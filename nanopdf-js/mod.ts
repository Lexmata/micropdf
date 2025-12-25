/**
 * NanoPDF for Deno
 *
 * High-performance PDF manipulation library for Deno using native Rust FFI.
 *
 * @example
 * ```ts
 * import { Context, Document, MatrixHelper } from "jsr:@nanopdf/deno";
 *
 * using ctx = new Context();
 * using doc = Document.open(ctx, "sample.pdf");
 *
 * console.log(`Pages: ${doc.pageCount()}`);
 *
 * using page = doc.loadPage(0);
 * const text = page.extractText();
 * console.log(text);
 * ```
 *
 * @module
 */

export { Context } from './deno/context.ts';
export { Document, Page } from './deno/document.ts';
export { Pixmap, MatrixHelper } from './deno/pixmap.ts';
export type { Rect } from './deno/document.ts';
export type { Matrix } from './deno/pixmap.ts';

// Re-export FFI for advanced users
export * as FFI from './deno/ffi.ts';
