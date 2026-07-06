<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

// Minimale Tastatur-Anbindung zum Testen der Basis-Spielfigur.
// (Vollständige Steuerung inkl. Swipe folgt im nächsten Schritt.)
function onKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft':
      game.lane = Math.max(-1, game.lane - 1)
      break
    case 'ArrowRight':
      game.lane = Math.min(1, game.lane + 1)
      break
    case 'ArrowUp':
    case ' ':
      if (!game.isJumping) game.isJumping = true
      break
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
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
    <p class="self-center text-sm opacity-80">
      Pfeiltasten ← → zum Wechseln der Spur · ↑ / Leertaste zum Springen
    </p>
  </div>
</template>
