<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import { useGameStore } from '@/stores/game'
import { useObstacles } from '@/composables/useObstacles'

const game = useGameStore()
const obstacles = useObstacles()

function restart() {
  obstacles.reset()
  game.startGame()
}

// Tastatur-Steuerung: Spur wechseln, springen, rollen, neu starten.
function onKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft':
      game.moveLeft()
      break
    case 'ArrowRight':
      game.moveRight()
      break
    case 'ArrowUp':
    case ' ':
      game.jump()
      break
    case 'ArrowDown':
      game.duck()
      break
    case 'r':
    case 'R':
      restart()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  restart()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <!-- 3D-Welt (Canvas) -->
  <GameCanvas />

  <!-- UI-Layer: strikt getrennt vom Canvas -->
  <div class="pointer-events-none fixed inset-0 flex flex-col justify-between p-6 font-mono text-white">
    <div class="flex justify-between text-xl drop-shadow">
      <span>Score: {{ game.score }}</span>
      <span>Coins: {{ game.coins }}</span>
    </div>

    <!-- Game-Over-Overlay -->
    <div
      v-if="game.state === 'gameover'"
      class="flex flex-col items-center gap-2 self-center rounded-xl bg-black/60 px-8 py-6 text-center"
    >
      <h2 class="text-3xl font-bold">Game Over</h2>
      <p class="text-lg">Score: {{ game.score }} · Coins: {{ game.coins }}</p>
      <p class="text-sm opacity-80">Taste <kbd>R</kbd> für Neustart</p>
    </div>

    <p class="self-center text-sm opacity-80">
      Pfeiltasten ← → zum Wechseln der Spur · ↑ / Leertaste zum Springen · ↓ zum Rollen
    </p>
  </div>
</template>
