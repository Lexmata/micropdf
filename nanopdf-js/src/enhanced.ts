/**
 * Enhanced - NanoPDF high-level convenience API
 *
 * This module provides NanoPDF-specific high-level functions for common PDF operations.
 * These are convenience wrappers that simplify complex workflows.
 */

import { Context, getDefaultContext } from './context.js';
import { Document } from './document.js';
import { Color, type ColorLike } from './geometry.js';
import { native } from './native.js';
import type { NativeContext, NativeDocument, NativePage } from './native.js';

/**
 * Enhanced NanoPDF API
 */
export class Enhanced {
  private _ctx: Context;

  constructor(ctx?: Context) {
    this._ctx = ctx || getDefaultContext();
  }

  /**
   * Get the context
   */
  get context(): Context {
    return this._ctx;
  }

  // ============================================================================
  // Page Operations
  // ============================================================================

  /**
   * Add a blank page to a document using FFI
   * @returns Page number of newly added page
   * @throws Error when native bindings are not available
   */
  addBlankPage(_doc: Document, width: number, height: number): number {
    // Get native handles (will be available when Document exposes them)
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;
    const nativeDoc = (_doc as unknown as { _doc?: NativeDocument })?._doc;

    if (!ctx || !nativeDoc) {
      throw new Error('Adding blank page requires native FFI bindings (np_add_blank_page)');
    }

    return native.npAddBlankPage(ctx, nativeDoc, width, height);
  }

  // ============================================================================
  // Drawing Operations
  // ============================================================================

  /**
   * Draw a line on a page using FFI
   * @throws Error when native bindings are not available
   */
  drawLine(
    page: unknown,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: ColorLike,
    alpha: number = 1.0,
    lineWidth: number = 1.0
  ): void {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;
    const nativePage = (page as unknown as { _page?: NativePage })?._page;

    if (!ctx || !nativePage) {
      throw new Error('Drawing line requires native FFI bindings (np_draw_line)');
    }

    const c = Color.from(color);
    const colorArray = [c.r, c.g, c.b];
    native.npDrawLine(ctx, nativePage, x0, y0, x1, y1, colorArray, alpha, lineWidth);
  }

  /**
   * Draw a rectangle on a page using FFI
   * @throws Error when native bindings are not available
   */
  drawRectangle(
    page: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    color: ColorLike,
    alpha: number = 1.0,
    fill: boolean = false
  ): void {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;
    const nativePage = (page as unknown as { _page?: NativePage })?._page;

    if (!ctx || !nativePage) {
      throw new Error('Drawing rectangle requires native FFI bindings (np_draw_rectangle)');
    }

    const c = Color.from(color);
    const colorArray = [c.r, c.g, c.b];
    native.npDrawRectangle(ctx, nativePage, x, y, width, height, colorArray, alpha, fill);
  }

  /**
   * Draw a circle on a page using FFI
   * @throws Error when native bindings are not available
   */
  drawCircle(
    page: unknown,
    x: number,
    y: number,
    radius: number,
    color: ColorLike,
    alpha: number = 1.0,
    fill: boolean = false
  ): void {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;
    const nativePage = (page as unknown as { _page?: NativePage })?._page;

    if (!ctx || !nativePage) {
      throw new Error('Drawing circle requires native FFI bindings (np_draw_circle)');
    }

    const c = Color.from(color);
    const colorArray = [c.r, c.g, c.b];
    native.npDrawCircle(ctx, nativePage, x, y, radius, colorArray, alpha, fill);
  }

  // ============================================================================
  // Watermark Operations
  // ============================================================================

  /**
   * Add watermark to PDF using FFI
   * @throws Error when native bindings are not available
   */
  async addWatermark(
    inputPath: string,
    _outputPath: string,
    text: string,
    _x: number = 100,
    _y: number = 100,
    fontSize: number = 48,
    opacity: number = 0.3
  ): Promise<void> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('Watermark requires native FFI bindings (np_add_watermark)');
    }

    // Open document
    const doc = native.openDocumentFromPath(ctx, inputPath);
    native.npAddWatermark(ctx, doc, text, fontSize, opacity);
    native.dropDocument(ctx, doc);
  }

  // ============================================================================
  // PDF Manipulation
  // ============================================================================

  /**
   * Merge multiple PDFs into one using FFI
   * @throws Error when native bindings are not available
   */
  async mergePDFs(inputPaths: string[], outputPath: string): Promise<void> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('PDF merging requires native FFI bindings (np_merge_pdfs)');
    }

    native.npMergePDFs(ctx, inputPaths, outputPath);
  }

  /**
   * Split PDF into separate files using FFI
   * @returns Array of output file paths
   * @throws Error when native bindings are not available
   */
  async splitPDF(inputPath: string, outputDir: string): Promise<string[]> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('PDF splitting requires native FFI bindings (np_split_pdf)');
    }

    return native.npSplitPDF(ctx, inputPath, outputDir);
  }

  /**
   * Optimize PDF (compress, remove unused objects) using FFI
   * @throws Error when native bindings are not available
   */
  async optimizePDF(path: string): Promise<void> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('PDF optimization requires native FFI bindings (np_optimize_pdf)');
    }

    native.npOptimizePDF(ctx, path);
  }

  /**
   * Linearize PDF for fast web viewing using FFI
   * @throws Error when native bindings are not available
   */
  async linearizePDF(inputPath: string, outputPath: string): Promise<void> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('PDF linearization requires native FFI bindings (np_linearize_pdf)');
    }

    native.npLinearizePDF(ctx, inputPath, outputPath);
  }

  /**
   * Write document to PDF file using FFI
   * @throws Error when native bindings are not available
   */
  async writePDF(doc: Document, path: string): Promise<void> {
    const ctx = (this._ctx as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;
    const nativeDoc = (doc as unknown as { _doc?: NativeDocument })?._doc;

    if (!ctx || !nativeDoc) {
      throw new Error('Writing PDF requires native FFI bindings (pdf_save_document)');
    }

    native.saveDocument(ctx, nativeDoc, path);
  }

  // ============================================================================
  // Convenience Factory Methods
  // ============================================================================

  /**
   * Create a new blank PDF document
   * @param width Page width in points (default A4 width: 595)
   * @param height Page height in points (default A4 height: 842)
   * @throws Error This is a static method that requires instance context
   */
  static createBlankDocument(_width: number = 595, _height: number = 842): Document {
    throw new Error(
      'Document creation requires native FFI bindings (fz_new_document). ' +
        'Use Document.fromBuffer() or Enhanced instance methods instead.'
    );
  }

  /**
   * Quick create PDF with text
   * @throws Error This is a static method that requires instance context
   */
  static async createTextPDF(
    _text: string,
    _outputPath: string,
    _options?: {
      fontSize?: number;
      fontName?: string;
      pageWidth?: number;
      pageHeight?: number;
    }
  ): Promise<void> {
    throw new Error(
      'PDF text creation requires native FFI bindings (fz_new_document, fz_show_string). ' +
        'Use Enhanced instance methods instead.'
    );
  }
}

/**
 * Global enhanced API instance
 */
let globalEnhanced: Enhanced | null = null;

/**
 * Get global enhanced API
 */
export function getEnhanced(): Enhanced {
  if (!globalEnhanced) {
    globalEnhanced = new Enhanced();
  }
  return globalEnhanced;
}

/**
 * Convenience functions (use global instance)
 */

export async function addWatermark(
  inputPath: string,
  outputPath: string,
  text: string,
  x?: number,
  y?: number,
  fontSize?: number,
  opacity?: number
): Promise<void> {
  return getEnhanced().addWatermark(inputPath, outputPath, text, x, y, fontSize, opacity);
}

export async function mergePDFs(inputPaths: string[], outputPath: string): Promise<void> {
  return getEnhanced().mergePDFs(inputPaths, outputPath);
}

export async function splitPDF(inputPath: string, outputDir: string): Promise<string[]> {
  return getEnhanced().splitPDF(inputPath, outputDir);
}

export async function optimizePDF(path: string): Promise<void> {
  return getEnhanced().optimizePDF(path);
}

export async function linearizePDF(inputPath: string, outputPath: string): Promise<void> {
  return getEnhanced().linearizePDF(inputPath, outputPath);
}

export function createBlankDocument(width?: number, height?: number): Document {
  return Enhanced.createBlankDocument(width, height);
}

export async function createTextPDF(
  text: string,
  outputPath: string,
  options?: Parameters<typeof Enhanced.createTextPDF>[2]
): Promise<void> {
  return Enhanced.createTextPDF(text, outputPath, options);
}
