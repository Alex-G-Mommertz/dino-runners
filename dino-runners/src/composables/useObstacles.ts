import { reactive } from 'vue'
import { usePhysics } from './usePhysics'
import { useGameStore } from '@/stores/game'

/**
 * Spawning, Bewegung und Kollision von Hindernissen und Items.
 *
 * Folgt den Spec-Prinzipien:
 * - Objekt-Pooling: ein fester Pool wird recycelt, statt Meshes/Objekte
 *   pro Frame neu zu erzeugen (schont die Garbage Collection).
 * - Vereinfachte BoxCollider: die Kollision ist ein simpler AABB-Overlap
 *   (unsichtbare Boxen), keine komplexen Meshes.
 *
 * Entitäts-Arten:
 * - 'coin':  Item, wird beim Berühren eingesammelt (+1 Coin).
 * - 'bone':  seltenes Item, gibt beim Einsammeln +10 Coins.
 * - 'block': Boden-Hindernis, muss übersprungen oder umfahren werden.
 * - 'bar':   Überkopf-Balken, muss unterrollt (Ducken) oder umfahren werden.
 * - 'ramp':  begehbarer Hügel; hebt die Spielerhöhe an (hochlaufen), tötet nicht.
 */

export type EntityKind = 'coin' | 'bone' | 'block' | 'bar' | 'ramp'

export interface Entity {
  id: number
  active: boolean
  kind: EntityKind
  lane: number
  z: number
}

// Weltabstand zwischen den drei Lanes (muss zu useGameLoop passen)
const LANE_WIDTH = 2
// Spawn-Position weit vor der Kamera
const SPAWN_Z = -70
// Ab dieser Z-Position (hinter der Kamera) wird recycelt
const RECYCLE_Z = 12
// Weltabstand zwischen zwei Spawns
const SPAWN_GAP = 11
// Grösse des Objekt-Pools
const POOL_SIZE = 24
// Halbe Kollisionsbreite/-tiefe für den AABB-Check
const HIT_HALF_X = 0.9
const HIT_HALF_Z = 0.7
// Ab dieser Spielerhöhe gilt ein Boden-Hindernis als übersprungen
const JUMP_CLEAR_Y = 1.4

// Rampe/Hügel als Ellipsoid: halbe Breite (X), Höhe (Y), halbe Länge (Z).
// Das Höhenprofil ist analytisch, damit Visual und Kollision identisch sind.
export const RAMP_RX = 0.9
export const RAMP_RY = 3.6
export const RAMP_RZ = 6

let entities: Entity[] | undefined
let spawnAccumulator = 0

function create() {
  entities = reactive(
    Array.from({ length: POOL_SIZE }, (_, i) => ({
      id: i,
      active: false,
      kind: 'coin' as EntityKind,
      lane: 0,
      z: 0,
    })),
  )
}

function spawn() {
  const e = entities!.find((x) => !x.active)
  if (!e) return

  e.active = true
  e.lane = Math.floor(Math.random() * 3) - 1
  const r = Math.random()
  e.kind = r < 0.3 ? 'coin' : r < 0.4 ? 'bone' : r < 0.58 ? 'block' : r < 0.74 ? 'bar' : 'ramp'
  e.z = SPAWN_Z
}

/**
 * Höhe der begehbaren Oberfläche unter der Spielerposition (x, z=0).
 * Summiert nicht, sondern nimmt den höchsten aktiven Rampenpunkt.
 * Basis ist der flache Boden (0).
 */
function groundHeightAt(px: number): number {
  if (!entities) return 0
  let h = 0
  for (const e of entities) {
    if (!e.active || e.kind !== 'ramp') continue
    // Spieler steht bei z = 0; dz ist der Abstand zur Rampenmitte.
    const dz = -e.z
    if (Math.abs(dz) >= RAMP_RZ) continue
    const dx = px - e.lane * LANE_WIDTH
    if (Math.abs(dx) >= RAMP_RX) continue
    const term = 1 - (dx / RAMP_RX) ** 2 - (dz / RAMP_RZ) ** 2
    if (term <= 0) continue
    const y = RAMP_RY * Math.sqrt(term)
    if (y > h) h = y
  }
  return h
}

function reset() {
  if (!entities) create()
  for (const e of entities!) e.active = false
  spawnAccumulator = 0
}

function update(delta: number) {
  const game = useGameStore()
  if (game.state !== 'running') return

  const { playerBody } = usePhysics()
  const px = playerBody.position.x
  const py = playerBody.position.y

  // Neue Entitäten distanzbasiert einstreuen
  spawnAccumulator += game.speed * delta
  while (spawnAccumulator >= SPAWN_GAP) {
    spawnAccumulator -= SPAWN_GAP
    spawn()
  }

  for (const e of entities!) {
    if (!e.active) continue

    // Entgegenlaufende Bewegung
    e.z += game.speed * delta
    if (e.z > RECYCLE_Z) {
      e.active = false
      continue
    }

    // Rampen töten nicht; ihre Wirkung läuft über groundHeightAt().
    if (e.kind === 'ramp') continue

    // Vereinfachter BoxCollider: AABB-Overlap gegen die Spieler-Box
    const ox = e.lane * LANE_WIDTH
    const hit = Math.abs(px - ox) < HIT_HALF_X && Math.abs(e.z) < HIT_HALF_Z
    if (!hit) continue

    switch (e.kind) {
      case 'coin':
        e.active = false
        game.addCoin()
        break
      case 'bone':
        e.active = false
        game.addCoin(10)
        break
      case 'block':
        // Nur durch ausreichend hohen Sprung passierbar
        if (py < JUMP_CLEAR_Y) {
          game.gameOver()
          return
        }
        break
      case 'bar':
        // Nur im Roll-/Duck-Zustand passierbar
        if (!game.isDucking) {
          game.gameOver()
          return
        }
        break
    }
  }
}

export function useObstacles() {
  if (!entities) create()
  return { entities: entities!, update, reset, groundHeightAt }
}
