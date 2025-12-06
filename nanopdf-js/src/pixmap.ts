/**
 * Pixmap - Raster image handling
 *
 * This module provides 100% API compatibility with MuPDF's pixmap operations.
 * Handles pixel-based images, conversions, and manipulations.
 */

import { Rect, IRect, type IRectLike } from './geometry.js';
import { Colorspace } from './colorspace.js';

/**
 * A raster image (pixmap)
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
   * Get samples (pixel data)
   */
  samples(): Uint8Array {
    return this._data;
  }

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
    if (!this._colorspace || !this._colorspace.isValid()) {
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
