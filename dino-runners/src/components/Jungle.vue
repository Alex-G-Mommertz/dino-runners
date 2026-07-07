<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGameStore } from '@/stores/game'

/**
 * Dschungel-Bewuchs links und rechts des Pfads. Die Pflanzen laufen dem
 * Spieler entgegen (gleiche Geschwindigkeit wie der Track) und werden per
 * Objekt-Pooling recycelt, sobald sie hinter der Kamera verschwinden.
 */

const game = useGameStore()

type Prop = {
  x: number
  scale: number
  rot: number
  kind: 'tree' | 'bush'
  trunk: string
  leaf: string
}

const COUNT = 20
const SPACING = 8
const START_Z = -140
const RECYCLE_Z = 14

// Deterministische Zufallswerte je Slot (Position/Grösse/Art), nur Z animiert.
const leafColors = ['#2c7a34', '#1f5e2a', '#3f9142', '#256b2e']
function makeProp(i: number): Prop {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1
  const side = i % 2 === 0 ? -1 : 1
  const x = side * (5.5 + r(1) * 4)
  return {
    x,
    scale: 0.8 + r(2) * 1.4,
    rot: r(3) * Math.PI * 2,
    kind: r(4) > 0.45 ? 'tree' : 'bush',
    trunk: '#5b3a1e',
    leaf: leafColors[Math.floor(r(5) * leafColors.length)],
  }
}

const props = Array.from({ length: COUNT }, (_, i) => makeProp(i))
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
  <TresGroup
    v-for="(z, i) in zs"
    :key="i"
    :position="[props[i].x, 0, z]"
    :rotation="[0, props[i].rot, 0]"
    :scale="props[i].scale"
  >
    <!-- Baum: Stamm + gestapelte Blätterkronen -->
    <template v-if="props[i].kind === 'tree'">
      <TresMesh :position="[0, 1.1, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.18, 0.28, 2.2, 6]" />
        <TresMeshStandardMaterial :color="props[i].trunk" />
      </TresMesh>
      <TresMesh :position="[0, 2.3, 0]" cast-shadow>
        <TresConeGeometry :args="[1.3, 1.8, 7]" />
        <TresMeshStandardMaterial :color="props[i].leaf" />
      </TresMesh>
      <TresMesh :position="[0, 3.1, 0]" cast-shadow>
        <TresConeGeometry :args="[1, 1.6, 7]" />
        <TresMeshStandardMaterial :color="props[i].leaf" />
      </TresMesh>
      <TresMesh :position="[0, 3.8, 0]" cast-shadow>
        <TresConeGeometry :args="[0.7, 1.3, 7]" />
        <TresMeshStandardMaterial :color="props[i].leaf" />
      </TresMesh>
    </template>

    <!-- Busch: kompakte Kugelgruppe -->
    <template v-else>
      <TresMesh :position="[0, 0.5, 0]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.7, 0]" />
        <TresMeshStandardMaterial :color="props[i].leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.6, 0.35, 0.2]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.5, 0]" />
        <TresMeshStandardMaterial :color="props[i].leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[-0.5, 0.3, -0.2]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.45, 0]" />
        <TresMeshStandardMaterial :color="props[i].leaf" flat-shading />
      </TresMesh>
    </template>
  </TresGroup>
</template>
