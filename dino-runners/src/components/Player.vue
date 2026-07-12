<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGLTF } from '@tresjs/cientos'
import {
  AnimationMixer,
  Box3,
  Vector3,
  LoopOnce,
  LoopRepeat,
  type Group,
  type Object3D,
  type Mesh,
  type AnimationClip,
  type AnimationAction,
} from 'three'
import { useGameStore, type PlayerModel } from '@/stores/game'
import { useGameLoop } from '@/composables/useGameLoop'
import { PLAYER_GROUND_Y } from '@/composables/usePhysics'

/**
 * Spielfigur (glTF), umschaltbar zwischen Mensch (Adventurer) und T-Rex.
 * Position/Sprung kommen aus der cannon-es Physik (via useGameLoop),
 * die seitliche Bewegung wird kinematisch gesteuert.
 *
 * Beide Modelle werden vorab geladen und bei Bedarf gewechselt. Jedes Modell
 * bringt eigene Clip-Namen mit (Run/Roll/Idle/Death), die hier auf die
 * logischen Animationszustände abgebildet werden.
 * Collider/Physik bleiben unberührt (nur das Visual).
 */

// Blickrichtung: Modell schaut in Laufrichtung (-z)
const MODEL_ROTATION_Y = Math.PI
// Überblend-Dauer zwischen Animationen
const FADE = 0.15

type ActionName = 'idle' | 'run' | 'roll' | 'death'

interface ModelDef {
  url: string
  // Zielhöhe des Modells in Welt-Einheiten
  targetHeight: number
  // Zuordnung logischer Zustand -> Clip-Name im jeweiligen glTF
  clips: Record<ActionName, string>
}

const MODEL_DEFS: Record<PlayerModel, ModelDef> = {
  human: {
    url: '/models/Adventurer.glb',
    targetHeight: 1.5,
    clips: {
      idle: 'CharacterArmature|Idle',
      run: 'CharacterArmature|Run',
      roll: 'CharacterArmature|Roll',
      death: 'CharacterArmature|Death',
    },
  },
  trex: {
    url: '/models/T-Rex.glb',
    targetHeight: 1.9,
    clips: {
      idle: 'Armature|TRex_Idle',
      run: 'Armature|TRex_Run',
      // T-Rex hat keine Rolle – der Sprung dient als Duck-Ersatz.
      roll: 'Armature|TRex_Jump',
      death: 'Armature|TRex_Death',
    },
  },
  astronaut: {
    url: '/models/Astronaut.glb',
    targetHeight: 1.5,
    clips: {
      idle: 'CharacterArmature|Idle',
      run: 'CharacterArmature|Run',
      roll: 'CharacterArmature|Roll',
      death: 'CharacterArmature|Death',
    },
  },
  zombie: {
    url: '/models/Zombie.glb',
    targetHeight: 1.6,
    clips: {
      idle: 'Armature|Idle',
      run: 'Armature|Running_Crawl',
      // Zombie hat keine Rolle – das Kriechen dient als Duck-Ersatz.
      roll: 'Armature|Crawl',
      death: 'Armature|Die',
    },
  },
  // Haunter und Unicorn Person bringen keine Animationen mit -> statisch.
  haunter: {
    url: '/models/Low%20Poly%20Haunter.glb',
    targetHeight: 1.9,
    clips: { idle: '', run: '', roll: '', death: '' },
  },
  unicorn: {
    url: '/models/Unicorn%20Person.glb',
    targetHeight: 1.7,
    clips: { idle: '', run: '', roll: '', death: '' },
  },
  velociraptor: {
    url: '/models/Velociraptor.glb',
    targetHeight: 1.7,
    clips: {
      idle: 'Armature|Velociraptor_Idle',
      run: 'Armature|Velociraptor_Run',
      // Kein Roll – der Sprung dient als Duck-Ersatz.
      roll: 'Armature|Velociraptor_Jump',
      death: 'Armature|Velociraptor_Death',
    },
  },
  parasaurolophus: {
    url: '/models/Parasaurolophus.glb',
    targetHeight: 1.9,
    clips: {
      idle: 'Armature|Parasaurolophus_Idle',
      run: 'Armature|Parasaurolophus_Run',
      // Kein Roll – der Sprung dient als Duck-Ersatz.
      roll: 'Armature|Parasaurolophus_Jump',
      death: 'Armature|Parasaurolophus_Death',
    },
  },
}

interface Prepared {
  scene: Object3D
  mixer: AnimationMixer
  actions: Partial<Record<ActionName, AnimationAction>>
}

const game = useGameStore()
const { update, playerBody } = useGameLoop()

const groupRef = shallowRef<Group | null>(null)
const active = shallowRef<Prepared | null>(null)

const { state: humanState } = useGLTF(MODEL_DEFS.human.url)
const { state: trexState } = useGLTF(MODEL_DEFS.trex.url)
const { state: astronautState } = useGLTF(MODEL_DEFS.astronaut.url)
const { state: zombieState } = useGLTF(MODEL_DEFS.zombie.url)
const { state: haunterState } = useGLTF(MODEL_DEFS.haunter.url)
const { state: unicornState } = useGLTF(MODEL_DEFS.unicorn.url)
const { state: velociraptorState } = useGLTF(MODEL_DEFS.velociraptor.url)
const { state: parasaurolophusState } = useGLTF(MODEL_DEFS.parasaurolophus.url)

// Ladezustand je Modell an einem Ort (für build() und den Watcher).
const states = {
  human: humanState,
  trex: trexState,
  astronaut: astronautState,
  zombie: zombieState,
  haunter: haunterState,
  unicorn: unicornState,
  velociraptor: velociraptorState,
  parasaurolophus: parasaurolophusState,
} as const

const prepared: Partial<Record<PlayerModel, Prepared>> = {}
let currentName: ActionName | '' = ''

/**
 * Skaliert das Modell auf die Zielhöhe, dreht es in Laufrichtung und
 * setzt die Füße auf den Gruppenboden (die Gruppe sitzt im Körperzentrum,
 * also PLAYER_GROUND_Y über dem Boden).
 */
function fitModel(obj: Object3D, targetHeight: number) {
  obj.rotation.y = MODEL_ROTATION_Y
  obj.updateMatrixWorld(true)

  const size = new Vector3()
  new Box3().setFromObject(obj).getSize(size)
  obj.scale.setScalar(targetHeight / (size.y || 1))
  obj.updateMatrixWorld(true)

  const box = new Box3().setFromObject(obj)
  const center = new Vector3()
  box.getCenter(center)
  obj.position.x -= center.x
  obj.position.z -= center.z
  obj.position.y += -PLAYER_GROUND_Y - box.min.y

  obj.traverse((child) => {
    const mesh = child as Mesh
    if (mesh.isMesh) mesh.castShadow = true
  })
}

/**
 * Bereitet ein Modell einmalig auf: skalieren, Mixer + Actions anlegen.
 * Gibt `null` zurück, solange das glTF noch lädt.
 */
function build(key: PlayerModel): Prepared | null {
  const existing = prepared[key]
  if (existing) return existing

  const gltf = states[key].value
  if (!gltf) return null

  const def = MODEL_DEFS[key]
  const scene = gltf.scene as unknown as Object3D
  fitModel(scene, def.targetHeight)

  const mixer = new AnimationMixer(scene)
  const byName = new Map((gltf.animations as AnimationClip[]).map((c) => [c.name, c]))
  const actions: Partial<Record<ActionName, AnimationAction>> = {}
  for (const name of Object.keys(def.clips) as ActionName[]) {
    const clip = byName.get(def.clips[name])
    if (clip) actions[name] = mixer.clipAction(clip)
  }

  // Ende der Roll-/Sprung-Animation beendet den Duck-Zustand
  mixer.addEventListener('finished', (e) => {
    if (e.action === actions.roll) game.isDucking = false
  })

  const p: Prepared = { scene, mixer, actions }
  prepared[key] = p
  return p
}

/**
 * Wechselt die aktive Animation mit weichem Crossfade.
 * `once` spielt den Clip einmal und hält das letzte Bild (z. B. Roll, Death).
 */
function play(name: ActionName, once = false) {
  const p = active.value
  if (!p || currentName === name) return
  const next = p.actions[name]
  if (!next) return

  const prev = currentName ? p.actions[currentName] : undefined
  next.reset()
  next.enabled = true
  if (once) {
    next.setLoop(LoopOnce, 1)
    next.clampWhenFinished = true
  } else {
    next.setLoop(LoopRepeat, Infinity)
  }
  next.fadeIn(FADE).play()
  if (prev && prev !== next) prev.fadeOut(FADE)
  currentName = name
}

// Aktives Modell aufbauen/wechseln, sobald sich die Auswahl ändert oder
// das jeweilige glTF fertig geladen ist.
watch(
  [
    () => game.playerModel,
    humanState,
    trexState,
    astronautState,
    zombieState,
    haunterState,
    unicornState,
    velociraptorState,
    parasaurolophusState,
  ],
  () => {
    const next = build(game.playerModel)
    if (!next || active.value === next) return

    // Vorheriges Modell anhalten
    if (active.value) {
      active.value.mixer.stopAllAction()
    }

    active.value = next
    currentName = ''
    play(game.state === 'running' ? 'run' : 'idle')
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  // Zentrale Spiel-/Physikberechnung
  update(delta)

  // Gruppe folgt dem Physik-Körper
  const group = groupRef.value
  if (group) {
    group.position.set(playerBody.position.x, playerBody.position.y, playerBody.position.z)
  }

  const p = active.value
  if (!p) return

  // Animationszustand aus dem Spielzustand ableiten
  if (game.state === 'gameover') {
    play('death', true)
  } else if (game.state !== 'running') {
    play('idle')
  } else if (game.isDucking) {
    play('roll', true)
  } else {
    play('run')
  }

  p.mixer.update(delta)
})
</script>

<template>
  <TresGroup ref="groupRef" :position="[0, PLAYER_GROUND_Y, 0]">
    <primitive v-if="active" :object="active.scene" />
  </TresGroup>
</template>
