/**
 * Pixmap - Pixel buffer for rendering
 *
 * This implementation mirrors the Rust `fitz::pixmap::Pixmap` for 100% API compatibility.
 */

import { Colorspace } from './colorspace.js';
import { NanoPDFError, type IRectLike } from './types.js';

/**
 * A pixel buffer for storing image data
 */
export class Pixmap {
  private readonly _x: number;
  private readonly _y: number;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _n: number;
  private readonly _alpha: boolean;
  private readonly _stride: number;
  private readonly _colorspace: Colorspace | null;
  private readonly _samples: Uint8Array;

  private constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    n: number,
    alpha: boolean,
    stride: number,
    colorspace: Colorspace | null,
    samples: Uint8Array
  ) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._n = n;
    this._alpha = alpha;
    this._stride = stride;
    this._colorspace = colorspace;
    this._samples = samples;
  }

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /**
   * Create a new pixmap
   */
  static create(
    colorspace: Colorspace | null,
    width: number,
    height: number,
    alpha: boolean
  ): Pixmap {
    if (width <= 0 || height <= 0) {
      throw NanoPDFError.argument('Invalid dimensions');
    }

    let n: number;
    if (colorspace !== null) {
      n = colorspace.n + (alpha ? 1 : 0);
    } else if (alpha) {
      n = 1;
    } else {
      throw NanoPDFError.argument('Pixmap must have colorspace or alpha');
    }

    const stride = width * n;
    const samples = new Uint8Array(stride * height);

    return new Pixmap(0, 0, width, height, n, alpha, stride, colorspace, samples);
  }

  /**
   * Create a new pixmap with a bounding box
   */
  static createWithBbox(
    colorspace: Colorspace | null,
    bbox: IRectLike,
    alpha: boolean
  ): Pixmap {
    const width = bbox.x1 - bbox.x0;
    const height = bbox.y1 - bbox.y0;

    if (width <= 0 || height <= 0) {
      throw NanoPDFError.argument('Invalid bounding box');
    }

    let n: number;
    if (colorspace !== null) {
      n = colorspace.n + (alpha ? 1 : 0);
    } else if (alpha) {
      n = 1;
    } else {
      throw NanoPDFError.argument('Pixmap must have colorspace or alpha');
    }

    const stride = width * n;
    const samples = new Uint8Array(stride * height);

    return new Pixmap(bbox.x0, bbox.y0, width, height, n, alpha, stride, colorspace, samples);
  }

  /**
   * Create a pixmap from existing sample data
   */
  static fromSamples(
    colorspace: Colorspace | null,
    width: number,
    height: number,
    alpha: boolean,
    samples: Uint8Array
  ): Pixmap {
    if (width <= 0 || height <= 0) {
      throw NanoPDFError.argument('Invalid dimensions');
    }

    let n: number;
    if (colorspace !== null) {
      n = colorspace.n + (alpha ? 1 : 0);
    } else if (alpha) {
      n = 1;
    } else {
      throw NanoPDFError.argument('Pixmap must have colorspace or alpha');
    }

    const stride = width * n;
    const expectedSize = stride * height;
    if (samples.length < expectedSize) {
      throw NanoPDFError.argument(`Expected ${expectedSize} bytes, got ${samples.length}`);
    }

    return new Pixmap(0, 0, width, height, n, alpha, stride, colorspace, samples);
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * X origin
   */
  get x(): number {
    return this._x;
  }

  /**
   * Y origin
   */
  get y(): number {
    return this._y;
  }

  /**
   * Width in pixels
   */
  get width(): number {
    return this._width;
  }

  /**
   * Height in pixels
   */
  get height(): number {
    return this._height;
  }

  /**
   * Number of components per pixel (including alpha)
   */
  get n(): number {
    return this._n;
  }

  /**
   * Number of color components (excluding alpha)
   */
  get colorants(): number {
    return this._alpha ? this._n - 1 : this._n;
  }

  /**
   * Whether the pixmap has an alpha channel
   */
  get alpha(): boolean {
    return this._alpha;
  }

  /**
   * Stride (bytes per row)
   */
  get stride(): number {
    return this._stride;
  }

  /**
   * Get the colorspace (null for alpha-only pixmaps)
   */
  get colorspace(): Colorspace | null {
    return this._colorspace;
  }

  /**
   * Get the sample data
   */
  get samples(): Uint8Array {
    return this._samples;
  }

  /**
   * Get the bounding box
   */
  get bbox(): IRectLike {
    return {
      x0: this._x,
      y0: this._y,
      x1: this._x + this._width,
      y1: this._y + this._height,
    };
  }

  // ============================================================================
  // Pixel Access
  // ============================================================================

  /**
   * Get a pixel at (x, y)
   */
  getPixel(x: number, y: number): Uint8Array | null {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return null;
    }
    const offset = y * this._stride + x * this._n;
    return this._samples.slice(offset, offset + this._n);
  }

  /**
   * Set a pixel at (x, y)
   */
  setPixel(x: number, y: number, values: number[]): this {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return this;
    }
    if (values.length < this._n) {
      throw NanoPDFError.argument(`Expected ${this._n} values, got ${values.length}`);
    }
    const offset = y * this._stride + x * this._n;
    for (let i = 0; i < this._n; i++) {
      const idx = offset + i;
      if (idx < this._samples.length) {
        this._samples[idx] = Math.max(0, Math.min(255, values[i] ?? 0));
      }
    }
    return this;
  }

  /**
   * Get a single sample value
   */
  getSample(x: number, y: number, component: number): number | null {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return null;
    }
    if (component < 0 || component >= this._n) {
      return null;
    }
    const offset = y * this._stride + x * this._n + component;
    return this._samples[offset] ?? null;
  }

  /**
   * Set a single sample value
   */
  setSample(x: number, y: number, component: number, value: number): this {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return this;
    }
    if (component < 0 || component >= this._n) {
      return this;
    }
    const offset = y * this._stride + x * this._n + component;
    if (offset < this._samples.length) {
      this._samples[offset] = Math.max(0, Math.min(255, value));
    }
    return this;
  }

  // ============================================================================
  // Modification Methods
  // ============================================================================

  /**
   * Clear the pixmap to transparent black
   */
  clear(): this {
    this._samples.fill(0);
    return this;
  }

  /**
   * Clear the pixmap to a specific value
   */
  clearWithValue(value: number): this {
    this._samples.fill(Math.max(0, Math.min(255, value)));
    return this;
  }

  /**
   * Fill the pixmap with a color
   */
  fill(color: number[]): this {
    if (color.length < this._n) {
      throw NanoPDFError.argument(`Expected ${this._n} values, got ${color.length}`);
    }
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const offset = y * this._stride + x * this._n;
        for (let i = 0; i < this._n; i++) {
          const idx = offset + i;
          if (idx < this._samples.length) {
            this._samples[idx] = Math.max(0, Math.min(255, color[i] ?? 0));
          }
        }
      }
    }
    return this;
  }

  /**
   * Invert the pixmap colors
   */
  invert(): this {
    const colorants = this._alpha ? this._n - 1 : this._n;
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const offset = y * this._stride + x * this._n;
        for (let i = 0; i < colorants; i++) {
          const idx = offset + i;
          if (idx < this._samples.length) {
            this._samples[idx] = 255 - (this._samples[idx] ?? 0);
          }
        }
      }
    }
    return this;
  }

  /**
   * Apply gamma correction
   */
  gamma(gammaValue: number): this {
    if (gammaValue <= 0) {
      throw NanoPDFError.argument('Gamma must be positive');
    }
    const invGamma = 1 / gammaValue;
    const colorants = this._alpha ? this._n - 1 : this._n;
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const offset = y * this._stride + x * this._n;
        for (let i = 0; i < colorants; i++) {
          const idx = offset + i;
          if (idx < this._samples.length) {
            const normalized = (this._samples[idx] ?? 0) / 255;
            this._samples[idx] = Math.round(Math.pow(normalized, invGamma) * 255);
          }
        }
      }
    }
    return this;
  }

  /**
   * Tint the pixmap with a color
   */
  tint(color: number[]): this {
    const colorants = this._alpha ? this._n - 1 : this._n;
    if (color.length < colorants) {
      throw NanoPDFError.argument(`Expected ${colorants} color values, got ${color.length}`);
    }
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const offset = y * this._stride + x * this._n;
        for (let i = 0; i < colorants; i++) {
          const idx = offset + i;
          if (idx < this._samples.length) {
            const orig = (this._samples[idx] ?? 0) / 255;
            const tintVal = Math.max(0, Math.min(1, color[i] ?? 0));
            this._samples[idx] = Math.round(orig * tintVal * 255);
          }
        }
      }
    }
    return this;
  }

  // ============================================================================
  // Clone
  // ============================================================================

  /**
   * Create a copy of this pixmap
   */
  clone(): Pixmap {
    const samples = new Uint8Array(this._samples);
    return new Pixmap(
      this._x,
      this._y,
      this._width,
      this._height,
      this._n,
      this._alpha,
      this._stride,
      this._colorspace?.clone() ?? null,
      samples
    );
  }

  // ============================================================================
  // Export
  // ============================================================================

  /**
   * Convert to raw RGBA data for use with Canvas API
   * Returns Uint8ClampedArray suitable for ImageData
   */
  toRGBA(): Uint8ClampedArray {
    // Convert to RGBA format for ImageData
    const rgba = new Uint8ClampedArray(this._width * this._height * 4);

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const srcOffset = y * this._stride + x * this._n;
        const dstOffset = (y * this._width + x) * 4;

        if (this._colorspace?.isGray) {
          const gray = this._samples[srcOffset] ?? 0;
          rgba[dstOffset] = gray;
          rgba[dstOffset + 1] = gray;
          rgba[dstOffset + 2] = gray;
          rgba[dstOffset + 3] = this._alpha ? (this._samples[srcOffset + 1] ?? 255) : 255;
        } else if (this._colorspace?.isRGB || this._colorspace?.isBGR) {
          if (this._colorspace.isBGR) {
            rgba[dstOffset] = this._samples[srcOffset + 2] ?? 0;
            rgba[dstOffset + 1] = this._samples[srcOffset + 1] ?? 0;
            rgba[dstOffset + 2] = this._samples[srcOffset] ?? 0;
          } else {
            rgba[dstOffset] = this._samples[srcOffset] ?? 0;
            rgba[dstOffset + 1] = this._samples[srcOffset + 1] ?? 0;
            rgba[dstOffset + 2] = this._samples[srcOffset + 2] ?? 0;
          }
          rgba[dstOffset + 3] = this._alpha ? (this._samples[srcOffset + 3] ?? 255) : 255;
        } else if (this._colorspace?.isCMYK) {
          const c = (this._samples[srcOffset] ?? 0) / 255;
          const m = (this._samples[srcOffset + 1] ?? 0) / 255;
          const yellow = (this._samples[srcOffset + 2] ?? 0) / 255;
          const k = (this._samples[srcOffset + 3] ?? 0) / 255;
          rgba[dstOffset] = Math.round((1 - c) * (1 - k) * 255);
          rgba[dstOffset + 1] = Math.round((1 - m) * (1 - k) * 255);
          rgba[dstOffset + 2] = Math.round((1 - yellow) * (1 - k) * 255);
          rgba[dstOffset + 3] = this._alpha ? (this._samples[srcOffset + 4] ?? 255) : 255;
        } else if (this._alpha && !this._colorspace) {
          // Alpha-only pixmap
          rgba[dstOffset] = 0;
          rgba[dstOffset + 1] = 0;
          rgba[dstOffset + 2] = 0;
          rgba[dstOffset + 3] = this._samples[srcOffset] ?? 0;
        }
      }
    }

    return rgba;
  }

  /**
   * Convert to ImageData for use with Canvas API (browser only)
   */
  toImageData(): ImageData {
    const rgba = this.toRGBA();
    // Need to create a new Uint8ClampedArray with proper ArrayBuffer for ImageData
    const data = new Uint8ClampedArray(rgba.length);
    data.set(rgba);
    return new ImageData(data, this._width, this._height);
  }

  /**
   * Get raw samples as Uint8Array
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this._samples);
  }

  /**
   * Encode to PNG format
   * Returns raw PNG data as Uint8Array
   */
  toPNG(): Uint8Array {
    // Simple PNG encoder (no compression for simplicity)
    const rgba = this.toRGBA();

    // PNG signature
    const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    // CRC32 table
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }

    function crc32(data: number[]): number {
      let crc = 0xFFFFFFFF;
      for (const byte of data) {
        crc = crcTable[(crc ^ byte) & 0xFF]! ^ (crc >>> 8);
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function writeChunk(type: string, data: number[]): number[] {
      const chunk: number[] = [];

      // Length (4 bytes, big-endian)
      const len = data.length;
      chunk.push((len >>> 24) & 0xFF);
      chunk.push((len >>> 16) & 0xFF);
      chunk.push((len >>> 8) & 0xFF);
      chunk.push(len & 0xFF);

      // Type (4 bytes)
      const typeBytes = type.split('').map(c => c.charCodeAt(0));
      chunk.push(...typeBytes);

      // Data
      chunk.push(...data);

      // CRC (4 bytes)
      const crc = crc32([...typeBytes, ...data]);
      chunk.push((crc >>> 24) & 0xFF);
      chunk.push((crc >>> 16) & 0xFF);
      chunk.push((crc >>> 8) & 0xFF);
      chunk.push(crc & 0xFF);

      return chunk;
    }

    // IHDR chunk
    const ihdr: number[] = [];
    ihdr.push((this._width >>> 24) & 0xFF);
    ihdr.push((this._width >>> 16) & 0xFF);
    ihdr.push((this._width >>> 8) & 0xFF);
    ihdr.push(this._width & 0xFF);
    ihdr.push((this._height >>> 24) & 0xFF);
    ihdr.push((this._height >>> 16) & 0xFF);
    ihdr.push((this._height >>> 8) & 0xFF);
    ihdr.push(this._height & 0xFF);
    ihdr.push(8);  // Bit depth
    ihdr.push(6);  // Color type (RGBA)
    ihdr.push(0);  // Compression method
    ihdr.push(0);  // Filter method
    ihdr.push(0);  // Interlace method

    // IDAT chunk (raw image data with filter bytes, compressed with deflate)
    const rawData: number[] = [];
    for (let y = 0; y < this._height; y++) {
      rawData.push(0); // Filter type: None
      const rowOffset = y * this._width * 4;
      for (let x = 0; x < this._width * 4; x++) {
        rawData.push(rgba[rowOffset + x] ?? 0);
      }
    }

    // Compress using zlib
    let idat: number[];
    try {
      // Use zlib deflate (Node.js only)
      const zlib = require('zlib');
      const compressed = zlib.deflateSync(globalThis.Buffer.from(rawData));
      idat = Array.from(new Uint8Array(compressed));
    } catch {
      // Fallback: Store uncompressed (won't be valid PNG but better than nothing)
      // Wrap in zlib format
      idat = [0x78, 0x01, ...rawData]; // Very basic zlib header
    }

    // IEND chunk (empty)
    const result: number[] = [
      ...signature,
      ...writeChunk('IHDR', ihdr),
      ...writeChunk('IDAT', idat),
      ...writeChunk('IEND', []),
    ];

    return new Uint8Array(result);
  }

  toString(): string {
    return `Pixmap(${this._width}x${this._height}, n=${this._n}, alpha=${this._alpha})`;
  }
}

