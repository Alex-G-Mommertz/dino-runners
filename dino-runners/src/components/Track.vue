<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGameStore } from '@/stores/game'
import { useGroundTexture } from '@/composables/useGroundTexture'

/**
 * Drei geschlängelte Dschungel-Pfade – einer pro Lane (-1, 0, 1). Die
 * Pfad-Kacheln laufen dem Spieler entgegen und werden per Objekt-Pooling
 * recycelt, statt neue Meshes zu erzeugen (schont die Garbage Collection).
 * Die seitliche Schlängelung ist rein visuell (Sinus über Z); die Lanes
 * selbst bleiben spielmechanisch bei x = lane * LANE_WIDTH.
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

// Schlängelung: Amplitude (seitlicher Ausschlag) und Frequenz über Z
const WOBBLE_AMP = 0.35
const WOBBLE_FREQ = 0.08

const zs = ref<number[]>(Array.from({ length: COUNT }, (_, i) => START_Z + i * SPACING))

/** Seitliche X-Position einer Kachel: Lane-Mitte plus Sinus-Schlängelung. */
function laneX(lane: number, z: number): number {
  return lane * LANE_WIDTH + Math.sin(z * WOBBLE_FREQ + lane) * WOBBLE_AMP
}

/** Leichte Gierung, damit die Kacheln der Schlängelung folgen. */
function laneYaw(lane: number, z: number): number {
  return -Math.cos(z * WOBBLE_FREQ + lane) * WOBBLE_FREQ * WOBBLE_AMP * 6
}

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
      :position="[laneX(lane, z), 0.02, z]"
      :rotation="[-Math.PI / 2, 0, laneYaw(lane, z)]"
      receive-shadow
    >
      <TresPlaneGeometry :args="[1.6, 4.2]" />
      <TresMeshStandardMaterial :map="dirt" :color="'#ffffff'" />
    </TresMesh>
  </template>
</template>
