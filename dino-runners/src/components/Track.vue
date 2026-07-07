<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGameStore } from '@/stores/game'
import { useGroundTexture } from '@/composables/useGroundTexture'

/**
 * Drei gerade Dschungel-Pfade – einer pro Lane (-1, 0, 1). Die Pfad-Kacheln
 * laufen dem Spieler entgegen und werden per Objekt-Pooling recycelt, statt
 * neue Meshes zu erzeugen (schont die Garbage Collection). Die Kacheln
 * bewegen sich ausschliesslich in Z (Lauf-Richtung); ihre seitliche Position
 * bleibt fest bei x = lane * LANE_WIDTH.
 */

const game = useGameStore()
const { dirt } = useGroundTexture()

// Weltabstand zwischen den Lanes (muss zu useGameLoop/useObstacles passen)
const LANE_WIDTH = 2
const LANES = [-1, 0, 1]

const COUNT = 24
const SPACING = 4
// Erster Streifen weit vorne, Rest gleichmässig dahinter
const START_Z = -80
// Ab dieser Z-Position (hinter der Kamera) wird ein Streifen recycelt
const RECYCLE_Z = 12

const zs = ref<number[]>(Array.from({ length: COUNT }, (_, i) => START_Z + i * SPACING))

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (game.state !== 'running') return
  const total = COUNT * SPACING
  zs.value = zs.value.map((z) => {
    const next = z + game.speed * delta
    return next > RECYCLE_Z ? next - total : next
  })
})
</script>

<template>
  <template v-for="lane in LANES" :key="lane">
    <TresMesh
      v-for="(z, i) in zs"
      :key="i"
      :position="[lane * LANE_WIDTH, 0.02, z]"
      :rotation="[-Math.PI / 2, 0, 0]"
      receive-shadow
    >
      <TresPlaneGeometry :args="[1.6, 4.2]" />
      <TresMeshStandardMaterial :map="dirt" :color="'#ffffff'" />
    </TresMesh>
  </template>
</template>
