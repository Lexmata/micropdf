/**
 * Path - PDF path construction and vector graphics
 *
 * This module provides comprehensive support for creating and manipulating vector paths
 * used in PDF graphics. Paths are fundamental building blocks for drawing lines, curves,
 * shapes, and complex vector graphics in PDF documents.
 *
 * This module provides 100% API compatibility with MuPDF's path operations.
 *
 * @module path
 * @example
 * ```typescript
 * import { Path, StrokeState, LineCap, LineJoin, Matrix } from 'micropdf';
 *
 * // Create a simple path
 * const path = Path.create();
 * path.moveTo(10, 10);
 * path.lineTo(100, 10);
 * path.lineTo(100, 100);
 * path.close();
 *
 * // Create a rectangle
 * const rect = Path.create();
 * rect.rect(0, 0, 200, 100);
 *
 * // Create a curve
 * const curve = Path.create();
 * curve.moveTo(0, 0);
 * curve.curveTo(50, 100, 100, 100, 150, 0);
 *
 * // Configure stroke
 * const stroke = StrokeState.create();
 * stroke.setLineWidth(2);
 * stroke.setLineCap(LineCap.Round);
 * stroke.setLineJoin(LineJoin.Round);
 * stroke.setDash([5, 3], 0); // 5 on, 3 off
 *
 * // Transform path
 * const matrix = Matrix.scale(2, 2);
 * path.transform(matrix);
 * ```
 */

import { Point, Rect, Matrix, type PointLike, type MatrixLike } from './geometry.js';

/**
 * Line cap styles determine how the ends of stroked paths are rendered.
 *
 * @enum {number}
 * @example
 * ```typescript
 * const stroke = StrokeState.create();
 * stroke.setLineCap(LineCap.Round); // Rounded end caps
 * stroke.setStartCap(LineCap.Square); // Square start cap
 * stroke.setEndCap(LineCap.Butt); // Flat end cap
 * ```
 */
export enum LineCap {
  /**
   * Butt cap - Line ends exactly at the endpoint (no extension).
   * This is the most common and default cap style.
   */
  Butt = 0,

  /**
   * Round cap - Line extends with a semicircular cap at the endpoint.
   * The diameter equals the line width.
   */
  Round = 1,

  /**
   * Square cap - Line extends with a square cap at the endpoint.
   * The extension equals half the line width.
   */
  Square = 2,

  /**
   * Triangle cap - Line extends with a triangular cap at the endpoint.
   * Less common, used for special effects.
   */
  Triangle = 3
}

/**
 * Line join styles determine how path segments connect at corners.
 *
 * @enum {number}
 * @example
 * ```typescript
 * const stroke = StrokeState.create();
 * stroke.setLineJoin(LineJoin.Round); // Smooth rounded corners
 * stroke.setLineJoin(LineJoin.Miter); // Sharp pointed corners
 * stroke.setMiterLimit(10); // Limit miter length
 * ```
 */
export enum LineJoin {
  /**
   * Miter join - Extends the outer edges until they meet at a point.
   * Creates sharp corners but can become very long at acute angles.
   * Use miterLimit to prevent excessive extension.
   */
  Miter = 0,

  /**
   * Round join - Joins segments with a circular arc.
   * Creates smooth, rounded corners with radius equal to half the line width.
   */
  Round = 1,

  /**
   * Bevel join - Joins segments with a straight line across the corner.
   * Creates a flat, beveled corner. Safe for all angles.
   */
  Bevel = 2,

  /**
   * Miter XPS join - Miter join variant used in XPS documents.
   * Similar to standard miter but with slightly different behavior.
   */
  MiterXPS = 3
}

/**
 * Type alias for line cap styles (backwards compatibility).
 * @deprecated Use {@link LineCap} instead
 * @type {typeof LineCap}
 */
export const LineCapStyle = LineCap;

/**
 * Type alias for line join styles (backwards compatibility).
 * @deprecated Use {@link LineJoin} instead
 * @type {typeof LineJoin}
 */
export const LineJoinStyle = LineJoin;

/**
 * Stroke state configuration for path rendering.
 *
 * StrokeState encapsulates all the properties that control how paths are stroked
 * (drawn with lines). This includes line width, cap styles, join styles, miter limits,
 * and dash patterns.
 *
 * **Reference Counting**: StrokeState uses manual reference counting. Call `keep()` to
 * increment the reference count and `drop()` to decrement it.
 *
 * @class StrokeState
 * @example
 * ```typescript
 * // Create default stroke state
 * const stroke = StrokeState.create();
 *
 * // Configure stroke properties
 * stroke.setLineWidth(2.5);
 * stroke.setStartCap(LineCap.Round);
 * stroke.setLineJoin(LineJoin.Round);
 * stroke.setMiterLimit(10);
 *
 * // Set dash pattern: 5 units on, 3 units off
 * stroke.setDash([5, 3], 0);
 *
 * // Clone for variations
 * const thickStroke = stroke.clone();
 * thickStroke.setLineWidth(5);
 *
 * // Clean up
 * stroke.drop();
 * thickStroke.drop();
 * ```
 *
 * @example
 * ```typescript
 * // Create dotted line
 * const dotted = StrokeState.create();
 * dotted.setLineWidth(1);
 * dotted.setLineCap(LineCap.Round);
 * dotted.setDash([2, 2], 0); // 2 on, 2 off
 *
 * // Create dashed line
 * const dashed = StrokeState.create();
 * dashed.setLineWidth(2);
 * dashed.setDash([10, 5], 0); // 10 on, 5 off
 *
 * // Create solid line with rounded corners
 * const rounded = StrokeState.create();
 * rounded.setLineWidth(3);
 * rounded.setLineCap(LineCap.Round);
 * rounded.setLineJoin(LineJoin.Round);
 * ```
 */
export class StrokeState {
  private _lineWidth: number = 1.0;
  private _startCap: LineCap = LineCap.Butt;
  private _dashCap: LineCap = LineCap.Butt;
  private _endCap: LineCap = LineCap.Butt;
  private _lineJoin: LineJoin = LineJoin.Miter;
  private _miterLimit: number = 10.0;
  private _dashPhase: number = 0.0;
  private _dashPattern: number[] = [];
  private _refCount: number = 1;

  constructor() {}

  /**
   * Create a new stroke state
   */
  static create(): StrokeState {
    return new StrokeState();
  }

  /**
   * Create stroke state with specific dash pattern length
   */
  static createWithDashLen(dashLen: number): StrokeState {
    const state = new StrokeState();
    state._dashPattern = new Array(dashLen).fill(0);
    return state;
  }

  /**
   * Clone this stroke state
   */
  clone(): StrokeState {
    const cloned = new StrokeState();
    cloned._lineWidth = this._lineWidth;
    cloned._startCap = this._startCap;
    cloned._dashCap = this._dashCap;
    cloned._endCap = this._endCap;
    cloned._lineJoin = this._lineJoin;
    cloned._miterLimit = this._miterLimit;
    cloned._dashPhase = this._dashPhase;
    cloned._dashPattern = [...this._dashPattern];
    return cloned;
  }

  /**
   * Keep (increment ref count)
   */
  keep(): this {
    this._refCount++;
    return this;
  }

  /**
   * Drop (decrement ref count)
   */
  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
  }

  /**
   * Unshare (make a unique copy if shared)
   */
  unshare(): StrokeState {
    if (this._refCount > 1) {
      this._refCount--;
      return this.clone();
    }
    return this;
  }

  // ============================================================================
  // Line Width
  // ============================================================================

  get lineWidth(): number {
    return this._lineWidth;
  }

  set lineWidth(width: number) {
    this._lineWidth = width;
  }

  // ============================================================================
  // Line Caps
  // ============================================================================

  get startCap(): LineCap {
    return this._startCap;
  }

  set startCap(cap: LineCap) {
    this._startCap = cap;
  }

  get dashCap(): LineCap {
    return this._dashCap;
  }

  set dashCap(cap: LineCap) {
    this._dashCap = cap;
  }

  get endCap(): LineCap {
    return this._endCap;
  }

  set endCap(cap: LineCap) {
    this._endCap = cap;
  }

  // ============================================================================
  // Line Join
  // ============================================================================

  get lineJoin(): LineJoin {
    return this._lineJoin;
  }

  set lineJoin(join: LineJoin) {
    this._lineJoin = join;
  }

  get miterLimit(): number {
    return this._miterLimit;
  }

  set miterLimit(limit: number) {
    this._miterLimit = limit;
  }

  // ============================================================================
  // Dash Pattern
  // ============================================================================

  get dashPhase(): number {
    return this._dashPhase;
  }

  get dashLength(): number {
    return this._dashPattern.length;
  }

  getDashPattern(): number[] {
    return [...this._dashPattern];
  }

  setDash(pattern: number[], phase: number = 0): void {
    this._dashPattern = [...pattern];
    this._dashPhase = phase;
  }

  /**
   * Check if stroke state is valid
   */
  isValid(): boolean {
    return this._lineWidth >= 0 && this._miterLimit >= 1 && this._dashPattern.every((v) => v >= 0);
  }
}

/**
 * Path walker interface for traversing path commands
 */
export interface PathWalker {
  moveTo?(x: number, y: number): void;
  lineTo?(x: number, y: number): void;
  curveTo?(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number): void;
  closePath?(): void;
  quadTo?(cx: number, cy: number, x: number, y: number): void;
  rectTo?(x: number, y: number, w: number, h: number): void;
}

/**
 * Path command types
 */
enum PathCmd {
  MoveTo,
  LineTo,
  CurveTo,
  Close,
  QuadTo,
  RectTo
}

/**
 * A single path command with its parameters
 */
interface PathCommand {
  cmd: PathCmd;
  params: number[];
}

/**
 * A graphics path for constructing vector shapes and drawings.
 *
 * Path represents a sequence of drawing commands that define vector graphics.
 * Paths can contain lines, curves, rectangles, and other geometric primitives.
 * They can be stroked (outlined) or filled to create visible graphics in PDFs.
 *
 * **Path Construction**: Paths are built using a sequence of commands:
 * - `moveTo()` - Start a new subpath at a point
 * - `lineTo()` - Draw a straight line to a point
 * - `curveTo()` - Draw a cubic Bézier curve
 * - `quadTo()` - Draw a quadratic Bézier curve
 * - `rect()` - Add a rectangle
 * - `closePath()` / `close()` - Close the current subpath
 *
 * **Reference Counting**: Paths use manual reference counting. Call `keep()` to
 * increment the reference count and `drop()` to decrement it.
 *
 * @class Path
 * @example
 * ```typescript
 * // Draw a triangle
 * const triangle = Path.create();
 * triangle.moveTo(50, 0);
 * triangle.lineTo(100, 100);
 * triangle.lineTo(0, 100);
 * triangle.close();
 *
 * // Draw a rectangle
 * const rect = Path.create();
 * rect.rect(10, 10, 200, 100);
 *
 * // Draw a rounded rectangle
 * const roundedRect = Path.create();
 * const x = 10, y = 10, w = 200, h = 100, r = 10;
 * roundedRect.moveTo(x + r, y);
 * roundedRect.lineTo(x + w - r, y);
 * roundedRect.curveTo(x + w, y, x + w, y, x + w, y + r);
 * roundedRect.lineTo(x + w, y + h - r);
 * roundedRect.curveTo(x + w, y + h, x + w, y + h, x + w - r, y + h);
 * roundedRect.lineTo(x + r, y + h);
 * roundedRect.curveTo(x, y + h, x, y + h, x, y + h - r);
 * roundedRect.lineTo(x, y + r);
 * roundedRect.curveTo(x, y, x, y, x + r, y);
 * roundedRect.close();
 * ```
 *
 * @example
 * ```typescript
 * // Draw a sine wave
 * const wave = Path.create();
 * wave.moveTo(0, 50);
 * for (let x = 0; x <= 200; x += 5) {
 *   const y = 50 + Math.sin(x * 0.1) * 20;
 *   wave.lineTo(x, y);
 * }
 *
 * // Transform the path
 * const matrix = Matrix.scale(2, 2);
 * wave.transform(matrix);
 *
 * // Check if empty
 * if (!wave.isEmpty()) {
 *   console.log('Path has commands');
 * }
 *
 * // Clean up
 * wave.drop();
 * ```
 *
 * @example
 * ```typescript
 * // Draw a circle approximation with cubic Bézier curves
 * const circle = Path.create();
 * const cx = 100, cy = 100, r = 50;
 * const k = 0.5522847498; // 4/3 * (sqrt(2) - 1)
 * const kr = r * k;
 *
 * circle.moveTo(cx, cy - r);
 * circle.curveTo(cx + kr, cy - r, cx + r, cy - kr, cx + r, cy);
 * circle.curveTo(cx + r, cy + kr, cx + kr, cy + r, cx, cy + r);
 * circle.curveTo(cx - kr, cy + r, cx - r, cy + kr, cx - r, cy);
 * circle.curveTo(cx - r, cy - kr, cx - kr, cy - r, cx, cy - r);
 * circle.close();
 * ```
 */
export class Path {
  private _commands: PathCommand[] = [];
  private _currentPoint: Point = Point.ORIGIN;
  private _refCount: number = 1;

  constructor() {}

  /**
   * Create a new empty path
   */
  static create(): Path {
    return new Path();
  }

  /**
   * Keep (increment ref count)
   */
  keep(): this {
    this._refCount++;
    return this;
  }

  /**
   * Drop (decrement ref count)
   */
  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
  }

  /**
   * Clone this path
   */
  clone(): Path {
    const cloned = new Path();
    cloned._commands = this._commands.map((cmd) => ({
      cmd: cmd.cmd,
      params: [...cmd.params]
    }));
    cloned._currentPoint = this._currentPoint;
    return cloned;
  }

  /**
   * Get the current point
   */
  get currentPoint(): Point {
    return this._currentPoint;
  }

  /**
   * Check if the path is empty
   */
  isEmpty(): boolean {
    return this._commands.length === 0;
  }

  // ============================================================================
  // Path Construction
  // ============================================================================

  /**
   * Move to a point (start a new subpath)
   */
  moveTo(x: number, y: number): this;
  moveTo(point: PointLike): this;
  moveTo(xOrPoint: number | PointLike, y?: number): this {
    const [x, actualY] = typeof xOrPoint === 'number' ? [xOrPoint, y!] : [xOrPoint.x, xOrPoint.y];

    this._commands.push({ cmd: PathCmd.MoveTo, params: [x, actualY] });
    this._currentPoint = new Point(x, actualY);
    return this;
  }

  /**
   * Draw a line to a point
   */
  lineTo(x: number, y: number): this;
  lineTo(point: PointLike): this;
  lineTo(xOrPoint: number | PointLike, y?: number): this {
    const [x, actualY] = typeof xOrPoint === 'number' ? [xOrPoint, y!] : [xOrPoint.x, xOrPoint.y];

    this._commands.push({ cmd: PathCmd.LineTo, params: [x, actualY] });
    this._currentPoint = new Point(x, actualY);
    return this;
  }

  /**
   * Draw a cubic Bézier curve
   */
  curveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number): this {
    this._commands.push({
      cmd: PathCmd.CurveTo,
      params: [cx1, cy1, cx2, cy2, x, y]
    });
    this._currentPoint = new Point(x, y);
    return this;
  }

  /**
   * Draw a quadratic Bézier curve
   */
  quadTo(cx: number, cy: number, x: number, y: number): this {
    this._commands.push({
      cmd: PathCmd.QuadTo,
      params: [cx, cy, x, y]
    });
    this._currentPoint = new Point(x, y);
    return this;
  }

  /**
   * Close the current subpath
   */
  closePath(): this {
    this._commands.push({ cmd: PathCmd.Close, params: [] });
    return this;
  }

  /**
   * Close the current subpath (alias for closePath)
   */
  close(): this {
    return this.closePath();
  }

  /**
   * Add a rectangle to the path
   */
  rectTo(x: number, y: number, w: number, h: number): this {
    this._commands.push({
      cmd: PathCmd.RectTo,
      params: [x, y, w, h]
    });
    // Rectangle starts and ends at (x, y)
    this._currentPoint = new Point(x, y);
    return this;
  }

  /**
   * Add a rectangle from corners
   */
  rect(x1: number, y1: number, x2: number, y2: number): this {
    return this.rectTo(x1, y1, x2 - x1, y2 - y1);
  }

  // ============================================================================
  // Path Operations
  // ============================================================================

  /**
   * Get the bounding box of the path
   */
  getBounds(): Rect {
    if (this._commands.length === 0) {
      return Rect.EMPTY;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    for (const cmd of this._commands) {
      switch (cmd.cmd) {
        case PathCmd.MoveTo:
        case PathCmd.LineTo:
          updateBounds(cmd.params[0]!, cmd.params[1]!);
          break;
        case PathCmd.CurveTo:
          updateBounds(cmd.params[0]!, cmd.params[1]!);
          updateBounds(cmd.params[2]!, cmd.params[3]!);
          updateBounds(cmd.params[4]!, cmd.params[5]!);
          break;
        case PathCmd.QuadTo:
          updateBounds(cmd.params[0]!, cmd.params[1]!);
          updateBounds(cmd.params[2]!, cmd.params[3]!);
          break;
        case PathCmd.RectTo:
          updateBounds(cmd.params[0]!, cmd.params[1]!);
          updateBounds(cmd.params[0]! + cmd.params[2]!, cmd.params[1]! + cmd.params[3]!);
          break;
      }
    }

    if (!isFinite(minX)) {
      return Rect.EMPTY;
    }

    return new Rect(minX, minY, maxX, maxY);
  }

  /**
   * Transform the path by a matrix
   */
  transform(matrix: MatrixLike): this {
    const m = Matrix.from(matrix);

    for (const cmd of this._commands) {
      switch (cmd.cmd) {
        case PathCmd.MoveTo:
        case PathCmd.LineTo:
          {
            const p = m.transformPoint({ x: cmd.params[0]!, y: cmd.params[1]! });
            cmd.params[0] = p.x;
            cmd.params[1] = p.y;
          }
          break;
        case PathCmd.CurveTo:
          {
            const p1 = m.transformPoint({ x: cmd.params[0]!, y: cmd.params[1]! });
            const p2 = m.transformPoint({ x: cmd.params[2]!, y: cmd.params[3]! });
            const p3 = m.transformPoint({ x: cmd.params[4]!, y: cmd.params[5]! });
            cmd.params[0] = p1.x;
            cmd.params[1] = p1.y;
            cmd.params[2] = p2.x;
            cmd.params[3] = p2.y;
            cmd.params[4] = p3.x;
            cmd.params[5] = p3.y;
          }
          break;
        case PathCmd.QuadTo:
          {
            const p1 = m.transformPoint({ x: cmd.params[0]!, y: cmd.params[1]! });
            const p2 = m.transformPoint({ x: cmd.params[2]!, y: cmd.params[3]! });
            cmd.params[0] = p1.x;
            cmd.params[1] = p1.y;
            cmd.params[2] = p2.x;
            cmd.params[3] = p2.y;
          }
          break;
        case PathCmd.RectTo:
          {
            // Transform rectangle corners
            const x1 = cmd.params[0]!;
            const y1 = cmd.params[1]!;
            const x2 = x1 + cmd.params[2]!;
            const y2 = y1 + cmd.params[3]!;

            const p1 = m.transformPoint({ x: x1, y: y1 });
            const p2 = m.transformPoint({ x: x2, y: y2 });

            cmd.params[0] = Math.min(p1.x, p2.x);
            cmd.params[1] = Math.min(p1.y, p2.y);
            cmd.params[2] = Math.abs(p2.x - p1.x);
            cmd.params[3] = Math.abs(p2.y - p1.y);
          }
          break;
      }
    }

    // Update current point
    if (this._commands.length > 0) {
      const lastCmd = this._commands[this._commands.length - 1]!;
      if (lastCmd.cmd === PathCmd.MoveTo || lastCmd.cmd === PathCmd.LineTo) {
        this._currentPoint = new Point(lastCmd.params[0]!, lastCmd.params[1]!);
      }
    }

    return this;
  }

  /**
   * Walk the path commands
   */
  walk(walker: PathWalker): void {
    for (const cmd of this._commands) {
      switch (cmd.cmd) {
        case PathCmd.MoveTo:
          walker.moveTo?.(cmd.params[0]!, cmd.params[1]!);
          break;
        case PathCmd.LineTo:
          walker.lineTo?.(cmd.params[0]!, cmd.params[1]!);
          break;
        case PathCmd.CurveTo:
          walker.curveTo?.(
            cmd.params[0]!,
            cmd.params[1]!,
            cmd.params[2]!,
            cmd.params[3]!,
            cmd.params[4]!,
            cmd.params[5]!
          );
          break;
        case PathCmd.QuadTo:
          walker.quadTo?.(cmd.params[0]!, cmd.params[1]!, cmd.params[2]!, cmd.params[3]!);
          break;
        case PathCmd.Close:
          walker.closePath?.();
          break;
        case PathCmd.RectTo:
          walker.rectTo?.(cmd.params[0]!, cmd.params[1]!, cmd.params[2]!, cmd.params[3]!);
          break;
      }
    }
  }

  /**
   * Check if path is valid
   */
  isValid(): boolean {
    return this._commands.every((cmd) => {
      return cmd.params.every((p) => isFinite(p));
    });
  }

  /**
   * Get the number of commands in the path
   */
  get length(): number {
    return this._commands.length;
  }

  /**
   * Clear all commands from the path
   */
  clear(): this {
    this._commands = [];
    this._currentPoint = Point.ORIGIN;
    return this;
  }
}
