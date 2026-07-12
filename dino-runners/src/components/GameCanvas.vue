<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import Player from './Player.vue'
import Track from './Track.vue'
import Obstacles from './Obstacles.vue'
import Jungle from './Jungle.vue'
import Ground from './Ground.vue'
import Sky from './Sky.vue'

/**
 * Die 3D-Welt (Canvas). Strikt getrennt vom UI-Layer.
 * Enthält Kamera, Beleuchtung, Boden, laufende Strecke und die Spielfigur.
 */
</script>

<template>
  <TresCanvas clear-color="#7fb069" window-size shadows render-mode="always">
    <TresPerspectiveCamera :position="[0, 4, 8]" :look-at="[0, 1, 0]" />
    <!-- Grüner Dunst in der Ferne für Dschungel-Stimmung -->
    <TresFog attach="fog" :args="['#2f6d3a', 25, 90]" />

    <TresAmbientLight :color="'#bfe6b0'" :intensity="0.7" />
    <TresDirectionalLight :position="[5, 10, 5]" :intensity="1" cast-shadow />

    <!-- Dschungel-Himmel (Farbverlauf-Hintergrund) -->
    <Sky />

    <!-- Dschungel-Boden -->
    <Ground />

    <Track />
    <Jungle />
    <Obstacles />
    <Player />
  </TresCanvas>
</template>
