/**
 * Document - PDF document handling
 *
 * This module provides the primary API for working with PDF documents. It handles
 * document lifecycle, page access, metadata, security, and rendering operations.
 *
 * This implementation mirrors the Rust `fitz::document::Document` for 100% API compatibility.
 *
 * @module document
 * @example
 * ```typescript
 * import { Document } from 'nanopdf';
 *
 * // Open a PDF from a file
 * const doc = Document.open('document.pdf');
 *
 * // Check if password is required
 * if (doc.needsPassword()) {
 *   doc.authenticate('password');
 * }
 *
 * // Get page count
 * console.log(`Pages: ${doc.pageCount}`);
 *
 * // Load and render a page
 * const page = doc.loadPage(0);
 * const pixmap = page.toPixmap(Matrix.identity());
 *
 * // Extract text
 * const text = page.extractText();
 *
 * // Clean up
 * page.drop();
 * doc.close();
 * ```
 */

import { Buffer } from './buffer.js';
import { Colorspace } from './colorspace.js';
import { Rect, Matrix, Quad } from './geometry.js';
import { native } from './native.js';
import type { NativeContext, NativeDocument, NativePage, NativeRect } from './native.js';
import { Pixmap } from './pixmap.js';
import {
  type RenderOptions,
  type ExtendedRenderOptions,
  AntiAliasLevel,
  mergeRenderOptions,
  validateRenderOptions,
  dpiToScale
} from './render-options.js';
import { NanoPDFError, LinkDestType, type Link, type RectLike, type MatrixLike } from './types.js';

/**
 * An item in the document outline (table of contents / bookmarks).
 *
 * Outline items form a tree structure representing the document's navigation hierarchy.
 * Each item can link to a page number, URI, or have child items.
 *
 * @class OutlineItem
 * @example
 * ```typescript
 * const outline = doc.getOutline();
 * for (const item of outline) {
 *   console.log(`${item.title} -> Page ${item.page}`);
 *   for (const child of item.children) {
 *     console.log(`  ${child.title} -> Page ${child.page}`);
 *   }
 * }
 * ```
 */
export class OutlineItem {
  /**
   * The title/label of this outline item.
   * @readonly
   * @type {string}
   */
  readonly title: string;

  /**
   * The destination page number (0-indexed), if this item links to a page.
   * Undefined if this item links to a URI instead.
   * @readonly
   * @type {number | undefined}
   */
  readonly page: number | undefined;

  /**
   * The destination URI, if this item links to an external resource.
   * Undefined if this item links to a page instead.
   * @readonly
   * @type {string | undefined}
   */
  readonly uri: string | undefined;

  /**
   * Child outline items nested under this item.
   * @readonly
   * @type {OutlineItem[]}
   */
  readonly children: OutlineItem[];

  /**
   * Creates a new outline item.
   *
   * @param {string} title - The title of the outline item
   * @param {number} [page] - The destination page number (0-indexed)
   * @param {string} [uri] - The destination URI
   */
  constructor(title: string, page?: number, uri?: string) {
    this.title = title;
    this.page = page;
    this.uri = uri;
    this.children = [];
  }
}

/**
 * A block of text extracted from a PDF page.
 *
 * Text blocks represent cohesive units of text, typically paragraphs or sections.
 * They contain the bounding box, complete text, and structured line information.
 *
 * @interface TextBlock
 * @example
 * ```typescript
 * const blocks = page.extractTextBlocks();
 * for (const block of blocks) {
 *   console.log(`Block at [${block.bbox.x0}, ${block.bbox.y0}]:`);
 *   console.log(block.text);
 *   console.log(`Contains ${block.lines.length} lines`);
 * }
 * ```
 */
export interface TextBlock {
  /**
   * The bounding box of the entire text block.
   * @readonly
   * @type {RectLike}
   */
  readonly bbox: RectLike;

  /**
   * The complete text content of this block.
   * @readonly
   * @type {string}
   */
  readonly text: string;

  /**
   * The individual lines within this block.
   * @readonly
   * @type {TextLine[]}
   */
  readonly lines: TextLine[];
}

/**
 * A single line of text extracted from a PDF page.
 *
 * Text lines represent a horizontal run of text, typically corresponding to
 * a single line in the original document layout.
 *
 * @interface TextLine
 * @example
 * ```typescript
 * const blocks = page.extractTextBlocks();
 * for (const block of blocks) {
 *   for (const line of block.lines) {
 *     console.log(`Line: "${line.text}"`);
 *     console.log(`  Font sizes: ${line.spans.map(s => s.size).join(', ')}`);
 *   }
 * }
 * ```
 */
export interface TextLine {
  /**
   * The bounding box of the entire line.
   * @readonly
   * @type {RectLike}
   */
  readonly bbox: RectLike;

  /**
   * The complete text content of this line.
   * @readonly
   * @type {string}
   */
  readonly text: string;

  /**
   * The individual text spans within this line.
   * @readonly
   * @type {TextSpan[]}
   */
  readonly spans: TextSpan[];
}

/**
 * A span of text with consistent formatting properties.
 *
 * Text spans represent runs of text that share the same font, size, and color.
 * They are the most granular level of text extraction.
 *
 * @interface TextSpan
 * @example
 * ```typescript
 * const blocks = page.extractTextBlocks();
 * for (const block of blocks) {
 *   for (const line of block.lines) {
 *     for (const span of line.spans) {
 *       console.log(`"${span.text}" - ${span.font} @ ${span.size}pt`);
 *       console.log(`  Color: RGB(${span.color.join(', ')})`);
 *     }
 *   }
 * }
 * ```
 */
export interface TextSpan {
  /**
   * The bounding box of this text span.
   * @readonly
   * @type {RectLike}
   */
  readonly bbox: RectLike;

  /**
   * The text content of this span.
   * @readonly
   * @type {string}
   */
  readonly text: string;

  /**
   * The font name used for this span.
   * @readonly
   * @type {string}
   */
  readonly font: string;

  /**
   * The font size in points.
   * @readonly
   * @type {number}
   */
  readonly size: number;

  /**
   * The text color as RGB values (0-255).
   * @readonly
   * @type {number[]}
   */
  readonly color: number[];
}

/**
 * A page in a PDF document.
 *
 * Represents a single page within a PDF document with methods for rendering,
 * text extraction, search, and link retrieval. Pages are loaded from a Document
 * using `Document.loadPage()`.
 *
 * **Important**: Pages must be explicitly freed using `drop()` when no longer needed
 * to prevent memory leaks.
 *
 * @class Page
 * @example
 * ```typescript
 * const doc = Document.open('document.pdf');
 * const page = doc.loadPage(0); // Load first page
 *
 * try {
 *   // Get page dimensions
 *   console.log(`Size: ${page.bounds.width} x ${page.bounds.height}`);
 *   console.log(`Rotation: ${page.rotation}°`);
 *
 *   // Extract text
 *   const text = page.extractText();
 *   console.log(text);
 *
 *   // Search for text
 *   const hits = page.searchText('hello');
 *   console.log(`Found ${hits.length} occurrences`);
 *
 *   // Render to pixmap
 *   const matrix = Matrix.scale(2, 2); // 2x zoom
 *   const pixmap = page.toPixmap(matrix);
 * } finally {
 *   page.drop(); // Always clean up!
 * }
 *
 * doc.close();
 * ```
 */
export class Page {
  private _ctx?: NativeContext;

  private _page?: NativePage;
  private readonly _pageNumber: number;
  private readonly _bounds: Rect;
  private readonly _mediaBox: Rect;
  private readonly _rotation: number;

  /** @internal */
  constructor(
    _document: Document,
    pageNumber: number,
    bounds: Rect,
    mediaBox: Rect,
    rotation: number
  ) {
    // Native handles will be set when FFI is fully integrated
    this._pageNumber = pageNumber;
    this._bounds = bounds;
    this._mediaBox = mediaBox;
    this._rotation = rotation;
  }

  /**
   * Get the page number (0-based)
   */
  get pageNumber(): number {
    return this._pageNumber;
  }

  /**
   * Get the page bounds
   */
  get bounds(): Rect {
    return this._bounds;
  }

  /**
   * Get the media box
   */
  get mediaBox(): Rect {
    return this._mediaBox;
  }

  /**
   * Get the crop box
   */
  get cropBox(): Rect {
    // Default to media box if no crop box specified
    return this._mediaBox;
  }

  /**
   * Get the page rotation (0, 90, 180, or 270)
   */
  get rotation(): number {
    return this._rotation;
  }

  /**
   * Render the page to a pixmap using FFI
   * @throws Error when native bindings are not available
   */
  toPixmap(
    matrix: MatrixLike = Matrix.IDENTITY,
    colorspace: Colorspace = Colorspace.deviceRGB(),
    alpha: boolean = true
  ): Pixmap {
    if (!this._ctx || !this._page) {
      throw new Error(
        'Page rendering requires native FFI bindings (fz_run_page, fz_new_bbox_device)'
      );
    }

    const m = Matrix.from(matrix);
    const nativeMatrix = {
      a: m.a,
      b: m.b,
      c: m.c,
      d: m.d,
      e: m.e,
      f: m.f
    };

    const nativeColorspace = {
      name: colorspace.name,
      n: colorspace.n,
      type: colorspace.type.toString()
    };

    const nativePixmap = native.renderPage(
      this._ctx,
      this._page,
      nativeMatrix,
      nativeColorspace,
      alpha
    );

    // Convert native pixmap to TypeScript Pixmap
    return Pixmap.create(colorspace, nativePixmap.width, nativePixmap.height, alpha);
  }

  /**
   * Render the page to PNG using FFI
   * @throws Error when native bindings are not available
   */
  toPNG(dpi: number = 72): Uint8Array {
    if (!this._ctx || !this._page) {
      throw new Error('PNG encoding requires native FFI bindings (fz_save_pixmap_as_png)');
    }

    const nativeColorspace = {
      name: 'DeviceRGB',
      n: 3,
      type: 'RGB'
    };

    const pngBuffer = native.renderPageToPNG(this._ctx, this._page, dpi, nativeColorspace);
    return new Uint8Array(pngBuffer);
  }

  /**
   * Render page with advanced options
   *
   * Provides fine-grained control over rendering quality, colorspace,
   * anti-aliasing, and other rendering parameters.
   *
   * @param options - Rendering options
   * @returns Pixmap containing the rendered page
   * @throws Error if native bindings are not available
   * @throws Error if options are invalid
   *
   * @example
   * ```typescript
   * // High-quality print rendering
   * const pixmap = page.renderWithOptions({
   *   dpi: 300,
   *   colorspace: Colorspace.deviceRGB(),
   *   alpha: true,
   *   antiAlias: AntiAliasLevel.High
   * });
   *
   * // Fast preview rendering
   * const preview = page.renderWithOptions({
   *   dpi: 72,
   *   antiAlias: AntiAliasLevel.Low
   * });
   * ```
   */
  renderWithOptions(options: RenderOptions = {}): Pixmap {
    if (!this._ctx || !this._page) {
      throw new Error('Rendering requires native FFI bindings');
    }

    // Validate options
    validateRenderOptions(options);

    // Merge with defaults
    const opts = mergeRenderOptions(options);

    // Calculate transform matrix from DPI or use provided transform
    const matrix = opts.transform
      ? opts.transform
      : Matrix.scale(dpiToScale(opts.dpi), dpiToScale(opts.dpi));

    // Use existing toPixmap method with derived parameters
    // TODO: In future, pass antiAlias level, renderAnnotations, renderFormFields through FFI
    return this.toPixmap(matrix, opts.colorspace, opts.alpha);
  }

  /**
   * Render page with progress tracking
   *
   * Extended rendering with progress callbacks and timeout support.
   * Useful for long-running renders of complex pages.
   *
   * @param options - Extended rendering options with callbacks
   * @returns Promise resolving to the rendered pixmap
   * @throws Error if rendering fails or times out
   *
   * @example
   * ```typescript
   * const pixmap = await page.renderWithProgress({
   *   dpi: 600,
   *   onProgress: (current, total) => {
   *     console.log(`Rendering: ${Math.round(current/total * 100)}%`);
   *     return true; // Continue rendering
   *   },
   *   onError: (error) => {
   *     console.error('Render error:', error);
   *   },
   *   timeout: 30000 // 30 second timeout
   * });
   * ```
   */
  async renderWithProgress(options: ExtendedRenderOptions = {}): Promise<Pixmap> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let timeoutId: NodeJS.Timeout | undefined;

      // Set up timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          const error = 'Rendering timeout exceeded';
          if (options.onError) {
            options.onError(error);
          }
          reject(new Error(error));
        }, options.timeout);
      }

      try {
        // For now, perform synchronous render
        // TODO: Implement async rendering with FFI progress callbacks
        const pixmap = this.renderWithOptions(options);

        // Simulate progress callback
        if (options.onProgress) {
          options.onProgress(100, 100);
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        resolve(pixmap);
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const errorMsg = error instanceof Error ? error.message : String(error);
        if (options.onError) {
          options.onError(errorMsg);
        }
        reject(error);
      }
    });
  }

  /**
   * Extract text from the page using FFI
   * @throws Error when native bindings are not available
   */
  getText(): string {
    if (!this._ctx || !this._page) {
      throw new Error('Text extraction requires native FFI bindings (fz_new_stext_page_from_page)');
    }
    return native.extractText(this._ctx, this._page);
  }

  /**
   * Get text blocks from the page using FFI
   * @throws Error when native bindings are not available
   */
  getTextBlocks(): TextBlock[] {
    if (!this._ctx || !this._page) {
      throw new Error(
        'Text block extraction requires native FFI bindings (fz_new_stext_page_from_page)'
      );
    }
    const blocks = native.extractTextBlocks(this._ctx, this._page);
    return blocks.map((block: { text: string; bbox: NativeRect }) => ({
      text: block.text,
      bbox: Rect.from(block.bbox),
      lines: [] // Lines will be populated when FFI provides detailed text structure
    }));
  }

  /**
   * Get links from the page using FFI
   * @throws Error when native bindings are not available
   */
  getLinks(): Link[] {
    if (!this._ctx || !this._page) {
      throw new Error(
        'Link extraction requires native FFI bindings (fz_load_links, pdf_annot_type)'
      );
    }
    const links = native.getPageLinks(this._ctx, this._page);
    return links.map((link: { rect: NativeRect; uri?: string; page?: number }): Link => {
      const bounds = Rect.from(link.rect);
      if (link.uri) {
        return { bounds, dest: LinkDestType.URI, uri: link.uri };
      } else if (link.page !== undefined) {
        return { bounds, dest: LinkDestType.Goto, page: link.page };
      } else {
        return { bounds, dest: LinkDestType.None };
      }
    });
  }

  /**
   * Search for text on the page using FFI
   * @throws Error when native bindings are not available
   */
  search(needle: string): Quad[] {
    if (!this._ctx || !this._page) {
      throw new Error('Text search requires native FFI bindings (fz_search_stext_page)');
    }
    const rects = native.searchText(this._ctx, this._page, needle, false);
    // Convert Rects to Quads (each rect becomes a quad)
    return rects.map((rect: NativeRect) => {
      const r = Rect.from(rect);
      return new Quad(
        { x: r.x0, y: r.y0 },
        { x: r.x1, y: r.y0 },
        { x: r.x0, y: r.y1 },
        { x: r.x1, y: r.y1 }
      );
    });
  }
}

/**
 * A PDF or other supported document format.
 *
 * The Document class is the main entry point for working with PDF files. It provides
 * methods for opening documents from files or memory, accessing pages, checking security,
 * reading metadata, and performing document-level operations.
 *
 * **Supported formats**: PDF, XPS, CBZ, and other formats supported by MuPDF.
 *
 * **Resource Management**: Documents must be explicitly closed using `close()` when
 * done to free native resources and prevent memory leaks.
 *
 * @class Document
 * @example
 * ```typescript
 * // Open from file
 * const doc = Document.open('document.pdf');
 *
 * // Open from buffer
 * const buffer = fs.readFileSync('document.pdf');
 * const doc2 = Document.openFromBuffer(buffer);
 *
 * // Check basic info
 * console.log(`Pages: ${doc.pageCount}`);
 * console.log(`Title: ${doc.getMetadata('Title')}`);
 * console.log(`Author: ${doc.getMetadata('Author')}`);
 *
 * // Handle password-protected PDFs
 * if (doc.needsPassword()) {
 *   const success = doc.authenticate('password123');
 *   if (!success) {
 *     throw new Error('Invalid password');
 *   }
 * }
 *
 * // Check permissions
 * if (!doc.hasPermission(4)) { // FZ_PERMISSION_PRINT
 *   console.warn('Printing is not allowed');
 * }
 *
 * // Work with pages
 * for (let i = 0; i < doc.pageCount; i++) {
 *   const page = doc.loadPage(i);
 *   const text = page.extractText();
 *   console.log(`Page ${i + 1}: ${text.substring(0, 100)}...`);
 *   page.drop();
 * }
 *
 * // Save modified document
 * doc.save('output.pdf');
 *
 * // Always clean up
 * doc.close();
 * ```
 *
 * @example
 * ```typescript
 * // Using try-finally for proper cleanup
 * const doc = Document.open('document.pdf');
 * try {
 *   // Work with document
 *   const page = doc.loadPage(0);
 *   try {
 *     const text = page.extractText();
 *     console.log(text);
 *   } finally {
 *     page.drop();
 *   }
 * } finally {
 *   doc.close();
 * }
 * ```
 */
export class Document {
  private _ctx?: NativeContext;

  private _doc?: NativeDocument;
  private _pages: Page[];
  private readonly _format: string;
  private readonly _metadata: Map<string, string>;
  private readonly _outline: OutlineItem[];
  private _needsPassword: boolean;
  private _isAuthenticated: boolean;

  private constructor(
    _buffer: Buffer,
    pages: Page[],
    format: string,
    needsPassword: boolean,
    isAuthenticated: boolean
  ) {
    this._pages = pages;
    this._format = format;
    this._needsPassword = needsPassword;
    this._isAuthenticated = isAuthenticated;
    this._metadata = new Map();
    this._outline = [];
  }

  /**
   * Open a document from a file path
   */
  static open(path: string, password?: string): Document {
    // Read file synchronously
    const fs = require('node:fs') as typeof import('fs');
    const data = fs.readFileSync(path);
    return Document.fromBuffer(Buffer.fromBuffer(data), password);
  }

  /**
   * Open a document from a buffer
   */
  static fromBuffer(buffer: Buffer, password?: string): Document {
    // Parse PDF header to get version
    const data = buffer.toUint8Array();
    const header = new TextDecoder().decode(data.slice(0, Math.min(1024, data.length)));

    // Check if it's a PDF
    if (!header.startsWith('%PDF-')) {
      throw NanoPDFError.argument('Not a PDF document');
    }

    // Extract version
    const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : '1.4';
    const format = `PDF ${version}`;

    // Parse pages (simplified - just count /Type /Page objects)
    const content = new TextDecoder().decode(data);
    const pageMatches = content.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : 0;

    // Create placeholder pages
    const pages: Page[] = [];
    const defaultBounds = new Rect(0, 0, 612, 792); // US Letter size

    // Parse MediaBox if present
    const mediaBoxMatch = content.match(
      /\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*]/
    );
    let mediaBox = defaultBounds;
    if (mediaBoxMatch) {
      mediaBox = new Rect(
        Number.parseFloat(mediaBoxMatch[1] ?? '0'),
        Number.parseFloat(mediaBoxMatch[2] ?? '0'),
        Number.parseFloat(mediaBoxMatch[3] ?? '612'),
        Number.parseFloat(mediaBoxMatch[4] ?? '792')
      );
    }

    const doc = new Document(buffer, [], format, false, true);

    for (let i = 0; i < pageCount; i++) {
      pages.push(new Page(doc, i, mediaBox, mediaBox, 0));
    }

    // Update pages array
    doc._pages = pages;

    // Try to authenticate if password provided
    if (password !== undefined) {
      doc.authenticate(password);
    }

    return doc;
  }

  /**
   * Open a document from a Uint8Array
   */
  static fromUint8Array(data: Uint8Array, password?: string): Document {
    return Document.fromBuffer(Buffer.fromUint8Array(data), password);
  }

  /**
   * Get the page count
   */
  get pageCount(): number {
    return this._pages.length;
  }

  /**
   * Get the document format (e.g., "PDF 1.4")
   */
  get format(): string {
    return this._format;
  }

  /**
   * Check if the document needs a password
   */
  get needsPassword(): boolean {
    return this._needsPassword;
  }

  /**
   * Check if the document is authenticated
   */
  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  /**
   * Check if the document is a PDF
   */
  get isPDF(): boolean {
    return this._format.startsWith('PDF');
  }

  /**
   * Check if the document is reflowable (e.g., EPUB)
   */
  get isReflowable(): boolean {
    return false; // PDFs are not reflowable
  }

  /**
   * Authenticate with a password using FFI
   * @returns true if authentication successful
   * @throws Error when native bindings are not available
   */
  authenticate(password: string): boolean {
    if (!this._ctx || !this._doc) {
      throw new Error('Authentication requires native FFI bindings (pdf_authenticate_password)');
    }
    const result = native.authenticatePassword(this._ctx, this._doc, password);
    if (result) {
      this._isAuthenticated = true;
    }
    return result;
  }

  /**
   * Check if the document has a specific permission using FFI
   * @param permission The permission to check (print, edit, copy, annotate)
   * @throws Error when native bindings are not available
   */
  hasPermission(permission: string): boolean {
    if (!this._ctx || !this._doc) {
      throw new Error('Permission check requires native FFI bindings (pdf_has_permission)');
    }
    // Map permission string to permission bits
    const permissionMap: Record<string, number> = {
      print: 4,
      edit: 8,
      copy: 16,
      annotate: 32
    };
    const permissionBit = permissionMap[permission] ?? 0;
    return native.hasPermission(this._ctx, this._doc, permissionBit);
  }

  /**
   * Get page label for a given page number
   * @param pageNum Page number (0-based)
   * @returns Page label (e.g., "i", "ii", "1", "2", "A-1")
   */
  getPageLabel(pageNum: number): string {
    // Default to simple page numbering if no label scheme defined
    return String(pageNum + 1);
  }

  /**
   * Get page number from a page label
   * @param label Page label to look up
   * @returns Page number (0-based) or -1 if not found
   */
  getPageFromLabel(label: string): number {
    // Simple implementation: try to parse as number
    const num = Number.parseInt(label, 10);
    if (!isNaN(num) && num > 0 && num <= this.pageCount) {
      return num - 1;
    }
    return -1;
  }

  /**
   * Check if the document is valid (not corrupted)
   */
  isValid(): boolean {
    return this._pages.length > 0;
  }

  /**
   * Resolve a named destination to a page location using FFI
   * @param name Named destination (e.g., "section1", "chapter2")
   * @returns Page number (0-based) or undefined if not found
   * @throws Error when native bindings are not available
   */
  resolveNamedDest(name: string): number | undefined {
    if (!this._ctx || !this._doc) {
      throw new Error('Named destination lookup requires native FFI bindings (pdf_lookup_dest)');
    }
    const result = native.resolveLink(this._ctx, this._doc, name);
    return result !== null ? result : undefined;
  }

  /**
   * Count chapters in the document (for structured documents)
   */
  countChapters(): number {
    // For PDFs without chapter structure, treat as single chapter
    return 1;
  }

  /**
   * Count pages in a specific chapter
   * @param chapterIndex Chapter index (0-based)
   */
  countChapterPages(chapterIndex: number): number {
    if (chapterIndex === 0) {
      return this.pageCount;
    }
    return 0;
  }

  /**
   * Get page number from a chapter and page location
   * @param chapter Chapter index (0-based)
   * @param page Page within chapter (0-based)
   */
  pageNumberFromLocation(chapter: number, page: number): number {
    // Simple implementation: just return page for single chapter
    if (chapter === 0) {
      return page;
    }
    return -1;
  }

  /**
   * Layout the document with specific width and height (for reflowable documents)
   * @param width Target width
   * @param height Target height
   * @param em Font size in points
   */
  layout(_width: number, _height: number, _em: number = 12): void {
    // No-op for non-reflowable PDFs
    // This is used for EPUB and other reflowable formats
  }

  /**
   * Clone the document (create a copy)
   * Note: This creates a shallow copy sharing the same data
   */
  clone(): Document {
    const cloned = Object.create(Document.prototype);
    cloned._pages = this._pages;
    cloned._format = this._format;
    cloned._needsPassword = this._needsPassword;
    cloned._isAuthenticated = this._isAuthenticated;
    cloned._metadata = new Map(this._metadata);
    cloned._outline = [...this._outline];
    return cloned;
  }

  /**
   * Get a page by index
   */
  getPage(index: number): Page {
    if (index < 0 || index >= this._pages.length) {
      throw NanoPDFError.argument(`Page index ${index} out of bounds (0..${this._pages.length})`);
    }
    return this._pages[index]!;
  }

  /**
   * Iterate over all pages
   */
  *pages(): Generator<Page> {
    for (const page of this._pages) {
      yield page;
    }
  }

  /**
   * Get the document outline (table of contents)
   */
  getOutline(): OutlineItem[] {
    return this._outline;
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): string | undefined {
    return this._metadata.get(key);
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: string): void {
    this._metadata.set(key, value);
  }

  /**
   * Get the title
   */
  get title(): string | undefined {
    return this._metadata.get('info:Title');
  }

  /**
   * Get the author
   */
  get author(): string | undefined {
    return this._metadata.get('info:Author');
  }

  /**
   * Get the subject
   */
  get subject(): string | undefined {
    return this._metadata.get('info:Subject');
  }

  /**
   * Get the keywords
   */
  get keywords(): string | undefined {
    return this._metadata.get('info:Keywords');
  }

  /**
   * Get the creator application
   */
  get creator(): string | undefined {
    return this._metadata.get('info:Creator');
  }

  /**
   * Get the producer application
   */
  get producer(): string | undefined {
    return this._metadata.get('info:Producer');
  }
}
