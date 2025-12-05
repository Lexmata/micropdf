/**
 * Pixmap - Raster image handling
 * 
 * Stub module for Device dependencies. Full implementation coming in Phase 3.
 */

import { Rect, type RectLike } from './geometry.js';
import { Colorspace } from './colorspace.js';

export class Pixmap {
  private _width: number;
  private _height: number;
  private _colorspace: Colorspace;
  private _alpha: boolean;
  private _data: Uint8Array;

  constructor(
    colorspace: Colorspace,
    width: number,
    height: number,
    alpha: boolean = true
  ) {
    this._colorspace = colorspace;
    this._width = width;
    this._height = height;
    this._alpha = alpha;
    const stride = colorspace.n + (alpha ? 1 : 0);
    this._data = new Uint8Array(width * height * stride);
  }

  static create(
    colorspace: Colorspace,
    width: number,
    height: number,
    alpha: boolean = true
  ): Pixmap {
    return new Pixmap(colorspace, width, height, alpha);
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

  get hasAlpha(): boolean {
    return this._alpha;
  }

  get data(): Uint8Array {
    return this._data;
  }

  get stride(): number {
    return this._colorspace.n + (this._alpha ? 1 : 0);
  }

  getBounds(): Rect {
    return new Rect(0, 0, this._width, this._height);
  }

  clear(): void {
    this._data.fill(0);
  }
}
