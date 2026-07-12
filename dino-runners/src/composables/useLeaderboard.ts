import { ref, type Ref } from 'vue'
import type { PlayerModel } from '@/stores/game'

/**
 * Persistente Rangliste (Highscores).
 *
 * Da eine reine Browser-App nicht direkt ins Dateisystem schreiben darf,
 * werden die Einträge als JSON im `localStorage` gehalten. Über `exportJson()`
 * lässt sich der aktuelle Stand zusätzlich als echte `.json`-Textdatei
 * herunterladen.
 */

export interface ScoreEntry {
  name: string
  score: number
  coins: number
  model: PlayerModel
  // ISO-Zeitstempel des Laufs
  date: string
}

const STORAGE_KEY = 'dino-runners.leaderboard'
// Anzahl der gespeicherten Top-Einträge
const MAX_ENTRIES = 10

let entries: Ref<ScoreEntry[]> | undefined

function load(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : []
  } catch {
    return []
  }
}

function persist(list: ScoreEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list, null, 2))
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) – still ignorieren.
  }
}

export function useLeaderboard() {
  if (!entries) entries = ref<ScoreEntry[]>(load())
  const list = entries

  // Neuen Lauf einsortieren, absteigend nach Score, auf MAX_ENTRIES kürzen.
  function addScore(entry: ScoreEntry) {
    const next = [...list.value, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES)
    list.value = next
    persist(next)
  }

  function clear() {
    list.value = []
    persist(list.value)
  }

  // Aktuelle Rangliste als JSON-Datei herunterladen.
  function exportJson() {
    const blob = new Blob([JSON.stringify(list.value, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dino-runners-leaderboard.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return { entries: list, addScore, clear, exportJson }
}
