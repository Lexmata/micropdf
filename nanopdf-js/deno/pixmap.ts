/**
 * Pixmap operations for rendering
 */

import type { Context } from './context.ts';
import type { Page } from './document.ts';
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
  readBuffer
} from './ffi.ts';

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

    // Convert matrix to struct
    const matrixStruct = [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f];

    const handle = fz_new_pixmap_from_page(
      ctx.getHandle(),
      page.getHandle(),
      matrixStruct,
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

    return readBuffer(samplesPtr, size);
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
      const sizePtr = new BigUint64Array(1);
      const dataPtr = fz_buffer_data(ctxHandle, bufferHandle, Deno.UnsafePointer.of(sizePtr));

      if (!dataPtr || sizePtr[0] === 0n) {
        return new Uint8Array(0);
      }

      const size = Number(sizePtr[0]);
      return readBuffer(dataPtr, size);
    } finally {
      fz_drop_buffer(ctxHandle, bufferHandle);
    }
  }

  async savePng(path: string): Promise<void> {
    const pngData = this.toPng();
    await Deno.writeFile(path, pngData);
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
    const result = fz_scale(sx, sy);
    return {
      a: result[0],
      b: result[1],
      c: result[2],
      d: result[3],
      e: result[4],
      f: result[5]
    };
  }

  static dpi(dpi: number): Matrix {
    const scale = dpi / 72.0;
    return MatrixHelper.scale(scale, scale);
  }
}
