import { computed, type ComputedRef } from 'vue'
import type { Object3D } from 'three'
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

type ModelMap = Record<ModelKind, ComputedRef<Object3D | null>>

let models: ModelMap | undefined

export function useEntityModels(): ModelMap {
  if (!models) {
    const trex = useGLTF('/models/T-Rex.glb')
    const tric = useGLTF('/models/Triceratops.glb')
    const diplo = useGLTF('/models/Diplodocus.glb')

    models = {
      block: computed(() => tric.state.value?.scene ?? null),
      bar: computed(() => trex.state.value?.scene ?? null),
      ramp: computed(() => diplo.state.value?.scene ?? null),
    }
  }
  return models
}
