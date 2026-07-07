<script setup lang="ts">
import { useObstacles } from '@/composables/useObstacles'
import { useEntityModels } from '@/composables/useEntityModels'
import ObstacleModel from './ObstacleModel.vue'

/**
 * Rendert die gepoolten Hindernisse und Items.
 * Bewegung/Spawn/Kollision laufen zentral im useGameLoop; hier wird
 * ausschliesslich der reaktive Pool-Zustand visualisiert.
 *
 * Coins bleiben ein einfaches Primitive; block/bar/ramp nutzen die
 * glTF-Modelle (T-Rex / Pterablocktyls / Diplodocus) via ObstacleModel.
 */

const LANE_WIDTH = 2
const { entities } = useObstacles()

// Modelle vorab laden (verhindert einen Ruckler beim ersten Hindernis)
useEntityModels()

function laneX(lane: number) {
  return lane * LANE_WIDTH
}
</script>

<template>
  <template v-for="e in entities" :key="e.id">
    <template v-if="e.active">
      <!-- Item: Coin (Primitive) -->
      <TresMesh
        v-if="e.kind === 'coin'"
        :position="[laneX(e.lane), 1, e.z]"
        :rotation="[Math.PI / 2, 0, 0]"
        cast-shadow
      >
        <TresCylinderGeometry :args="[0.35, 0.35, 0.12, 16]" />
        <TresMeshStandardMaterial :color="'#fde047'" :metalness="0.6" :roughness="0.3" />
      </TresMesh>

      <!-- Hindernisse/Rampe: glTF-Modelle (Collider bleibt separat) -->
      <TresGroup v-else :position="[laneX(e.lane), 0, e.z]">
        <ObstacleModel :kind="e.kind" />
      </TresGroup>
    </template>
  </template>
</template>

