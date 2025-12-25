/**
 * Geometry primitives - Point, Rect, IRect, Matrix, Quad
 *
 * This module provides fundamental 2D geometry types used throughout the NanoPDF library.
 * All types are immutable and follow functional programming principles.
 *
 * This implementation mirrors the Rust `fitz::geometry` module for 100% API compatibility.
 *
 * @module geometry
 * @example
 * ```typescript
 * import { Point, Rect, Matrix } from 'nanopdf';
 *
 * // Create a point
 * const p = new Point(100, 200);
 *
 * // Create a rectangle
 * const rect = new Rect(0, 0, 100, 100);
 *
 * // Transform with a matrix
 * const matrix = Matrix.scale(2, 2);
 * const transformed = p.transform(matrix);
 * ```
 */

import type { PointLike, RectLike, IRectLike, MatrixLike, QuadLike } from './types.js';

// Re-export types
export type { PointLike, RectLike, IRectLike, MatrixLike, QuadLike };

/**
 * A 2D point with floating-point coordinates.
 *
 * Points are immutable - all operations return new Point instances rather than
 * modifying the existing point. This makes them safe to use in functional programming
 * contexts and prevents accidental mutations.
 *
 * @class Point
 * @implements {PointLike}
 * @example
 * ```typescript
 * // Create a point
 * const p1 = new Point(10, 20);
 *
 * // Transform it
 * const p2 = p1.scale(2); // Point(20, 40)
 *
 * // Calculate distance
 * const distance = p1.distanceTo(p2); // 22.36...
 *
 * // Points are immutable
 * const p3 = p1.add(new Point(5, 5)); // p1 is unchanged
 * ```
 */
export class Point implements PointLike {
  /**
   * The x-coordinate of the point.
   * @readonly
   * @type {number}
   */
  readonly x: number;

  /**
   * The y-coordinate of the point.
   * @readonly
   * @type {number}
   */
  readonly y: number;

  /**
   * Creates a new Point with the specified coordinates.
   *
   * @param {number} x - The x-coordinate
   * @param {number} y - The y-coordinate
   * @example
   * ```typescript
   * const point = new Point(100, 200);
   * console.log(point.x); // 100
   * console.log(point.y); // 200
   * ```
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // ============================================================================
  // Static Constants
  // ============================================================================

  /**
   * The origin point at coordinates (0, 0).
   *
   * This is a convenience constant for the most commonly used point.
   *
   * @static
   * @readonly
   * @type {Point}
   * @example
   * ```typescript
   * const origin = Point.ORIGIN;
   * console.log(origin.x, origin.y); // 0, 0
   * ```
   */
  static readonly ORIGIN = new Point(0, 0);

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /**
   * Creates a Point from a point-like object.
   *
   * This method accepts any object with `x` and `y` properties and converts it
   * to a proper Point instance. If the input is already a Point, it returns it unchanged.
   *
   * @static
   * @param {PointLike} p - A point-like object with x and y properties
   * @returns {Point} A Point instance
   * @example
   * ```typescript
   * // From a plain object
   * const p1 = Point.from({ x: 10, y: 20 });
   *
   * // From an existing Point (returns the same instance)
   * const p2 = new Point(10, 20);
   * const p3 = Point.from(p2); // p2 === p3
   * ```
   */
  static from(p: PointLike): Point {
    if (p instanceof Point) {
      return p;
    }
    return new Point(p.x, p.y);
  }

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Transforms this point by a transformation matrix.
   *
   * Applies a 2D affine transformation to the point. This is commonly used for
   * scaling, rotation, translation, and skewing operations.
   *
   * @param {MatrixLike} m - The transformation matrix to apply
   * @returns {Point} A new transformed point
   * @example
   * ```typescript
   * const p = new Point(10, 20);
   *
   * // Scale by 2x
   * const scaled = p.transform(Matrix.scale(2, 2));
   * console.log(scaled); // Point(20, 40)
   *
   * // Rotate 90 degrees
   * const rotated = p.transform(Matrix.rotate(90));
   * ```
   */
  transform(m: MatrixLike): Point {
    return new Point(this.x * m.a + this.y * m.c + m.e, this.x * m.b + this.y * m.d + m.f);
  }

  /**
   * Calculates the Euclidean distance to another point.
   *
   * Uses the Pythagorean theorem to compute the straight-line distance
   * between this point and another point in 2D space.
   *
   * @param {PointLike} other - The point to measure distance to
   * @returns {number} The distance in the same units as the coordinates
   * @example
   * ```typescript
   * const p1 = new Point(0, 0);
   * const p2 = new Point(3, 4);
   * const distance = p1.distanceTo(p2); // 5.0
   *
   * // Distance is symmetric
   * p2.distanceTo(p1) === p1.distanceTo(p2); // true
   * ```
   */
  distanceTo(other: PointLike): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Adds another point to this point (vector addition).
   *
   * Returns a new point whose coordinates are the sum of this point's
   * coordinates and the other point's coordinates.
   *
   * @param {PointLike} other - The point to add
   * @returns {Point} A new point with summed coordinates
   * @example
   * ```typescript
   * const p1 = new Point(10, 20);
   * const p2 = new Point(5, 10);
   * const sum = p1.add(p2);
   * console.log(sum); // Point(15, 30)
   * ```
   */
  add(other: PointLike): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtracts another point from this point (vector subtraction).
   *
   * Returns a new point whose coordinates are the difference between
   * this point's coordinates and the other point's coordinates.
   *
   * @param {PointLike} other - The point to subtract
   * @returns {Point} A new point with the difference
   * @example
   * ```typescript
   * const p1 = new Point(10, 20);
   * const p2 = new Point(5, 10);
   * const diff = p1.subtract(p2);
   * console.log(diff); // Point(5, 10)
   * ```
   */
  subtract(other: PointLike): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  /**
   * Scales this point by a factor (scalar multiplication).
   *
   * Multiplies both x and y coordinates by the given factor.
   *
   * @param {number} factor - The scaling factor
   * @returns {Point} A new scaled point
   * @example
   * ```typescript
   * const p = new Point(10, 20);
   * const doubled = p.scale(2); // Point(20, 40)
   * const halved = p.scale(0.5); // Point(5, 10)
   * const negated = p.scale(-1); // Point(-10, -20)
   * ```
   */
  scale(factor: number): Point {
    return new Point(this.x * factor, this.y * factor);
  }

  /**
   * Normalizes this point to unit length.
   *
   * Returns a point in the same direction but with length 1.0.
   * If the point is at the origin (length 0), returns the origin.
   *
   * @returns {Point} A normalized point with length 1.0 (or origin if length is 0)
   * @example
   * ```typescript
   * const p = new Point(3, 4);
   * const normalized = p.normalize();
   * console.log(normalized); // Point(0.6, 0.8)
   * console.log(normalized.length); // 1.0
   *
   * // Origin stays at origin
   * Point.ORIGIN.normalize(); // Point(0, 0)
   * ```
   */
  normalize(): Point {
    const len = Math.sqrt(this.x * this.x + this.y * this.y);
    if (len === 0) {
      return new Point(0, 0);
    }
    return new Point(this.x / len, this.y / len);
  }

  /**
   * Gets the length (magnitude) of this point when treated as a vector.
   *
   * Computes the Euclidean distance from the origin to this point.
   *
   * @readonly
   * @type {number}
   * @example
   * ```typescript
   * const p = new Point(3, 4);
   * console.log(p.length); // 5.0
   *
   * // Right triangle: 3² + 4² = 5²
   * ```
   */
  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Checks if this point is equal to another point.
   *
   * Two points are considered equal if both their x and y coordinates are exactly equal.
   * Note: This uses strict equality, so floating point precision issues may affect the result.
   *
   * @param {PointLike} other - The point to compare with
   * @returns {boolean} True if the points have identical coordinates
   * @example
   * ```typescript
   * const p1 = new Point(10, 20);
   * const p2 = new Point(10, 20);
   * const p3 = new Point(10, 21);
   *
   * p1.equals(p2); // true
   * p1.equals(p3); // false
   * ```
   */
  equals(other: PointLike): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Returns a string representation of the point.
   *
   * @returns {string} A string in the format "Point(x, y)"
   * @example
   * ```typescript
   * const p = new Point(10.5, 20.3);
   * console.log(p.toString()); // "Point(10.5, 20.3)"
   * console.log(String(p)); // "Point(10.5, 20.3)"
   * ```
   */
  toString(): string {
    return `Point(${this.x}, ${this.y})`;
  }
}

/**
 * A rectangle defined by two corner points (floating point)
 */
export class Rect implements RectLike {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }

  // ============================================================================
  // Static Constants
  // ============================================================================

  /** Empty rectangle */
  static readonly EMPTY = new Rect(Infinity, Infinity, -Infinity, -Infinity);

  /** Infinite rectangle */
  static readonly INFINITE = new Rect(-Infinity, -Infinity, Infinity, Infinity);

  /** Unit rectangle (0,0) to (1,1) */
  static readonly UNIT = new Rect(0, 0, 1, 1);

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /** Create a rect from a rect-like object */
  static from(r: RectLike): Rect {
    if (r instanceof Rect) {
      return r;
    }
    return new Rect(r.x0, r.y0, r.x1, r.y1);
  }

  /** Create a rect from position and size */
  static fromXYWH(x: number, y: number, width: number, height: number): Rect {
    return new Rect(x, y, x + width, y + height);
  }

  /** Create a rect from an IRect */
  static fromIRect(r: IRectLike): Rect {
    return new Rect(r.x0, r.y0, r.x1, r.y1);
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /** Width of the rectangle */
  get width(): number {
    return this.x1 - this.x0;
  }

  /** Height of the rectangle */
  get height(): number {
    return this.y1 - this.y0;
  }

  /** Check if the rectangle is empty */
  get isEmpty(): boolean {
    return this.x0 >= this.x1 || this.y0 >= this.y1;
  }

  /** Check if the rectangle is infinite */
  get isInfinite(): boolean {
    return this.x0 === -Infinity;
  }

  // ============================================================================
  // Methods
  // ============================================================================

  /** Check if a point is inside the rectangle */
  containsPoint(p: PointLike): boolean;
  containsPoint(x: number, y: number): boolean;
  containsPoint(xOrPoint: number | PointLike, y?: number): boolean {
    const px = typeof xOrPoint === 'number' ? xOrPoint : xOrPoint.x;
    const py = typeof xOrPoint === 'number' ? y! : xOrPoint.y;
    return px >= this.x0 && px < this.x1 && py >= this.y0 && py < this.y1;
  }

  /** Check if this rectangle contains another rectangle */
  containsRect(other: RectLike): boolean {
    return this.x0 <= other.x0 && this.y0 <= other.y0 && this.x1 >= other.x1 && this.y1 >= other.y1;
  }

  /** Union with another rectangle */
  union(other: RectLike): Rect {
    if (this.isEmpty) return Rect.from(other);
    if (other.x0 >= other.x1 || other.y0 >= other.y1) return this;
    return new Rect(
      Math.min(this.x0, other.x0),
      Math.min(this.y0, other.y0),
      Math.max(this.x1, other.x1),
      Math.max(this.y1, other.y1)
    );
  }

  /** Intersection with another rectangle */
  intersect(other: RectLike): Rect {
    const result = new Rect(
      Math.max(this.x0, other.x0),
      Math.max(this.y0, other.y0),
      Math.min(this.x1, other.x1),
      Math.min(this.y1, other.y1)
    );
    if (result.isEmpty) {
      return Rect.EMPTY;
    }
    return result;
  }

  /** Expand by including a point */
  includePoint(p: PointLike): Rect {
    return new Rect(
      Math.min(this.x0, p.x),
      Math.min(this.y0, p.y),
      Math.max(this.x1, p.x),
      Math.max(this.y1, p.y)
    );
  }

  /** Translate by offset */
  translate(dx: number, dy: number): Rect {
    return new Rect(this.x0 + dx, this.y0 + dy, this.x1 + dx, this.y1 + dy);
  }

  /** Scale by factor */
  scale(sx: number, sy: number = sx): Rect {
    return new Rect(this.x0 * sx, this.y0 * sy, this.x1 * sx, this.y1 * sy);
  }

  /** Transform by a matrix */
  transform(m: MatrixLike): Rect {
    if (this.isEmpty || this.isInfinite) {
      return this;
    }
    const p1 = new Point(this.x0, this.y0).transform(m);
    const p2 = new Point(this.x1, this.y0).transform(m);
    const p3 = new Point(this.x0, this.y1).transform(m);
    const p4 = new Point(this.x1, this.y1).transform(m);
    return new Rect(
      Math.min(p1.x, p2.x, p3.x, p4.x),
      Math.min(p1.y, p2.y, p3.y, p4.y),
      Math.max(p1.x, p2.x, p3.x, p4.x),
      Math.max(p1.y, p2.y, p3.y, p4.y)
    );
  }

  /** Normalize (ensure x0 <= x1 and y0 <= y1) */
  normalize(): Rect {
    return new Rect(
      Math.min(this.x0, this.x1),
      Math.min(this.y0, this.y1),
      Math.max(this.x0, this.x1),
      Math.max(this.y0, this.y1)
    );
  }

  /** Round to integer rectangle */
  round(): IRect {
    return new IRect(
      Math.floor(this.x0),
      Math.floor(this.y0),
      Math.ceil(this.x1),
      Math.ceil(this.y1)
    );
  }

  /** Check equality */
  equals(other: RectLike): boolean {
    return (
      this.x0 === other.x0 && this.y0 === other.y0 && this.x1 === other.x1 && this.y1 === other.y1
    );
  }

  toString(): string {
    return `Rect(${this.x0}, ${this.y0}, ${this.x1}, ${this.y1})`;
  }
}

/**
 * An integer rectangle defined by two corner points
 */
export class IRect implements IRectLike {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = Math.floor(x0);
    this.y0 = Math.floor(y0);
    this.x1 = Math.floor(x1);
    this.y1 = Math.floor(y1);
  }

  // ============================================================================
  // Static Constants
  // ============================================================================

  /** Empty integer rectangle */
  static readonly EMPTY = new IRect(0x7fffffff, 0x7fffffff, -0x80000000, -0x80000000);

  /** Infinite integer rectangle */
  static readonly INFINITE = new IRect(-0x80000000, -0x80000000, 0x7fffffff, 0x7fffffff);

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /** Create from a rect-like object */
  static from(r: IRectLike): IRect {
    if (r instanceof IRect) {
      return r;
    }
    return new IRect(r.x0, r.y0, r.x1, r.y1);
  }

  /** Create from a Rect by rounding */
  static fromRect(r: RectLike): IRect {
    return new IRect(Math.floor(r.x0), Math.floor(r.y0), Math.ceil(r.x1), Math.ceil(r.y1));
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /** Width */
  get width(): number {
    return this.x1 - this.x0;
  }

  /** Height */
  get height(): number {
    return this.y1 - this.y0;
  }

  /** Check if empty */
  get isEmpty(): boolean {
    return this.x0 >= this.x1 || this.y0 >= this.y1;
  }

  // ============================================================================
  // Methods
  // ============================================================================

  /** Union with another integer rectangle */
  union(other: IRectLike): IRect {
    if (this.isEmpty) return IRect.from(other);
    if (other.x0 >= other.x1 || other.y0 >= other.y1) return this;
    return new IRect(
      Math.min(this.x0, other.x0),
      Math.min(this.y0, other.y0),
      Math.max(this.x1, other.x1),
      Math.max(this.y1, other.y1)
    );
  }

  /** Intersection with another integer rectangle */
  intersect(other: IRectLike): IRect {
    const result = new IRect(
      Math.max(this.x0, other.x0),
      Math.max(this.y0, other.y0),
      Math.min(this.x1, other.x1),
      Math.min(this.y1, other.y1)
    );
    if (result.isEmpty) {
      return IRect.EMPTY;
    }
    return result;
  }

  /** Translate by offset */
  translate(dx: number, dy: number): IRect {
    return new IRect(this.x0 + dx, this.y0 + dy, this.x1 + dx, this.y1 + dy);
  }

  /** Convert to Rect */
  toRect(): Rect {
    return new Rect(this.x0, this.y0, this.x1, this.y1);
  }

  /** Check equality */
  equals(other: IRectLike): boolean {
    return (
      this.x0 === other.x0 && this.y0 === other.y0 && this.x1 === other.x1 && this.y1 === other.y1
    );
  }

  toString(): string {
    return `IRect(${this.x0}, ${this.y0}, ${this.x1}, ${this.y1})`;
  }
}

/**
 * A 2D transformation matrix (affine transform)
 */
export class Matrix implements MatrixLike {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;

  constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  // ============================================================================
  // Static Constants
  // ============================================================================

  /** Identity matrix */
  static readonly IDENTITY = new Matrix(1, 0, 0, 1, 0, 0);

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /** Create a matrix from a matrix-like object */
  static from(m: MatrixLike): Matrix {
    if (m instanceof Matrix) {
      return m;
    }
    return new Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  /** Create a translation matrix */
  static translate(tx: number, ty: number): Matrix {
    return new Matrix(1, 0, 0, 1, tx, ty);
  }

  /** Create a scaling matrix */
  static scale(sx: number, sy: number = sx): Matrix {
    return new Matrix(sx, 0, 0, sy, 0, 0);
  }

  /** Create a rotation matrix (degrees) */
  static rotate(degrees: number): Matrix {
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  }

  /** Create a shear matrix */
  static shear(sx: number, sy: number): Matrix {
    return new Matrix(1, sy, sx, 1, 0, 0);
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /** Check if this is the identity matrix */
  get isIdentity(): boolean {
    return (
      this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0
    );
  }

  /** Check if this is a rectilinear matrix (no rotation/shear) */
  get isRectilinear(): boolean {
    return (this.b === 0 && this.c === 0) || (this.a === 0 && this.d === 0);
  }

  // ============================================================================
  // Methods
  // ============================================================================

  /** Concatenate with another matrix */
  concat(other: MatrixLike): Matrix {
    return new Matrix(
      this.a * other.a + this.b * other.c,
      this.a * other.b + this.b * other.d,
      this.c * other.a + this.d * other.c,
      this.c * other.b + this.d * other.d,
      this.e * other.a + this.f * other.c + other.e,
      this.e * other.b + this.f * other.d + other.f
    );
  }

  /** Invert the matrix */
  invert(): Matrix | null {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-14) {
      return null;
    }
    const invDet = 1 / det;
    return new Matrix(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.f - this.d * this.e) * invDet,
      (this.b * this.e - this.a * this.f) * invDet
    );
  }

  /** Pre-translate this matrix */
  preTranslate(tx: number, ty: number): Matrix {
    return Matrix.translate(tx, ty).concat(this);
  }

  /** Post-translate this matrix */
  postTranslate(tx: number, ty: number): Matrix {
    return this.concat(Matrix.translate(tx, ty));
  }

  /** Pre-scale this matrix */
  preScale(sx: number, sy: number = sx): Matrix {
    return Matrix.scale(sx, sy).concat(this);
  }

  /** Post-scale this matrix */
  postScale(sx: number, sy: number = sx): Matrix {
    return this.concat(Matrix.scale(sx, sy));
  }

  /** Pre-rotate this matrix */
  preRotate(degrees: number): Matrix {
    return Matrix.rotate(degrees).concat(this);
  }

  /** Post-rotate this matrix */
  postRotate(degrees: number): Matrix {
    return this.concat(Matrix.rotate(degrees));
  }

  /** Pre-shear this matrix */
  preShear(sx: number, sy: number): Matrix {
    return Matrix.shear(sx, sy).concat(this);
  }

  /** Post-shear this matrix */
  postShear(sx: number, sy: number): Matrix {
    return this.concat(Matrix.shear(sx, sy));
  }

  /** Transform a point */
  transformPoint(p: PointLike): Point {
    return new Point(p.x * this.a + p.y * this.c + this.e, p.x * this.b + p.y * this.d + this.f);
  }

  /** Check equality */
  equals(other: MatrixLike): boolean {
    return (
      this.a === other.a &&
      this.b === other.b &&
      this.c === other.c &&
      this.d === other.d &&
      this.e === other.e &&
      this.f === other.f
    );
  }

  toString(): string {
    return `Matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
  }
}

/**
 * A quadrilateral defined by four corner points
 */
export class Quad implements QuadLike {
  readonly ul: Point;
  readonly ur: Point;
  readonly ll: Point;
  readonly lr: Point;

  constructor(ul: PointLike, ur: PointLike, ll: PointLike, lr: PointLike) {
    this.ul = Point.from(ul);
    this.ur = Point.from(ur);
    this.ll = Point.from(ll);
    this.lr = Point.from(lr);
  }

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /** Create a quad from a rectangle */
  static fromRect(r: RectLike): Quad {
    return new Quad(
      new Point(r.x0, r.y0),
      new Point(r.x1, r.y0),
      new Point(r.x0, r.y1),
      new Point(r.x1, r.y1)
    );
  }

  // ============================================================================
  // Methods
  // ============================================================================

  /** Transform this quad by a matrix */
  transform(m: MatrixLike): Quad {
    const matrix = Matrix.from(m);
    return new Quad(
      this.ul.transform(matrix),
      this.ur.transform(matrix),
      this.ll.transform(matrix),
      this.lr.transform(matrix)
    );
  }

  /** Get the bounding rectangle */
  get bounds(): Rect {
    return new Rect(
      Math.min(this.ul.x, this.ur.x, this.ll.x, this.lr.x),
      Math.min(this.ul.y, this.ur.y, this.ll.y, this.lr.y),
      Math.max(this.ul.x, this.ur.x, this.ll.x, this.lr.x),
      Math.max(this.ul.y, this.ur.y, this.ll.y, this.lr.y)
    );
  }

  /** Check if a point is inside the quad */
  containsPoint(p: PointLike): boolean {
    // Use cross product to check if point is on the correct side of each edge
    const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

    const check = (p1: Point, p2: Point) => {
      return cross(p2.x - p1.x, p2.y - p1.y, p.x - p1.x, p.y - p1.y) >= 0;
    };

    return (
      check(this.ul, this.ur) &&
      check(this.ur, this.lr) &&
      check(this.lr, this.ll) &&
      check(this.ll, this.ul)
    );
  }

  /** Check if this is a valid quad (non-self-intersecting) */
  get isValid(): boolean {
    // A simple check: all cross products should have the same sign
    const cross = (p1: Point, p2: Point, p3: Point) => {
      return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    };

    const c1 = cross(this.ul, this.ur, this.lr);
    const c2 = cross(this.ur, this.lr, this.ll);
    const c3 = cross(this.lr, this.ll, this.ul);
    const c4 = cross(this.ll, this.ul, this.ur);

    return (c1 >= 0 && c2 >= 0 && c3 >= 0 && c4 >= 0) || (c1 <= 0 && c2 <= 0 && c3 <= 0 && c4 <= 0);
  }

  toString(): string {
    return `Quad(${this.ul}, ${this.ur}, ${this.ll}, ${this.lr})`;
  }
}

// ============================================================================
// Color
// ============================================================================

/**
 * Color-like type
 */
export type ColorLike =
  | Color
  | { r: number; g: number; b: number; a?: number }
  | [number, number, number]
  | [number, number, number, number];

/**
 * An RGBA color
 */
export class Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;

  constructor(r: number, g: number, b: number, a: number = 1.0) {
    this.r = Math.max(0, Math.min(1, r));
    this.g = Math.max(0, Math.min(1, g));
    this.b = Math.max(0, Math.min(1, b));
    this.a = Math.max(0, Math.min(1, a));
  }

  /**
   * Create color from color-like object
   */
  static from(c: ColorLike): Color {
    if (c instanceof Color) {
      return c;
    }
    if (Array.isArray(c)) {
      return new Color(c[0], c[1], c[2], c[3]);
    }
    return new Color(c.r, c.g, c.b, c.a);
  }

  /** Black color */
  static readonly BLACK = new Color(0, 0, 0);
  /** White color */
  static readonly WHITE = new Color(1, 1, 1);
  /** Red color */
  static readonly RED = new Color(1, 0, 0);
  /** Green color */
  static readonly GREEN = new Color(0, 1, 0);
  /** Blue color */
  static readonly BLUE = new Color(0, 0, 1);

  /**
   * Get as array [r, g, b, a]
   */
  toArray(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }
}
