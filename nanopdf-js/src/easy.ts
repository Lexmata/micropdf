/**
 * Easy API - Simplified, ergonomic API for common PDF tasks
 *
 * This module provides a high-level, user-friendly interface for the most common
 * PDF operations, with automatic resource management and intuitive method chaining.
 *
 * @example
 * ```typescript
 * import { EasyPDF } from 'nanopdf/easy';
 *
 * // Simple text extraction
 * const text = await EasyPDF.extractText('document.pdf');
 *
 * // Render to PNG
 * const buffer = await EasyPDF.renderPage('document.pdf', 0, { dpi: 300 });
 *
 * // Chain operations
 * await EasyPDF.open('input.pdf')
 *   .getMetadata()
 *   .extractText()
 *   .renderPages({ dpi: 150 })
 *   .save('output.pdf');
 * ```
 */

import { Document } from './document.js';
import { Matrix } from './geometry.js';
import { Colorspace } from './colorspace.js';
import { dpiToScale } from './render-options.js';
import * as fs from 'fs/promises';

/**
 * Options for rendering pages
 */
export interface EasyRenderOptions {
  /** DPI for rendering (default: 72) */
  dpi?: number;
  /** Width in pixels (alternative to DPI) */
  width?: number;
  /** Height in pixels (alternative to DPI) */
  height?: number;
  /** Colorspace (default: RGB) */
  colorspace?: 'gray' | 'rgb' | 'cmyk';
  /** Include alpha channel (default: false) */
  alpha?: boolean;
  /** Image format for output (default: 'png') */
  format?: 'png' | 'pnm' | 'pam' | 'pbm';
}

/**
 * PDF metadata
 */
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modDate?: Date;
}

/**
 * Page information
 */
export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Document information
 */
export interface DocumentInfo {
  pageCount: number;
  metadata: PdfMetadata;
  isEncrypted: boolean;
  hasXfa: boolean;
  pages: PageInfo[];
}

/**
 * Text extraction result
 */
export interface ExtractedText {
  text: string;
  pageNumber: number;
  blocks?: Array<{
    text: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Search result
 */
export interface SearchResult {
  text: string;
  pageNumber: number;
  bbox: { x: number; y: number; width: number; height: number };
}

/**
 * EasyPDF - Fluent builder for PDF operations
 */
export class EasyPDF {
  private doc: Document | null = null;
  private autoClose = true;

  private constructor(doc: Document) {
    this.doc = doc;
  }

  /**
   * Open a PDF document
   *
   * @param path - Path to PDF file
   * @param password - Optional password for encrypted PDFs
   * @returns EasyPDF instance for chaining
   *
   * @example
   * ```typescript
   * const pdf = EasyPDF.open('document.pdf');
   * ```
   */
  static open(path: string, password?: string): EasyPDF {
    const doc = Document.open(path, password);
    return new EasyPDF(doc);
  }

  /**
   * Open a PDF from a buffer
   *
   * @param buffer - Buffer containing PDF data
   * @param password - Optional password for encrypted PDFs
   * @returns EasyPDF instance for chaining
   *
   * @example
   * ```typescript
   * const buffer = await fs.readFile('document.pdf');
   * const pdf = EasyPDF.fromBuffer(buffer);
   * ```
   */
  static fromBuffer(buffer: Uint8Array | globalThis.Buffer, password?: string): EasyPDF {
    const doc = Document.fromBuffer(buffer as any, password);
    return new EasyPDF(doc);
  }

  /**
   * Extract text from a PDF file (static helper)
   *
   * @param path - Path to PDF file
   * @param pageNumber - Optional page number (0-indexed), or undefined for all pages
   * @returns Extracted text
   *
   * @example
   * ```typescript
   * // Extract all text
   * const allText = await EasyPDF.extractText('document.pdf');
   *
   * // Extract from specific page
   * const pageText = await EasyPDF.extractText('document.pdf', 0);
   * ```
   */
  static async extractText(path: string, pageNumber?: number): Promise<string> {
    const pdf = EasyPDF.open(path);
    try {
      if (pageNumber !== undefined) {
        return pdf.extractPageText(pageNumber);
      }
      return pdf.extractAllText();
    } finally {
      pdf.close();
    }
  }

  /**
   * Render a specific page to an image buffer (static helper)
   *
   * @param path - Path to PDF file
   * @param pageNumber - Page number (0-indexed)
   * @param options - Render options
   * @returns Image buffer
   *
   * @example
   * ```typescript
   * const pngBuffer = await EasyPDF.renderPage('document.pdf', 0, {
   *   dpi: 300,
   *   format: 'png'
   * });
   * await fs.writeFile('page.png', pngBuffer);
   * ```
   */
  static async renderPage(
    path: string,
    pageNumber: number,
    options: EasyRenderOptions = {}
  ): Promise<Buffer> {
    const pdf = EasyPDF.open(path);
    try {
      return pdf.renderToBuffer(pageNumber, options);
    } finally {
      pdf.close();
    }
  }

  /**
   * Get document information (static helper)
   *
   * @param path - Path to PDF file
   * @returns Document information
   *
   * @example
   * ```typescript
   * const info = await EasyPDF.getInfo('document.pdf');
   * console.log(`Pages: ${info.pageCount}`);
   * console.log(`Title: ${info.metadata.title}`);
   * ```
   */
  static async getInfo(path: string): Promise<DocumentInfo> {
    const pdf = EasyPDF.open(path);
    try {
      return pdf.getInfo();
    } finally {
      pdf.close();
    }
  }

  /**
   * Search for text in a PDF (static helper)
   *
   * @param path - Path to PDF file
   * @param query - Text to search for
   * @param pageNumber - Optional page number (0-indexed), or undefined for all pages
   * @returns Array of search results
   *
   * @example
   * ```typescript
   * const results = await EasyPDF.search('document.pdf', 'important');
   * console.log(`Found ${results.length} occurrences`);
   * ```
   */
  static async search(
    path: string,
    query: string,
    pageNumber?: number
  ): Promise<SearchResult[]> {
    const pdf = EasyPDF.open(path);
    try {
      return pdf.search(query, pageNumber);
    } finally {
      pdf.close();
    }
  }

  /**
   * Get the number of pages
   *
   * @returns Page count
   */
  get pageCount(): number {
    this.ensureOpen();
    return this.doc!.pageCount;
  }

  /**
   * Check if document is encrypted
   *
   * @returns True if encrypted
   */
  get isEncrypted(): boolean {
    this.ensureOpen();
    return this.doc!.needsPassword;
  }

  /**
   * Get document metadata
   *
   * @returns Metadata object
   *
   * @example
   * ```typescript
   * const metadata = pdf.getMetadata();
   * console.log(metadata.title);
   * console.log(metadata.author);
   * ```
   */
  getMetadata(): PdfMetadata {
    this.ensureOpen();
    const doc = this.doc!;

    const parseDate = (dateStr: string | null): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        // PDF date format: D:YYYYMMDDHHmmSSOHH'mm
        const match = dateStr.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
        if (match) {
          const [, year, month, day, hour, min, sec] = match;
          return new Date(
            parseInt(year!),
            parseInt(month!) - 1,
            parseInt(day!),
            parseInt(hour!),
            parseInt(min!),
            parseInt(sec!)
          );
        }
        return new Date(dateStr);
      } catch {
        return undefined;
      }
    };

    const metadata: PdfMetadata = {};
    
    const title = doc.getMetadata('Title');
    if (title) metadata.title = title;
    
    const author = doc.getMetadata('Author');
    if (author) metadata.author = author;
    
    const subject = doc.getMetadata('Subject');
    if (subject) metadata.subject = subject;
    
    const keywords = doc.getMetadata('Keywords');
    if (keywords) metadata.keywords = keywords;
    
    const creator = doc.getMetadata('Creator');
    if (creator) metadata.creator = creator;
    
    const producer = doc.getMetadata('Producer');
    if (producer) metadata.producer = producer;
    
    const creationDate = parseDate(doc.getMetadata('CreationDate'));
    if (creationDate) metadata.creationDate = creationDate;
    
    const modDate = parseDate(doc.getMetadata('ModDate'));
    if (modDate) metadata.modDate = modDate;
    
    return metadata;
  }

  /**
   * Get document information
   *
   * @returns Complete document information
   *
   * @example
   * ```typescript
   * const info = pdf.getInfo();
   * console.log(`Document has ${info.pageCount} pages`);
   * info.pages.forEach((page, i) => {
   *   console.log(`Page ${i}: ${page.width}x${page.height}`);
   * });
   * ```
   */
  getInfo(): DocumentInfo {
    this.ensureOpen();
    const doc = this.doc!;

    const pages: PageInfo[] = [];
    for (let i = 0; i < doc.pageCount; i++) {
      const page = doc.getPage(i);
      try {
        const bounds = page.bounds();
        pages.push({
          pageNumber: i,
          width: bounds.width,
          height: bounds.height,
          rotation: 0 // TODO: Get rotation from page
        });
      } finally {
        page.drop();
      }
    }

    return {
      pageCount: doc.pageCount,
      metadata: this.getMetadata(),
      isEncrypted: doc.needsPassword,
      hasXfa: false, // TODO: Check for XFA forms
      pages
    };
  }

  /**
   * Extract text from a specific page
   *
   * @param pageNumber - Page number (0-indexed)
   * @returns Extracted text
   *
   * @example
   * ```typescript
   * const text = pdf.extractPageText(0);
   * console.log(text);
   * ```
   */
  extractPageText(pageNumber: number): string {
    this.ensureOpen();
    const page = this.doc!.getPage(pageNumber);
    try {
      return page.extractText();
    } finally {
      page.drop();
    }
  }

  /**
   * Extract text from all pages
   *
   * @param separator - Separator between pages (default: '\n\n---\n\n')
   * @returns Extracted text
   *
   * @example
   * ```typescript
   * const allText = pdf.extractAllText();
   * ```
   */
  extractAllText(separator = '\n\n---\n\n'): string {
    this.ensureOpen();
    const texts: string[] = [];

    for (let i = 0; i < this.doc!.pageCount; i++) {
      texts.push(this.extractPageText(i));
    }

    return texts.join(separator);
  }

  /**
   * Extract structured text with bounding boxes
   *
   * @param pageNumber - Page number (0-indexed), or undefined for all pages
   * @returns Array of extracted text with structure
   *
   * @example
   * ```typescript
   * const structured = pdf.extractStructuredText(0);
   * structured.forEach(block => {
   *   console.log(`Text: ${block.text}`);
   *   console.log(`Position: ${block.bbox.x}, ${block.bbox.y}`);
   * });
   * ```
   */
  extractStructuredText(pageNumber?: number): ExtractedText[] {
    this.ensureOpen();
    const results: ExtractedText[] = [];

    const processPage = (pNum: number) => {
      const page = this.doc!.getPage(pNum);
      try {
        const stext = page.extractStructuredText();
        const blocks = stext.blocks.map((block) => ({
          text: block.text || '',
          bbox: {
            x: block.bbox.x,
            y: block.bbox.y,
            width: block.bbox.width,
            height: block.bbox.height
          }
        }));

        results.push({
          text: page.extractText(),
          pageNumber: pNum,
          blocks
        });
      } finally {
        page.drop();
      }
    };

    if (pageNumber !== undefined) {
      processPage(pageNumber);
    } else {
      for (let i = 0; i < this.doc!.pageCount; i++) {
        processPage(i);
      }
    }

    return results;
  }

  /**
   * Search for text in the document
   *
   * @param query - Text to search for
   * @param pageNumber - Optional page number (0-indexed), or undefined for all pages
   * @returns Array of search results
   *
   * @example
   * ```typescript
   * const results = pdf.search('important');
   * results.forEach(result => {
   *   console.log(`Found on page ${result.pageNumber}: ${result.text}`);
   * });
   * ```
   */
  search(query: string, pageNumber?: number): SearchResult[] {
    this.ensureOpen();
    const results: SearchResult[] = [];

    const searchPage = (pNum: number) => {
      const page = this.doc!.getPage(pNum);
      try {
        const hits = page.searchText(query);
        hits.forEach((hit) => {
          results.push({
            text: query,
            pageNumber: pNum,
            bbox: {
              x: hit.x,
              y: hit.y,
              width: hit.width,
              height: hit.height
            }
          });
        });
      } finally {
        page.drop();
      }
    };

    if (pageNumber !== undefined) {
      searchPage(pageNumber);
    } else {
      for (let i = 0; i < this.doc!.pageCount; i++) {
        searchPage(i);
      }
    }

    return results;
  }

  /**
   * Render a page to a buffer
   *
   * @param pageNumber - Page number (0-indexed)
   * @param options - Render options
   * @returns Image buffer
   *
   * @example
   * ```typescript
   * const pngBuffer = pdf.renderToBuffer(0, { dpi: 300 });
   * await fs.writeFile('page.png', pngBuffer);
   * ```
   */
  renderToBuffer(pageNumber: number, options: EasyRenderOptions = {}): Buffer {
    this.ensureOpen();
    const page = this.doc!.getPage(pageNumber);

    try {
      // Calculate transform matrix
      let matrix = Matrix.IDENTITY;

      if (options.dpi) {
        const scale = dpiToScale(options.dpi);
        matrix = Matrix.scale(scale, scale);
      } else if (options.width || options.height) {
        const bounds = page.bounds();
        const scaleX = options.width ? options.width / bounds.width : 1;
        const scaleY = options.height ? options.height / bounds.height : 1;
        const scale = Math.min(scaleX, scaleY);
        matrix = Matrix.scale(scale, scale);
      }

      // Determine colorspace
      let colorspace: Colorspace;
      switch (options.colorspace) {
        case 'gray':
          colorspace = Colorspace.deviceGray();
          break;
        case 'cmyk':
          colorspace = Colorspace.deviceCMYK();
          break;
        case 'rgb':
        default:
          colorspace = Colorspace.deviceRGB();
          break;
      }

      // Render to pixmap
      const pixmap = page.toPixmap(matrix, colorspace, options.alpha ?? false);

      try {
        // Convert to buffer
        const format = options.format || 'png';
        return pixmap.toBuffer(format);
      } finally {
        pixmap.drop();
      }
    } finally {
      page.drop();
    }
  }

  /**
   * Render a page to a file
   *
   * @param pageNumber - Page number (0-indexed)
   * @param outputPath - Output file path
   * @param options - Render options
   *
   * @example
   * ```typescript
   * await pdf.renderToFile(0, 'page.png', { dpi: 300 });
   * ```
   */
  async renderToFile(
    pageNumber: number,
    outputPath: string,
    options: EasyRenderOptions = {}
  ): Promise<void> {
    const buffer = this.renderToBuffer(pageNumber, options);
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Render all pages
   *
   * @param options - Render options
   * @returns Array of image buffers
   *
   * @example
   * ```typescript
   * const pages = pdf.renderAll({ dpi: 150 });
   * pages.forEach((buffer, i) => {
   *   fs.writeFileSync(`page-${i}.png`, buffer);
   * });
   * ```
   */
  renderAll(options: EasyRenderOptions = {}): Buffer[] {
    this.ensureOpen();
    const buffers: Buffer[] = [];

    for (let i = 0; i < this.doc!.pageCount; i++) {
      buffers.push(this.renderToBuffer(i, options));
    }

    return buffers;
  }

  /**
   * Render all pages to files
   *
   * @param outputPattern - Output file pattern (use {page} for page number)
   * @param options - Render options
   *
   * @example
   * ```typescript
   * await pdf.renderAllToFiles('output/page-{page}.png', { dpi: 150 });
   * ```
   */
  async renderAllToFiles(
    outputPattern: string,
    options: EasyRenderOptions = {}
  ): Promise<void> {
    this.ensureOpen();

    for (let i = 0; i < this.doc!.pageCount; i++) {
      const outputPath = outputPattern.replace('{page}', i.toString());
      await this.renderToFile(i, outputPath, options);
    }
  }

  /**
   * Disable automatic closing (for manual resource management)
   *
   * @returns this for chaining
   */
  keepOpen(): this {
    this.autoClose = false;
    return this;
  }

  /**
   * Close the document and free resources
   *
   * @example
   * ```typescript
   * const pdf = EasyPDF.open('document.pdf');
   * try {
   *   // Use pdf...
   * } finally {
   *   pdf.close();
   * }
   * ```
   */
  close(): void {
    // Documents don't require explicit cleanup in this implementation
    this.doc = null;
  }

  /**
   * Use the PDF document within a callback, automatically closing it
   *
   * @param callback - Callback function
   * @returns Result of callback
   *
   * @example
   * ```typescript
   * const text = await EasyPDF.open('document.pdf').use(pdf => {
   *   return pdf.extractAllText();
   * });
   * ```
   */
  use<T>(callback: (pdf: this) => T): T {
    try {
      return callback(this);
    } finally {
      if (this.autoClose) {
        this.close();
      }
    }
  }

  /**
   * Use the PDF document within an async callback, automatically closing it
   *
   * @param callback - Async callback function
   * @returns Promise with result of callback
   *
   * @example
   * ```typescript
   * const info = await EasyPDF.open('document.pdf').useAsync(async pdf => {
   *   return pdf.getInfo();
   * });
   * ```
   */
  async useAsync<T>(callback: (pdf: this) => Promise<T>): Promise<T> {
    try {
      return await callback(this);
    } finally {
      if (this.autoClose) {
        this.close();
      }
    }
  }

  private ensureOpen(): void {
    if (!this.doc) {
      throw new Error('PDF document is closed');
    }
  }
}

/**
 * Namespace for quick utility functions
 */
export namespace PDFUtils {
  /**
   * Extract text from a PDF file
   */
  export const extractText = EasyPDF.extractText;

  /**
   * Render a page to buffer
   */
  export const renderPage = EasyPDF.renderPage;

  /**
   * Get document information
   */
  export const getInfo = EasyPDF.getInfo;

  /**
   * Search for text
   */
  export const search = EasyPDF.search;
}

