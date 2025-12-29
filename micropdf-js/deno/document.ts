/**
 * Document and Page operations
 */

import type { Context } from './context.ts';
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
  fromCString,
  readBuffer
} from './ffi.ts';

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
    const rect = fz_bound_page(this.ctx.getHandle(), this.handle);
    return {
      x0: rect[0],
      y0: rect[1],
      x1: rect[2],
      y1: rect[3]
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
        const sizePtr = new BigUint64Array(1);
        const dataPtr = fz_buffer_data(ctxHandle, bufferHandle, Deno.UnsafePointer.of(sizePtr));

        if (!dataPtr || sizePtr[0] === 0n) {
          return '';
        }

        const size = Number(sizePtr[0]);
        const textData = readBuffer(dataPtr, size);
        const decoder = new TextDecoder();
        return decoder.decode(textData);
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
    const handle = fz_open_document(ctx.getHandle(), Deno.UnsafePointer.of(pathBytes));

    if (handle === 0n) {
      throw new Error(`Failed to open document: ${path}`);
    }

    return new Document(ctx, handle);
  }

  static fromBytes(ctx: Context, data: Uint8Array, magic = '.pdf'): Document {
    const magicBytes = toCString(magic);
    const handle = fz_open_document_with_buffer(
      ctx.getHandle(),
      Deno.UnsafePointer.of(magicBytes),
      Deno.UnsafePointer.of(data),
      data.length
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
    return (
      fz_authenticate_password(
        this.ctx.getHandle(),
        this.handle,
        Deno.UnsafePointer.of(passwordBytes)
      ) !== 0
    );
  }

  getMetadata(key: string): string {
    const keyBytes = toCString(key);
    const buffer = new Uint8Array(1024);

    const length = fz_lookup_metadata(
      this.ctx.getHandle(),
      this.handle,
      Deno.UnsafePointer.of(keyBytes),
      Deno.UnsafePointer.of(buffer),
      buffer.length
    );

    if (length <= 0) {
      return '';
    }

    const decoder = new TextDecoder();
    return decoder.decode(buffer.subarray(0, length));
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
