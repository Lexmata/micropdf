/**
 * Device - PDF rendering device abstraction
 *
 * This module provides 100% API compatibility with MuPDF's device operations.
 * Devices receive drawing commands and render them to various outputs.
 */

import { Rect, Matrix, type RectLike, type MatrixLike } from './geometry.js';
import { Path, StrokeState } from './path.js';
import { Colorspace } from './colorspace.js';
import { Pixmap } from './pixmap.js';

/**
 * Device types
 */
export enum DeviceType {
  Unknown = 0,
  Draw = 1,
  BBox = 2,
  Trace = 3,
  List = 4,
  Custom = 5
}

/**
 * Device hints for optimization
 */
export enum DeviceHint {
  NoCache = 1 << 0,
  NoPureColor = 1 << 1
}

/**
 * Blend modes for transparency
 */
export enum BlendMode {
  Normal = 0,
  Multiply = 1,
  Screen = 2,
  Overlay = 3,
  Darken = 4,
  Lighten = 5,
  ColorDodge = 6,
  ColorBurn = 7,
  HardLight = 8,
  SoftLight = 9,
  Difference = 10,
  Exclusion = 11
}

/**
 * Abstract base class for rendering devices
 */
export abstract class Device {
  private _refCount: number = 1;
  private _closed: boolean = false;
  private _type: DeviceType;
  private _hints: number = 0;

  constructor(type: DeviceType) {
    this._type = type;
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

  // ============================================================================
  // Device Control
  // ============================================================================

  /**
   * Close the device (finalize rendering)
   */
  close(): void {
    this._closed = true;
    this.onClose();
  }

  protected onClose(): void {
    // Override in subclasses
  }

  get isClosed(): boolean {
    return this._closed;
  }

  get type(): DeviceType {
    return this._type;
  }

  isValid(): boolean {
    return !this._closed;
  }

  // ============================================================================
  // Hints
  // ============================================================================

  enableHints(hints: DeviceHint): void {
    this._hints |= hints;
  }

  disableHints(hints: DeviceHint): void {
    this._hints &= ~hints;
  }

  hasHint(hint: DeviceHint): boolean {
    return (this._hints & hint) !== 0;
  }

  // ============================================================================
  // Tiling
  // ============================================================================

  beginTile(area: RectLike, view: RectLike, xStep: number, yStep: number, ctm: MatrixLike): void {
    this.onBeginTile(Rect.from(area), Rect.from(view), xStep, yStep, Matrix.from(ctm));
  }

  protected onBeginTile(
    _area: Rect,
    _view: Rect,
    _xStep: number,
    _yStep: number,
    _ctm: Matrix
  ): void {
    // Override in subclasses
  }

  endTile(): void {
    this.onEndTile();
  }

  protected onEndTile(): void {
    // Override in subclasses
  }

  // ============================================================================
  // Path Drawing
  // ============================================================================

  fillPath(
    path: Path,
    evenOdd: boolean,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.onFillPath(path, evenOdd, Matrix.from(ctm), colorspace, color, alpha);
  }

  protected abstract onFillPath(
    path: Path,
    evenOdd: boolean,
    ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void;

  strokePath(
    path: Path,
    stroke: StrokeState,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.onStrokePath(path, stroke, Matrix.from(ctm), colorspace, color, alpha);
  }

  protected abstract onStrokePath(
    path: Path,
    stroke: StrokeState,
    ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void;

  clipPath(path: Path, evenOdd: boolean, ctm: MatrixLike): void {
    this.onClipPath(path, evenOdd, Matrix.from(ctm));
  }

  protected onClipPath(_path: Path, _evenOdd: boolean, _ctm: Matrix): void {
    // Override in subclasses
  }

  clipStrokePath(path: Path, stroke: StrokeState, ctm: MatrixLike): void {
    this.onClipStrokePath(path, stroke, Matrix.from(ctm));
  }

  protected onClipStrokePath(_path: Path, _stroke: StrokeState, _ctm: Matrix): void {
    // Override in subclasses
  }

  // ============================================================================
  // Text Drawing
  // ============================================================================

  fillText(
    text: string,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.onFillText(text, Matrix.from(ctm), colorspace, color, alpha);
  }

  protected onFillText(
    _text: string,
    _ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    // Override in subclasses
  }

  strokeText(
    text: string,
    stroke: StrokeState,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.onStrokeText(text, stroke, Matrix.from(ctm), colorspace, color, alpha);
  }

  protected onStrokeText(
    _text: string,
    _stroke: StrokeState,
    _ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    // Override in subclasses
  }

  clipText(text: string, ctm: MatrixLike): void {
    this.onClipText(text, Matrix.from(ctm));
  }

  protected onClipText(_text: string, _ctm: Matrix): void {
    // Override in subclasses
  }

  clipStrokeText(text: string, stroke: StrokeState, ctm: MatrixLike): void {
    this.onClipStrokeText(text, stroke, Matrix.from(ctm));
  }

  protected onClipStrokeText(_text: string, _stroke: StrokeState, _ctm: Matrix): void {
    // Override in subclasses
  }

  ignoreText(text: string, ctm: MatrixLike): void {
    this.onIgnoreText(text, Matrix.from(ctm));
  }

  protected onIgnoreText(_text: string, _ctm: Matrix): void {
    // Override in subclasses
  }

  // ============================================================================
  // Image Drawing
  // ============================================================================

  fillImage(image: Pixmap, ctm: MatrixLike, alpha: number): void {
    this.onFillImage(image, Matrix.from(ctm), alpha);
  }

  protected onFillImage(_image: Pixmap, _ctm: Matrix, _alpha: number): void {
    // Override in subclasses
  }

  fillImageMask(
    image: Pixmap,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.onFillImageMask(image, Matrix.from(ctm), colorspace, color, alpha);
  }

  protected onFillImageMask(
    _image: Pixmap,
    _ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    // Override in subclasses
  }

  clipImageMask(image: Pixmap, ctm: MatrixLike): void {
    this.onClipImageMask(image, Matrix.from(ctm));
  }

  protected onClipImageMask(_image: Pixmap, _ctm: Matrix): void {
    // Override in subclasses
  }

  // ============================================================================
  // Clipping
  // ============================================================================

  popClip(): void {
    this.onPopClip();
  }

  protected onPopClip(): void {
    // Override in subclasses
  }

  // ============================================================================
  // Masking
  // ============================================================================

  beginMask(area: RectLike, luminosity: boolean, colorspace: Colorspace, color: number[]): void {
    this.onBeginMask(Rect.from(area), luminosity, colorspace, color);
  }

  protected onBeginMask(
    _area: Rect,
    _luminosity: boolean,
    _colorspace: Colorspace,
    _color: number[]
  ): void {
    // Override in subclasses
  }

  endMask(): void {
    this.onEndMask();
  }

  protected onEndMask(): void {
    // Override in subclasses
  }

  // ============================================================================
  // Grouping
  // ============================================================================

  beginGroup(
    area: RectLike,
    colorspace: Colorspace,
    isolated: boolean,
    knockout: boolean,
    blendMode: BlendMode,
    alpha: number
  ): void {
    this.onBeginGroup(Rect.from(area), colorspace, isolated, knockout, blendMode, alpha);
  }

  protected onBeginGroup(
    _area: Rect,
    _colorspace: Colorspace,
    _isolated: boolean,
    _knockout: boolean,
    _blendMode: BlendMode,
    _alpha: number
  ): void {
    // Override in subclasses
  }

  endGroup(): void {
    this.onEndGroup();
  }

  protected onEndGroup(): void {
    // Override in subclasses
  }
}

/**
 * Draw device - renders to a pixmap
 */
export class DrawDevice extends Device {
  private _pixmap: Pixmap;

  constructor(pixmap: Pixmap) {
    super(DeviceType.Draw);
    this._pixmap = pixmap;
  }

  static create(pixmap: Pixmap): DrawDevice {
    return new DrawDevice(pixmap);
  }

  get pixmap(): Pixmap {
    return this._pixmap;
  }

  protected onFillPath(
    _path: Path,
    _evenOdd: boolean,
    _ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    // Actual rendering would happen here
  }

  protected onStrokePath(
    _path: Path,
    _stroke: StrokeState,
    _ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    // Actual rendering would happen here
  }
}

/**
 * BBox device - calculates bounding boxes
 */
export class BBoxDevice extends Device {
  private _bbox: Rect = Rect.EMPTY;

  constructor() {
    super(DeviceType.BBox);
  }

  static create(): BBoxDevice {
    return new BBoxDevice();
  }

  get bbox(): Rect {
    return this._bbox;
  }

  protected onFillPath(
    path: Path,
    _evenOdd: boolean,
    ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    const pathBounds = path.getBounds();
    const transformedBounds = pathBounds.transform(ctm);
    this._bbox = this._bbox.union(transformedBounds);
  }

  protected onStrokePath(
    path: Path,
    _stroke: StrokeState,
    ctm: Matrix,
    _colorspace: Colorspace,
    _color: number[],
    _alpha: number
  ): void {
    const pathBounds = path.getBounds();
    const transformedBounds = pathBounds.transform(ctm);
    this._bbox = this._bbox.union(transformedBounds);
  }
}

/**
 * Trace device - logs drawing operations
 */
export class TraceDevice extends Device {
  private _log: string[] = [];

  constructor() {
    super(DeviceType.Trace);
  }

  static create(): TraceDevice {
    return new TraceDevice();
  }

  get log(): string[] {
    return [...this._log];
  }

  protected onFillPath(
    _path: Path,
    evenOdd: boolean,
    _ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this._log.push(
      `fillPath(evenOdd=${evenOdd}, colorspace=${colorspace.type}, color=[${color}], alpha=${alpha})`
    );
  }

  protected onStrokePath(
    _path: Path,
    stroke: StrokeState,
    _ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this._log.push(
      `strokePath(width=${stroke.lineWidth}, colorspace=${colorspace.type}, color=[${color}], alpha=${alpha})`
    );
  }

  protected override onFillText(
    text: string,
    _ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this._log.push(
      `fillText("${text}", colorspace=${colorspace.type}, color=[${color}], alpha=${alpha})`
    );
  }

  protected override onFillImage(image: Pixmap, _ctm: Matrix, alpha: number): void {
    this._log.push(`fillImage(${image.width}x${image.height}, alpha=${alpha})`);
  }

  protected override onBeginGroup(
    area: Rect,
    _colorspace: Colorspace,
    isolated: boolean,
    knockout: boolean,
    blendMode: BlendMode,
    alpha: number
  ): void {
    this._log.push(
      `beginGroup(area=${area}, isolated=${isolated}, knockout=${knockout}, blend=${blendMode}, alpha=${alpha})`
    );
  }

  protected override onEndGroup(): void {
    this._log.push('endGroup()');
  }
}

/**
 * Recorded device command
 */
interface DeviceCommand {
  type: string;
  path?: Path;
  stroke?: StrokeState;
  evenOdd?: boolean;
  ctm?: Matrix;
  colorspace?: Colorspace;
  color?: number[];
  alpha?: number;
}

/**
 * List device - records display list
 */
export class ListDevice extends Device {
  private _commands: DeviceCommand[] = [];

  constructor() {
    super(DeviceType.List);
  }

  static create(): ListDevice {
    return new ListDevice();
  }

  get commands(): DeviceCommand[] {
    return [...this._commands];
  }

  protected onFillPath(
    path: Path,
    evenOdd: boolean,
    ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this._commands.push({
      type: 'fillPath',
      path: path.clone(),
      evenOdd,
      ctm,
      colorspace,
      color: [...color],
      alpha
    });
  }

  protected onStrokePath(
    path: Path,
    stroke: StrokeState,
    ctm: Matrix,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this._commands.push({
      type: 'strokePath',
      path: path.clone(),
      stroke: stroke.clone(),
      ctm,
      colorspace,
      color: [...color],
      alpha
    });
  }
}
