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
  z: number
  scale: number
  rot: number
  kind: 'tree' | 'bush' | 'fern' | 'rock'
  trunk: string
  leaf: string
  leaf2: string
  stone: string
  stone2: string
}

const COUNT = 34
const SPACING = 5
const START_Z = -160
const RECYCLE_Z = 14

// Deterministische Zufallswerte je Slot (Position/Grösse/Art), nur Z animiert.
const leafColors = ['#2c7a34', '#1f5e2a', '#3f9142', '#256b2e', '#4f9e3f', '#164a22', '#5bb04a']
const trunkColors = ['#5b3a1e', '#4a2f18', '#6b4526']
const stoneColors = ['#8a8f98', '#6f747c', '#9aa0a8', '#7d7368', '#5f636b']
// Wählt deterministisch eine Farbe (mit Fallback, damit der Typ `string` bleibt).
function pick(colors: string[], t: number): string {
  return colors[Math.floor(t * colors.length)] ?? colors[0]!
}
function makeProp(i: number): Prop {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1
  const side = i % 2 === 0 ? -1 : 1
  // Bäume weiter aussen und tiefer gestaffelt -> dichte grüne "Wand"
  const x = side * (4.5 + r(1) * 9)
  const k = r(4)
  const kind: Prop['kind'] = k > 0.58 ? 'tree' : k > 0.38 ? 'bush' : k > 0.2 ? 'fern' : 'rock'
  return {
    x,
    z: START_Z + i * SPACING,
    scale: 0.8 + r(2) * 1.7,
    rot: r(3) * Math.PI * 2,
    kind,
    trunk: pick(trunkColors, r(6)),
    leaf: pick(leafColors, r(5)),
    leaf2: pick(leafColors, r(7)),
    stone: pick(stoneColors, r(8)),
    stone2: pick(stoneColors, r(9)),
  }
}

const items = ref<Prop[]>(Array.from({ length: COUNT }, (_, i) => makeProp(i)))

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (game.state !== 'running') return
  const total = COUNT * SPACING
  for (const item of items.value) {
    item.z += game.speed * delta
    if (item.z > RECYCLE_Z) item.z -= total
  }
})
</script>

<template>
  <TresGroup
    v-for="(item, i) in items"
    :key="i"
    :position="[item.x, 0, item.z]"
    :rotation="[0, item.rot, 0]"
    :scale="item.scale"
  >
    <!-- Baum: Stamm + gestapelte Blätterkronen -->
    <template v-if="item.kind === 'tree'">
      <TresMesh :position="[0, 1.4, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.18, 0.32, 2.8, 6]" />
        <TresMeshStandardMaterial :color="item.trunk" />
      </TresMesh>
      <TresMesh :position="[0, 2.7, 0]" cast-shadow>
        <TresConeGeometry :args="[1.5, 2, 7]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0, 3.6, 0]" cast-shadow>
        <TresConeGeometry :args="[1.2, 1.8, 7]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
      <TresMesh :position="[0, 4.4, 0]" cast-shadow>
        <TresConeGeometry :args="[0.9, 1.6, 7]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0, 5.1, 0]" cast-shadow>
        <TresConeGeometry :args="[0.6, 1.3, 7]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
    </template>

    <!-- Busch: kompakte Kugelgruppe -->
    <template v-else-if="item.kind === 'bush'">
      <TresMesh :position="[0, 0.5, 0]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.7, 0]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.6, 0.35, 0.2]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.5, 0]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
      <TresMesh :position="[-0.5, 0.3, -0.2]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.45, 0]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.1, 0.8, -0.4]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.4, 0]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
    </template>

    <!-- Farn/Gras-Büschel: aufgefächerte schmale Blätter am Boden -->
    <template v-else-if="item.kind === 'fern'">
      <TresMesh :position="[0, 0.5, 0]" :rotation="[0, 0, 0.15]" cast-shadow>
        <TresConeGeometry :args="[0.12, 1.1, 4]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.18, 0.45, 0.05]" :rotation="[0.2, 0, 0.5]" cast-shadow>
        <TresConeGeometry :args="[0.1, 0.9, 4]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
      <TresMesh :position="[-0.18, 0.45, -0.05]" :rotation="[-0.2, 0, -0.5]" cast-shadow>
        <TresConeGeometry :args="[0.1, 0.9, 4]" />
        <TresMeshStandardMaterial :color="item.leaf2" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.05, 0.4, 0.2]" :rotation="[0.5, 0, 0.15]" cast-shadow>
        <TresConeGeometry :args="[0.09, 0.8, 4]" />
        <TresMeshStandardMaterial :color="item.leaf" flat-shading />
      </TresMesh>
    </template>

    <!-- Steine: kantige, flache Felsbrocken -->
    <template v-else>
      <TresMesh :position="[0, 0.28, 0]" :scale="[1.1, 0.7, 1]" cast-shadow receive-shadow>
        <TresIcosahedronGeometry :args="[0.6, 0]" />
        <TresMeshStandardMaterial :color="item.stone" flat-shading />
      </TresMesh>
      <TresMesh :position="[0.45, 0.18, 0.25]" :scale="[1, 0.6, 1]" cast-shadow receive-shadow>
        <TresIcosahedronGeometry :args="[0.35, 0]" />
        <TresMeshStandardMaterial :color="item.stone2" flat-shading />
      </TresMesh>
      <TresMesh :position="[-0.4, 0.14, -0.2]" :scale="[1, 0.55, 1]" cast-shadow receive-shadow>
        <TresIcosahedronGeometry :args="[0.28, 0]" />
        <TresMeshStandardMaterial :color="item.stone2" flat-shading />
      </TresMesh>
    </template>
  </TresGroup>
</template>
