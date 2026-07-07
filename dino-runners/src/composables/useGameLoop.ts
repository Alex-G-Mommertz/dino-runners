import { usePhysics, PLAYER_GROUND_Y } from './usePhysics'
import { useObstacles } from './useObstacles'
import { useGameStore } from '@/stores/game'

/**
 * Zentrale Spiel-Schleife: Bewegung ("Rennen") und Physik-Schritt.
 *
 * Sämtliche Berechnungen (Physik, Sprung, Distanz/Score) laufen hier.
 * Die 3D-Komponenten reagieren nur auf den daraus resultierenden Zustand.
 */

// Fester Physik-Zeitschritt (60 Hz) für stabile Simulation
const PHYSICS_STEP = 1 / 60
// Anfangs-Vertikalgeschwindigkeit eines Sprungs
const JUMP_VELOCITY = 11
// Weltabstand zwischen den drei Lanes
const LANE_WIDTH = 2
// Interpolationsgeschwindigkeit der seitlichen Bewegung
const LANE_LERP = 10
// Wie stark die Laufgeschwindigkeit pro Sekunde zunimmt
const ACCELERATION = 0.4
// Toleranz für die Boden-Erkennung
const GROUND_EPSILON = 0.02

export function useGameLoop() {
  const game = useGameStore()
  const { world, playerBody } = usePhysics()
  const obstacles = useObstacles()

  function update(rawDelta: number) {
    if (game.state !== 'running') return

    // Grosse Frame-Sprünge (z. B. Tab-Wechsel) begrenzen
    const delta = Math.min(rawDelta, 0.05)

    // Rennen: Geschwindigkeit steigt stetig, Distanz treibt den Score
    game.speed += delta * ACCELERATION
    game.distance += game.speed * delta
    game.score = Math.floor(game.distance)

    // Seitliche Bewegung kinematisch: Ziel-Lane sanft anfahren
    const targetX = game.lane * LANE_WIDTH
    playerBody.position.x += (targetX - playerBody.position.x) * Math.min(delta * LANE_LERP, 1)
    playerBody.velocity.x = 0
    playerBody.velocity.z = 0
    playerBody.position.z = 0

    // Hindernisse/Items bewegen, spawnen und Kollision prüfen
    obstacles.update(delta)

    // Begehbare Oberfläche unter dem Spieler (Rampe hebt den Boden an)
    const floorY = PLAYER_GROUND_Y + obstacles.groundHeightAt(playerBody.position.x)

    // Boden-Erkennung: nahe der aktuellen Oberfläche und nicht steigend
    const grounded =
      playerBody.position.y <= floorY + GROUND_EPSILON &&
      playerBody.velocity.y <= GROUND_EPSILON
    game.isGrounded = grounded

    // Sprung nur vom Boden aus auslösen
    if (game.jumpRequested && grounded) {
      playerBody.velocity.y = JUMP_VELOCITY
    }
    game.jumpRequested = false

    // Physik-Schritt mit fester Schrittweite
    world.step(PHYSICS_STEP, delta, 3)

    // Nicht durch die begehbare Oberfläche fallen (Hochlaufen der Rampe)
    if (playerBody.position.y < floorY) {
      playerBody.position.y = floorY
      if (playerBody.velocity.y < 0) playerBody.velocity.y = 0
    }
  }

  return { update, playerBody }
}
