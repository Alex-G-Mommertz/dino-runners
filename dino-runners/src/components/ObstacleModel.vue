<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { Box3, Vector3, type Object3D, type Mesh } from 'three'
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

const props = defineProps<{ kind: EntityKind }>()

const models = useEntityModels()

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
const cache = new Map<ModelKind, Object3D>()

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
  if (kind === 'coin') {
    object.value = null
    return
  }

  const modelKind = kind as ModelKind
  const cached = cache.get(modelKind)
  if (cached) {
    object.value = cached
    return
  }

  const source = models[modelKind].value
  if (!source) {
    object.value = null
    return
  }

  const clone = skeletonClone(source)
  fit(clone, CONFIG[modelKind])
  cache.set(modelKind, clone)
  object.value = clone
})
</script>

<template>
  <primitive v-if="object" :object="object" />
</template>
