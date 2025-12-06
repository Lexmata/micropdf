/**
 * Structured Text Extraction
 *
 * Provides layout-aware text extraction from PDF pages.
 * Organizes text into a hierarchy: Page → Block → Line → Char
 */

import { native_addon } from './native.js';
import type { Page } from './document.js';
import { Rect } from './geometry.js';

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
    // @ts-expect-error - Accessing private properties
    const ctx = page._ctx;
    // @ts-expect-error - Accessing private properties
    const pageHandle = page._handle;

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
  return r1.intersects(r2);
}

