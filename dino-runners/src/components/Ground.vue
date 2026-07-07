<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { useGameStore } from '@/stores/game'
import { useGroundTexture } from '@/composables/useGroundTexture'

/**
 * Der Dschungel-Gras-Boden. Der Textur-Offset scrollt synchron zu Pfad,
 * Dschungel und Hindernissen, damit die gesamte Welt einheitlich am Spieler
 * vorbeiläuft (kein Laufband-Effekt).
 */

const game = useGameStore()
const { grass } = useGroundTexture()

// Welt-Länge der Boden-Ebene in Z (muss zur PlaneGeometry unten passen)
const GROUND_LENGTH = 100
// Welt-Distanz, die eine Textur-Wiederholung abdeckt (repeat.y = 40)
const WORLD_PER_REPEAT = GROUND_LENGTH / grass.repeat.y

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  if (game.state !== 'running') return
  grass.offset.y = (grass.offset.y + (game.speed * delta) / WORLD_PER_REPEAT) % 1
})
</script>

<template>
  <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
    <TresPlaneGeometry :args="[20, GROUND_LENGTH]" />
    <TresMeshStandardMaterial :map="grass" :color="'#ffffff'" />
  </TresMesh>
</template>
