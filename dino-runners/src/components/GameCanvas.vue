<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import Player from './Player.vue'
import Track from './Track.vue'
import Obstacles from './Obstacles.vue'

/**
 * Die 3D-Welt (Canvas). Strikt getrennt vom UI-Layer.
 * Enthält Kamera, Beleuchtung, Boden, laufende Strecke und die Spielfigur.
 */
</script>

<template>
  <TresCanvas clear-color="#87ceeb" window-size shadows render-mode="always">
    <TresPerspectiveCamera :position="[0, 4, 8]" :look-at="[0, 1, 0]" />

    <TresAmbientLight :intensity="0.6" />
    <TresDirectionalLight :position="[5, 10, 5]" :intensity="1" cast-shadow />

    <!-- Boden -->
    <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
      <TresPlaneGeometry :args="[20, 100]" />
      <TresMeshStandardMaterial :color="'#3f3f46'" />
    </TresMesh>

    <Track />
    <Obstacles />
    <Player />
  </TresCanvas>
</template>
