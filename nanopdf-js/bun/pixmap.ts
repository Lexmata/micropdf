/**
 * Pixmap operations for rendering
 */

import type { Context } from './context';
import type { Page } from './document';
import { writeFile } from 'fs/promises';
import { ptr } from 'bun:ffi';
import {
  fz_new_pixmap_from_page,
  fz_drop_pixmap,
  fz_pixmap_width,
  fz_pixmap_height,
  fz_pixmap_samples,
  fz_pixmap_stride,
  fz_new_buffer_from_pixmap_as_png,
  fz_buffer_data,
  fz_drop_buffer,
  fz_device_rgb,
  fz_scale,
  readBuffer,
  readFloats
} from './ffi';

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export class Pixmap {
  private handle: bigint;
  private dropped = false;

  private constructor(
    private ctx: Context,
    handle: bigint
  ) {
    this.handle = handle;
  }

  static fromPage(ctx: Context, page: Page, matrix: Matrix, alpha = false): Pixmap {
    const colorspace = fz_device_rgb(ctx.getHandle());

    // Create matrix buffer
    const matrixBuffer = new Float32Array([
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f
    ]);

    const handle = fz_new_pixmap_from_page(
      ctx.getHandle(),
      page.getHandle(),
      ptr(matrixBuffer),
      colorspace,
      alpha ? 1 : 0
    );

    if (handle === 0n) {
      throw new Error('Failed to create pixmap from page');
    }

    return new Pixmap(ctx, handle);
  }

  getHandle(): bigint {
    if (this.dropped) {
      throw new Error('Pixmap has been dropped');
    }
    return this.handle;
  }

  width(): number {
    return fz_pixmap_width(this.ctx.getHandle(), this.handle);
  }

  height(): number {
    return fz_pixmap_height(this.ctx.getHandle(), this.handle);
  }

  stride(): number {
    return fz_pixmap_stride(this.ctx.getHandle(), this.handle);
  }

  samples(): Uint8Array {
    const width = this.width();
    const height = this.height();
    const stride = this.stride();
    const size = stride * height;

    const samplesPtr = fz_pixmap_samples(this.ctx.getHandle(), this.handle);
    if (!samplesPtr) {
      return new Uint8Array(0);
    }

    return readBuffer(Number(samplesPtr), size);
  }

  toPng(): Uint8Array {
    const ctxHandle = this.ctx.getHandle();

    // Create PNG buffer
    const bufferHandle = fz_new_buffer_from_pixmap_as_png(ctxHandle, this.handle, 0);
    if (bufferHandle === 0n) {
      throw new Error('Failed to convert pixmap to PNG');
    }

    try {
      // Get buffer data
      const sizePtr = Buffer.alloc(8);
      const dataPtr = fz_buffer_data(ctxHandle, bufferHandle, ptr(sizePtr));

      if (!dataPtr) {
        return new Uint8Array(0);
      }

      const size = sizePtr.readBigUInt64LE(0);
      if (size === 0n) {
        return new Uint8Array(0);
      }

      return readBuffer(Number(dataPtr), Number(size));
    } finally {
      fz_drop_buffer(ctxHandle, bufferHandle);
    }
  }

  async savePng(path: string): Promise<void> {
    const pngData = this.toPng();
    await writeFile(path, pngData);
  }

  drop(): void {
    if (!this.dropped) {
      fz_drop_pixmap(this.ctx.getHandle(), this.handle);
      this.dropped = true;
    }
  }

  [Symbol.dispose](): void {
    this.drop();
  }
}

// Helper to create transformation matrices
export class MatrixHelper {
  static identity(): Matrix {
    return {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0
    };
  }

  static scale(sx: number, sy: number): Matrix {
    const resultPtr = fz_scale(sx, sy);
    const floats = readFloats(Number(resultPtr), 6);
    return {
      a: floats[0],
      b: floats[1],
      c: floats[2],
      d: floats[3],
      e: floats[4],
      f: floats[5]
    };
  }

  static dpi(dpi: number): Matrix {
    const scale = dpi / 72.0;
    return MatrixHelper.scale(scale, scale);
  }
}
