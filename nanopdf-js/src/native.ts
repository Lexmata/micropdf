/**
 * Native module loader
 *
 * Handles loading the native addon, with fallback to mock implementation
 * for development/testing without native bindings.
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Native addon interface - mirrors the Rust FFI exports
 */
export interface NativeAddon {
  getVersion(): string;

  // Context
  createContext(): NativeContext;
  dropContext(ctx: NativeContext): void;

  // Document
  openDocument(ctx: NativeContext, data: globalThis.Buffer, magic?: string): NativeDocument;
  openDocumentFromPath(ctx: NativeContext, path: string): NativeDocument;
  dropDocument(ctx: NativeContext, doc: NativeDocument): void;
  countPages(ctx: NativeContext, doc: NativeDocument): number;
  loadPage(ctx: NativeContext, doc: NativeDocument, pageNum: number): NativePage;
  dropPage(ctx: NativeContext, page: NativePage): void;
  boundPage(ctx: NativeContext, page: NativePage): NativeRect;

  // Document metadata
  getMetadata(ctx: NativeContext, doc: NativeDocument, key: string): string | null;
  setMetadata(ctx: NativeContext, doc: NativeDocument, key: string, value: string): void;

  // Document writing
  saveDocument(ctx: NativeContext, doc: NativeDocument, path: string, options?: string): void;
  writeDocument(ctx: NativeContext, doc: NativeDocument): globalThis.Buffer;

  // Rendering
  renderPage(
    ctx: NativeContext,
    page: NativePage,
    matrix: NativeMatrix,
    colorspace: NativeColorspace,
    alpha: boolean
  ): NativePixmap;
  renderPageToPNG(
    ctx: NativeContext,
    page: NativePage,
    dpi: number,
    colorspace: NativeColorspace
  ): globalThis.Buffer;

  // Text extraction
  extractText(ctx: NativeContext, page: NativePage): string;
  extractTextBlocks(
    ctx: NativeContext,
    page: NativePage
  ): Array<{
    text: string;
    bbox: NativeRect;
  }>;
  searchText(
    ctx: NativeContext,
    page: NativePage,
    needle: string,
    caseSensitive: boolean
  ): NativeRect[];

  // Structured text
  newSTextPage(ctx: NativeContext, page: NativePage): NativeSTextPage;
  dropSTextPage(ctx: NativeContext, stext: NativeSTextPage): void;
  getSTextAsText(ctx: NativeContext, stext: NativeSTextPage): string;
  searchSTextPage(
    ctx: NativeContext,
    stext: NativeSTextPage,
    needle: string,
    maxHits: number
  ): Array<{
    ul: { x: number; y: number };
    ur: { x: number; y: number };
    ll: { x: number; y: number };
    lr: { x: number; y: number };
  }>;
  getSTextPageBounds(ctx: NativeContext, stext: NativeSTextPage): NativeRect;

  // Links
  getPageLinks(
    ctx: NativeContext,
    page: NativePage
  ): Array<{
    rect: NativeRect;
    uri?: string;
    page?: number;
  }>;

  // Authentication
  needsPassword(ctx: NativeContext, doc: NativeDocument): boolean;
  authenticatePassword(ctx: NativeContext, doc: NativeDocument, password: string): boolean;
  hasPermission(ctx: NativeContext, doc: NativeDocument, permission: number): boolean;

  // Named destinations
  resolveLink(ctx: NativeContext, doc: NativeDocument, uri: string): number | null;

  // Font operations
  loadFontFromMemory(ctx: NativeContext, data: globalThis.Buffer, index: number): NativeFont;
  loadFontFromFile(ctx: NativeContext, path: string, index: number): NativeFont;
  dropFont(ctx: NativeContext, font: NativeFont): void;
  getFontName(ctx: NativeContext, font: NativeFont): string;
  getFontBBox(ctx: NativeContext, font: NativeFont): NativeRect;

  // Image operations
  loadImageFromMemory(ctx: NativeContext, data: globalThis.Buffer): NativeImage;
  loadImageFromFile(ctx: NativeContext, path: string): NativeImage;
  dropImage(ctx: NativeContext, image: NativeImage): void;
  getImageWidth(ctx: NativeContext, image: NativeImage): number;
  getImageHeight(ctx: NativeContext, image: NativeImage): number;
  getImageColorspace(ctx: NativeContext, image: NativeImage): NativeColorspace;
  getImagePixmap(ctx: NativeContext, image: NativeImage, subarea?: NativeRect): NativePixmap;
  scalePixmap(
    ctx: NativeContext,
    pixmap: NativePixmap,
    width: number,
    height: number
  ): NativePixmap;

  // Output operations
  openOutput(ctx: NativeContext, path: string): NativeOutput;
  dropOutput(ctx: NativeContext, output: NativeOutput): void;
  writeOutput(ctx: NativeContext, output: NativeOutput, data: globalThis.Buffer): void;
  tellOutput(ctx: NativeContext, output: NativeOutput): number;
  seekOutput(ctx: NativeContext, output: NativeOutput, offset: number, whence: number): void;

  // Archive operations
  openArchive(ctx: NativeContext, path: string): NativeArchive;
  openArchiveFromMemory(ctx: NativeContext, data: globalThis.Buffer): NativeArchive;
  dropArchive(ctx: NativeContext, archive: NativeArchive): void;
  countArchiveEntries(ctx: NativeContext, archive: NativeArchive): number;
  listArchiveEntry(ctx: NativeContext, archive: NativeArchive, index: number): string;
  hasArchiveEntry(ctx: NativeContext, archive: NativeArchive, name: string): boolean;
  readArchiveEntry(ctx: NativeContext, archive: NativeArchive, name: string): globalThis.Buffer;

  // Enhanced API (np_* functions)
  npAddBlankPage(ctx: NativeContext, doc: NativeDocument, width: number, height: number): number;
  npAddWatermark(
    ctx: NativeContext,
    doc: NativeDocument,
    text: string,
    fontSize: number,
    opacity: number
  ): void;
  npDrawLine(
    ctx: NativeContext,
    page: NativePage,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: number[],
    alpha: number,
    lineWidth: number
  ): void;
  npDrawRectangle(
    ctx: NativeContext,
    page: NativePage,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number[],
    alpha: number,
    fill: boolean
  ): void;
  npDrawCircle(
    ctx: NativeContext,
    page: NativePage,
    x: number,
    y: number,
    radius: number,
    color: number[],
    alpha: number,
    fill: boolean
  ): void;
  npMergePDFs(ctx: NativeContext, inputPaths: string[], outputPath: string): void;
  npSplitPDF(ctx: NativeContext, inputPath: string, outputDir: string): string[];
  npOptimizePDF(ctx: NativeContext, path: string): void;
  npLinearizePDF(ctx: NativeContext, inputPath: string, outputPath: string): void;

  // Buffer
  Buffer: {
    new (capacity?: number): NativeBuffer;
    fromBuffer(data: globalThis.Buffer): NativeBuffer;
    fromString(str: string): NativeBuffer;
  };

  // Geometry
  createPoint(x: number, y: number): NativePoint;
  transformPoint(point: NativePoint, matrix: NativeMatrix): NativePoint;
  normalizeVector(point: NativePoint): NativePoint;

  createRect(x0: number, y0: number, x1: number, y1: number): NativeRect;
  rectEmpty(): NativeRect;
  rectInfinite(): NativeRect;
  rectUnit(): NativeRect;
  isRectEmpty(rect: NativeRect): boolean;
  isRectInfinite(rect: NativeRect): boolean;
  rectUnion(a: NativeRect, b: NativeRect): NativeRect;
  rectIntersect(a: NativeRect, b: NativeRect): NativeRect;
  rectContains(a: NativeRect, b: NativeRect): boolean;
  transformRect(rect: NativeRect, matrix: NativeMatrix): NativeRect;

  createIRect(x0: number, y0: number, x1: number, y1: number): NativeIRect;
  iRectFromRect(rect: NativeRect): NativeIRect;
  rectFromIRect(irect: NativeIRect): NativeRect;
  isIRectEmpty(irect: NativeIRect): boolean;
  iRectUnion(a: NativeIRect, b: NativeIRect): NativeIRect;
  iRectIntersect(a: NativeIRect, b: NativeIRect): NativeIRect;

  matrixIdentity(): NativeMatrix;
  matrixTranslate(tx: number, ty: number): NativeMatrix;
  matrixScale(sx: number, sy: number): NativeMatrix;
  matrixRotate(degrees: number): NativeMatrix;
  matrixShear(sx: number, sy: number): NativeMatrix;
  matrixConcat(a: NativeMatrix, b: NativeMatrix): NativeMatrix;
  matrixInvert(m: NativeMatrix): NativeMatrix | null;
  isMatrixIdentity(m: NativeMatrix): boolean;
  isMatrixRectilinear(m: NativeMatrix): boolean;

  createQuadFromRect(rect: NativeRect): NativeQuad;
  rectFromQuad(quad: NativeQuad): NativeRect;
  transformQuad(quad: NativeQuad, matrix: NativeMatrix): NativeQuad;
  isPointInsideQuad(point: NativePoint, quad: NativeQuad): boolean;

  // Colorspace
  deviceGray(): NativeColorspace;
  deviceRGB(): NativeColorspace;
  deviceBGR(): NativeColorspace;
  deviceCMYK(): NativeColorspace;
  deviceLab(): NativeColorspace;
  colorspaceN(cs: NativeColorspace): number;
  colorspaceName(cs: NativeColorspace): string;
  convertColor(srcCs: NativeColorspace, srcValues: number[], dstCs: NativeColorspace): number[];

  // Pixmap
  createPixmap(
    colorspace: NativeColorspace | null,
    width: number,
    height: number,
    alpha: boolean
  ): NativePixmap;
  pixmapWidth(pm: NativePixmap): number;
  pixmapHeight(pm: NativePixmap): number;
  pixmapN(pm: NativePixmap): number;
  pixmapAlpha(pm: NativePixmap): boolean;
  pixmapStride(pm: NativePixmap): number;
  pixmapSamples(pm: NativePixmap): Uint8Array;
  clearPixmap(pm: NativePixmap): void;
  clearPixmapWithValue(pm: NativePixmap, value: number): void;
  invertPixmap(pm: NativePixmap): void;
  gammaPixmap(pm: NativePixmap, gamma: number): void;
}

export interface NativeBuffer {
  length(): number;
  getData(): globalThis.Buffer;
  append(data: globalThis.Buffer | Uint8Array): this;
  appendByte(byte: number): this;
  appendString(str: string): this;
  appendInt16LE(value: number): this;
  appendInt32LE(value: number): this;
  appendInt16BE(value: number): this;
  appendInt32BE(value: number): this;
  clear(): this;
  resize(size: number): this;
  slice(start: number, end?: number): NativeBuffer;
  toBuffer(): globalThis.Buffer;
  md5Digest(): Uint8Array;
}

export interface NativeContext {
  _handle: number; // Opaque handle
}

export interface NativeDocument {
  _handle: number; // Opaque handle
}

export interface NativePage {
  _handle: number; // Opaque handle
}

export interface NativeFont {
  _handle: number; // Opaque handle
}

export interface NativeImage {
  _handle: number; // Opaque handle
}

export interface NativeOutput {
  _handle: number; // Opaque handle
}

export interface NativeArchive {
  _handle: number; // Opaque handle
}

export interface NativeSTextPage {
  _handle: number; // Opaque handle
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

export interface NativeIRect {
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

export interface NativeQuad {
  ul: NativePoint;
  ur: NativePoint;
  ll: NativePoint;
  lr: NativePoint;
}

export interface NativeColorspace {
  name: string;
  n: number;
  type: string;
}

export interface NativePixmap {
  width: number;
  height: number;
  n: number;
  alpha: boolean;
  stride: number;
  samples: Uint8Array;
}

/**
 * Try to load the native addon from various locations
 */
function tryLoadNative(): NativeAddon | null {
  const locations = [
    // node-gyp-build locations
    join(__dirname, '..', 'prebuilds'),
    join(__dirname, '..', 'build', 'Release'),
    join(__dirname, '..', 'build', 'Debug')
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
 * Helper to create a function that throws "FFI required" error
 */
function requireFFI(fnName: string): (...args: unknown[]) => never {
  return (..._args: unknown[]) => {
    throw new Error(
      `FFI function '${fnName}' requires native bindings. ` +
        'Build the native addon or provide mock implementation.'
    );
  };
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

    appendByte(byte: number): this {
      this.data = globalThis.Buffer.concat([this.data, globalThis.Buffer.from([byte])]);
      return this;
    }

    appendString(str: string): this {
      return this.append(globalThis.Buffer.from(str, 'utf-8'));
    }

    appendInt16LE(value: number): this {
      const buf = globalThis.Buffer.alloc(2);
      buf.writeInt16LE(value, 0);
      return this.append(buf);
    }

    appendInt32LE(value: number): this {
      const buf = globalThis.Buffer.alloc(4);
      buf.writeInt32LE(value, 0);
      return this.append(buf);
    }

    appendInt16BE(value: number): this {
      const buf = globalThis.Buffer.alloc(2);
      buf.writeInt16BE(value, 0);
      return this.append(buf);
    }

    appendInt32BE(value: number): this {
      const buf = globalThis.Buffer.alloc(4);
      buf.writeInt32BE(value, 0);
      return this.append(buf);
    }

    clear(): this {
      this.data = globalThis.Buffer.alloc(0);
      return this;
    }

    resize(size: number): this {
      const newData = globalThis.Buffer.alloc(size);
      this.data.copy(newData, 0, 0, Math.min(this.data.length, size));
      this.data = newData;
      return this;
    }

    slice(start: number, end?: number): NativeBuffer {
      const sliced = new MockBuffer();
      sliced.data = globalThis.Buffer.from(this.data.subarray(start, end));
      return sliced;
    }

    toBuffer(): globalThis.Buffer {
      return this.data;
    }

    md5Digest(): Uint8Array {
      const crypto = require('node:crypto');
      const hash = crypto.createHash('md5');
      hash.update(this.data);
      return new Uint8Array(hash.digest());
    }
  }

  return {
    getVersion: () => '0.1.0-mock',

    Buffer: MockBuffer as unknown as NativeAddon['Buffer'],

    // Point
    createPoint: (x: number, y: number): NativePoint => ({ x, y }),
    transformPoint: (p: NativePoint, m: NativeMatrix): NativePoint => ({
      x: p.x * m.a + p.y * m.c + m.e,
      y: p.x * m.b + p.y * m.d + m.f
    }),
    normalizeVector: (p: NativePoint): NativePoint => {
      const len = Math.sqrt(p.x * p.x + p.y * p.y);
      if (len === 0) return { x: 0, y: 0 };
      return { x: p.x / len, y: p.y / len };
    },

    // Rect
    createRect: (x0: number, y0: number, x1: number, y1: number): NativeRect => ({
      x0,
      y0,
      x1,
      y1
    }),
    rectEmpty: (): NativeRect => ({
      x0: Infinity,
      y0: Infinity,
      x1: -Infinity,
      y1: -Infinity
    }),
    rectInfinite: (): NativeRect => ({
      x0: -Infinity,
      y0: -Infinity,
      x1: Infinity,
      y1: Infinity
    }),
    rectUnit: (): NativeRect => ({ x0: 0, y0: 0, x1: 1, y1: 1 }),
    isRectEmpty: (r: NativeRect): boolean => r.x0 >= r.x1 || r.y0 >= r.y1,
    isRectInfinite: (r: NativeRect): boolean => r.x0 === -Infinity,
    rectUnion: (a: NativeRect, b: NativeRect): NativeRect => ({
      x0: Math.min(a.x0, b.x0),
      y0: Math.min(a.y0, b.y0),
      x1: Math.max(a.x1, b.x1),
      y1: Math.max(a.y1, b.y1)
    }),
    rectIntersect: (a: NativeRect, b: NativeRect): NativeRect => ({
      x0: Math.max(a.x0, b.x0),
      y0: Math.max(a.y0, b.y0),
      x1: Math.min(a.x1, b.x1),
      y1: Math.min(a.y1, b.y1)
    }),
    rectContains: (a: NativeRect, b: NativeRect): boolean =>
      a.x0 <= b.x0 && a.y0 <= b.y0 && a.x1 >= b.x1 && a.y1 >= b.y1,
    transformRect: (r: NativeRect, m: NativeMatrix): NativeRect => {
      const p1 = { x: r.x0 * m.a + r.y0 * m.c + m.e, y: r.x0 * m.b + r.y0 * m.d + m.f };
      const p2 = { x: r.x1 * m.a + r.y0 * m.c + m.e, y: r.x1 * m.b + r.y0 * m.d + m.f };
      const p3 = { x: r.x0 * m.a + r.y1 * m.c + m.e, y: r.x0 * m.b + r.y1 * m.d + m.f };
      const p4 = { x: r.x1 * m.a + r.y1 * m.c + m.e, y: r.x1 * m.b + r.y1 * m.d + m.f };
      return {
        x0: Math.min(p1.x, p2.x, p3.x, p4.x),
        y0: Math.min(p1.y, p2.y, p3.y, p4.y),
        x1: Math.max(p1.x, p2.x, p3.x, p4.x),
        y1: Math.max(p1.y, p2.y, p3.y, p4.y)
      };
    },

    // IRect
    createIRect: (x0: number, y0: number, x1: number, y1: number): NativeIRect => ({
      x0: Math.floor(x0),
      y0: Math.floor(y0),
      x1: Math.floor(x1),
      y1: Math.floor(y1)
    }),
    iRectFromRect: (r: NativeRect): NativeIRect => ({
      x0: Math.floor(r.x0),
      y0: Math.floor(r.y0),
      x1: Math.ceil(r.x1),
      y1: Math.ceil(r.y1)
    }),
    rectFromIRect: (r: NativeIRect): NativeRect => ({
      x0: r.x0,
      y0: r.y0,
      x1: r.x1,
      y1: r.y1
    }),
    isIRectEmpty: (r: NativeIRect): boolean => r.x0 >= r.x1 || r.y0 >= r.y1,
    iRectUnion: (a: NativeIRect, b: NativeIRect): NativeIRect => ({
      x0: Math.min(a.x0, b.x0),
      y0: Math.min(a.y0, b.y0),
      x1: Math.max(a.x1, b.x1),
      y1: Math.max(a.y1, b.y1)
    }),
    iRectIntersect: (a: NativeIRect, b: NativeIRect): NativeIRect => ({
      x0: Math.max(a.x0, b.x0),
      y0: Math.max(a.y0, b.y0),
      x1: Math.min(a.x1, b.x1),
      y1: Math.min(a.y1, b.y1)
    }),

    // Matrix
    matrixIdentity: (): NativeMatrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    matrixTranslate: (tx: number, ty: number): NativeMatrix => ({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: tx,
      f: ty
    }),
    matrixScale: (sx: number, sy: number): NativeMatrix => ({
      a: sx,
      b: 0,
      c: 0,
      d: sy,
      e: 0,
      f: 0
    }),
    matrixRotate: (degrees: number): NativeMatrix => {
      const rad = (degrees * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
    },
    matrixShear: (sx: number, sy: number): NativeMatrix => ({
      a: 1,
      b: sy,
      c: sx,
      d: 1,
      e: 0,
      f: 0
    }),
    matrixConcat: (a: NativeMatrix, b: NativeMatrix): NativeMatrix => ({
      a: a.a * b.a + a.b * b.c,
      b: a.a * b.b + a.b * b.d,
      c: a.c * b.a + a.d * b.c,
      d: a.c * b.b + a.d * b.d,
      e: a.e * b.a + a.f * b.c + b.e,
      f: a.e * b.b + a.f * b.d + b.f
    }),
    matrixInvert: (m: NativeMatrix): NativeMatrix | null => {
      const det = m.a * m.d - m.b * m.c;
      if (Math.abs(det) < 1e-14) return null;
      const invDet = 1 / det;
      return {
        a: m.d * invDet,
        b: -m.b * invDet,
        c: -m.c * invDet,
        d: m.a * invDet,
        e: (m.c * m.f - m.d * m.e) * invDet,
        f: (m.b * m.e - m.a * m.f) * invDet
      };
    },
    isMatrixIdentity: (m: NativeMatrix): boolean =>
      m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0,
    isMatrixRectilinear: (m: NativeMatrix): boolean =>
      (m.b === 0 && m.c === 0) || (m.a === 0 && m.d === 0),

    // Quad
    createQuadFromRect: (r: NativeRect): NativeQuad => ({
      ul: { x: r.x0, y: r.y0 },
      ur: { x: r.x1, y: r.y0 },
      ll: { x: r.x0, y: r.y1 },
      lr: { x: r.x1, y: r.y1 }
    }),
    rectFromQuad: (q: NativeQuad): NativeRect => ({
      x0: Math.min(q.ul.x, q.ur.x, q.ll.x, q.lr.x),
      y0: Math.min(q.ul.y, q.ur.y, q.ll.y, q.lr.y),
      x1: Math.max(q.ul.x, q.ur.x, q.ll.x, q.lr.x),
      y1: Math.max(q.ul.y, q.ur.y, q.ll.y, q.lr.y)
    }),
    transformQuad: (q: NativeQuad, m: NativeMatrix): NativeQuad => {
      const transform = (p: NativePoint) => ({
        x: p.x * m.a + p.y * m.c + m.e,
        y: p.x * m.b + p.y * m.d + m.f
      });
      return {
        ul: transform(q.ul),
        ur: transform(q.ur),
        ll: transform(q.ll),
        lr: transform(q.lr)
      };
    },
    isPointInsideQuad: (p: NativePoint, q: NativeQuad): boolean => {
      const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;
      const check = (p1: NativePoint, p2: NativePoint) =>
        cross(p2.x - p1.x, p2.y - p1.y, p.x - p1.x, p.y - p1.y) >= 0;
      return check(q.ul, q.ur) && check(q.ur, q.lr) && check(q.lr, q.ll) && check(q.ll, q.ul);
    },

    // Colorspace
    deviceGray: (): NativeColorspace => ({ name: 'DeviceGray', n: 1, type: 'GRAY' }),
    deviceRGB: (): NativeColorspace => ({ name: 'DeviceRGB', n: 3, type: 'RGB' }),
    deviceBGR: (): NativeColorspace => ({ name: 'DeviceBGR', n: 3, type: 'BGR' }),
    deviceCMYK: (): NativeColorspace => ({ name: 'DeviceCMYK', n: 4, type: 'CMYK' }),
    deviceLab: (): NativeColorspace => ({ name: 'Lab', n: 3, type: 'LAB' }),
    colorspaceN: (cs: NativeColorspace): number => cs.n,
    colorspaceName: (cs: NativeColorspace): string => cs.name,
    convertColor: (
      srcCs: NativeColorspace,
      srcValues: number[],
      dstCs: NativeColorspace
    ): number[] => {
      // Basic color conversion via RGB intermediate (FFI would use ICC profiles)
      let rgb: [number, number, number];

      switch (srcCs.type) {
        case 'GRAY':
          rgb = [srcValues[0] ?? 0, srcValues[0] ?? 0, srcValues[0] ?? 0];
          break;
        case 'RGB':
          rgb = [srcValues[0] ?? 0, srcValues[1] ?? 0, srcValues[2] ?? 0];
          break;
        case 'BGR':
          rgb = [srcValues[2] ?? 0, srcValues[1] ?? 0, srcValues[0] ?? 0];
          break;
        case 'CMYK': {
          const c = srcValues[0] ?? 0,
            m = srcValues[1] ?? 0,
            y = srcValues[2] ?? 0,
            k = srcValues[3] ?? 0;
          rgb = [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
          break;
        }
        default:
          rgb = [0, 0, 0];
      }

      switch (dstCs.type) {
        case 'GRAY':
          return [0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]];
        case 'RGB':
          return [...rgb];
        case 'BGR':
          return [rgb[2], rgb[1], rgb[0]];
        case 'CMYK': {
          const k = 1 - Math.max(rgb[0], rgb[1], rgb[2]);
          if (k === 1) return [0, 0, 0, 1];
          return [
            (1 - rgb[0] - k) / (1 - k),
            (1 - rgb[1] - k) / (1 - k),
            (1 - rgb[2] - k) / (1 - k),
            k
          ];
        }
        default:
          return [];
      }
    },

    // Pixmap
    createPixmap: (
      colorspace: NativeColorspace | null,
      width: number,
      height: number,
      alpha: boolean
    ): NativePixmap => {
      const n = colorspace ? colorspace.n + (alpha ? 1 : 0) : alpha ? 1 : 0;
      const stride = width * n;
      return {
        width,
        height,
        n,
        alpha,
        stride,
        samples: new Uint8Array(stride * height)
      };
    },
    pixmapWidth: (pm: NativePixmap): number => pm.width,
    pixmapHeight: (pm: NativePixmap): number => pm.height,
    pixmapN: (pm: NativePixmap): number => pm.n,
    pixmapAlpha: (pm: NativePixmap): boolean => pm.alpha,
    pixmapStride: (pm: NativePixmap): number => pm.stride,
    pixmapSamples: (pm: NativePixmap): Uint8Array => pm.samples,
    clearPixmap: (pm: NativePixmap): void => {
      pm.samples.fill(0);
    },
    clearPixmapWithValue: (pm: NativePixmap, value: number): void => {
      pm.samples.fill(value);
    },
    invertPixmap: (pm: NativePixmap): void => {
      const colorants = pm.alpha ? pm.n - 1 : pm.n;
      for (let y = 0; y < pm.height; y++) {
        for (let x = 0; x < pm.width; x++) {
          const offset = y * pm.stride + x * pm.n;
          for (let i = 0; i < colorants; i++) {
            const idx = offset + i;
            if (idx < pm.samples.length) {
              pm.samples[idx] = 255 - (pm.samples[idx] ?? 0);
            }
          }
        }
      }
    },
    gammaPixmap: (pm: NativePixmap, gamma: number): void => {
      const invGamma = 1 / gamma;
      const colorants = pm.alpha ? pm.n - 1 : pm.n;
      for (let y = 0; y < pm.height; y++) {
        for (let x = 0; x < pm.width; x++) {
          const offset = y * pm.stride + x * pm.n;
          for (let i = 0; i < colorants; i++) {
            const idx = offset + i;
            if (idx < pm.samples.length) {
              const normalized = (pm.samples[idx] ?? 0) / 255;
              pm.samples[idx] = Math.round(Math.pow(normalized, invGamma) * 255);
            }
          }
        }
      }
    },

    // Context operations
    createContext: requireFFI('createContext') as () => NativeContext,
    dropContext: requireFFI('dropContext') as (ctx: NativeContext) => void,

    // Document operations
    openDocument: requireFFI('openDocument') as (
      ctx: NativeContext,
      data: globalThis.Buffer,
      magic?: string
    ) => NativeDocument,
    openDocumentFromPath: requireFFI('openDocumentFromPath') as (
      ctx: NativeContext,
      path: string
    ) => NativeDocument,
    dropDocument: requireFFI('dropDocument') as (ctx: NativeContext, doc: NativeDocument) => void,
    countPages: requireFFI('countPages') as (ctx: NativeContext, doc: NativeDocument) => number,
    loadPage: requireFFI('loadPage') as (
      ctx: NativeContext,
      doc: NativeDocument,
      pageNum: number
    ) => NativePage,
    dropPage: requireFFI('dropPage') as (ctx: NativeContext, page: NativePage) => void,
    boundPage: requireFFI('boundPage') as (ctx: NativeContext, page: NativePage) => NativeRect,
    getMetadata: requireFFI('getMetadata') as (
      ctx: NativeContext,
      doc: NativeDocument,
      key: string
    ) => string | null,
    setMetadata: requireFFI('setMetadata') as (
      ctx: NativeContext,
      doc: NativeDocument,
      key: string,
      value: string
    ) => void,
    saveDocument: requireFFI('saveDocument') as (
      ctx: NativeContext,
      doc: NativeDocument,
      path: string,
      options?: string
    ) => void,
    writeDocument: requireFFI('writeDocument') as (
      ctx: NativeContext,
      doc: NativeDocument
    ) => globalThis.Buffer,

    // Rendering operations
    renderPage: requireFFI('renderPage') as (
      ctx: NativeContext,
      page: NativePage,
      matrix: NativeMatrix,
      colorspace: NativeColorspace,
      alpha: boolean
    ) => NativePixmap,
    renderPageToPNG: requireFFI('renderPageToPNG') as (
      ctx: NativeContext,
      page: NativePage,
      dpi: number,
      colorspace: NativeColorspace
    ) => globalThis.Buffer,

    // Text extraction
    extractText: requireFFI('extractText') as (ctx: NativeContext, page: NativePage) => string,
    extractTextBlocks: requireFFI('extractTextBlocks') as (
      ctx: NativeContext,
      page: NativePage
    ) => Array<{ text: string; bbox: NativeRect }>,
    searchText: requireFFI('searchText') as (
      ctx: NativeContext,
      page: NativePage,
      needle: string,
      caseSensitive: boolean
    ) => NativeRect[],

    // Structured text
    newSTextPage: requireFFI('newSTextPage') as (
      ctx: NativeContext,
      page: NativePage
    ) => NativeSTextPage,
    dropSTextPage: requireFFI('dropSTextPage') as (
      ctx: NativeContext,
      stext: NativeSTextPage
    ) => void,
    getSTextAsText: requireFFI('getSTextAsText') as (
      ctx: NativeContext,
      stext: NativeSTextPage
    ) => string,
    searchSTextPage: requireFFI('searchSTextPage') as (
      ctx: NativeContext,
      stext: NativeSTextPage,
      needle: string,
      maxHits: number
    ) => Array<{
      ul: { x: number; y: number };
      ur: { x: number; y: number };
      ll: { x: number; y: number };
      lr: { x: number; y: number };
    }>,
    getSTextPageBounds: requireFFI('getSTextPageBounds') as (
      ctx: NativeContext,
      stext: NativeSTextPage
    ) => NativeRect,

    // Links
    getPageLinks: requireFFI('getPageLinks') as (
      ctx: NativeContext,
      page: NativePage
    ) => Array<{ rect: NativeRect; uri?: string; page?: number }>,

    // Authentication
    needsPassword: requireFFI('needsPassword') as (
      ctx: NativeContext,
      doc: NativeDocument
    ) => boolean,
    authenticatePassword: requireFFI('authenticatePassword') as (
      ctx: NativeContext,
      doc: NativeDocument,
      password: string
    ) => boolean,
    hasPermission: requireFFI('hasPermission') as (
      ctx: NativeContext,
      doc: NativeDocument,
      permission: number
    ) => boolean,
    resolveLink: requireFFI('resolveLink') as (
      ctx: NativeContext,
      doc: NativeDocument,
      uri: string
    ) => number | null,

    // Font operations
    loadFontFromMemory: requireFFI('loadFontFromMemory') as (
      ctx: NativeContext,
      data: globalThis.Buffer,
      index: number
    ) => NativeFont,
    loadFontFromFile: requireFFI('loadFontFromFile') as (
      ctx: NativeContext,
      path: string,
      index: number
    ) => NativeFont,
    dropFont: requireFFI('dropFont') as (ctx: NativeContext, font: NativeFont) => void,
    getFontName: requireFFI('getFontName') as (ctx: NativeContext, font: NativeFont) => string,
    getFontBBox: requireFFI('getFontBBox') as (ctx: NativeContext, font: NativeFont) => NativeRect,

    // Image operations
    loadImageFromMemory: requireFFI('loadImageFromMemory') as (
      ctx: NativeContext,
      data: globalThis.Buffer
    ) => NativeImage,
    loadImageFromFile: requireFFI('loadImageFromFile') as (
      ctx: NativeContext,
      path: string
    ) => NativeImage,
    dropImage: requireFFI('dropImage') as (ctx: NativeContext, image: NativeImage) => void,
    getImageWidth: requireFFI('getImageWidth') as (
      ctx: NativeContext,
      image: NativeImage
    ) => number,
    getImageHeight: requireFFI('getImageHeight') as (
      ctx: NativeContext,
      image: NativeImage
    ) => number,
    getImageColorspace: requireFFI('getImageColorspace') as (
      ctx: NativeContext,
      image: NativeImage
    ) => NativeColorspace,
    getImagePixmap: requireFFI('getImagePixmap') as (
      ctx: NativeContext,
      image: NativeImage,
      subarea?: NativeRect
    ) => NativePixmap,
    scalePixmap: requireFFI('scalePixmap') as (
      ctx: NativeContext,
      pixmap: NativePixmap,
      width: number,
      height: number
    ) => NativePixmap,

    // Output operations
    openOutput: requireFFI('openOutput') as (ctx: NativeContext, path: string) => NativeOutput,
    dropOutput: requireFFI('dropOutput') as (ctx: NativeContext, output: NativeOutput) => void,
    writeOutput: requireFFI('writeOutput') as (
      ctx: NativeContext,
      output: NativeOutput,
      data: globalThis.Buffer
    ) => void,
    tellOutput: requireFFI('tellOutput') as (ctx: NativeContext, output: NativeOutput) => number,
    seekOutput: requireFFI('seekOutput') as (
      ctx: NativeContext,
      output: NativeOutput,
      offset: number,
      whence: number
    ) => void,

    // Archive operations
    openArchive: requireFFI('openArchive') as (ctx: NativeContext, path: string) => NativeArchive,
    openArchiveFromMemory: requireFFI('openArchiveFromMemory') as (
      ctx: NativeContext,
      data: globalThis.Buffer
    ) => NativeArchive,
    dropArchive: requireFFI('dropArchive') as (ctx: NativeContext, archive: NativeArchive) => void,
    countArchiveEntries: requireFFI('countArchiveEntries') as (
      ctx: NativeContext,
      archive: NativeArchive
    ) => number,
    listArchiveEntry: requireFFI('listArchiveEntry') as (
      ctx: NativeContext,
      archive: NativeArchive,
      index: number
    ) => string,
    hasArchiveEntry: requireFFI('hasArchiveEntry') as (
      ctx: NativeContext,
      archive: NativeArchive,
      name: string
    ) => boolean,
    readArchiveEntry: requireFFI('readArchiveEntry') as (
      ctx: NativeContext,
      archive: NativeArchive,
      name: string
    ) => globalThis.Buffer,

    // Enhanced API (np_* functions)
    npAddBlankPage: requireFFI('npAddBlankPage') as (
      ctx: NativeContext,
      doc: NativeDocument,
      width: number,
      height: number
    ) => number,
    npAddWatermark: requireFFI('npAddWatermark') as (
      ctx: NativeContext,
      doc: NativeDocument,
      text: string,
      fontSize: number,
      opacity: number
    ) => void,
    npDrawLine: requireFFI('npDrawLine') as (
      ctx: NativeContext,
      page: NativePage,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: number[],
      alpha: number,
      lineWidth: number
    ) => void,
    npDrawRectangle: requireFFI('npDrawRectangle') as (
      ctx: NativeContext,
      page: NativePage,
      x: number,
      y: number,
      width: number,
      height: number,
      color: number[],
      alpha: number,
      fill: boolean
    ) => void,
    npDrawCircle: requireFFI('npDrawCircle') as (
      ctx: NativeContext,
      page: NativePage,
      x: number,
      y: number,
      radius: number,
      color: number[],
      alpha: number,
      fill: boolean
    ) => void,
    npMergePDFs: requireFFI('npMergePDFs') as (
      ctx: NativeContext,
      inputPaths: string[],
      outputPath: string
    ) => void,
    npSplitPDF: requireFFI('npSplitPDF') as (
      ctx: NativeContext,
      inputPath: string,
      outputDir: string
    ) => string[],
    npOptimizePDF: requireFFI('npOptimizePDF') as (ctx: NativeContext, path: string) => void,
    npLinearizePDF: requireFFI('npLinearizePDF') as (
      ctx: NativeContext,
      inputPath: string,
      outputPath: string
    ) => void
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
export { addon as native };
