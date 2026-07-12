import { computed, type ComputedRef } from 'vue'
import type { AnimationClip, Object3D } from 'three'
import { useGLTF } from '@tresjs/cientos'

/**
 * Lädt die glTF-Modelle für die Hindernisse einmalig (Singleton) und stellt
 * die geladenen Szenen je Hindernis-Art bereit.
 *
 * Zuordnung (Modell -> Entitäts-Art):
 * - block -> Triceratops  (Boden-Hindernis, überspringen)
 * - bar   -> T-Rex        (steht am Boden, man rollt zwischen den Beinen durch)
 * - ramp  -> Diplodocus   (begehbarer "Hügel", hochlaufen)
 *
 * Rückgabe sind reaktive Refs, die `null` sind, solange das Modell lädt.
 * Der Collider/die Physik bleiben davon unberührt (nur das Visual).
 */

export type ModelKind = 'block' | 'bar' | 'ramp'

/**
 * Ein geladenes Entitäts-Modell: die Szene (zum Klonen) und die im glTF
 * enthaltenen Animations-Clips (z. B. Idle/Attack/Walk).
 */
export interface EntityModel {
  scene: ComputedRef<Object3D | null>
  animations: ComputedRef<AnimationClip[]>
}

type ModelMap = Record<ModelKind, EntityModel>

let models: ModelMap | undefined

export function useEntityModels(): ModelMap {
  if (!models) {
    const trex = useGLTF('/models/T-Rex.glb')
    const tric = useGLTF('/models/Triceratops.glb')
    const diplo = useGLTF('/models/Diplodocus.glb')

    models = {
      block: {
        scene: computed(() => tric.state.value?.scene ?? null),
        animations: computed(() => tric.state.value?.animations ?? []),
      },
      bar: {
        scene: computed(() => trex.state.value?.scene ?? null),
        animations: computed(() => trex.state.value?.animations ?? []),
      },
      ramp: {
        scene: computed(() => diplo.state.value?.scene ?? null),
        animations: computed(() => diplo.state.value?.animations ?? []),
      },
    }
  }
  return models
}
