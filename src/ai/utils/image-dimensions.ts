/**
 * Lightweight image dimension utilities (no external deps)
 * Supports PNG and JPEG for data URLs and HTTP URLs
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

function isPNG(buf: Buffer) {
  return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

function isJPEG(buf: Buffer) {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
}

function parsePNG(buf: Buffer): ImageDimensions | null {
  // PNG signature (8 bytes) + IHDR chunk starts at offset 8
  if (buf.length < 24) return null;
  try {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
    return null;
  } catch {
    return null;
  }
}

function parseJPEG(buf: Buffer): ImageDimensions | null {
  // Walk through JPEG markers to find SOF0/2
  let offset = 2; // skip 0xFFD8
  const len = buf.length;
  while (offset < len) {
    // Find marker
    if (buf[offset] !== 0xff) { offset++; continue; }
    let marker = buf[offset + 1];
    // Skip padding FFs
    while (marker === 0xff) { offset++; marker = buf[offset + 1]; }

    // SOI(FFD8) and TEM(FF01) have no length
    if (marker === 0xd8 || marker === 0x01) { offset += 2; continue; }
    // EOI(FFD9)
    if (marker === 0xd9) break;

    const size = buf.readUInt16BE(offset + 2);
    if (size < 2) return null;

    // SOF0(FFC0), SOF1(FFC1), SOF2(FFC2), SOF3(FFC3), SOF5-7, SOF9-11, SOF13-15
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    offset += 2 + size;
  }
  return null;
}

export function getImageDimensionsFromBuffer(buf: Buffer): ImageDimensions | null {
  if (isPNG(buf)) return parsePNG(buf);
  if (isJPEG(buf)) return parseJPEG(buf);
  return null;
}

export async function getImageDimensionsFromDataUrl(dataUrl: string): Promise<ImageDimensions | null> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const base64 = match[2];
  const buf = Buffer.from(base64, 'base64');
  return getImageDimensionsFromBuffer(buf);
}

export async function getImageDimensionsFromUrl(url: string): Promise<ImageDimensions | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  return getImageDimensionsFromBuffer(buf);
}

export async function ensureExactDimensions(imageUrl: string, expectedWidth: number, expectedHeight: number): Promise<{ ok: boolean; width?: number; height?: number; }> {
  try {
    let dims: ImageDimensions | null = null;
    if (imageUrl.startsWith('data:')) {
      dims = await getImageDimensionsFromDataUrl(imageUrl);
    } else if (imageUrl.startsWith('http')) {
      dims = await getImageDimensionsFromUrl(imageUrl);
    }
    if (!dims) return { ok: false };
    return { ok: dims.width === expectedWidth && dims.height === expectedHeight, width: dims.width, height: dims.height };
  } catch {
    return { ok: false };
  }
}

