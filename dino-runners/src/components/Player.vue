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
  type AnimationAction,
} from 'three'
import { useGameStore } from '@/stores/game'
import { useGameLoop } from '@/composables/useGameLoop'
import { PLAYER_GROUND_Y } from '@/composables/usePhysics'

/**
 * Spielfigur (Adventurer, glTF).
 * Position/Sprung kommen aus der cannon-es Physik (via useGameLoop),
 * die seitliche Bewegung wird kinematisch gesteuert.
 *
 * Die mitgelieferten Animationen werden über einen three.js AnimationMixer
 * abgespielt (Run/Roll/Idle/Death) und im zentralen Render-Loop aktualisiert.
 * Collider/Physik bleiben unberührt (nur das Visual).
 */

// Zielhöhe des Charakters (Welt-Einheiten) und Blickrichtung (Laufrichtung -z)
const TARGET_HEIGHT = 1.5
const MODEL_ROTATION_Y = Math.PI
// Überblend-Dauer zwischen Animationen
const FADE = 0.15

const CLIP = {
  idle: 'CharacterArmature|Idle',
  run: 'CharacterArmature|Run',
  roll: 'CharacterArmature|Roll',
  death: 'CharacterArmature|Death',
} as const

const game = useGameStore()
const { update, playerBody } = useGameLoop()

const groupRef = shallowRef<Group | null>(null)
const model = shallowRef<Object3D | null>(null)

const { state } = useGLTF('/models/Adventurer.glb')

let mixer: AnimationMixer | null = null
const actions: Record<string, AnimationAction> = {}
let currentName = ''

/**
 * Skaliert das Modell auf TARGET_HEIGHT, dreht es in Laufrichtung und
 * setzt die Füße auf den Gruppenboden (die Gruppe sitzt im Körperzentrum,
 * also PLAYER_GROUND_Y über dem Boden).
 */
function fitModel(obj: Object3D) {
  obj.rotation.y = MODEL_ROTATION_Y
  obj.updateMatrixWorld(true)

  const size = new Vector3()
  new Box3().setFromObject(obj).getSize(size)
  obj.scale.setScalar(TARGET_HEIGHT / (size.y || 1))
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
 * Wechselt die aktive Animation mit weichem Crossfade.
 * `once` spielt den Clip einmal und hält das letzte Bild (z. B. Roll, Death).
 */
function play(name: string, once = false) {
  if (currentName === name) return
  const next = actions[name]
  if (!next) return

  const prev = actions[currentName]
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

watch(
  state,
  (gltf) => {
    if (!gltf || mixer) return

    const scene = gltf.scene as unknown as Object3D
    fitModel(scene)

    mixer = new AnimationMixer(scene)
    for (const clip of gltf.animations) {
      actions[clip.name] = mixer.clipAction(clip)
    }

    // Ende der Roll-Animation beendet den Duck-Zustand
    mixer.addEventListener('finished', (e) => {
      if (e.action === actions[CLIP.roll]) game.isDucking = false
    })

    model.value = scene
    play(game.state === 'running' ? CLIP.run : CLIP.idle)
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

  if (!mixer) return

  // Animationszustand aus dem Spielzustand ableiten
  if (game.state === 'gameover') {
    play(CLIP.death, true)
  } else if (game.state !== 'running') {
    play(CLIP.idle)
  } else if (game.isDucking) {
    play(CLIP.roll, true)
  } else {
    play(CLIP.run)
  }

  mixer.update(delta)
})
</script>

<template>
  <TresGroup ref="groupRef" :position="[0, PLAYER_GROUND_Y, 0]">
    <primitive v-if="model" :object="model" />
  </TresGroup>
</template>
