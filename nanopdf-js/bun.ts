/**
 * NanoPDF for Bun
 * 
 * High-performance PDF manipulation library for Bun using native Rust FFI.
 * 
 * @example
 * ```ts
 * import { Context, Document, MatrixHelper } from "./bun";
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

export { Context } from "./bun/context";
export { Document, Page } from "./bun/document";
export { Pixmap, MatrixHelper } from "./bun/pixmap";
export type { Rect } from "./bun/document";
export type { Matrix } from "./bun/pixmap";

// Re-export FFI for advanced users
export * as FFI from "./bun/ffi";

