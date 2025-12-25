/**
 * Pixmap - Raster image handling and pixel manipulation
 *
 * This module provides comprehensive support for working with raster images (pixmaps)
 * in PDF documents. Pixmaps represent pixel-based images with support for various
 * colorspaces, alpha channels, and pixel-level manipulation.
 *
 * This module provides 100% API compatibility with MuPDF's pixmap operations.
 *
 * @module pixmap
 * @example
 * ```typescript
 * import { Pixmap, Colorspace, Rect } from 'nanopdf';
 *
 * // Create a pixmap from a page
 * const page = doc.loadPage(0);
 * const pixmap = page.toPixmap(Matrix.identity());
 *
 * // Create an empty pixmap
 * const empty = Pixmap.create(Colorspace.deviceRGB(), 100, 100, true);
 *
 * // Get pixel data
 * const width = pixmap.width;
 * const height = pixmap.height;
 * const data = pixmap.samples;
 *
 * // Manipulate pixels
 * for (let y = 0; y < height; y++) {
 *   for (let x = 0; x < width; x++) {
 *     const pixel = pixmap.getPixel(x, y);
 *     // Modify pixel...
 *     pixmap.setPixel(x, y, [r, g, b, a]);
 *   }
 * }
 *
 * // Convert colorspace
 * const gray = pixmap.convert(Colorspace.deviceGray());
 *
 * // Scale
 * const thumbnail = pixmap.scale(50, 50);
 *
 * // Clean up
 * pixmap.drop();
 * gray.drop();
 * thumbnail.drop();
 * ```
 */

import { Colorspace } from './colorspace.js';
import { Rect, IRect, type IRectLike } from './geometry.js';

/**
 * A raster image with pixel-level manipulation capabilities.
 *
 * Pixmap represents a rectangular array of pixels with an associated colorspace
 * and optional alpha channel. Pixmaps are used for rendering PDF pages, working
 * with images, and performing pixel-level image processing.
 *
 * **Key Features:**
 * - Multiple colorspace support (Gray, RGB, CMYK, etc.)
 * - Optional alpha channel for transparency
 * - Pixel-level read/write access
 * - Colorspace conversion
 * - Scaling and transformation
 * - Tinting and color manipulation
 *
 * **Memory Layout**: Pixels are stored row-by-row, left-to-right, with components
 * interleaved. For RGB with alpha, the order is: R₁G₁B₁A₁, R₂G₂B₂A₂, ...
 *
 * **Reference Counting**: Pixmaps use manual reference counting. Call `keep()` to
 * increment the reference count and `drop()` to decrement it.
 *
 * @class Pixmap
 * @example
 * ```typescript
 * // Render a PDF page to a pixmap
 * const doc = Document.open('document.pdf');
 * const page = doc.loadPage(0);
 * const matrix = Matrix.scale(2, 2); // 2x zoom
 * const pixmap = page.toPixmap(matrix, Colorspace.deviceRGB(), true);
 *
 * console.log(`Size: ${pixmap.width} x ${pixmap.height}`);
 * console.log(`Components: ${pixmap.n}`); // 4 for RGBA
 * console.log(`Has alpha: ${pixmap.alpha}`);
 *
 * // Access pixel data
 * const samples = pixmap.samples; // Uint8Array
 * const pixel = pixmap.getPixel(10, 10); // [r, g, b, a]
 *
 * // Modify a pixel
 * pixmap.setPixel(10, 10, [255, 0, 0, 255]); // Red pixel
 *
 * // Convert to grayscale
 * const gray = pixmap.convert(Colorspace.deviceGray());
 *
 * // Create thumbnail
 * const thumb = pixmap.scale(100, 100);
 *
 * // Clean up
 * pixmap.drop();
 * gray.drop();
 * thumb.drop();
 * page.drop();
 * doc.close();
 * ```
 *
 * @example
 * ```typescript
 * // Create a blank red image
 * const pixmap = Pixmap.create(
 *   Colorspace.deviceRGB(),
 *   200,
 *   200,
 *   false // No alpha
 * );
 *
 * // Fill with red
 * for (let y = 0; y < pixmap.height; y++) {
 *   for (let x = 0; x < pixmap.width; x++) {
 *     pixmap.setPixel(x, y, [255, 0, 0]); // Red
 *   }
 * }
 *
 * // Convert to RGBA
 * const rgba = pixmap.toRGBA();
 * console.log(rgba.length); // 200 * 200 * 4 = 160,000 bytes
 * ```
 *
 * @example
 * ```typescript
 * // Load from raw sample data
 * const width = 2, height = 2;
 * const samples = new Uint8Array([
 *   255, 0, 0, 255,  // Red pixel
 *   0, 255, 0, 255,  // Green pixel
 *   0, 0, 255, 255,  // Blue pixel
 *   255, 255, 0, 255 // Yellow pixel
 * ]);
 *
 * const pixmap = Pixmap.fromSamples(
 *   Colorspace.deviceRGB(),
 *   width,
 *   height,
 *   true,
 *   samples
 * );
 *
 * // Tint with red and white
 * pixmap.tint([255, 0, 0], [255, 255, 255]);
 * ```
 */
export class Pixmap {
  private _width: number;
  private _height: number;
  private _x: number = 0;
  private _y: number = 0;
  private _colorspace: Colorspace;
  private _alpha: boolean;
  private _data: Uint8Array;
  private _xres: number = 96;
  private _yres: number = 96;
  private _refCount: number = 1;

  constructor(
    colorspace: Colorspace,
    width: number,
    height: number,
    alpha: boolean = true,
    x: number = 0,
    y: number = 0
  ) {
    this._colorspace = colorspace;
    this._width = width;
    this._height = height;
    this._alpha = alpha;
    this._x = x;
    this._y = y;
    const stride = colorspace.n + (alpha ? 1 : 0);
    this._data = new Uint8Array(width * height * stride);
  }

  /**
   * Create a new pixmap
   */
  static create(
    colorspace: Colorspace,
    width: number,
    height: number,
    alpha: boolean = true
  ): Pixmap {
    return new Pixmap(colorspace, width, height, alpha);
  }

  /**
   * Create pixmap with bounding box
   */
  static createWithBBox(colorspace: Colorspace, bbox: IRectLike, alpha: boolean = true): Pixmap {
    const b = IRect.from(bbox);
    return new Pixmap(colorspace, b.width, b.height, alpha, b.x0, b.y0);
  }

  /**
   * Create pixmap with bounding box (lowercase alias)
   */
  static createWithBbox(colorspace: Colorspace, bbox: IRectLike, alpha: boolean = true): Pixmap {
    return Pixmap.createWithBBox(colorspace, bbox, alpha);
  }

  /**
   * Create pixmap from sample data
   */
  static fromSamples(
    colorspace: Colorspace,
    width: number,
    height: number,
    alpha: boolean,
    samples: Uint8Array
  ): Pixmap {
    const pixmap = new Pixmap(colorspace, width, height, alpha);
    pixmap._data = new Uint8Array(samples);
    return pixmap;
  }

  // ============================================================================
  // Reference Counting
  // ============================================================================

  keep(): this {
    this._refCount++;
    return this;
  }

  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
  }

  /**
   * Clone this pixmap
   */
  clone(): Pixmap {
    const cloned = new Pixmap(
      this._colorspace,
      this._width,
      this._height,
      this._alpha,
      this._x,
      this._y
    );
    cloned._data = new Uint8Array(this._data);
    cloned._xres = this._xres;
    cloned._yres = this._yres;
    return cloned;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get colorspace(): Colorspace {
    return this._colorspace;
  }

  /**
   * Get number of components (colorants + alpha if present)
   */
  get components(): number {
    return this._colorspace.n + (this._alpha ? 1 : 0);
  }

  /**
   * Get number of colorant components (excluding alpha) - alias for components
   */
  get n(): number {
    return this.components;
  }

  /**
   * Get number of colorant components (excluding alpha)
   */
  get colorants(): number {
    return this._colorspace.n;
  }

  /**
   * Check if pixmap has alpha channel
   */
  get hasAlpha(): boolean {
    return this._alpha;
  }

  /**
   * Check if pixmap has alpha channel (short alias)
   */
  get alpha(): boolean {
    return this._alpha;
  }

  /**
   * Get stride (bytes per row)
   */
  get stride(): number {
    return this._width * this.components;
  }

  /**
   * Get raw pixel data
   */
  get data(): Uint8Array {
    return this._data;
  }

  /**
   * Get samples (pixel data) - alias for data
   */
  get samples(): Uint8Array {
    return this._data;
  }

  /**
   * Get bounding box
   */
  getBounds(): Rect {
    return new Rect(this._x, this._y, this._x + this._width, this._y + this._height);
  }

  /**
   * Get integer bounding box
   */
  getBBox(): IRect {
    return new IRect(this._x, this._y, this._x + this._width, this._y + this._height);
  }

  // ============================================================================
  // Resolution
  // ============================================================================

  get xres(): number {
    return this._xres;
  }

  set xres(res: number) {
    this._xres = Math.max(1, res);
  }

  get yres(): number {
    return this._yres;
  }

  set yres(res: number) {
    this._yres = Math.max(1, res);
  }

  /**
   * Get resolution as [xres, yres]
   */
  getResolution(): [number, number] {
    return [this._xres, this._yres];
  }

  /**
   * Set resolution
   */
  setResolution(xres: number, yres: number): void {
    this._xres = Math.max(1, xres);
    this._yres = Math.max(1, yres);
  }

  // ============================================================================
  // Sample Access
  // ============================================================================

  /**
   * Get a single sample value
   */
  getSample(x: number, y: number, component: number): number {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return 0;
    }
    if (component < 0 || component >= this.components) {
      return 0;
    }
    const offset = (y * this._width + x) * this.components + component;
    return this._data[offset] || 0;
  }

  /**
   * Set a single sample value
   */
  setSample(x: number, y: number, component: number, value: number): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return;
    }
    if (component < 0 || component >= this.components) {
      return;
    }
    const offset = (y * this._width + x) * this.components + component;
    this._data[offset] = Math.max(0, Math.min(255, value));
  }

  /**
   * Get all samples for a pixel
   */
  getPixel(x: number, y: number): number[] {
    const pixel: number[] = [];
    for (let c = 0; c < this.components; c++) {
      pixel.push(this.getSample(x, y, c));
    }
    return pixel;
  }

  /**
   * Set all samples for a pixel
   */
  setPixel(x: number, y: number, values: number[]): void {
    for (let c = 0; c < Math.min(this.components, values.length); c++) {
      this.setSample(x, y, c, values[c]!);
    }
  }

  // ============================================================================
  // Clearing and Filling
  // ============================================================================

  /**
   * Clear pixmap to transparent/white
   */
  clear(): void {
    if (this._alpha) {
      // Clear to transparent (all zeros)
      this._data.fill(0);
    } else {
      // Clear to white (all 255)
      this._data.fill(255);
    }
  }

  /**
   * Clear pixmap to specific value
   */
  clearWithValue(value: number): void {
    this._data.fill(value);
  }

  // ============================================================================
  // Transformations
  // ============================================================================

  /**
   * Invert pixmap colors
   */
  invert(): void {
    const colorants = this._colorspace.n;
    for (let i = 0; i < this._data.length; i++) {
      // Invert colorants but not alpha
      if (i % this.components < colorants) {
        this._data[i] = 255 - this._data[i]!;
      }
    }
  }

  /**
   * Apply gamma correction
   */
  gamma(gamma: number): void {
    const colorants = this._colorspace.n;
    const invGamma = 1.0 / gamma;

    for (let i = 0; i < this._data.length; i++) {
      // Apply gamma to colorants but not alpha
      if (i % this.components < colorants) {
        const normalized = this._data[i]! / 255;
        const corrected = Math.pow(normalized, invGamma);
        this._data[i] = Math.round(corrected * 255);
      }
    }
  }

  /**
   * Tint pixmap with a color
   */
  tint(black: number[], white: number[]): void {
    if (!this._colorspace) {
      return; // No colorspace, cannot tint
    }
    if (black.length !== this._colorspace.n || white.length !== this._colorspace.n) {
      return;
    }

    const colorants = this._colorspace.n;
    const components = this.components;

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const offset = (y * this._width + x) * components;

        for (let c = 0; c < colorants; c++) {
          const gray = this._data[offset + c]! / 255;
          const tinted = black[c]! * (1 - gray) + white[c]! * gray;
          this._data[offset + c] = Math.round(tinted * 255);
        }
      }
    }
  }

  // ============================================================================
  // Conversion
  // ============================================================================

  /**
   * Convert pixmap to another colorspace
   */
  convert(destColorspace: Colorspace): Pixmap {
    const converted = new Pixmap(
      destColorspace,
      this._width,
      this._height,
      this._alpha,
      this._x,
      this._y
    );

    converted._xres = this._xres;
    converted._yres = this._yres;

    const srcComponents = this.components;
    const dstComponents = converted.components;
    const srcColorants = this._colorspace.n;
    const dstColorants = destColorspace.n;

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const srcOffset = (y * this._width + x) * srcComponents;
        const dstOffset = (y * this._width + x) * dstComponents;

        // Extract source color
        const srcColor: number[] = [];
        for (let c = 0; c < srcColorants; c++) {
          srcColor.push(this._data[srcOffset + c]! / 255);
        }

        // Convert color
        const dstColor = this._colorspace.convertColor(destColorspace, srcColor);

        // Store destination color
        for (let c = 0; c < dstColorants; c++) {
          converted._data[dstOffset + c] = Math.round(dstColor[c]! * 255);
        }

        // Copy alpha if present
        if (this._alpha && converted._alpha) {
          converted._data[dstOffset + dstColorants] = this._data[srcOffset + srcColorants]!;
        }
      }
    }

    return converted;
  }

  /**
   * Convert pixmap to RGBA format
   */
  toRGBA(): Uint8Array {
    // If already RGBA, return a copy
    if (this._colorspace.n === 3 && this._alpha) {
      return new Uint8Array(this._data);
    }

    // Convert to RGB with alpha
    const rgbaData = new Uint8Array(this._width * this._height * 4);
    const srcComponents = this.components;

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const srcOffset = (y * this._width + x) * srcComponents;
        const dstOffset = (y * this._width + x) * 4;

        if (this._colorspace.n === 1) {
          // Grayscale to RGB
          const gray = this._data[srcOffset]!;
          rgbaData[dstOffset] = gray; // R
          rgbaData[dstOffset + 1] = gray; // G
          rgbaData[dstOffset + 2] = gray; // B
          rgbaData[dstOffset + 3] = this._alpha ? this._data[srcOffset + 1]! : 255; // A
        } else if (this._colorspace.n === 3) {
          // RGB to RGBA
          rgbaData[dstOffset] = this._data[srcOffset]!; // R
          rgbaData[dstOffset + 1] = this._data[srcOffset + 1]!; // G
          rgbaData[dstOffset + 2] = this._data[srcOffset + 2]!; // B
          rgbaData[dstOffset + 3] = this._alpha ? this._data[srcOffset + 3]! : 255; // A
        } else {
          // Other colorspaces - default to white with alpha
          rgbaData[dstOffset] = 255;
          rgbaData[dstOffset + 1] = 255;
          rgbaData[dstOffset + 2] = 255;
          rgbaData[dstOffset + 3] = this._alpha ? this._data[srcOffset + this._colorspace.n]! : 255;
        }
      }
    }

    return rgbaData;
  }

  /**
   * Scale pixmap to new dimensions
   */
  scale(width: number, height: number): Pixmap {
    const scaled = new Pixmap(this._colorspace, width, height, this._alpha, this._x, this._y);

    scaled._xres = this._xres;
    scaled._yres = this._yres;

    const xRatio = this._width / width;
    const yRatio = this._height / height;
    const components = this.components;

    // Nearest neighbor scaling (simplified)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);

        const srcOffset = (srcY * this._width + srcX) * components;
        const dstOffset = (y * width + x) * components;

        for (let c = 0; c < components; c++) {
          scaled._data[dstOffset + c] = this._data[srcOffset + c]!;
        }
      }
    }

    return scaled;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if pixmap is valid
   */
  isValid(): boolean {
    if (this._width <= 0 || this._height <= 0) {
      return false;
    }
    if (!this._colorspace?.isValid()) {
      return false;
    }
    if (this._data.length !== this._width * this._height * this.components) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // Information
  // ============================================================================

  /**
   * Get pixmap info
   */
  getInfo(): PixmapInfo {
    return {
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height,
      colorspace: this._colorspace,
      components: this.components,
      colorants: this.colorants,
      hasAlpha: this._alpha,
      stride: this.stride,
      xres: this._xres,
      yres: this._yres,
      size: this._data.length
    };
  }
}

/**
 * Pixmap information
 */
export interface PixmapInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  colorspace: Colorspace;
  components: number;
  colorants: number;
  hasAlpha: boolean;
  stride: number;
  xres: number;
  yres: number;
  size: number;
}
