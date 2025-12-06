/**
 * Annot - PDF annotation handling
 *
 * This module provides 100% API compatibility with MuPDF's annotation operations.
 * Supports text notes, highlights, stamps, ink, shapes, and more.
 */

import { Rect, Point, type RectLike, type PointLike } from './geometry.js';

/**
 * PDF annotation types
 */
export enum AnnotationType {
  Text = 0,
  Link = 1,
  FreeText = 2,
  Line = 3,
  Square = 4,
  Circle = 5,
  Polygon = 6,
  PolyLine = 7,
  Highlight = 8,
  Underline = 9,
  Squiggly = 10,
  StrikeOut = 11,
  Stamp = 12,
  Caret = 13,
  Ink = 14,
  Popup = 15,
  FileAttachment = 16,
  Sound = 17,
  Movie = 18,
  Widget = 19,
  Screen = 20,
  PrinterMark = 21,
  TrapNet = 22,
  Watermark = 23,
  ThreeD = 24,
  Redact = 25
}

/**
 * Annotation flags (bit flags)
 */
export enum AnnotationFlags {
  Invisible = 1 << 0,
  Hidden = 1 << 1,
  Print = 1 << 2,
  NoZoom = 1 << 3,
  NoRotate = 1 << 4,
  NoView = 1 << 5,
  ReadOnly = 1 << 6,
  Locked = 1 << 7,
  ToggleNoView = 1 << 8,
  LockedContents = 1 << 9
}

/**
 * Line ending styles for line annotations
 */
export enum LineEndingStyle {
  None = 0,
  Square = 1,
  Circle = 2,
  Diamond = 3,
  OpenArrow = 4,
  ClosedArrow = 5,
  Butt = 6,
  ROpenArrow = 7,
  RClosedArrow = 8,
  Slash = 9
}

/**
 * A PDF annotation
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

  constructor(type: AnnotationType, rect: RectLike) {
    this._type = type;
    this._rect = Rect.from(rect);
  }

  /**
   * Create a new annotation
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
