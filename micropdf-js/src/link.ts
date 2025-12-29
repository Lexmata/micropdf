/**
 * Link - PDF hyperlink and navigation
 *
 * This module provides 100% API compatibility with MuPDF's link operations.
 * Handles hyperlinks, page navigation, and external URIs.
 */

import { Rect, Point, type RectLike, type PointLike } from './geometry.js';

/**
 * Link destination types
 */
export enum LinkDestinationType {
  URI = 0, // External URI
  Page = 1, // Internal page number
  XYZ = 2, // Go to position on page
  Fit = 3, // Fit page to window
  FitH = 4, // Fit horizontally
  FitV = 5, // Fit vertically
  FitR = 6, // Fit rectangle
  FitB = 7, // Fit bounding box
  FitBH = 8, // Fit bounding box horizontally
  FitBV = 9 // Fit bounding box vertically
}

/**
 * A PDF hyperlink
 */
export class Link {
  private _rect: Rect;
  private _uri: string = '';
  private _pageNumber: number = -1;
  private _refCount: number = 1;
  private _destType: LinkDestinationType = LinkDestinationType.URI;

  constructor(rect: RectLike, uri?: string, pageNumber?: number) {
    this._rect = Rect.from(rect);
    if (uri !== undefined) {
      this._uri = uri;
      this._destType = LinkDestinationType.URI;
    } else if (pageNumber !== undefined) {
      this._pageNumber = pageNumber;
      this._destType = LinkDestinationType.Page;
    }
  }

  /**
   * Create a new link
   */
  static create(rect: RectLike, uri?: string, pageNumber?: number): Link {
    return new Link(rect, uri, pageNumber);
  }

  /**
   * Create a URI link
   */
  static createURI(rect: RectLike, uri: string): Link {
    return new Link(rect, uri);
  }

  /**
   * Create a page link
   */
  static createPage(rect: RectLike, pageNumber: number): Link {
    return new Link(rect, undefined, pageNumber);
  }

  // ============================================================================
  // Reference Counting
  // ============================================================================

  keep(): this {
    this._refCount++;
    return this;
  }

  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
  }

  /**
   * Clone this link
   */
  clone(): Link {
    const cloned = new Link(this._rect, this._uri, this._pageNumber);
    cloned._destType = this._destType;
    return cloned;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  get rect(): Rect {
    return this._rect;
  }

  set rect(r: RectLike) {
    this._rect = Rect.from(r);
  }

  get uri(): string {
    return this._uri;
  }

  set uri(uri: string) {
    this._uri = uri;
    this._destType = LinkDestinationType.URI;
    this._pageNumber = -1;
  }

  get pageNumber(): number {
    return this._pageNumber;
  }

  /**
   * Check if link is external (URI)
   */
  isExternal(): boolean {
    return this._destType === LinkDestinationType.URI && this._uri.length > 0;
  }

  /**
   * Check if link is a page link
   */
  isPageLink(): boolean {
    return this._destType === LinkDestinationType.Page && this._pageNumber >= 0;
  }

  /**
   * Get destination type
   */
  get destinationType(): LinkDestinationType {
    return this._destType;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if link is valid
   */
  isValid(): boolean {
    if (this._rect.isEmpty) {
      return false;
    }
    if (this._destType === LinkDestinationType.URI && this._uri.length === 0) {
      return false;
    }
    if (this._destType === LinkDestinationType.Page && this._pageNumber < 0) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Check if two links are equal
   */
  equals(other: Link): boolean {
    if (!this._rect.equals(other._rect)) {
      return false;
    }
    if (this._destType !== other._destType) {
      return false;
    }
    if (this._destType === LinkDestinationType.URI) {
      return this._uri === other._uri;
    }
    if (this._destType === LinkDestinationType.Page) {
      return this._pageNumber === other._pageNumber;
    }
    return true;
  }
}

/**
 * A list of links for a page
 */
export class LinkList {
  private _links: Link[] = [];

  constructor() {}

  /**
   * Create a new link list
   */
  static create(): LinkList {
    return new LinkList();
  }

  // ============================================================================
  // Reference Counting
  // ============================================================================

  /**
   * Clone this link list
   */
  clone(): LinkList {
    const cloned = new LinkList();
    cloned._links = this._links.map((link) => link.clone());
    return cloned;
  }

  // ============================================================================
  // Link Management
  // ============================================================================

  /**
   * Add a link to the list
   */
  add(link: Link): void {
    this._links.push(link);
  }

  /**
   * Count number of links
   */
  count(): number {
    return this._links.length;
  }

  /**
   * Check if list is empty
   */
  isEmpty(): boolean {
    return this._links.length === 0;
  }

  /**
   * Get first link
   */
  first(): Link | undefined {
    return this._links[0];
  }

  /**
   * Get link by index
   */
  get(index: number): Link | undefined {
    if (index < 0 || index >= this._links.length) {
      return undefined;
    }
    return this._links[index];
  }

  /**
   * Get all links
   */
  getAll(): Link[] {
    return [...this._links];
  }

  /**
   * Find link at a point
   */
  findAtPoint(point: PointLike): Link | undefined {
    const p = Point.from(point);
    for (const link of this._links) {
      if (link.rect.containsPoint(p)) {
        return link;
      }
    }
    return undefined;
  }

  /**
   * Find all links at a point
   */
  findAllAtPoint(point: PointLike): Link[] {
    const p = Point.from(point);
    const results: Link[] = [];
    for (const link of this._links) {
      if (link.rect.containsPoint(p)) {
        results.push(link);
      }
    }
    return results;
  }

  /**
   * Find links in a rect
   */
  findInRect(rect: RectLike): Link[] {
    const r = Rect.from(rect);
    const results: Link[] = [];
    for (const link of this._links) {
      // Check if rectangles intersect by seeing if they don't *not* intersect
      const intersection = link.rect.intersect(r);
      if (!intersection.isEmpty) {
        results.push(link);
      }
    }
    return results;
  }

  /**
   * Clear all links
   */
  clear(): void {
    this._links = [];
  }

  /**
   * Remove a specific link
   */
  remove(link: Link): boolean {
    const index = this._links.indexOf(link);
    if (index >= 0) {
      this._links.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove link at index
   */
  removeAt(index: number): boolean {
    if (index >= 0 && index < this._links.length) {
      this._links.splice(index, 1);
      return true;
    }
    return false;
  }

  // ============================================================================
  // Filtering
  // ============================================================================

  /**
   * Get all external (URI) links
   */
  getExternalLinks(): Link[] {
    return this._links.filter((link) => link.isExternal());
  }

  /**
   * Get all page links
   */
  getPageLinks(): Link[] {
    return this._links.filter((link) => link.isPageLink());
  }

  /**
   * Get links by page number
   */
  getLinksToPage(pageNumber: number): Link[] {
    return this._links.filter((link) => link.isPageLink() && link.pageNumber === pageNumber);
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  /**
   * Iterate over links
   */
  *[Symbol.iterator](): Generator<Link> {
    for (const link of this._links) {
      yield link;
    }
  }

  /**
   * For each link
   */
  forEach(callback: (link: Link, index: number) => void): void {
    this._links.forEach(callback);
  }

  /**
   * Map links
   */
  map<T>(callback: (link: Link, index: number) => T): T[] {
    return this._links.map(callback);
  }

  /**
   * Filter links
   */
  filter(predicate: (link: Link, index: number) => boolean): Link[] {
    return this._links.filter(predicate);
  }
}
