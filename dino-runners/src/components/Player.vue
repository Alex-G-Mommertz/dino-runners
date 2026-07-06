<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Mesh } from 'three'
import { useGameStore } from '@/stores/game'

/**
 * Basis-Spielfigur (Würfel).
 * Die Figur bewegt sich sanft zwischen drei Lanes und kann springen.
 * Kollision wird später über eine vereinfachte BoxCollider-Box gelöst.
 */

// Abstand zwischen den Lanes in Welt-Einheiten
const LANE_WIDTH = 2
// Y-Position am Boden bzw. am höchsten Sprungpunkt
const GROUND_Y = 0.5
const JUMP_HEIGHT = 2
// Interpolationsgeschwindigkeit für seitliche Bewegung
const LERP_SPEED = 10

const game = useGameStore()

const meshRef = shallowRef<Mesh | null>(null)

// Ziel-X abhängig von der aktiven Lane
let targetX = 0
// Sprung-Fortschritt (0 = Boden, PI = Landung)
let jumpPhase = 0

watch(
  () => game.lane,
  (lane) => {
    targetX = lane * LANE_WIDTH
  },
  { immediate: true },
)

watch(
  () => game.isJumping,
  (jumping) => {
    if (jumping) jumpPhase = 0
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  const mesh = meshRef.value
  if (!mesh) return

  // Sanfte seitliche Bewegung Richtung Ziel-Lane
  mesh.position.x += (targetX - mesh.position.x) * Math.min(delta * LERP_SPEED, 1)

  // Sprung-Bogen über eine Sinuskurve
  if (game.isJumping) {
    jumpPhase += delta * 5
    if (jumpPhase >= Math.PI) {
      jumpPhase = 0
      mesh.position.y = GROUND_Y
      game.isJumping = false
    } else {
      mesh.position.y = GROUND_Y + Math.sin(jumpPhase) * JUMP_HEIGHT
    }
  } else {
    mesh.position.y = GROUND_Y
  }
})
</script>

<template>
  <TresMesh ref="meshRef" :position="[0, GROUND_Y, 0]" cast-shadow>
    <TresBoxGeometry :args="[1, 1, 1]" />
    <TresMeshStandardMaterial :color="'#4ade80'" />
  </TresMesh>
</template>
