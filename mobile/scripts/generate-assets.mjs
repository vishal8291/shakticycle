// Pure-Node PNG generator for HealthMap AI brand assets.
// Produces: assets/icon.png, adaptive-icon.png, splash.png, favicon.png, notification-icon.png
// Usage: node scripts/generate-assets.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(here, '..', 'assets')
mkdirSync(assetsDir, { recursive: true })

// --- CRC32 table ---
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(width, height, pixels /* Uint8Array RGBA length = w*h*4 */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // Filter byte 0 per scanline
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    pixels.subarray(y * stride, (y + 1) * stride).copy
      ? pixels.subarray(y * stride, (y + 1) * stride).copy(raw, y * (stride + 1) + 1)
      : raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- Drawing helpers ---
function createCanvas(w, h) {
  return { w, h, px: new Uint8Array(w * h * 4) }
}
function setPx(c, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const i = (y * c.w + x) * 4
  // alpha blend
  if (a === 255) {
    c.px[i] = r
    c.px[i + 1] = g
    c.px[i + 2] = b
    c.px[i + 3] = 255
    return
  }
  const ba = c.px[i + 3] / 255
  const fa = a / 255
  const oa = fa + ba * (1 - fa)
  if (oa === 0) return
  c.px[i] = Math.round((r * fa + c.px[i] * ba * (1 - fa)) / oa)
  c.px[i + 1] = Math.round((g * fa + c.px[i + 1] * ba * (1 - fa)) / oa)
  c.px[i + 2] = Math.round((b * fa + c.px[i + 2] * ba * (1 - fa)) / oa)
  c.px[i + 3] = Math.round(oa * 255)
}
function fillRect(c, x, y, w, h, r, g, b, a = 255) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(c, i, j, r, g, b, a)
}
function fillGradient(c, c1, c2) {
  // diagonal gradient top-left -> bottom-right
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const t = (x + y) / (c.w + c.h - 2)
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
      setPx(c, x, y, r, g, b, 255)
    }
  }
}
function fillSolid(c, r, g, b) {
  for (let i = 0; i < c.px.length; i += 4) {
    c.px[i] = r
    c.px[i + 1] = g
    c.px[i + 2] = b
    c.px[i + 3] = 255
  }
}
function fillCircle(c, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius
  const r2o = (radius + 1.5) * (radius + 1.5)
  const y0 = Math.max(0, Math.floor(cy - radius - 2))
  const y1 = Math.min(c.h - 1, Math.ceil(cy + radius + 2))
  const x0 = Math.max(0, Math.floor(cx - radius - 2))
  const x1 = Math.min(c.w - 1, Math.ceil(cx + radius + 2))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= r2) setPx(c, x, y, r, g, b, a)
      else if (d2 <= r2o) {
        const d = Math.sqrt(d2)
        const aa = Math.max(0, 1 - (d - radius) / 1.5)
        setPx(c, x, y, r, g, b, Math.round(a * aa))
      }
    }
  }
}
function fillRoundedRect(c, x, y, w, h, radius, r, g, b, a = 255) {
  // straight edges
  fillRect(c, x + radius, y, w - 2 * radius, h, r, g, b, a)
  fillRect(c, x, y + radius, radius, h - 2 * radius, r, g, b, a)
  fillRect(c, x + w - radius, y + radius, radius, h - 2 * radius, r, g, b, a)
  // corners
  fillCircle(c, x + radius, y + radius, radius, r, g, b, a)
  fillCircle(c, x + w - radius, y + radius, radius, r, g, b, a)
  fillCircle(c, x + radius, y + h - radius, radius, r, g, b, a)
  fillCircle(c, x + w - radius, y + h - radius, radius, r, g, b, a)
}

// Draw a stylized heart+pulse mark as the HealthMap logo.
// Geometry is relative to canvas size so it scales to any icon/splash dimension.
function drawLogo(c, centerX, centerY, size, { white = [255, 255, 255], accent = [78, 189, 149] } = {}) {
  // Rounded square background tile (subtle)
  const tile = size * 0.9
  // Heart: two circles + triangle
  const heartSize = size * 0.55
  const lobeR = heartSize * 0.28
  const topY = centerY - heartSize * 0.1
  const leftX = centerX - lobeR * 0.95
  const rightX = centerX + lobeR * 0.95
  fillCircle(c, leftX, topY, lobeR, ...white, 255)
  fillCircle(c, rightX, topY, lobeR, ...white, 255)
  // Triangle pointing down (bottom of heart)
  const bottomY = centerY + heartSize * 0.55
  const triTop = topY + lobeR * 0.15
  for (let y = triTop; y <= bottomY; y++) {
    const t = (y - triTop) / (bottomY - triTop)
    const halfW = (1 - t) * heartSize * 0.65
    for (let x = centerX - halfW; x <= centerX + halfW; x++) {
      setPx(c, Math.round(x), Math.round(y), ...white, 255)
    }
  }
  // Pulse line horizontal across center
  const pulseY = centerY + size * 0.02
  const pulseThickness = Math.max(4, Math.round(size * 0.045))
  const pulseStart = centerX - heartSize * 0.8
  const pulseEnd = centerX + heartSize * 0.8
  // base line
  fillRect(c, Math.round(pulseStart), Math.round(pulseY - pulseThickness / 2), Math.round(pulseEnd - pulseStart), pulseThickness, ...accent, 255)
  // spike (triangle wave in middle)
  const spikeWidth = heartSize * 0.5
  const spikeStart = centerX - spikeWidth / 2
  const peakH = size * 0.12
  function line(x1, y1, x2, y2, th, col) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      fillCircle(c, x, y, th / 2, ...col, 255)
    }
  }
  const s = [
    [spikeStart, pulseY],
    [spikeStart + spikeWidth * 0.2, pulseY - peakH * 0.4],
    [spikeStart + spikeWidth * 0.4, pulseY + peakH * 0.8],
    [spikeStart + spikeWidth * 0.6, pulseY - peakH],
    [spikeStart + spikeWidth * 0.8, pulseY + peakH * 0.3],
    [spikeStart + spikeWidth, pulseY],
  ]
  for (let i = 0; i < s.length - 1; i++) line(s[i][0], s[i][1], s[i + 1][0], s[i + 1][1], pulseThickness, accent)
  return tile
}

function saveCanvas(c, name) {
  const buf = encodePNG(c.w, c.h, c.px)
  const p = resolve(assetsDir, name)
  writeFileSync(p, buf)
  console.log('wrote', p, buf.length, 'bytes')
}

// Brand palette (matches mobile/src/theme/colors.ts)
const brandPrimary = [44, 115, 217]
const brandGradient1 = [44, 115, 217]
const brandGradient2 = [78, 189, 149]
const brandBackground = [243, 249, 255]

// --- icon.png 1024x1024 (full-bleed gradient tile with logo) ---
{
  const c = createCanvas(1024, 1024)
  fillGradient(c, brandGradient1, brandGradient2)
  drawLogo(c, 512, 512, 700)
  saveCanvas(c, 'icon.png')
}

// --- adaptive-icon.png 1024x1024 (logo only on transparent-ish bg safe zone) ---
{
  const c = createCanvas(1024, 1024)
  fillSolid(c, ...brandPrimary)
  drawLogo(c, 512, 512, 560)
  saveCanvas(c, 'adaptive-icon.png')
}

// --- splash.png 1284x2778 (iPhone-ish; Expo will center & scale) ---
{
  const w = 1284, h = 2778
  const c = createCanvas(w, h)
  fillGradient(c, [230, 240, 255], brandBackground)
  drawLogo(c, w / 2, h / 2, 720)
  saveCanvas(c, 'splash.png')
}

// --- favicon.png 196x196 ---
{
  const c = createCanvas(196, 196)
  fillGradient(c, brandGradient1, brandGradient2)
  drawLogo(c, 98, 98, 150)
  saveCanvas(c, 'favicon.png')
}

// --- notification-icon.png 96x96 (Android monochrome-ish white on transparent not possible here; use primary) ---
{
  const c = createCanvas(96, 96)
  // Android expects monochrome white silhouette on transparent. We'll approximate with white on transparent.
  drawLogo(c, 48, 48, 80)
  saveCanvas(c, 'notification-icon.png')
}

console.log('All assets generated in', assetsDir)
