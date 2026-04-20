#!/usr/bin/env node
// Generates public/icon-192.png and public/icon-512.png using only Node.js built-ins.
// Run once with: node scripts/generate-icons.js
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Draws a square icon: purple background, white outer border, white 3×3 grid lines.
function makePNG(size) {
  const PURPLE = [134, 59, 255, 255]; // #863bff
  const WHITE  = [255, 255, 255, 255];

  const border   = Math.round(size * 0.05);
  const inner    = size - 2 * border;
  const cellSize = Math.floor(inner / 3);
  const lineW    = Math.max(2, Math.round(size * 0.018));
  const halfLine = Math.floor(lineW / 2);

  // Precompute which inner-coordinates are on a divider line
  const vLines = new Set();
  const hLines = new Set();
  for (const mult of [1, 2]) {
    const center = mult * cellSize;
    for (let d = -halfLine; d < lineW - halfLine; d++) {
      vLines.add(center + d);
      hLines.add(center + d);
    }
  }

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // PNG filter byte: None
    for (let x = 0; x < size; x++) {
      const isOuterBorder = x < border || x >= size - border || y < border || y >= size - border;
      const ix = x - border;
      const iy = y - border;
      const isInnerLine = !isOuterBorder && (vLines.has(ix) || hLines.has(iy));
      const color = (isOuterBorder || isInnerLine) ? WHITE : PURPLE;
      row.push(...color);
    }
    rows.push(Buffer.from(row));
  }

  const rawData    = Buffer.concat(rows);
  const compressed = deflateSync(rawData);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // RGBA colour type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', makePNG(192));
writeFileSync('public/icon-512.png', makePNG(512));
console.log('Generated public/icon-192.png and public/icon-512.png');
