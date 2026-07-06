import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GameState = 'menu' | 'running' | 'gameover'

/**
 * Zentraler Spielstatus. Steuert Score, Coins und den Game-State.
 * Die 3D-Welt reagiert ausschliesslich auf diese Werte.
 */
export const useGameStore = defineStore('game', () => {
  const state = ref<GameState>('menu')
  const score = ref(0)
  const coins = ref(0)

  // Lane-Position der Spielfigur: -1 (links), 0 (mitte), 1 (rechts)
  const lane = ref(0)
  const isJumping = ref(false)

  function startGame() {
    state.value = 'running'
    score.value = 0
    coins.value = 0
    lane.value = 0
    isJumping.value = false
  }

  function gameOver() {
    state.value = 'gameover'
  }

  function addScore(amount = 1) {
    score.value += amount
  }

  function addCoin(amount = 1) {
    coins.value += amount
  }

  return {
    state,
    score,
    coins,
    lane,
    isJumping,
    startGame,
    gameOver,
    addScore,
    addCoin,
  }
})
