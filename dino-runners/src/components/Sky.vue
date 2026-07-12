<script setup lang="ts">
import { BackSide, CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Atmosphärischer Dschungel-Himmel: eine grosse, von innen sichtbare Kugel mit
 * einem vertikalen Farbverlauf (heller Dunst oben, dichtes Grün am Horizont).
 * Der Nebel ist deaktiviert, damit die Kugel den festen Hintergrund bildet;
 * die untere Verlaufsfarbe entspricht der Fog-Farbe, sodass entfernte Bäume
 * nahtlos in den Hintergrund übergehen.
 */

function makeGradientTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  const g = ctx.createLinearGradient(0, 0, 0, canvas.height)
  g.addColorStop(0.0, '#cfeeb0') // heller, dunstiger Himmel
  g.addColorStop(0.35, '#8fc86f')
  g.addColorStop(0.62, '#4f9a4a')
  g.addColorStop(0.82, '#2f6d3a') // == Fog-Farbe (nahtloser Horizont)
  g.addColorStop(1.0, '#1b4a26') // dichtes Grün am Boden
  ctx.fillStyle = g
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

const gradient = makeGradientTexture()
</script>

<template>
  <TresMesh :render-order="-1">
    <TresSphereGeometry :args="[220, 32, 16]" />
    <TresMeshBasicMaterial :map="gradient" :side="BackSide" :fog="false" :depth-write="false" />
  </TresMesh>
</template>
