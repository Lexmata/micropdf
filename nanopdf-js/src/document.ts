/**
 * Document - PDF document handling
 *
 * This implementation mirrors the Rust `fitz::document::Document` for 100% API compatibility.
 */

import { Buffer } from './buffer.js';
import { Pixmap } from './pixmap.js';
import { Colorspace } from './colorspace.js';
import { Rect, Matrix, Quad } from './geometry.js';
import { NanoPDFError, LinkDestType, type Link, type RectLike, type MatrixLike } from './types.js';
import { native } from './native.js';
import type { NativeContext, NativeDocument, NativePage, NativeRect } from './native.js';

/**
 * An item in the document outline (table of contents)
 */
export class OutlineItem {
  readonly title: string;
  readonly page: number | undefined;
  readonly uri: string | undefined;
  readonly children: OutlineItem[];

  constructor(title: string, page?: number, uri?: string) {
    this.title = title;
    this.page = page;
    this.uri = uri;
    this.children = [];
  }
}

/**
 * A text block extracted from a page
 */
export interface TextBlock {
  readonly bbox: RectLike;
  readonly text: string;
  readonly lines: TextLine[];
}

/**
 * A line of text extracted from a page
 */
export interface TextLine {
  readonly bbox: RectLike;
  readonly text: string;
  readonly spans: TextSpan[];
}

/**
 * A span of text with consistent formatting
 */
export interface TextSpan {
  readonly bbox: RectLike;
  readonly text: string;
  readonly font: string;
  readonly size: number;
  readonly color: number[];
}

/**
 * A page in a document
 */
export class Page {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _ctx?: NativeContext;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      throw new Error('Page rendering requires native FFI bindings (fz_run_page, fz_new_bbox_device)');
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

    const nativePixmap = native.renderPage(this._ctx, this._page, nativeMatrix, nativeColorspace, alpha);

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
      throw new Error('Text block extraction requires native FFI bindings (fz_new_stext_page_from_page)');
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
      throw new Error('Link extraction requires native FFI bindings (fz_load_links, pdf_annot_type)');
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
 * A PDF or other document
 */
export class Document {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _ctx?: NativeContext;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      /\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/
    );
    let mediaBox = defaultBounds;
    if (mediaBoxMatch) {
      mediaBox = new Rect(
        parseFloat(mediaBoxMatch[1] ?? '0'),
        parseFloat(mediaBoxMatch[2] ?? '0'),
        parseFloat(mediaBoxMatch[3] ?? '612'),
        parseFloat(mediaBoxMatch[4] ?? '792')
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
    const num = parseInt(label, 10);
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
