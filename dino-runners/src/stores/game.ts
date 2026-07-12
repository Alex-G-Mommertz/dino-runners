import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GameState = 'menu' | 'running' | 'gameover'

// Auswählbares Spieler-Modell
export type PlayerModel =
  | 'human'
  | 'trex'
  | 'astronaut'
  | 'zombie'
  | 'haunter'
  | 'unicorn'
  | 'velociraptor'
  | 'parasaurolophus'

// Reihenfolge für das Durchschalten der Modelle
const PLAYER_MODELS: PlayerModel[] = [
  'human',
  'trex',
  'astronaut',
  'zombie',
  'haunter',
  'unicorn',
  'velociraptor',
  'parasaurolophus',
]

// Start-Laufgeschwindigkeit in Welt-Einheiten pro Sekunde
const BASE_SPEED = 8

/**
 * Zentraler Spielstatus. Steuert Score, Coins, Lauf-Bewegung und Game-State.
 * Die 3D-Welt reagiert ausschliesslich auf diese Werte.
 */
export const useGameStore = defineStore('game', () => {
  const state = ref<GameState>('menu')
  const score = ref(0)
  const coins = ref(0)

  // Rennen: zurückgelegte Distanz und aktuelle Laufgeschwindigkeit
  const distance = ref(0)
  const speed = ref(BASE_SPEED)

  // Lane-Position der Spielfigur: -1 (links), 0 (mitte), 1 (rechts)
  const lane = ref(0)
  const isDucking = ref(false)
  // Vom Physik-Loop gesetzt: steht die Figur am Boden?
  const isGrounded = ref(true)
  // Sprung-Anforderung, wird im Physik-Loop verarbeitet
  const jumpRequested = ref(false)

  // Gewähltes Spieler-Modell (Mensch oder T-Rex)
  const playerModel = ref<PlayerModel>('human')

  function startGame() {
    state.value = 'running'
    score.value = 0
    coins.value = 0
    distance.value = 0
    speed.value = BASE_SPEED
    lane.value = 0
    isDucking.value = false
    isGrounded.value = true
    jumpRequested.value = false
  }

  function gameOver() {
    state.value = 'gameover'
  }

  function moveLeft() {
    lane.value = Math.max(-1, lane.value - 1)
  }

  function moveRight() {
    lane.value = Math.min(1, lane.value + 1)
  }

  // Fordert einen Sprung an (nur im laufenden Spiel; Boden-Check im Loop).
  function jump() {
    if (state.value !== 'running') return
    jumpRequested.value = true
  }

  // Löst eine Roll-/Duck-Animation aus (nur am Boden, nicht während einer Rolle).
  function duck() {
    if (state.value !== 'running' || isDucking.value || !isGrounded.value) return
    isDucking.value = true
  }

  function addCoin(amount = 1) {
    coins.value += amount
  }

  // Wechselt zwischen Mensch- und T-Rex-Modell.
  function setPlayerModel(model: PlayerModel) {
    playerModel.value = model
  }

  function togglePlayerModel() {
    const i = PLAYER_MODELS.indexOf(playerModel.value)
    playerModel.value = PLAYER_MODELS[(i + 1) % PLAYER_MODELS.length] ?? 'human'
  }

  return {
    state,
    score,
    coins,
    distance,
    speed,
    lane,
    isDucking,
    isGrounded,
    jumpRequested,
    playerModel,
    startGame,
    gameOver,
    moveLeft,
    moveRight,
    jump,
    duck,
    addCoin,
    setPlayerModel,
    togglePlayerModel,
  }
})
