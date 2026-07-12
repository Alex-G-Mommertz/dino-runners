<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { useLoop } from '@tresjs/core'
import {
  AnimationMixer,
  Box3,
  Vector3,
  LoopRepeat,
  type AnimationAction,
  type Object3D,
  type Mesh,
} from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useEntityModels, type ModelKind } from '@/composables/useEntityModels'
import { RAMP_RX, RAMP_RY, RAMP_RZ, type EntityKind } from '@/composables/useObstacles'

/**
 * Rendert das passende glTF-Modell für eine Hindernis-Instanz.
 *
 * Prinzipien:
 * - Objekt-Pooling: pro Komponenten-Instanz (= Pool-Slot) wird je Art höchstens
 *   ein Klon erzeugt und zwischengespeichert. `SkeletonUtils.clone` unterstützt
 *   auch geriggte/animierte Modelle.
 * - Auto-Fit: jedes Modell wird über seine Bounding-Box auf eine Zielgröße
 *   skaliert und so positioniert, dass es korrekt am Boden bzw. über Kopf sitzt.
 *   Der Collider/das Höhenfeld bleiben unberührt.
 */

const props = defineProps<{ kind: EntityKind; z: number }>()

const models = useEntityModels()

// Ab dieser Z-Position (näher an der Kamera als der Spawn) gilt das Modell als
// "in Sichtweite" und beginnt seine Angriffs-/Leerlauf-Animation.
const IN_VIEW_Z = -55

interface FitConfig {
  mode: 'height' | 'box'
  // Bei 'height': Zielhöhe. Bei 'box': [Breite X, Höhe Y, Tiefe Z].
  size: [number, number, number]
  rotationY: number
  // Unterkante des Modells auf dieser Welt-Höhe (relativ zur Gruppe am Boden).
  baseY: number
}

const CONFIG: Record<ModelKind, FitConfig> = {
  // Triceratops: Boden-Hindernis (überspringen), deutlich größer.
  block: { mode: 'height', size: [0, 2.6, 0], rotationY: 0, baseY: 0 },
  // T-Rex: steht am Boden und ist groß – man rollt zwischen den Beinen durch.
  bar: { mode: 'height', size: [0, 3.4, 0], rotationY: 0, baseY: 0 },
  // Diplodocus füllt die begehbare Ellipsoid-Kuppel aus.
  ramp: { mode: 'box', size: [2 * RAMP_RX, RAMP_RY, 2 * RAMP_RZ], rotationY: Math.PI, baseY: 0 },
}

const object = shallowRef<Object3D | null>(null)

/**
 * Gecachter Klon je Modell-Art inkl. eigenem AnimationMixer.
 * Der Mixer wird nur weitergeschaltet, solange das Modell sichtbar ist.
 */
interface Slot {
  object: Object3D
  mixer: AnimationMixer | null
  action: AnimationAction | null
}

const cache = new Map<ModelKind, Slot>()
let current: Slot | null = null

function fit(obj: Object3D, cfg: FitConfig) {
  obj.rotation.y = cfg.rotationY
  obj.updateMatrixWorld(true)

  const size = new Vector3()
  new Box3().setFromObject(obj).getSize(size)

  if (cfg.mode === 'height') {
    obj.scale.setScalar(cfg.size[1] / (size.y || 1))
  } else {
    obj.scale.set(
      cfg.size[0] / (size.x || 1),
      cfg.size[1] / (size.y || 1),
      cfg.size[2] / (size.z || 1),
    )
  }
  obj.updateMatrixWorld(true)

  // Zentrieren (X/Z) und Unterkante auf baseY setzen
  const box = new Box3().setFromObject(obj)
  const center = new Vector3()
  box.getCenter(center)
  obj.position.x -= center.x
  obj.position.z -= center.z
  obj.position.y += cfg.baseY - box.min.y

  obj.traverse((child) => {
    const mesh = child as Mesh
    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

watchEffect(() => {
  const kind = props.kind
  // Items ohne Modell (Coin/Knochen) werden separat als Primitive gerendert.
  if (kind === 'coin' || kind === 'bone') {
    object.value = null
    current = null
    return
  }

  const modelKind = kind as ModelKind
  const cached = cache.get(modelKind)
  if (cached) {
    current = cached
    object.value = cached.object
    return
  }

  const source = models[modelKind].scene.value
  if (!source) {
    object.value = null
    current = null
    return
  }

  const clone = skeletonClone(source)
  fit(clone, CONFIG[modelKind])

  // Animations-Clip auswählen: bevorzugt "Attack", sonst der erste Clip.
  const clips = models[modelKind].animations.value
  const clip = clips.find((c) => c.name.toLowerCase().includes('attack')) ?? clips[0] ?? null

  let mixer: AnimationMixer | null = null
  let action: AnimationAction | null = null
  if (clip) {
    mixer = new AnimationMixer(clone)
    action = mixer.clipAction(clip)
    action.setLoop(LoopRepeat, Infinity)
  }

  const slot: Slot = { object: clone, mixer, action }
  cache.set(modelKind, slot)
  current = slot
  object.value = clone
})

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  const slot = current
  if (!slot?.mixer || !slot.action) return

  // Erst animieren, wenn das Modell in Sichtweite gelaufen ist.
  const inView = props.z >= IN_VIEW_Z
  if (inView) {
    if (!slot.action.isRunning()) slot.action.play()
    slot.mixer.update(delta)
  } else if (slot.action.isRunning()) {
    // Ausserhalb der Sicht in den Ruhezustand zurücksetzen.
    slot.action.stop()
    slot.mixer.setTime(0)
  }
})
</script>

<template>
  <primitive v-if="object" :object="object" />
</template>
