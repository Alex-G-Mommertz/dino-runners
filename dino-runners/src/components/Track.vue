<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGameStore } from '@/stores/game'

/**
 * Bodenstreifen, die dem Spieler entgegenlaufen und so das "Rennen"
 * sichtbar machen. Die Streifen werden per Objekt-Pooling recycelt,
 * statt neue Meshes zu erzeugen (schont die Garbage Collection).
 */

const game = useGameStore()

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
  <TresMesh
    v-for="(z, i) in zs"
    :key="i"
    :position="[0, 0.01, z]"
    :rotation="[-Math.PI / 2, 0, 0]"
    receive-shadow
  >
    <TresPlaneGeometry :args="[4, 0.6]" />
    <TresMeshStandardMaterial :color="'#facc15'" />
  </TresMesh>
</template>
