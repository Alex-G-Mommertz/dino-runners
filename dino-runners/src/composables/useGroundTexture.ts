import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

/**
 * Erzeugt prozedurale Dschungel-Texturen per Canvas (keine externen Assets).
 * Die Texturen werden einmalig gebaut (Singleton) und gekachelt auf Boden
 * und Lauf-Pfad gelegt.
 */

interface JungleTextures {
  grass: Texture
  dirt: Texture
}

let textures: JungleTextures | undefined

/** Kleiner deterministischer Zufall, damit das Muster stabil bleibt. */
function makeNoise(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Gras-Textur: sattes Dschungel-Grün mit Halmen und Farbvariation. */
function createGrassTexture(): Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = makeNoise(1337)

  // Grundfläche mit dunkelgrünem Verlauf
  const bg = ctx.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#177e28')
  bg.addColorStop(1, '#2d5824')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Farbige Flecken (heller/dunkler) für Tiefe
  for (let i = 0; i < 900; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 2 + rand() * 6
    const shade = rand()
    ctx.fillStyle =
      shade > 0.66
        ? 'rgba(120,190,90,0.35)'
        : shade > 0.33
          ? 'rgba(20,70,25,0.35)'
          : 'rgba(60,140,55,0.3)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Einzelne Grashalme
  ctx.lineWidth = 1
  for (let i = 0; i < 600; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = 3 + rand() * 6
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(150,210,110,0.5)' : 'rgba(25,80,30,0.5)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 3, y - len)
    ctx.stroke()
  }

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(8, 40)
  tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/** Erd-/Trampelpfad-Textur: feuchte Dschungel-Erde mit Steinchen. */
function createDirtTexture(): Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = makeNoise(4711)

  // Gleichmässiger Erd-Grundton – bewusst KEIN Verlauf, sonst entsteht beim
  // Scrollen ein periodisches Hell/Dunkel-Banding zwischen den Kacheln.
  ctx.fillStyle = '#5a3f26'
  ctx.fillRect(0, 0, size, size)

  // Zeichnet einen Fleck nahtlos: an allen Kanten gespiegelt wiederholt, damit
  // die Textur kachelbar ist und keine sichtbaren Nähte entstehen.
  function speck(x: number, y: number, r: number, color: string) {
    ctx.fillStyle = color
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.beginPath()
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Weiche Farbflecken für Tiefe/Feuchtigkeit
  for (let i = 0; i < 400; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 6 + rand() * 18
    ctx.globalAlpha = 0.18
    speck(x, y, r, rand() > 0.5 ? '#6f5033' : '#3d2a18')
  }

  // Feine Körnung / kleine Steinchen
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 500; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 1 + rand() * 3
    const shade = rand()
    speck(x, y, r, shade > 0.7 ? '#785c3c' : shade > 0.4 ? '#2a1c10' : '#50381f')
  }
  ctx.globalAlpha = 1

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1, 1)
  tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/** Liefert die (einmalig gebauten) Dschungel-Texturen. */
export function useGroundTexture(): JungleTextures {
  if (!textures) {
    textures = {
      grass: createGrassTexture(),
      dirt: createDirtTexture(),
    }
  }
  return textures
}
