/**
 * Generates `public/og-image.png` — a 1200x630 branded social preview image
 * (Open Graph / Twitter cards) using an embedded 5x7 bitmap font so the PNG is
 * fully deterministic with zero font/rasterizer dependencies.
 *
 *   npm run gen:og
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const WIDTH = 1200
const HEIGHT = 630

/* ---------------- helpers ---------------- */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const lerp = (a, b, t) => a + (b - a) * t

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  typeBuf.copy(out, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length)
  return out
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // PNG filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      raw[p++] = rgba[idx]
      raw[p++] = rgba[idx + 1]
      raw[p++] = rgba[idx + 2]
      raw[p++] = rgba[idx + 3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------- canvas ---------------- */

const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
const out = (x, y) => (y * WIDTH + x) * 4

function setPx(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
  const i = out(x, y)
  pixels[i] = r
  pixels[i + 1] = g
  pixels[i + 2] = b
  pixels[i + 3] = a
}

function fillRect(x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) setPx(x, y, r, g, b, a)
}

function fillRoundRect(x1, y1, x2, y2, radius, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const dx = x < x1 + radius ? x1 + radius - x : x > x2 - radius ? x - (x2 - radius) : 0
      const dy = y < y1 + radius ? y1 + radius - y : y > y2 - radius ? y - (y2 - radius) : 0
      if (dx * dx + dy * dy <= radius * radius) setPx(x, y, r, g, b, a)
    }
  }
}

/* ---------------- 5x7 bitmap font ---------------- */

const F = (rows) => rows

const FONT = {
  ' ': F(['00000', '00000', '00000', '00000', '00000', '00000', '00000']),
  '.': F(['00000', '00000', '00000', '00000', '00000', '01100', '01100']),
  '-': F(['00000', '00000', '00000', '11111', '00000', '00000', '00000']),
  '0': F(['01110', '10001', '10011', '10101', '11001', '10001', '01110']),
  '1': F(['00100', '01100', '00100', '00100', '00100', '00100', '01110']),
  '2': F(['01110', '10001', '00001', '00010', '00100', '01000', '11111']),
  '3': F(['01110', '10001', '00001', '00110', '00001', '10001', '01110']),
  '4': F(['00010', '00110', '01010', '10010', '11111', '00010', '00010']),
  '5': F(['11111', '10000', '10000', '11110', '00001', '00001', '11110']),
  '6': F(['00110', '01000', '10000', '11110', '10001', '10001', '01110']),
  '7': F(['11111', '00001', '00010', '00100', '01000', '01000', '01000']),
  '8': F(['01110', '10001', '10001', '01110', '10001', '10001', '01110']),
  '9': F(['01110', '10001', '10001', '01111', '00001', '00010', '01100']),
  A: F(['01110', '10001', '10001', '11111', '10001', '10001', '10001']),
  B: F(['11110', '10001', '10001', '11110', '10001', '10001', '11110']),
  C: F(['01111', '10000', '10000', '10000', '10000', '10000', '01111']),
  D: F(['11110', '10001', '10001', '10001', '10001', '10001', '11110']),
  E: F(['11111', '10000', '10000', '11110', '10000', '10000', '11111']),
  F: F(['11111', '10000', '10000', '11110', '10000', '10000', '10000']),
  G: F(['01111', '10000', '10000', '10111', '10001', '10001', '01111']),
  H: F(['10001', '10001', '10001', '11111', '10001', '10001', '10001']),
  I: F(['01110', '00100', '00100', '00100', '00100', '00100', '01110']),
  J: F(['00111', '00010', '00010', '00010', '00010', '10010', '01100']),
  K: F(['10001', '10010', '10100', '11000', '10100', '10010', '10001']),
  L: F(['10000', '10000', '10000', '10000', '10000', '10000', '11111']),
  M: F(['10001', '11011', '10101', '10101', '10001', '10001', '10001']),
  N: F(['10001', '11001', '10101', '10011', '10001', '10001', '10001']),
  O: F(['01110', '10001', '10001', '10001', '10001', '10001', '01110']),
  P: F(['11110', '10001', '10001', '11110', '10000', '10000', '10000']),
  Q: F(['01110', '10001', '10001', '10001', '10101', '10010', '01101']),
  R: F(['11110', '10001', '10001', '11110', '10100', '10010', '10001']),
  S: F(['01111', '10000', '10000', '01110', '00001', '00001', '11110']),
  T: F(['11111', '00100', '00100', '00100', '00100', '00100', '00100']),
  U: F(['10001', '10001', '10001', '10001', '10001', '10001', '01110']),
  V: F(['10001', '10001', '10001', '10001', '10001', '01010', '00100']),
  W: F(['10001', '10001', '10001', '10101', '10101', '10101', '01010']),
  X: F(['10001', '10001', '01010', '00100', '01010', '10001', '10001']),
  Y: F(['10001', '10001', '01010', '00100', '00100', '00100', '00100']),
  Z: F(['11111', '00001', '00010', '00100', '01000', '10000', '11111']),
}

function textWidth(text, scale) {
  let width = 0
  for (let i = 0; i < text.length; i++) {
    width += (i === text.length - 1 ? 5 : 6) * scale
  }
  return width
}

function drawText(text, cx, topY, scale, r, g, b) {
  const startX = Math.round(cx - textWidth(text, scale) / 2)
  let penX = startX
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch !== ' ') {
      const glyph = FONT[ch] || FONT[' ']
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                setPx(penX + col * scale + sx, topY + row * scale + sy, r, g, b)
              }
            }
          }
        }
      }
    }
    penX += 6 * scale
  }
}

/* ---------------- scene ---------------- */

const TOP = [67, 56, 202] // #4338ca
const BOTTOM = [139, 92, 246] // #8b5cf6

for (let y = 0; y < HEIGHT; y++) {
  const t = y / (HEIGHT - 1)
  const r = lerp(TOP[0], BOTTOM[0], t)
  const g = lerp(TOP[1], BOTTOM[1], t)
  const b = lerp(TOP[2], BOTTOM[2], t)
  fillRect(0, y, WIDTH - 1, y, r, g, b)
}

// Radial glow above the icon.
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const d = Math.hypot(x - 600, y - 150)
    const glow = clamp(1 - d / 760, 0, 1)
    if (glow <= 0.01) continue
    const i = out(x, y)
    pixels[i] = clamp(pixels[i] + glow * 40, 0, 255)
    pixels[i + 1] = clamp(pixels[i + 1] + glow * 40, 0, 255)
    pixels[i + 2] = clamp(pixels[i + 2] + glow * 52, 0, 255)
  }
}

// Document glyph (white sheet + violet rule lines + a small accent badge).
fillRoundRect(508, 96, 692, 224, 26, 255, 255, 255, 250)
fillRoundRect(534, 140, 666, 150, 5, 124, 58, 237, 255)
fillRoundRect(534, 166, 666, 176, 5, 124, 58, 237, 255)
fillRoundRect(534, 192, 618, 202, 5, 124, 58, 237, 255)
fillRoundRect(612, 196, 666, 206, 5, 196, 181, 253, 255)

// Title / tagline / domain.
drawText('PDF TOOLS', 600, 268, 10, 255, 255, 255)
drawText('FREE ONLINE PDF TOOLKIT', 600, 378, 5, 226, 218, 250)
drawText('SHEHZADBASHIR.XYZ', 600, 466, 5, 165, 180, 252)

/* ---------------- write ---------------- */

const png = encodePng(WIDTH, HEIGHT, pixels)
const target = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
mkdirSync(path.dirname(target), { recursive: true })
writeFileSync(target, png)
console.log(`Wrote ${target} (${png.length} bytes, ${WIDTH}x${HEIGHT})`)