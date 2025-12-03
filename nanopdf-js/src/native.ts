/**
 * Native module loader
 * 
 * Handles loading the native addon, with fallback to mock implementation
 * for development/testing without native bindings.
 */

import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Native addon interface
 */
export interface NativeAddon {
  getVersion(): string;
  
  // Buffer
  Buffer: {
    new(capacity?: number): NativeBuffer;
    fromBuffer(data: globalThis.Buffer): NativeBuffer;
    fromString(str: string): NativeBuffer;
  };
  
  // Geometry
  createPoint(x: number, y: number): NativePoint;
  transformPoint(point: NativePoint, matrix: NativeMatrix): NativePoint;
  
  createRect(x0: number, y0: number, x1: number, y1: number): NativeRect;
  rectEmpty(): NativeRect;
  rectUnit(): NativeRect;
  isRectEmpty(rect: NativeRect): boolean;
  rectUnion(a: NativeRect, b: NativeRect): NativeRect;
  rectIntersect(a: NativeRect, b: NativeRect): NativeRect;
  
  matrixIdentity(): NativeMatrix;
  matrixTranslate(tx: number, ty: number): NativeMatrix;
  matrixScale(sx: number, sy: number): NativeMatrix;
  matrixRotate(degrees: number): NativeMatrix;
  matrixConcat(a: NativeMatrix, b: NativeMatrix): NativeMatrix;
}

export interface NativeBuffer {
  length(): number;
  getData(): globalThis.Buffer;
  append(data: globalThis.Buffer | Uint8Array): this;
  toBuffer(): globalThis.Buffer;
}

export interface NativePoint {
  x: number;
  y: number;
}

export interface NativeRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface NativeMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Try to load the native addon from various locations
 */
function tryLoadNative(): NativeAddon | null {
  const locations = [
    // node-gyp-build locations
    join(__dirname, '..', 'prebuilds'),
    join(__dirname, '..', 'build', 'Release'),
    join(__dirname, '..', 'build', 'Debug'),
  ];

  for (const location of locations) {
    try {
      if (existsSync(location)) {
        // Try node-gyp-build first
        const nodeGypBuild = require('node-gyp-build');
        return nodeGypBuild(join(__dirname, '..')) as NativeAddon;
      }
    } catch {
      // Continue to next location
    }
  }

  // Try direct require as fallback
  try {
    return require('../build/Release/nanopdf.node') as NativeAddon;
  } catch {
    return null;
  }
}

/**
 * Create a mock implementation for development/testing
 */
function createMockAddon(): NativeAddon {
  class MockBuffer implements NativeBuffer {
    private data: globalThis.Buffer;

    constructor(capacity = 0) {
      this.data = globalThis.Buffer.alloc(capacity);
    }

    static fromBuffer(data: globalThis.Buffer): MockBuffer {
      const buf = new MockBuffer();
      buf.data = globalThis.Buffer.from(data);
      return buf;
    }

    static fromString(str: string): MockBuffer {
      const buf = new MockBuffer();
      buf.data = globalThis.Buffer.from(str, 'utf-8');
      return buf;
    }

    length(): number {
      return this.data.length;
    }

    getData(): globalThis.Buffer {
      return this.data;
    }

    append(data: globalThis.Buffer | Uint8Array): this {
      this.data = globalThis.Buffer.concat([this.data, globalThis.Buffer.from(data)]);
      return this;
    }

    toBuffer(): globalThis.Buffer {
      return this.data;
    }
  }

  return {
    getVersion: () => '0.1.0-mock',
    
    Buffer: MockBuffer as unknown as NativeAddon['Buffer'],

    createPoint: (x: number, y: number): NativePoint => ({ x, y }),
    transformPoint: (p: NativePoint, m: NativeMatrix): NativePoint => ({
      x: p.x * m.a + p.y * m.c + m.e,
      y: p.x * m.b + p.y * m.d + m.f,
    }),

    createRect: (x0: number, y0: number, x1: number, y1: number): NativeRect => 
      ({ x0, y0, x1, y1 }),
    rectEmpty: (): NativeRect => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }),
    rectUnit: (): NativeRect => ({ x0: 0, y0: 0, x1: 1, y1: 1 }),
    isRectEmpty: (r: NativeRect): boolean => r.x0 >= r.x1 || r.y0 >= r.y1,
    rectUnion: (a: NativeRect, b: NativeRect): NativeRect => ({
      x0: Math.min(a.x0, b.x0),
      y0: Math.min(a.y0, b.y0),
      x1: Math.max(a.x1, b.x1),
      y1: Math.max(a.y1, b.y1),
    }),
    rectIntersect: (a: NativeRect, b: NativeRect): NativeRect => ({
      x0: Math.max(a.x0, b.x0),
      y0: Math.max(a.y0, b.y0),
      x1: Math.min(a.x1, b.x1),
      y1: Math.min(a.y1, b.y1),
    }),

    matrixIdentity: (): NativeMatrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    matrixTranslate: (tx: number, ty: number): NativeMatrix => 
      ({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }),
    matrixScale: (sx: number, sy: number): NativeMatrix => 
      ({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }),
    matrixRotate: (degrees: number): NativeMatrix => {
      const rad = degrees * Math.PI / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
    },
    matrixConcat: (a: NativeMatrix, b: NativeMatrix): NativeMatrix => ({
      a: a.a * b.a + a.b * b.c,
      b: a.a * b.b + a.b * b.d,
      c: a.c * b.a + a.d * b.c,
      d: a.c * b.b + a.d * b.d,
      e: a.e * b.a + a.f * b.c + b.e,
      f: a.e * b.b + a.f * b.d + b.f,
    }),
  };
}

// Load native addon or fall back to mock
let addon: NativeAddon;
const native = tryLoadNative();

if (native !== null) {
  addon = native;
} else {
  console.warn('NanoPDF: Native addon not found, using mock implementation');
  addon = createMockAddon();
}

export const native_addon = addon;
export const isMock = native === null;

