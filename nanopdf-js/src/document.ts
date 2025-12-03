/**
 * Document - PDF document handling
 *
 * This implementation mirrors the Rust `fitz::document::Document` for 100% API compatibility.
 */

import { Buffer } from './buffer.js';
import { Pixmap } from './pixmap.js';
import { Colorspace } from './colorspace.js';
import { Rect, Matrix, Quad } from './geometry.js';
import { NanoPDFError, type Link, type RectLike, type MatrixLike } from './types.js';

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
   * Render the page to a pixmap
   */
  toPixmap(
    matrix: MatrixLike = Matrix.IDENTITY,
    colorspace: Colorspace = Colorspace.deviceRGB(),
    alpha: boolean = true
  ): Pixmap {
    // Calculate transformed bounds
    const m = Matrix.from(matrix);
    const transformedBounds = this._bounds.transform(m);

    const width = Math.ceil(transformedBounds.width);
    const height = Math.ceil(transformedBounds.height);

    // Create pixmap with appropriate size
    const pixmap = Pixmap.create(colorspace, width > 0 ? width : 1, height > 0 ? height : 1, alpha);
    pixmap.clearWithValue(255); // White background

    // TODO: Actual rendering requires content stream interpretation

    return pixmap;
  }

  /**
   * Render the page to PNG
   */
  toPNG(dpi: number = 72): Uint8Array {
    const scale = dpi / 72;
    const matrix = Matrix.scale(scale, scale);
    const pixmap = this.toPixmap(matrix, Colorspace.deviceRGB(), true);
    return pixmap.toPNG();
  }

  /**
   * Extract text from the page
   */
  getText(): string {
    // TODO: Text extraction requires content stream interpretation
    return '';
  }

  /**
   * Get text blocks from the page
   */
  getTextBlocks(): TextBlock[] {
    // TODO: Text extraction requires content stream interpretation
    return [];
  }

  /**
   * Get links from the page
   */
  getLinks(): Link[] {
    // TODO: Link extraction requires annotation parsing
    return [];
  }

  /**
   * Search for text on the page
   */
  search(_needle: string): Quad[] {
    // TODO: Text search requires content stream interpretation
    return [];
  }
}

/**
 * A PDF or other document
 */
export class Document {
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
    const mediaBoxMatch = content.match(/\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/);
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
   * Authenticate with a password
   */
  authenticate(_password: string): boolean {
    // TODO: Implement proper PDF authentication
    this._isAuthenticated = true;
    return true;
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

