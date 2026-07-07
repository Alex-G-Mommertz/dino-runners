import * as CANNON from 'cannon-es'

/**
 * Zentrale cannon-es Physikwelt (Singleton).
 *
 * Enthält:
 * - eine unendliche Bodenebene (statisch)
 * - den Spieler-Körper als vereinfachte Box (BoxCollider)
 *
 * Die seitliche Bewegung (Lane) wird kinematisch gesteuert, während
 * Sprung und Fall über die Gravitation der Physik-Engine laufen.
 */

// Halbe Kantenlänge des Spieler-Würfels
const PLAYER_HALF = 0.5
// Ruhehöhe des Spielers (Mittelpunkt der Box über dem Boden)
export const PLAYER_GROUND_Y = PLAYER_HALF

let world: CANNON.World | undefined
let playerBody: CANNON.Body | undefined

function init() {
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) })
  world.broadphase = new CANNON.NaiveBroadphase()

  // Boden: unendliche Ebene, in die XZ-Fläche gedreht
  const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() })
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(ground)

  // Spieler: dynamische Box, Rotation gesperrt (kippt nicht durch Physik um)
  playerBody = new CANNON.Body({
    mass: 1,
    fixedRotation: true,
    shape: new CANNON.Box(new CANNON.Vec3(PLAYER_HALF, PLAYER_HALF, PLAYER_HALF)),
    position: new CANNON.Vec3(0, PLAYER_GROUND_Y, 0),
  })
  world.addBody(playerBody)
}

export function usePhysics() {
  if (!world || !playerBody) init()
  return { world: world!, playerBody: playerBody! }
}
