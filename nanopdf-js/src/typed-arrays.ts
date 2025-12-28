/**
 * TypedArray utilities for high-performance numeric operations.
 *
 * This module provides optimized operations using TypedArrays instead of
 * regular JavaScript arrays for numeric data. TypedArrays offer:
 * - Better memory efficiency (fixed-size elements)
 * - Faster iteration (no type checking per element)
 * - Better cache locality
 * - Direct memory access for FFI operations
 *
 * @module typed-arrays
 */

// ============================================================================
// Color Arrays (Float32Array for 0-1 normalized colors)
// ============================================================================

/**
 * Create a color array from RGB values (0-255 or 0-1).
 * Returns Float32Array normalized to 0-1 range.
 */
export function colorFromRGB(r: number, g: number, b: number, normalize = true): Float32Array {
  const color = new Float32Array(3);
  if (normalize && (r > 1 || g > 1 || b > 1)) {
    color[0] = r / 255;
    color[1] = g / 255;
    color[2] = b / 255;
  } else {
    color[0] = r;
    color[1] = g;
    color[2] = b;
  }
  return color;
}

/**
 * Create a color array from RGBA values.
 */
export function colorFromRGBA(
  r: number,
  g: number,
  b: number,
  a: number,
  normalize = true
): Float32Array {
  const color = new Float32Array(4);
  if (normalize && (r > 1 || g > 1 || b > 1 || a > 1)) {
    color[0] = r / 255;
    color[1] = g / 255;
    color[2] = b / 255;
    color[3] = a / 255;
  } else {
    color[0] = r;
    color[1] = g;
    color[2] = b;
    color[3] = a;
  }
  return color;
}

/**
 * Create a grayscale color array.
 */
export function colorFromGray(gray: number, normalize = true): Float32Array {
  const color = new Float32Array(1);
  color[0] = normalize && gray > 1 ? gray / 255 : gray;
  return color;
}

/**
 * Create a CMYK color array.
 */
export function colorFromCMYK(
  c: number,
  m: number,
  y: number,
  k: number,
  normalize = true
): Float32Array {
  const color = new Float32Array(4);
  if (normalize && (c > 1 || m > 1 || y > 1 || k > 1)) {
    color[0] = c / 255;
    color[1] = m / 255;
    color[2] = y / 255;
    color[3] = k / 255;
  } else {
    color[0] = c;
    color[1] = m;
    color[2] = y;
    color[3] = k;
  }
  return color;
}

// ============================================================================
// Point/Coordinate Arrays (Float32Array for x,y pairs)
// ============================================================================

/**
 * Create a point array from coordinates.
 * Stores as [x0, y0, x1, y1, x2, y2, ...]
 */
export function pointsFromCoords(...coords: number[]): Float32Array {
  return new Float32Array(coords);
}

/**
 * Create a point array from Point-like objects.
 */
export function pointsFromObjects(points: { x: number; y: number }[]): Float32Array {
  const arr = new Float32Array(points.length * 2);
  for (let i = 0; i < points.length; i++) {
    arr[i * 2] = points[i].x;
    arr[i * 2 + 1] = points[i].y;
  }
  return arr;
}

/**
 * Transform points in-place by a matrix.
 * Points are stored as [x0, y0, x1, y1, ...]
 * Matrix is [a, b, c, d, e, f]
 */
export function transformPointsInPlace(
  points: Float32Array,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
): void {
  const n = points.length;
  for (let i = 0; i < n; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    points[i] = x * a + y * c + e;
    points[i + 1] = x * b + y * d + f;
  }
}

/**
 * Transform points, returning a new array.
 */
export function transformPoints(
  points: Float32Array,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
): Float32Array {
  const result = new Float32Array(points.length);
  const n = points.length;
  for (let i = 0; i < n; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    result[i] = x * a + y * c + e;
    result[i + 1] = x * b + y * d + f;
  }
  return result;
}

// ============================================================================
// Rectangle Arrays (Float32Array for x0, y0, x1, y1 quads)
// ============================================================================

/**
 * Create a rectangle array from coordinates.
 * Stores as [x0, y0, x1, y1, ...]
 */
export function rectsFromCoords(...coords: number[]): Float32Array {
  return new Float32Array(coords);
}

/**
 * Create a rectangle array from Rect-like objects.
 */
export function rectsFromObjects(
  rects: { x0: number; y0: number; x1: number; y1: number }[]
): Float32Array {
  const arr = new Float32Array(rects.length * 4);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    arr[i * 4] = r.x0;
    arr[i * 4 + 1] = r.y0;
    arr[i * 4 + 2] = r.x1;
    arr[i * 4 + 3] = r.y1;
  }
  return arr;
}

/**
 * Transform rectangles in-place by a matrix.
 * For axis-aligned transforms (b=0, c=0), preserves rectangle form.
 * For other transforms, computes bounding box of transformed corners.
 */
export function transformRectsInPlace(
  rects: Float32Array,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
): void {
  const n = rects.length;

  // Fast path: translation only
  if (a === 1 && b === 0 && c === 0 && d === 1) {
    for (let i = 0; i < n; i += 4) {
      rects[i] += e;
      rects[i + 1] += f;
      rects[i + 2] += e;
      rects[i + 3] += f;
    }
    return;
  }

  // Fast path: axis-aligned (scale + translate)
  if (b === 0 && c === 0) {
    for (let i = 0; i < n; i += 4) {
      let x0 = rects[i] * a + e;
      let y0 = rects[i + 1] * d + f;
      let x1 = rects[i + 2] * a + e;
      let y1 = rects[i + 3] * d + f;
      // Handle negative scale
      if (x0 > x1) [x0, x1] = [x1, x0];
      if (y0 > y1) [y0, y1] = [y1, y0];
      rects[i] = x0;
      rects[i + 1] = y0;
      rects[i + 2] = x1;
      rects[i + 3] = y1;
    }
    return;
  }

  // General case: transform corners and compute bounding box
  for (let i = 0; i < n; i += 4) {
    const x0 = rects[i],
      y0 = rects[i + 1];
    const x1 = rects[i + 2],
      y1 = rects[i + 3];

    // Transform all four corners
    const p1x = x0 * a + y0 * c + e,
      p1y = x0 * b + y0 * d + f;
    const p2x = x1 * a + y0 * c + e,
      p2y = x1 * b + y0 * d + f;
    const p3x = x0 * a + y1 * c + e,
      p3y = x0 * b + y1 * d + f;
    const p4x = x1 * a + y1 * c + e,
      p4y = x1 * b + y1 * d + f;

    // Compute bounding box
    rects[i] = Math.min(p1x, p2x, p3x, p4x);
    rects[i + 1] = Math.min(p1y, p2y, p3y, p4y);
    rects[i + 2] = Math.max(p1x, p2x, p3x, p4x);
    rects[i + 3] = Math.max(p1y, p2y, p3y, p4y);
  }
}

// ============================================================================
// Matrix Operations (Float32Array for [a, b, c, d, e, f])
// ============================================================================

/**
 * Create an identity matrix.
 */
export function matrixIdentity(): Float32Array {
  return new Float32Array([1, 0, 0, 1, 0, 0]);
}

/**
 * Create a translation matrix.
 */
export function matrixTranslate(tx: number, ty: number): Float32Array {
  return new Float32Array([1, 0, 0, 1, tx, ty]);
}

/**
 * Create a scale matrix.
 */
export function matrixScale(sx: number, sy: number = sx): Float32Array {
  return new Float32Array([sx, 0, 0, sy, 0, 0]);
}

/**
 * Create a rotation matrix (degrees).
 */
export function matrixRotate(degrees: number): Float32Array {
  // Fast paths for common angles
  switch (degrees) {
    case 0:
      return new Float32Array([1, 0, 0, 1, 0, 0]);
    case 90:
      return new Float32Array([0, 1, -1, 0, 0, 0]);
    case 180:
      return new Float32Array([-1, 0, 0, -1, 0, 0]);
    case 270:
    case -90:
      return new Float32Array([0, -1, 1, 0, 0, 0]);
  }

  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return new Float32Array([cos, sin, -sin, cos, 0, 0]);
}

/**
 * Concatenate two matrices in-place (m1 = m1 * m2).
 */
export function matrixConcatInPlace(m1: Float32Array, m2: Float32Array): void {
  const a = m1[0] * m2[0] + m1[1] * m2[2];
  const b = m1[0] * m2[1] + m1[1] * m2[3];
  const c = m1[2] * m2[0] + m1[3] * m2[2];
  const d = m1[2] * m2[1] + m1[3] * m2[3];
  const e = m1[4] * m2[0] + m1[5] * m2[2] + m2[4];
  const f = m1[4] * m2[1] + m1[5] * m2[3] + m2[5];
  m1[0] = a;
  m1[1] = b;
  m1[2] = c;
  m1[3] = d;
  m1[4] = e;
  m1[5] = f;
}

/**
 * Concatenate two matrices, returning new array.
 */
export function matrixConcat(m1: Float32Array, m2: Float32Array): Float32Array {
  return new Float32Array([
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5]
  ]);
}

// ============================================================================
// Batch Distance Calculations
// ============================================================================

/**
 * Calculate distances from one point to multiple points.
 * Returns Float32Array of distances.
 */
export function pointDistances(fromX: number, fromY: number, points: Float32Array): Float32Array {
  const n = points.length / 2;
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const dx = points[i * 2] - fromX;
    const dy = points[i * 2 + 1] - fromY;
    result[i] = Math.sqrt(dx * dx + dy * dy);
  }
  return result;
}

/**
 * Calculate squared distances (faster, no sqrt).
 */
export function pointDistancesSquared(
  fromX: number,
  fromY: number,
  points: Float32Array
): Float32Array {
  const n = points.length / 2;
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const dx = points[i * 2] - fromX;
    const dy = points[i * 2 + 1] - fromY;
    result[i] = dx * dx + dy * dy;
  }
  return result;
}

// ============================================================================
// Containment Tests
// ============================================================================

/**
 * Test which points are inside a rectangle.
 * Returns Uint8Array (0 = outside, 1 = inside).
 */
export function rectContainsPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  points: Float32Array
): Uint8Array {
  const n = points.length / 2;
  const result = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const px = points[i * 2];
    const py = points[i * 2 + 1];
    result[i] = px >= x0 && px < x1 && py >= y0 && py < y1 ? 1 : 0;
  }
  return result;
}

/**
 * Count points inside a rectangle (no allocation).
 */
export function countPointsInRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  points: Float32Array
): number {
  let count = 0;
  const n = points.length;
  for (let i = 0; i < n; i += 2) {
    const px = points[i];
    const py = points[i + 1];
    if (px >= x0 && px < x1 && py >= y0 && py < y1) {
      count++;
    }
  }
  return count;
}

// ============================================================================
// Pixel Operations
// ============================================================================

/**
 * Convert pixel data from one format to another.
 * Supported: RGB to RGBA, RGBA to RGB, Gray to RGB, etc.
 */
export function convertPixelFormat(
  src: Uint8Array,
  srcComponents: number,
  dstComponents: number,
  defaultAlpha = 255
): Uint8Array {
  const srcPixels = src.length / srcComponents;
  const dst = new Uint8Array(srcPixels * dstComponents);

  if (srcComponents === 3 && dstComponents === 4) {
    // RGB to RGBA
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      dst[j] = src[i];
      dst[j + 1] = src[i + 1];
      dst[j + 2] = src[i + 2];
      dst[j + 3] = defaultAlpha;
    }
  } else if (srcComponents === 4 && dstComponents === 3) {
    // RGBA to RGB
    for (let i = 0, j = 0; i < src.length; i += 4, j += 3) {
      dst[j] = src[i];
      dst[j + 1] = src[i + 1];
      dst[j + 2] = src[i + 2];
    }
  } else if (srcComponents === 1 && dstComponents === 3) {
    // Gray to RGB
    for (let i = 0, j = 0; i < src.length; i++, j += 3) {
      dst[j] = dst[j + 1] = dst[j + 2] = src[i];
    }
  } else if (srcComponents === 1 && dstComponents === 4) {
    // Gray to RGBA
    for (let i = 0, j = 0; i < src.length; i++, j += 4) {
      dst[j] = dst[j + 1] = dst[j + 2] = src[i];
      dst[j + 3] = defaultAlpha;
    }
  } else {
    throw new Error(`Unsupported conversion: ${srcComponents} -> ${dstComponents}`);
  }

  return dst;
}

/**
 * Premultiply alpha in RGBA pixel data (in-place).
 */
export function premultiplyAlpha(pixels: Uint8Array): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3] / 255;
    pixels[i] = Math.round(pixels[i] * a);
    pixels[i + 1] = Math.round(pixels[i + 1] * a);
    pixels[i + 2] = Math.round(pixels[i + 2] * a);
  }
}

/**
 * Unpremultiply alpha in RGBA pixel data (in-place).
 */
export function unpremultiplyAlpha(pixels: Uint8Array): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a > 0 && a < 255) {
      const scale = 255 / a;
      pixels[i] = Math.min(255, Math.round(pixels[i] * scale));
      pixels[i + 1] = Math.min(255, Math.round(pixels[i + 1] * scale));
      pixels[i + 2] = Math.min(255, Math.round(pixels[i + 2] * scale));
    }
  }
}
