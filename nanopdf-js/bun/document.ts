/**
 * Document and Page operations
 */

import type { Context } from './context';
import { ptr } from 'bun:ffi';
import {
  fz_open_document,
  fz_open_document_with_buffer,
  fz_drop_document,
  fz_count_pages,
  fz_needs_password,
  fz_authenticate_password,
  fz_lookup_metadata,
  fz_load_page,
  fz_drop_page,
  fz_bound_page,
  fz_new_stext_page_from_page,
  fz_drop_stext_page,
  fz_new_buffer_from_stext_page,
  fz_buffer_data,
  fz_drop_buffer,
  toCString,
  readFloats,
  readBuffer
} from './ffi';

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export class Page {
  private handle: bigint;
  private dropped = false;

  constructor(
    private ctx: Context,
    handle: bigint
  ) {
    this.handle = handle;
  }

  getHandle(): bigint {
    if (this.dropped) {
      throw new Error('Page has been dropped');
    }
    return this.handle;
  }

  bounds(): Rect {
    const rectPtr = fz_bound_page(this.ctx.getHandle(), this.handle);
    const floats = readFloats(Number(rectPtr), 4);
    return {
      x0: floats[0],
      y0: floats[1],
      x1: floats[2],
      y1: floats[3]
    };
  }

  extractText(): string {
    const ctxHandle = this.ctx.getHandle();

    // Create text page
    const stextHandle = fz_new_stext_page_from_page(ctxHandle, this.handle, null);
    if (stextHandle === 0n) {
      return '';
    }

    try {
      // Convert to buffer
      const bufferHandle = fz_new_buffer_from_stext_page(ctxHandle, stextHandle);
      if (bufferHandle === 0n) {
        return '';
      }

      try {
        // Get buffer data
        const sizePtr = Buffer.alloc(8);
        const dataPtr = fz_buffer_data(ctxHandle, bufferHandle, ptr(sizePtr));

        if (!dataPtr) {
          return '';
        }

        const size = sizePtr.readBigUInt64LE(0);
        if (size === 0n) {
          return '';
        }

        const textData = readBuffer(Number(dataPtr), Number(size));
        return Buffer.from(textData).toString('utf-8');
      } finally {
        fz_drop_buffer(ctxHandle, bufferHandle);
      }
    } finally {
      fz_drop_stext_page(ctxHandle, stextHandle);
    }
  }

  drop(): void {
    if (!this.dropped) {
      fz_drop_page(this.ctx.getHandle(), this.handle);
      this.dropped = true;
    }
  }

  [Symbol.dispose](): void {
    this.drop();
  }
}

export class Document {
  private handle: bigint;
  private dropped = false;

  private constructor(
    private ctx: Context,
    handle: bigint
  ) {
    this.handle = handle;
  }

  static open(ctx: Context, path: string): Document {
    const pathBytes = toCString(path);
    const handle = fz_open_document(ctx.getHandle(), ptr(pathBytes));

    if (handle === 0n) {
      throw new Error(`Failed to open document: ${path}`);
    }

    return new Document(ctx, handle);
  }

  static fromBytes(ctx: Context, data: Uint8Array, magic = '.pdf'): Document {
    const magicBytes = toCString(magic);
    const handle = fz_open_document_with_buffer(
      ctx.getHandle(),
      ptr(magicBytes),
      ptr(data),
      BigInt(data.length)
    );

    if (handle === 0n) {
      throw new Error('Failed to open document from bytes');
    }

    return new Document(ctx, handle);
  }

  getHandle(): bigint {
    if (this.dropped) {
      throw new Error('Document has been dropped');
    }
    return this.handle;
  }

  pageCount(): number {
    return fz_count_pages(this.ctx.getHandle(), this.handle);
  }

  needsPassword(): boolean {
    return fz_needs_password(this.ctx.getHandle(), this.handle) !== 0;
  }

  authenticate(password: string): boolean {
    const passwordBytes = toCString(password);
    return fz_authenticate_password(this.ctx.getHandle(), this.handle, ptr(passwordBytes)) !== 0;
  }

  getMetadata(key: string): string {
    const keyBytes = toCString(key);
    const buffer = Buffer.alloc(1024);

    const length = fz_lookup_metadata(
      this.ctx.getHandle(),
      this.handle,
      ptr(keyBytes),
      ptr(buffer),
      buffer.length
    );

    if (length <= 0) {
      return '';
    }

    return buffer.toString('utf-8', 0, length);
  }

  loadPage(pageNum: number): Page {
    const pageCount = this.pageCount();
    if (pageNum < 0 || pageNum >= pageCount) {
      throw new Error(`Invalid page number: ${pageNum} (document has ${pageCount} pages)`);
    }

    const handle = fz_load_page(this.ctx.getHandle(), this.handle, pageNum);
    if (handle === 0n) {
      throw new Error(`Failed to load page ${pageNum}`);
    }

    return new Page(this.ctx, handle);
  }

  drop(): void {
    if (!this.dropped) {
      fz_drop_document(this.ctx.getHandle(), this.handle);
      this.dropped = true;
    }
  }

  [Symbol.dispose](): void {
    this.drop();
  }
}
