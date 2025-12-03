/**
 * Geometry primitives - Point, Rect, Matrix, Quad
 */

import { native_addon } from './native.js';

/**
 * Point-like object
 */
export interface PointLike {
  readonly x: number;
  readonly y: number;
}

/**
 * Rect-like object
 */
export interface RectLike {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/**
 * Matrix-like object
 */
export interface MatrixLike {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/**
 * Quad-like object
 */
export interface QuadLike {
  readonly ul: PointLike;
  readonly ur: PointLike;
  readonly ll: PointLike;
  readonly lr: PointLike;
}

/**
 * A 2D point
 */
export class Point implements PointLike {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Origin point (0, 0)
   */
  static readonly ORIGIN = new Point(0, 0);

  /**
   * Create a point from a point-like object
   */
  static from(p: PointLike): Point {
    if (p instanceof Point) {
      return p;
    }
    return new Point(p.x, p.y);
  }

  /**
   * Transform this point by a matrix
   */
  transform(m: MatrixLike): Point {
    const result = native_addon.transformPoint(
      { x: this.x, y: this.y },
      { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }
    );
    return new Point(result.x, result.y);
  }

  /**
   * Calculate distance to another point
   */
  distanceTo(other: PointLike): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Add another point
   */
  add(other: PointLike): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtract another point
   */
  subtract(other: PointLike): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  /**
   * Scale by a factor
   */
  scale(factor: number): Point {
    return new Point(this.x * factor, this.y * factor);
  }

  /**
   * Check equality
   */
  equals(other: PointLike): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toString(): string {
    return `Point(${this.x}, ${this.y})`;
  }
}

/**
 * A rectangle defined by two corner points
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

  /**
   * Empty rectangle
   */
  static readonly EMPTY = new Rect(Infinity, Infinity, -Infinity, -Infinity);

  /**
   * Infinite rectangle
   */
  static readonly INFINITE = new Rect(-Infinity, -Infinity, Infinity, Infinity);

  /**
   * Unit rectangle (0,0) to (1,1)
   */
  static readonly UNIT = new Rect(0, 0, 1, 1);

  /**
   * Create a rect from a rect-like object
   */
  static from(r: RectLike): Rect {
    if (r instanceof Rect) {
      return r;
    }
    return new Rect(r.x0, r.y0, r.x1, r.y1);
  }

  /**
   * Create a rect from position and size
   */
  static fromXYWH(x: number, y: number, width: number, height: number): Rect {
    return new Rect(x, y, x + width, y + height);
  }

  /**
   * Width of the rectangle
   */
  get width(): number {
    return this.x1 - this.x0;
  }

  /**
   * Height of the rectangle
   */
  get height(): number {
    return this.y1 - this.y0;
  }

  /**
   * Check if the rectangle is empty
   */
  get isEmpty(): boolean {
    return native_addon.isRectEmpty({ x0: this.x0, y0: this.y0, x1: this.x1, y1: this.y1 });
  }

  /**
   * Check if the rectangle is infinite
   */
  get isInfinite(): boolean {
    return this.x0 === -Infinity;
  }

  /**
   * Check if a point is inside the rectangle
   */
  contains(p: PointLike): boolean;
  contains(x: number, y: number): boolean;
  contains(xOrPoint: number | PointLike, y?: number): boolean {
    const px = typeof xOrPoint === 'number' ? xOrPoint : xOrPoint.x;
    const py = typeof xOrPoint === 'number' ? y! : xOrPoint.y;
    return px >= this.x0 && px < this.x1 && py >= this.y0 && py < this.y1;
  }

  /**
   * Union with another rectangle
   */
  union(other: RectLike): Rect {
    const result = native_addon.rectUnion(
      { x0: this.x0, y0: this.y0, x1: this.x1, y1: this.y1 },
      { x0: other.x0, y0: other.y0, x1: other.x1, y1: other.y1 }
    );
    return new Rect(result.x0, result.y0, result.x1, result.y1);
  }

  /**
   * Intersection with another rectangle
   */
  intersect(other: RectLike): Rect {
    const result = native_addon.rectIntersect(
      { x0: this.x0, y0: this.y0, x1: this.x1, y1: this.y1 },
      { x0: other.x0, y0: other.y0, x1: other.x1, y1: other.y1 }
    );
    return new Rect(result.x0, result.y0, result.x1, result.y1);
  }

  /**
   * Expand by including a point
   */
  includePoint(p: PointLike): Rect {
    return new Rect(
      Math.min(this.x0, p.x),
      Math.min(this.y0, p.y),
      Math.max(this.x1, p.x),
      Math.max(this.y1, p.y)
    );
  }

  /**
   * Translate by offset
   */
  translate(dx: number, dy: number): Rect {
    return new Rect(this.x0 + dx, this.y0 + dy, this.x1 + dx, this.y1 + dy);
  }

  /**
   * Scale by factor
   */
  scale(sx: number, sy: number = sx): Rect {
    return new Rect(this.x0 * sx, this.y0 * sy, this.x1 * sx, this.y1 * sy);
  }

  toString(): string {
    return `Rect(${this.x0}, ${this.y0}, ${this.x1}, ${this.y1})`;
  }
}

/**
 * A 2D transformation matrix
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

  /**
   * Identity matrix
   */
  static readonly IDENTITY = new Matrix(1, 0, 0, 1, 0, 0);

  /**
   * Create a matrix from a matrix-like object
   */
  static from(m: MatrixLike): Matrix {
    if (m instanceof Matrix) {
      return m;
    }
    return new Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  /**
   * Create a translation matrix
   */
  static translate(tx: number, ty: number): Matrix {
    const result = native_addon.matrixTranslate(tx, ty);
    return new Matrix(result.a, result.b, result.c, result.d, result.e, result.f);
  }

  /**
   * Create a scaling matrix
   */
  static scale(sx: number, sy: number = sx): Matrix {
    const result = native_addon.matrixScale(sx, sy);
    return new Matrix(result.a, result.b, result.c, result.d, result.e, result.f);
  }

  /**
   * Create a rotation matrix
   */
  static rotate(degrees: number): Matrix {
    const result = native_addon.matrixRotate(degrees);
    return new Matrix(result.a, result.b, result.c, result.d, result.e, result.f);
  }

  /**
   * Concatenate with another matrix
   */
  concat(other: MatrixLike): Matrix {
    const result = native_addon.matrixConcat(
      { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f },
      { a: other.a, b: other.b, c: other.c, d: other.d, e: other.e, f: other.f }
    );
    return new Matrix(result.a, result.b, result.c, result.d, result.e, result.f);
  }

  /**
   * Pre-translate this matrix
   */
  preTranslate(tx: number, ty: number): Matrix {
    return Matrix.translate(tx, ty).concat(this);
  }

  /**
   * Post-translate this matrix
   */
  postTranslate(tx: number, ty: number): Matrix {
    return this.concat(Matrix.translate(tx, ty));
  }

  /**
   * Pre-scale this matrix
   */
  preScale(sx: number, sy: number = sx): Matrix {
    return Matrix.scale(sx, sy).concat(this);
  }

  /**
   * Post-scale this matrix
   */
  postScale(sx: number, sy: number = sx): Matrix {
    return this.concat(Matrix.scale(sx, sy));
  }

  /**
   * Pre-rotate this matrix
   */
  preRotate(degrees: number): Matrix {
    return Matrix.rotate(degrees).concat(this);
  }

  /**
   * Post-rotate this matrix
   */
  postRotate(degrees: number): Matrix {
    return this.concat(Matrix.rotate(degrees));
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

  /**
   * Create a quad from a rectangle
   */
  static fromRect(r: RectLike): Quad {
    return new Quad(
      new Point(r.x0, r.y0),
      new Point(r.x1, r.y0),
      new Point(r.x0, r.y1),
      new Point(r.x1, r.y1)
    );
  }

  /**
   * Transform this quad by a matrix
   */
  transform(m: MatrixLike): Quad {
    const matrix = Matrix.from(m);
    return new Quad(
      this.ul.transform(matrix),
      this.ur.transform(matrix),
      this.ll.transform(matrix),
      this.lr.transform(matrix)
    );
  }

  /**
   * Get the bounding rectangle
   */
  get bounds(): Rect {
    let rect = Rect.EMPTY;
    rect = rect.includePoint(this.ul);
    rect = rect.includePoint(this.ur);
    rect = rect.includePoint(this.ll);
    rect = rect.includePoint(this.lr);
    return rect;
  }

  toString(): string {
    return `Quad(${this.ul}, ${this.ur}, ${this.ll}, ${this.lr})`;
  }
}

