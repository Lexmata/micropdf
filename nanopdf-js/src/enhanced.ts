/**
 * Enhanced - NanoPDF high-level convenience API
 * 
 * This module provides NanoPDF-specific high-level functions for common PDF operations.
 * These are convenience wrappers that simplify complex workflows.
 */

import { Context, getDefaultContext } from './context.js';
import { Document } from './document.js';
import { Color, type ColorLike } from './geometry.js';

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
   * Add a blank page to a document
   */
  addBlankPage(doc: Document, width: number, height: number): number {
    // Simplified: would call FFI to add page
    // Returns page index
    return doc.countPages();
  }

  // ============================================================================
  // Drawing Operations
  // ============================================================================

  /**
   * Draw a line on a page
   */
  drawLine(
    page: any,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: ColorLike,
    alpha: number = 1.0,
    lineWidth: number = 1.0
  ): void {
    // Simplified: would create path and stroke
    const c = Color.from(color);
    // In real implementation, would use Path and Device to draw
  }

  /**
   * Draw a rectangle on a page
   */
  drawRectangle(
    page: any,
    x: number,
    y: number,
    width: number,
    height: number,
    color: ColorLike,
    alpha: number = 1.0,
    fill: boolean = false
  ): void {
    // Simplified: would create path and fill/stroke
    const c = Color.from(color);
    // In real implementation, would use Path and Device
  }

  /**
   * Draw a circle on a page
   */
  drawCircle(
    page: any,
    x: number,
    y: number,
    radius: number,
    color: ColorLike,
    alpha: number = 1.0,
    fill: boolean = false
  ): void {
    // Simplified: would create circular path
    const c = Color.from(color);
    // In real implementation, would use Path with curves
  }

  // ============================================================================
  // Watermark Operations
  // ============================================================================

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    inputPath: string,
    outputPath: string,
    text: string,
    x: number = 100,
    y: number = 100,
    fontSize: number = 48,
    opacity: number = 0.3
  ): Promise<void> {
    // Simplified: would open PDF, add text to each page, save
    // In real implementation:
    // 1. Open input PDF
    // 2. For each page, add watermark text
    // 3. Save to output path
  }

  // ============================================================================
  // PDF Manipulation
  // ============================================================================

  /**
   * Merge multiple PDFs into one
   */
  async mergePDFs(inputPaths: string[], outputPath: string): Promise<void> {
    // Simplified: would open each PDF and append pages
    // In real implementation:
    // 1. Create new document
    // 2. For each input PDF:
    //    - Open document
    //    - Copy all pages
    //    - Append to output
    // 3. Save merged document
  }

  /**
   * Split PDF into separate files
   */
  async splitPDF(inputPath: string, outputDir: string): Promise<string[]> {
    // Simplified: would create one file per page
    // In real implementation:
    // 1. Open input PDF
    // 2. For each page:
    //    - Create new single-page document
    //    - Copy page
    //    - Save to outputDir/page-N.pdf
    // 3. Return list of created files
    return [];
  }

  /**
   * Optimize PDF (compress, remove unused objects)
   */
  async optimizePDF(path: string): Promise<void> {
    // Simplified: would compress streams, remove unused objects
    // In real implementation:
    // 1. Open PDF
    // 2. Compress all streams
    // 3. Remove unused objects
    // 4. Remove duplicate resources
    // 5. Save optimized PDF
  }

  /**
   * Linearize PDF for fast web viewing
   */
  async linearizePDF(inputPath: string, outputPath: string): Promise<void> {
    // Simplified: would reorganize PDF for linear access
    // In real implementation:
    // 1. Open input PDF
    // 2. Reorganize object order for sequential access
    // 3. Place page content before other objects
    // 4. Save linearized PDF
  }

  /**
   * Write document to PDF file
   */
  async writePDF(doc: Document, path: string): Promise<void> {
    // Simplified: would save document
    // In real implementation, would call doc.save(path)
  }

  // ============================================================================
  // Convenience Factory Methods
  // ============================================================================

  /**
   * Create a new blank PDF document
   */
  static createBlankDocument(width: number = 595, height: number = 842): Document {
    // Simplified: would create new document with one blank page
    // Default to A4 size (595x842 points)
    return Document.create();
  }

  /**
   * Quick create PDF with text
   */
  static async createTextPDF(
    text: string,
    outputPath: string,
    options?: {
      fontSize?: number;
      fontName?: string;
      pageWidth?: number;
      pageHeight?: number;
    }
  ): Promise<void> {
    // Simplified: would create PDF with text content
    // In real implementation:
    // 1. Create document
    // 2. Add page
    // 3. Add text content
    // 4. Save to path
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

