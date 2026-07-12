<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import { useGameStore } from '@/stores/game'
import { useObstacles } from '@/composables/useObstacles'
import { useLeaderboard } from '@/composables/useLeaderboard'

const game = useGameStore()
const obstacles = useObstacles()
const leaderboard = useLeaderboard()

// Spielername für die Rangliste (im localStorage gemerkt)
const playerName = ref(localStorage.getItem('dino-runners.name') ?? 'Spieler')
watch(playerName, (name) => localStorage.setItem('dino-runners.name', name))

function startGame() {
  obstacles.reset()
  game.startGame()
}

// Zurück ins Startmenü (z. B. nach Game Over, um das Modell neu zu wählen).
function goToMenu() {
  obstacles.reset()
  game.state = 'menu'
}

// Icon je Spieler-Modell für die Rangliste
const MODEL_ICON: Record<string, string> = {
  human: '🧍',
  trex: '🦖',
  astronaut: '👨‍🚀',
  zombie: '🧟',
  haunter: '👻',
  unicorn: '🦄',
  velociraptor: '🦕',
  parasaurolophus: '🦕',
}
function modelIcon(model: string) {
  return MODEL_ICON[model] ?? '🧍'
}

// Beim Übergang running -> gameover den Lauf in die Rangliste eintragen.
watch(
  () => game.state,
  (state, prev) => {
    if (state === 'gameover' && prev === 'running') {
      leaderboard.addScore({
        name: playerName.value.trim() || 'Spieler',
        score: game.score,
        coins: game.coins,
        model: game.playerModel,
        date: new Date().toISOString(),
      })
    }
  },
)

// Tastatur-Steuerung: Spur wechseln, springen, rollen, neu starten.
function onKeyDown(e: KeyboardEvent) {
  // Im Menü/Game-Over: Leertaste oder Enter startet das Spiel.
  if (game.state !== 'running') {
    if (e.key === ' ' || e.key === 'Enter') {
      startGame()
      return
    }
    if ((e.key === 'm' || e.key === 'M') && game.state === 'menu') {
      game.togglePlayerModel()
      return
    }
    if ((e.key === 'Escape' || e.key === 'm' || e.key === 'M') && game.state === 'gameover') {
      goToMenu()
      return
    }
    return
  }

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
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  // Im Startmenü beginnen: Spieler steht bereit, Modell ist wählbar.
  goToMenu()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <!-- 3D-Welt (Canvas) -->
  <GameCanvas />

  <!-- UI-Layer: strikt getrennt vom Canvas -->
  <div
    class="pointer-events-none fixed inset-0 flex flex-col justify-between p-6 font-mono text-white"
  >
    <div class="flex justify-between text-xl drop-shadow">
      <span>Score: {{ game.score }}</span>
      <span>Coins: {{ game.coins }}</span>
    </div>

    <!-- Startmenü: Modell-Auswahl vor Spielbeginn -->
    <div
      v-if="game.state === 'menu'"
      class="pointer-events-auto flex flex-col items-center gap-4 self-center rounded-xl bg-black/60 px-10 py-8 text-center"
    >
      <h1 class="text-4xl font-bold">Dino Runners</h1>
      <p class="text-sm opacity-80">Wähle dein Modell</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="game.playerModel === 'human' ? 'bg-white text-black' : 'bg-black/50 text-white'"
          @click="game.setPlayerModel('human')"
        >
          🧍 Mensch
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="game.playerModel === 'trex' ? 'bg-white text-black' : 'bg-black/50 text-white'"
          @click="game.setPlayerModel('trex')"
        >
          🦖 T-Rex
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="
            game.playerModel === 'astronaut' ? 'bg-white text-black' : 'bg-black/50 text-white'
          "
          @click="game.setPlayerModel('astronaut')"
        >
          👨‍🚀 Astronaut
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="game.playerModel === 'zombie' ? 'bg-white text-black' : 'bg-black/50 text-white'"
          @click="game.setPlayerModel('zombie')"
        >
          🧟 Zombie
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="game.playerModel === 'haunter' ? 'bg-white text-black' : 'bg-black/50 text-white'"
          @click="game.setPlayerModel('haunter')"
        >
          👻 Haunter
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="game.playerModel === 'unicorn' ? 'bg-white text-black' : 'bg-black/50 text-white'"
          @click="game.setPlayerModel('unicorn')"
        >
          🦄 Unicorn
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="
            game.playerModel === 'velociraptor' ? 'bg-white text-black' : 'bg-black/50 text-white'
          "
          @click="game.setPlayerModel('velociraptor')"
        >
          🦕 Velociraptor
        </button>
        <button
          type="button"
          class="rounded-lg px-5 py-2 text-base font-bold transition"
          :class="
            game.playerModel === 'parasaurolophus'
              ? 'bg-white text-black'
              : 'bg-black/50 text-white'
          "
          @click="game.setPlayerModel('parasaurolophus')"
        >
          🦕 Parasaurolophus
        </button>
      </div>
      <label class="flex flex-col gap-1 text-left text-sm">
        <span class="opacity-80">Name</span>
        <input
          v-model="playerName"
          type="text"
          maxlength="16"
          class="rounded-lg bg-black/40 px-3 py-2 text-white outline-none ring-1 ring-white/20 focus:ring-white/60"
          @keydown.stop
        />
      </label>
      <button
        type="button"
        class="mt-2 rounded-lg bg-emerald-500 px-8 py-3 text-lg font-bold text-white transition hover:bg-emerald-400"
        @click="startGame"
      >
        Start
      </button>

      <!-- Rangliste -->
      <div class="mt-2 w-72 text-left">
        <div class="mb-1 flex items-center justify-between">
          <h2 class="text-sm font-bold uppercase tracking-wide opacity-80">Rangliste</h2>
          <div class="flex gap-2">
            <button
              type="button"
              class="text-xs underline opacity-70 hover:opacity-100 disabled:opacity-30"
              :disabled="leaderboard.entries.value.length === 0"
              @click="leaderboard.exportJson()"
            >
              Export JSON
            </button>
            <button
              type="button"
              class="text-xs underline opacity-70 hover:opacity-100 disabled:opacity-30"
              :disabled="leaderboard.entries.value.length === 0"
              @click="leaderboard.clear()"
            >
              Leeren
            </button>
          </div>
        </div>
        <p v-if="leaderboard.entries.value.length === 0" class="text-xs opacity-60">
          Noch keine Einträge – sei der Erste!
        </p>
        <ol v-else class="space-y-1 text-sm">
          <li
            v-for="(entry, i) in leaderboard.entries.value"
            :key="i"
            class="flex items-center justify-between gap-2 rounded bg-black/30 px-2 py-1"
          >
            <span class="w-5 text-right opacity-60">{{ i + 1 }}.</span>
            <span class="flex-1 truncate">{{ entry.name }}</span>
            <span class="opacity-60">{{ modelIcon(entry.model) }}</span>
            <span class="font-bold tabular-nums">{{ entry.score }}</span>
          </li>
        </ol>
      </div>

      <p class="text-xs opacity-70">Leertaste / Enter zum Starten · <kbd>M</kbd> Modell wechseln</p>
    </div>

    <!-- Game-Over-Overlay -->
    <div
      v-else-if="game.state === 'gameover'"
      class="pointer-events-auto flex flex-col items-center gap-2 self-center rounded-xl bg-black/60 px-8 py-6 text-center"
    >
      <h2 class="text-3xl font-bold">Game Over</h2>
      <p class="text-lg">Score: {{ game.score }} · Coins: {{ game.coins }}</p>

      <!-- Rangliste -->
      <ol class="my-2 w-72 space-y-1 text-left text-sm">
        <li
          v-for="(entry, i) in leaderboard.entries.value"
          :key="i"
          class="flex items-center justify-between gap-2 rounded px-2 py-1"
          :class="
            entry.name === (playerName.trim() || 'Spieler') && entry.score === game.score
              ? 'bg-emerald-500/40'
              : 'bg-black/30'
          "
        >
          <span class="w-5 text-right opacity-60">{{ i + 1 }}.</span>
          <span class="flex-1 truncate">{{ entry.name }}</span>
          <span class="opacity-60">{{ modelIcon(entry.model) }}</span>
          <span class="font-bold tabular-nums">{{ entry.score }}</span>
        </li>
      </ol>

      <div class="mt-2 flex gap-3">
        <button
          type="button"
          class="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-400"
          @click="startGame"
        >
          Nochmal
        </button>
        <button
          type="button"
          class="rounded-lg bg-black/50 px-6 py-2 font-bold text-white transition hover:bg-black/70"
          @click="goToMenu"
        >
          Menü
        </button>
      </div>
      <p class="text-sm opacity-80">
        Leertaste für Neustart · <kbd>M</kbd> / <kbd>Esc</kbd> für Menü
      </p>
    </div>

    <!-- Steuerungs-Hinweis nur im laufenden Spiel -->
    <p v-if="game.state === 'running'" class="self-center text-sm opacity-80">
      Pfeiltasten ← → zum Wechseln der Spur · ↑ / Leertaste zum Springen · ↓ zum Rollen
    </p>
    <p v-else class="self-center text-sm opacity-0">&nbsp;</p>
  </div>
</template>
