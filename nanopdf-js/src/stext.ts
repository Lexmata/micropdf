/**
 * Structured Text Extraction
 *
 * Provides layout-aware text extraction from PDF pages.
 * Organizes text into a hierarchy: Page → Block → Line → Char
 */

import type { Page } from './document.js';
import { Rect } from './geometry.js';
import { native_addon } from './native.js';

/**
 * Quad - four-corner bounding box for rotated text
 */
export interface Quad {
  /** Upper-left corner */
  ul: { x: number; y: number };
  /** Upper-right corner */
  ur: { x: number; y: number };
  /** Lower-left corner */
  ll: { x: number; y: number };
  /** Lower-right corner */
  lr: { x: number; y: number };
}

/**
 * Text block type
 */
export enum STextBlockType {
  /** Regular text block */
  Text = 0,
  /** Image block */
  Image = 1,
  /** List item */
  List = 2,
  /** Table cell */
  Table = 3
}

/**
 * Writing mode for text lines
 */
export enum WritingMode {
  /** Horizontal left-to-right */
  HorizontalLtr = 0,
  /** Horizontal right-to-left */
  HorizontalRtl = 1,
  /** Vertical top-to-bottom */
  VerticalTtb = 2,
  /** Vertical bottom-to-top */
  VerticalBtt = 3
}

/**
 * Structured text character
 */
export interface STextCharData {
  /** Unicode character */
  c: string;
  /** Character quad (4 corners) */
  quad: Quad;
  /** Font size */
  size: number;
  /** Font name */
  fontName: string;
}

/**
 * Structured text line
 */
export interface STextLineData {
  /** Writing mode */
  wmode: WritingMode;
  /** Bounding box */
  bbox: Rect;
  /** Baseline coordinate */
  baseline: number;
  /** Text direction */
  dir: { x: number; y: number };
  /** Characters in this line */
  chars: STextCharData[];
}

/**
 * Structured text block
 */
export interface STextBlockData {
  /** Block type */
  blockType: STextBlockType;
  /** Bounding box */
  bbox: Rect;
  /** Lines in this block */
  lines: STextLineData[];
}

/**
 * Structured Text Page
 *
 * Represents extracted text from a PDF page with layout information.
 * Provides hierarchical access to blocks, lines, and characters.
 *
 * @example
 * ```typescript
 * const doc = Document.open('document.pdf');
 * const page = doc.loadPage(0);
 * const stext = STextPage.fromPage(page);
 *
 * // Get all text
 * console.log(stext.getText());
 *
 * // Search for text
 * const hits = stext.search('keyword');
 * console.log(`Found ${hits.length} matches`);
 *
 * stext.drop();
 * page.drop();
 * doc.close();
 * ```
 */
export class STextPage {
  private _ctx: bigint;
  private _handle: bigint;
  private _dropped = false;

  private constructor(ctx: bigint, handle: bigint) {
    this._ctx = ctx;
    this._handle = handle;
  }

  /**
   * Create a structured text page from a document page
   *
   * @param page - The page to extract text from
   * @returns A new STextPage instance
   *
   * @example
   * ```typescript
   * const stext = STextPage.fromPage(page);
   * ```
   */
  static fromPage(page: Page): STextPage {
    // Access internal page state for FFI call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageAny = page as any;
    const ctx = pageAny._ctx as bigint;
    const pageHandle = pageAny._handle as bigint;

    const handle = native_addon.newSTextPage(ctx, pageHandle);
    return new STextPage(ctx, handle);
  }

  /**
   * Get all text as a single string
   *
   * @returns Plain text content
   *
   * @example
   * ```typescript
   * const text = stext.getText();
   * console.log(text);
   * ```
   */
  getText(): string {
    this._checkDropped();
    return native_addon.getSTextAsText(this._ctx, this._handle);
  }

  /**
   * Search for text in the page
   *
   * @param needle - The text to search for
   * @param maxHits - Maximum number of hits to return (default: 500)
   * @returns Array of quads (bounding boxes) for matches
   *
   * @example
   * ```typescript
   * const hits = stext.search('important');
   * for (const hit of hits) {
   *   console.log('Found at:', hit);
   * }
   * ```
   */
  search(needle: string, maxHits = 500): Quad[] {
    this._checkDropped();
    return native_addon.searchSTextPage(this._ctx, this._handle, needle, maxHits);
  }

  /**
   * Get the page bounds
   *
   * @returns Rectangle representing the page bounds
   *
   * @example
   * ```typescript
   * const bounds = stext.getBounds();
   * console.log(`Page size: ${bounds.width} x ${bounds.height}`);
   * ```
   */
  getBounds(): Rect {
    this._checkDropped();
    const rect = native_addon.getSTextPageBounds(this._ctx, this._handle);
    return new Rect(rect.x0, rect.y0, rect.x1, rect.y1);
  }

  /**
   * Drop (free) the structured text page
   *
   * Must be called when done to free resources.
   *
   * @example
   * ```typescript
   * const stext = STextPage.fromPage(page);
   * // ... use stext ...
   * stext.drop();
   * ```
   */
  drop(): void {
    if (!this._dropped) {
      native_addon.dropSTextPage(this._ctx, this._handle);
      this._dropped = true;
    }
  }

  /**
   * Check if the structured text page has been dropped
   *
   * @returns true if dropped, false otherwise
   */
  isDropped(): boolean {
    return this._dropped;
  }

  /**
   * Get blocks from the page
   *
   * Returns the hierarchical structure of text blocks, lines, and characters.
   * Note: This requires full FFI implementation. For now, returns simplified structure.
   *
   * @returns Array of text blocks
   *
   * @example
   * ```typescript
   * const blocks = stext.getBlocks();
   * for (const block of blocks) {
   *   console.log(`Block type: ${block.blockType}`);
   *   for (const line of block.lines) {
   *     console.log(`  Line: ${line.chars.map(c => c.c).join('')}`);
   *   }
   * }
   * ```
   */
  getBlocks(): STextBlockData[] {
    this._checkDropped();

    // TODO: Implement native FFI for block/line/char access
    // For now, provide a simplified version using getText()
    const text = this.getText();
    const bounds = this.getBounds();

    // Create a single text block with the full text
    const lines = text.split('\n').map((lineText, lineIndex) => {
      const lineHeight = bounds.height / Math.max(1, text.split('\n').length);
      const lineY = bounds.y0 + lineIndex * lineHeight;

      const chars: STextCharData[] = [...lineText].map((char, charIndex) => ({
        c: char,
        quad: {
          ul: { x: bounds.x0 + charIndex * 10, y: lineY },
          ur: { x: bounds.x0 + (charIndex + 1) * 10, y: lineY },
          ll: { x: bounds.x0 + charIndex * 10, y: lineY + lineHeight },
          lr: { x: bounds.x0 + (charIndex + 1) * 10, y: lineY + lineHeight }
        },
        size: 12,
        fontName: 'Unknown'
      }));

      return {
        wmode: WritingMode.HorizontalLtr,
        bbox: new Rect(bounds.x0, lineY, bounds.x1, lineY + lineHeight),
        baseline: lineY + lineHeight * 0.8,
        dir: { x: 1, y: 0 },
        chars
      };
    });

    return [
      {
        blockType: STextBlockType.Text,
        bbox: bounds,
        lines
      }
    ];
  }

  /**
   * Get the number of blocks on the page
   *
   * @returns Number of blocks
   *
   * @example
   * ```typescript
   * const count = stext.blockCount();
   * console.log(`Page has ${count} blocks`);
   * ```
   */
  blockCount(): number {
    this._checkDropped();
    return this.getBlocks().length;
  }

  /**
   * Get the number of characters on the page
   *
   * @returns Total character count
   *
   * @example
   * ```typescript
   * const count = stext.charCount();
   * console.log(`Page has ${count} characters`);
   * ```
   */
  charCount(): number {
    this._checkDropped();
    return this.getText().length;
  }

  /**
   * Get blocks of a specific type
   *
   * @param blockType - The block type to filter by
   * @returns Array of blocks matching the type
   *
   * @example
   * ```typescript
   * const textBlocks = stext.getBlocksOfType(STextBlockType.Text);
   * const imageBlocks = stext.getBlocksOfType(STextBlockType.Image);
   * ```
   */
  getBlocksOfType(blockType: STextBlockType): STextBlockData[] {
    this._checkDropped();
    return this.getBlocks().filter((block) => block.blockType === blockType);
  }

  /**
   * Get the native handle (for advanced use)
   *
   * @internal
   */
  get handle(): bigint {
    return this._handle;
  }

  private _checkDropped(): void {
    if (this._dropped) {
      throw new Error('STextPage has been dropped');
    }
  }
}

/**
 * Convert a quad to a rectangle (axis-aligned bounding box)
 *
 * @param quad - The quad to convert
 * @returns Rectangle enclosing the quad
 *
 * @example
 * ```typescript
 * const hits = stext.search('text');
 * const rect = quadToRect(hits[0]);
 * ```
 */
export function quadToRect(quad: Quad): Rect {
  const minX = Math.min(quad.ul.x, quad.ur.x, quad.ll.x, quad.lr.x);
  const minY = Math.min(quad.ul.y, quad.ur.y, quad.ll.y, quad.lr.y);
  const maxX = Math.max(quad.ul.x, quad.ur.x, quad.ll.x, quad.lr.x);
  const maxY = Math.max(quad.ul.y, quad.ur.y, quad.ll.y, quad.lr.y);

  return new Rect(minX, minY, maxX, maxY);
}

/**
 * Check if two quads overlap
 *
 * @param q1 - First quad
 * @param q2 - Second quad
 * @returns true if quads overlap, false otherwise
 */
export function quadsOverlap(q1: Quad, q2: Quad): boolean {
  const r1 = quadToRect(q1);
  const r2 = quadToRect(q2);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return r1.intersects(r2);
}
