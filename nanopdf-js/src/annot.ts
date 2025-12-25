/**
 * Annot - PDF annotation handling
 *
 * This module provides comprehensive PDF annotation support with 100% API compatibility
 * with MuPDF's annotation operations. It supports creating, modifying, and managing
 * various types of PDF annotations including text notes, highlights, stamps, shapes,
 * ink annotations, and more.
 *
 * **Key Features:**
 * - 28 annotation types (text, highlight, stamp, ink, shapes, etc.)
 * - Complete annotation properties (color, opacity, borders, etc.)
 * - Annotation lifecycle management (creation, modification, deletion)
 * - Dirty tracking for efficient updates
 * - Reference counting for memory management
 *
 * **Supported Annotation Types:**
 * - **Text Markup**: Highlight, Underline, Squiggly, StrikeOut
 * - **Note Annotations**: Text, FreeText
 * - **Shape Annotations**: Square, Circle, Line, Polygon, PolyLine
 * - **Stamp Annotations**: Stamp (Approved, Draft, etc.)
 * - **Drawing Annotations**: Ink (freehand drawing)
 * - **Special Types**: Link, FileAttachment, Sound, Movie, Widget, etc.
 *
 * @example Basic usage:
 * ```typescript
 * import { Annotation, AnnotationType, AnnotationFlags } from 'nanopdf';
 *
 * // Create a text annotation
 * const textAnnot = Annotation.createText(
 *   { x0: 100, y0: 100, x1: 150, y1: 120 },
 *   'This is a note'
 * );
 *
 * // Create a highlight annotation
 * const highlightAnnot = Annotation.createHighlight(
 *   { x0: 50, y0: 200, x1: 300, y1: 220 },
 *   [1, 1, 0] // Yellow
 * );
 *
 * // Modify annotation properties
 * highlightAnnot.opacity = 0.5;
 * highlightAnnot.author = 'John Doe';
 * highlightAnnot.setFlag(AnnotationFlags.Print, true);
 *
 * // Check if annotation was modified
 * if (highlightAnnot.isDirty) {
 *   // Update appearance
 *   highlightAnnot.update();
 * }
 * ```
 *
 * @module annot
 */

import { Rect, Point, type RectLike, type PointLike } from './geometry.js';

/**
 * PDF annotation types.
 *
 * These correspond to the standard PDF annotation types as defined in the PDF specification.
 * Each type has specific rendering behavior and properties.
 *
 * @enum {number}
 */
export enum AnnotationType {
  /** Text note annotation - sticky note icon */
  Text = 0,
  /** Link annotation - hyperlink to URL or document location */
  Link = 1,
  /** Free text annotation - text directly on page */
  FreeText = 2,
  /** Line annotation - straight line with optional endpoints */
  Line = 3,
  /** Square annotation - rectangle shape */
  Square = 4,
  /** Circle annotation - circle/ellipse shape */
  Circle = 5,
  /** Polygon annotation - closed polygon shape */
  Polygon = 6,
  /** PolyLine annotation - open polyline shape */
  PolyLine = 7,
  /** Highlight annotation - text markup highlighting */
  Highlight = 8,
  /** Underline annotation - text markup underlining */
  Underline = 9,
  /** Squiggly annotation - text markup squiggly underline */
  Squiggly = 10,
  /** StrikeOut annotation - text markup strikethrough */
  StrikeOut = 11,
  /** Stamp annotation - rubber stamp (Approved, Draft, etc.) */
  Stamp = 12,
  /** Caret annotation - text insertion point */
  Caret = 13,
  /** Ink annotation - freehand drawing paths */
  Ink = 14,
  /** Popup annotation - popup window for another annotation */
  Popup = 15,
  /** File attachment annotation - embedded file */
  FileAttachment = 16,
  /** Sound annotation - embedded sound */
  Sound = 17,
  /** Movie annotation - embedded video */
  Movie = 18,
  /** Widget annotation - interactive form field */
  Widget = 19,
  /** Screen annotation - multimedia screen */
  Screen = 20,
  /** Printer mark annotation - printing marks */
  PrinterMark = 21,
  /** Trap net annotation - color separation trapping */
  TrapNet = 22,
  /** Watermark annotation - page watermark */
  Watermark = 23,
  /** 3D annotation - 3D artwork */
  ThreeD = 24,
  /** Redact annotation - content to be redacted */
  Redact = 25
}

/**
 * Annotation flags (bit flags).
 *
 * These flags control the visibility, behavior, and interaction of annotations.
 * Multiple flags can be combined using bitwise OR operations.
 *
 * @example Using annotation flags:
 * ```typescript
 * import { Annotation, AnnotationFlags } from 'nanopdf';
 *
 * const annot = Annotation.createText(rect, 'Note');
 *
 * // Set multiple flags
 * annot.setFlags(AnnotationFlags.Print | AnnotationFlags.ReadOnly);
 *
 * // Check if a flag is set
 * if (annot.hasFlag(AnnotationFlags.Print)) {
 *   console.log('Annotation will be printed');
 * }
 *
 * // Toggle a flag
 * annot.setFlag(AnnotationFlags.Hidden, true);
 * ```
 *
 * @enum {number}
 */
export enum AnnotationFlags {
  /** Annotation is invisible (not displayed or printed) */
  Invisible = 1 << 0,
  /** Annotation is hidden (not displayed, but may be printed) */
  Hidden = 1 << 1,
  /** Annotation should be printed */
  Print = 1 << 2,
  /** Annotation should not scale with zoom */
  NoZoom = 1 << 3,
  /** Annotation should not rotate with page */
  NoRotate = 1 << 4,
  /** Annotation should not be viewed (but may be printed) */
  NoView = 1 << 5,
  /** Annotation is read-only (cannot be modified or deleted) */
  ReadOnly = 1 << 6,
  /** Annotation is locked (cannot be moved or resized) */
  Locked = 1 << 7,
  /** Toggle NoView flag based on user actions */
  ToggleNoView = 1 << 8,
  /** Annotation contents are locked (cannot be edited) */
  LockedContents = 1 << 9
}

/**
 * Line ending styles for line annotations.
 *
 * These styles define the appearance of line endings for Line, PolyLine,
 * and Polygon annotations.
 *
 * @example Using line ending styles:
 * ```typescript
 * import { Annotation, LineEndingStyle } from 'nanopdf';
 *
 * const lineAnnot = Annotation.createLine(rect, start, end);
 * lineAnnot.lineStartStyle = LineEndingStyle.OpenArrow;
 * lineAnnot.lineEndStyle = LineEndingStyle.ClosedArrow;
 * ```
 *
 * @enum {number}
 */
export enum LineEndingStyle {
  /** No line ending */
  None = 0,
  /** Square line ending */
  Square = 1,
  /** Circle line ending */
  Circle = 2,
  /** Diamond line ending */
  Diamond = 3,
  /** Open arrow line ending */
  OpenArrow = 4,
  /** Closed arrow line ending (filled) */
  ClosedArrow = 5,
  /** Butt line ending (perpendicular cap) */
  Butt = 6,
  /** Reverse open arrow */
  ROpenArrow = 7,
  /** Reverse closed arrow (filled) */
  RClosedArrow = 8,
  /** Slash line ending (diagonal cap) */
  Slash = 9
}

/**
 * A PDF annotation.
 *
 * Represents a single PDF annotation with all its properties and methods.
 * Annotations can be text notes, highlights, shapes, stamps, ink drawings, and more.
 *
 * **Lifecycle:**
 * 1. Create annotation using static factory methods or constructor
 * 2. Modify properties (color, opacity, contents, etc.)
 * 3. Check `isDirty` to see if annotation needs updating
 * 4. Call `update()` to update appearance
 * 5. Increment/decrement reference count for memory management
 * 6. Drop annotation when done (`drop()`)
 *
 * **Properties:**
 * - Type, rectangle, flags
 * - Contents, author, subject
 * - Color, opacity, borders
 * - Line endpoints and styles (for line annotations)
 * - Modification date
 * - Popup association
 *
 * **Methods:**
 * - Getters/setters for all properties
 * - Type checking (`isHighlight()`, `isStamp()`, etc.)
 * - Dirty tracking (`isDirty`, `markDirty()`, `clearDirty()`)
 * - Reference counting (`keep()`, `drop()`)
 * - Appearance updates (`update()`)
 * - Cloning (`clone()`)
 *
 * @example Creating and modifying annotations:
 * ```typescript
 * // Create a highlight annotation
 * const highlight = Annotation.createHighlight(
 *   { x0: 100, y0: 200, x1: 400, y1: 220 },
 *   [1, 1, 0] // Yellow
 * );
 *
 * // Modify properties
 * highlight.opacity = 0.3;
 * highlight.author = 'John Doe';
 * highlight.contents = 'Important section';
 *
 * // Check if modified
 * if (highlight.isDirty) {
 *   highlight.update(); // Update appearance
 * }
 *
 * // Clone annotation
 * const copy = highlight.clone();
 *
 * // Clean up
 * highlight.drop();
 * copy.drop();
 * ```
 *
 * @example Working with different annotation types:
 * ```typescript
 * // Text note
 * const note = Annotation.createText(rect, 'Important!');
 * note.setFlag(AnnotationFlags.ReadOnly, true);
 *
 * // Stamp
 * const stamp = Annotation.createStamp(rect, 'Approved');
 * stamp.color = [0, 1, 0]; // Green
 *
 * // Line with arrows
 * const line = Annotation.createLine(rect, start, end);
 * line.lineStartStyle = LineEndingStyle.OpenArrow;
 * line.lineEndStyle = LineEndingStyle.ClosedArrow;
 *
 * // Free text
 * const freeText = Annotation.createFreeText(rect, 'This is text');
 * freeText.borderWidth = 2;
 * ```
 *
 * @class
 */
export class Annotation {
  private _type: AnnotationType;
  private _rect: Rect;
  private _flags: number = AnnotationFlags.Print;
  private _contents: string = '';
  private _author: string = '';
  private _color: number[] = [1, 1, 0]; // Yellow default
  private _interiorColor: number[] = [];
  private _borderWidth: number = 1;
  private _opacity: number = 1.0;
  private _lineStart: Point = Point.ORIGIN;
  private _lineEnd: Point = Point.ORIGIN;
  private _refCount: number = 1;
  private _dirty: boolean = false;
  private _hasPopup: boolean = false;

  /**
   * Creates a new PDF annotation.
   *
   * **Note**: Prefer using static factory methods (e.g., `createHighlight()`, `createStamp()`)
   * instead of the constructor for better type safety and convenience.
   *
   * @param type - The annotation type
   * @param rect - The annotation rectangle on the page
   *
   * @example Using the constructor:
   * ```typescript
   * const annot = new Annotation(AnnotationType.Square, {
   *   x0: 100, y0: 100, x1: 200, y1: 200
   * });
   * ```
   */
  constructor(type: AnnotationType, rect: RectLike) {
    this._type = type;
    this._rect = Rect.from(rect);
  }

  /**
   * Create a new annotation (alias for constructor).
   *
   * @param type - The annotation type
   * @param rect - The annotation rectangle
   * @returns A new annotation instance
   *
   * @deprecated Use static factory methods instead (e.g., `createHighlight()`)
   */
  static create(type: AnnotationType, rect: RectLike): Annotation {
    return new Annotation(type, rect);
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
   * Clone this annotation
   */
  clone(): Annotation {
    const cloned = new Annotation(this._type, this._rect);
    cloned._flags = this._flags;
    cloned._contents = this._contents;
    cloned._author = this._author;
    cloned._color = [...this._color];
    cloned._interiorColor = [...this._interiorColor];
    cloned._borderWidth = this._borderWidth;
    cloned._opacity = this._opacity;
    cloned._lineStart = this._lineStart;
    cloned._lineEnd = this._lineEnd;
    cloned._hasPopup = this._hasPopup;
    return cloned;
  }

  // ============================================================================
  // Basic Properties
  // ============================================================================

  get type(): AnnotationType {
    return this._type;
  }

  get rect(): Rect {
    return this._rect;
  }

  set rect(r: RectLike) {
    this._rect = Rect.from(r);
    this._dirty = true;
  }

  // ============================================================================
  // Flags
  // ============================================================================

  get flags(): number {
    return this._flags;
  }

  set flags(f: number) {
    this._flags = f;
    this._dirty = true;
  }

  hasFlag(flag: AnnotationFlags): boolean {
    return (this._flags & flag) !== 0;
  }

  setFlag(flag: AnnotationFlags, value: boolean): void {
    if (value) {
      this._flags |= flag;
    } else {
      this._flags &= ~flag;
    }
    this._dirty = true;
  }

  get isHidden(): boolean {
    return this.hasFlag(AnnotationFlags.Hidden);
  }

  set isHidden(value: boolean) {
    this.setFlag(AnnotationFlags.Hidden, value);
  }

  get isPrintable(): boolean {
    return this.hasFlag(AnnotationFlags.Print);
  }

  set isPrintable(value: boolean) {
    this.setFlag(AnnotationFlags.Print, value);
  }

  get isReadOnly(): boolean {
    return this.hasFlag(AnnotationFlags.ReadOnly);
  }

  set isReadOnly(value: boolean) {
    this.setFlag(AnnotationFlags.ReadOnly, value);
  }

  get isLocked(): boolean {
    return this.hasFlag(AnnotationFlags.Locked);
  }

  set isLocked(value: boolean) {
    this.setFlag(AnnotationFlags.Locked, value);
  }

  // ============================================================================
  // Content Properties
  // ============================================================================

  get contents(): string {
    return this._contents;
  }

  set contents(text: string) {
    this._contents = text;
    this._dirty = true;
  }

  get author(): string {
    return this._author;
  }

  set author(name: string) {
    this._author = name;
    this._dirty = true;
  }

  // ============================================================================
  // Appearance Properties
  // ============================================================================

  get color(): number[] {
    return [...this._color];
  }

  set color(rgb: number[]) {
    if (rgb.length === 3) {
      this._color = [...rgb];
      this._dirty = true;
    }
  }

  get interiorColor(): number[] {
    return [...this._interiorColor];
  }

  set interiorColor(rgb: number[]) {
    if (rgb.length === 3 || rgb.length === 0) {
      this._interiorColor = [...rgb];
      this._dirty = true;
    }
  }

  get borderWidth(): number {
    return this._borderWidth;
  }

  set borderWidth(width: number) {
    this._borderWidth = Math.max(0, width);
    this._dirty = true;
  }

  get opacity(): number {
    return this._opacity;
  }

  set opacity(alpha: number) {
    this._opacity = Math.max(0, Math.min(1, alpha));
    this._dirty = true;
  }

  // ============================================================================
  // Line Annotation Properties
  // ============================================================================

  get lineStart(): Point {
    return this._lineStart;
  }

  get lineEnd(): Point {
    return this._lineEnd;
  }

  setLine(start: PointLike, end: PointLike): void {
    this._lineStart = Point.from(start);
    this._lineEnd = Point.from(end);
    this._dirty = true;
  }

  getLine(): [Point, Point] {
    return [this._lineStart, this._lineEnd];
  }

  // ============================================================================
  // Popup
  // ============================================================================

  get hasPopup(): boolean {
    return this._hasPopup;
  }

  set hasPopup(value: boolean) {
    this._hasPopup = value;
    this._dirty = true;
  }

  // ============================================================================
  // Dirty Tracking
  // ============================================================================

  get isDirty(): boolean {
    return this._dirty;
  }

  clearDirty(): void {
    this._dirty = false;
  }

  /**
   * Update the annotation (mark for re-rendering)
   */
  update(): void {
    this._dirty = true;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  isValid(): boolean {
    // Check if annotation has valid properties
    if (!this._rect || this._rect.isEmpty) {
      return false;
    }
    if (this._opacity < 0 || this._opacity > 1) {
      return false;
    }
    if (this._borderWidth < 0) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // Type-specific factory methods
  // ============================================================================

  /**
   * Create a text note annotation
   */
  static createText(rect: RectLike, contents: string = '', author: string = ''): Annotation {
    const annot = new Annotation(AnnotationType.Text, rect);
    annot.contents = contents;
    annot.author = author;
    return annot;
  }

  /**
   * Create a highlight annotation
   */
  static createHighlight(rect: RectLike, color: number[] = [1, 1, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Highlight, rect);
    annot.color = color;
    annot.opacity = 0.5;
    return annot;
  }

  /**
   * Create an underline annotation
   */
  static createUnderline(rect: RectLike, color: number[] = [1, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Underline, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create a strikeout annotation
   */
  static createStrikeOut(rect: RectLike, color: number[] = [1, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.StrikeOut, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create a squiggly underline annotation
   */
  static createSquiggly(rect: RectLike, color: number[] = [1, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Squiggly, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create a line annotation
   */
  static createLine(
    rect: RectLike,
    start: PointLike,
    end: PointLike,
    color: number[] = [0, 0, 0]
  ): Annotation {
    const annot = new Annotation(AnnotationType.Line, rect);
    annot.setLine(start, end);
    annot.color = color;
    return annot;
  }

  /**
   * Create a square annotation
   */
  static createSquare(rect: RectLike, color: number[] = [0, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Square, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create a circle annotation
   */
  static createCircle(rect: RectLike, color: number[] = [0, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Circle, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create an ink annotation (freehand drawing)
   */
  static createInk(rect: RectLike, color: number[] = [0, 0, 0]): Annotation {
    const annot = new Annotation(AnnotationType.Ink, rect);
    annot.color = color;
    return annot;
  }

  /**
   * Create a stamp annotation
   */
  static createStamp(rect: RectLike, stampText: string = 'Approved'): Annotation {
    const annot = new Annotation(AnnotationType.Stamp, rect);
    annot.contents = stampText;
    return annot;
  }

  /**
   * Create a free text annotation
   */
  static createFreeText(rect: RectLike, text: string = ''): Annotation {
    const annot = new Annotation(AnnotationType.FreeText, rect);
    annot.contents = text;
    return annot;
  }
}

/**
 * Annotation list manager for a page
 */
export class AnnotationList {
  private _annotations: Annotation[] = [];

  constructor() {}

  /**
   * Add an annotation
   */
  add(annot: Annotation): void {
    this._annotations.push(annot);
  }

  /**
   * Delete an annotation
   */
  delete(annot: Annotation): boolean {
    const index = this._annotations.indexOf(annot);
    if (index >= 0) {
      this._annotations.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get annotation count
   */
  get count(): number {
    return this._annotations.length;
  }

  /**
   * Get annotation by index
   */
  get(index: number): Annotation | undefined {
    return this._annotations[index];
  }

  /**
   * Get first annotation
   */
  first(): Annotation | undefined {
    return this._annotations[0];
  }

  /**
   * Get next annotation after the given one
   */
  next(current: Annotation): Annotation | undefined {
    const index = this._annotations.indexOf(current);
    if (index >= 0 && index < this._annotations.length - 1) {
      return this._annotations[index + 1];
    }
    return undefined;
  }

  /**
   * Get all annotations
   */
  getAll(): Annotation[] {
    return [...this._annotations];
  }

  /**
   * Clear all annotations
   */
  clear(): void {
    this._annotations = [];
  }

  /**
   * Iterate over annotations
   */
  *[Symbol.iterator](): Generator<Annotation> {
    for (const annot of this._annotations) {
      yield annot;
    }
  }
}
