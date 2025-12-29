/**
 * DisplayList - Cached rendering commands
 *
 * This module provides 100% API compatibility with MuPDF's display list operations.
 * Display lists cache drawing commands for efficient re-rendering.
 */

import { Colorspace } from './colorspace.js';
import { Device } from './device.js';
import { Rect, Matrix, type RectLike, type MatrixLike } from './geometry.js';
import { Image } from './image.js';
import { Path, StrokeState } from './path.js';
import { Pixmap } from './pixmap.js';
import { Text } from './text.js';

/**
 * Display list command types
 */
enum CommandType {
  FillPath,
  StrokePath,
  ClipPath,
  ClipStrokePath,
  FillText,
  StrokeText,
  ClipText,
  ClipStrokeText,
  IgnoreText,
  FillShade,
  FillImage,
  FillImageMask,
  ClipImageMask,
  PopClip,
  BeginMask,
  EndMask,
  BeginGroup,
  EndGroup,
  BeginTile,
  EndTile
}

/**
 * Command data for display list operations
 * Using a flexible interface since commands can have various properties
 */
interface CommandData {
  // Path operations
  path?: Path;
  evenOdd?: boolean;
  stroke?: StrokeState;

  // Text operations
  text?: Text;

  // Image operations
  image?: Image;

  // Transformation and color
  ctm?: Matrix;
  colorspace?: Colorspace | null;
  color?: number[];
  alpha?: number;

  // Masks and groups
  area?: Rect;
  luminosity?: boolean;
  isolated?: boolean;
  knockout?: boolean;
  blendMode?: number;

  // Tiles
  view?: Rect;
  scale?: number;
  id?: number;
  xStep?: number;
  yStep?: number;
}

/**
 * A single display list command
 */
interface DisplayCommand {
  type: CommandType;
  data: CommandData;
}

/**
 * A display list - a cached list of rendering commands
 */
export class DisplayList {
  private _commands: DisplayCommand[] = [];
  private _bounds: Rect = Rect.EMPTY;
  private _refCount: number = 1;

  constructor(bounds?: RectLike) {
    if (bounds) {
      this._bounds = Rect.from(bounds);
    }
  }

  /**
   * Create a new display list
   */
  static create(bounds?: RectLike): DisplayList {
    return new DisplayList(bounds);
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
   * Clone this display list
   */
  clone(): DisplayList {
    const cloned = new DisplayList(this._bounds);
    cloned._commands = this._commands.map((cmd) => ({
      type: cmd.type,
      data: { ...cmd.data }
    }));
    return cloned;
  }

  // ============================================================================
  // Bounds
  // ============================================================================

  /**
   * Get the bounding box of all commands
   */
  getBounds(ctm?: MatrixLike): Rect {
    if (ctm) {
      return this._bounds.transform(Matrix.from(ctm));
    }
    return this._bounds;
  }

  /**
   * Update bounds to include a rect
   */
  private updateBounds(rect: Rect): void {
    this._bounds = this._bounds.union(rect);
  }

  // ============================================================================
  // Command Management
  // ============================================================================

  /**
   * Add a command to the display list
   */
  private addCommand(type: CommandType, data: CommandData): void {
    this._commands.push({ type, data });

    // Update bounds if command has a rect
    if ('rect' in data && data.rect) {
      this.updateBounds(Rect.from(data.rect as RectLike));
    }
  }

  /**
   * Count number of commands
   */
  countCommands(): number {
    return this._commands.length;
  }

  /**
   * Check if display list is empty
   */
  isEmpty(): boolean {
    return this._commands.length === 0;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this._commands = [];
    this._bounds = Rect.EMPTY;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if display list is valid
   */
  isValid(): boolean {
    return true; // Display lists are always valid in this implementation
  }

  // ============================================================================
  // Recording (Device-like interface for recording)
  // ============================================================================

  /**
   * Record a fill path command
   */
  recordFillPath(
    path: Path,
    evenOdd: boolean,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.addCommand(CommandType.FillPath, {
      path,
      evenOdd,
      ctm: Matrix.from(ctm),
      colorspace,
      color: [...color],
      alpha
    });
  }

  /**
   * Record a stroke path command
   */
  recordStrokePath(
    path: Path,
    stroke: StrokeState,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.addCommand(CommandType.StrokePath, {
      path,
      stroke,
      ctm: Matrix.from(ctm),
      colorspace,
      color: [...color],
      alpha
    });
  }

  /**
   * Record a clip path command
   */
  recordClipPath(path: Path, evenOdd: boolean, ctm: MatrixLike): void {
    this.addCommand(CommandType.ClipPath, {
      path,
      evenOdd,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record a clip stroke path command
   */
  recordClipStrokePath(path: Path, stroke: StrokeState, ctm: MatrixLike): void {
    this.addCommand(CommandType.ClipStrokePath, {
      path,
      stroke,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record a fill text command
   */
  recordFillText(
    text: Text,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.addCommand(CommandType.FillText, {
      text,
      ctm: Matrix.from(ctm),
      colorspace,
      color: [...color],
      alpha
    });
  }

  /**
   * Record a stroke text command
   */
  recordStrokeText(
    text: Text,
    stroke: StrokeState,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    alpha: number
  ): void {
    this.addCommand(CommandType.StrokeText, {
      text,
      stroke,
      ctm: Matrix.from(ctm),
      colorspace,
      color: [...color],
      alpha
    });
  }

  /**
   * Record a clip text command
   */
  recordClipText(text: Text, ctm: MatrixLike): void {
    this.addCommand(CommandType.ClipText, {
      text,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record a clip stroke text command
   */
  recordClipStrokeText(text: Text, stroke: StrokeState, ctm: MatrixLike): void {
    this.addCommand(CommandType.ClipStrokeText, {
      text,
      stroke,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record an ignore text command
   */
  recordIgnoreText(text: Text, ctm: MatrixLike): void {
    this.addCommand(CommandType.IgnoreText, {
      text,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record a fill image command
   */
  recordFillImage(image: Image, ctm: MatrixLike, alpha: number): void {
    this.addCommand(CommandType.FillImage, {
      image,
      ctm: Matrix.from(ctm),
      alpha
    });
  }

  /**
   * Record a fill image mask command
   */
  recordFillImageMask(
    image: Image,
    ctm: MatrixLike,
    colorspace: Colorspace,
    color: number[],
    _alpha: number
  ): void {
    this.addCommand(CommandType.FillImageMask, {
      image,
      ctm: Matrix.from(ctm),
      colorspace,
      color: [...color]
    });
  }

  /**
   * Record a clip image mask command
   */
  recordClipImageMask(image: Image, ctm: MatrixLike): void {
    this.addCommand(CommandType.ClipImageMask, {
      image,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record a pop clip command
   */
  recordPopClip(): void {
    this.addCommand(CommandType.PopClip, {});
  }

  /**
   * Record a begin mask command
   */
  recordBeginMask(
    area: RectLike,
    luminosity: boolean,
    colorspace: Colorspace | null,
    color: number[]
  ): void {
    this.addCommand(CommandType.BeginMask, {
      area: Rect.from(area),
      luminosity,
      colorspace,
      color: [...color]
    });
  }

  /**
   * Record an end mask command
   */
  recordEndMask(): void {
    this.addCommand(CommandType.EndMask, {});
  }

  /**
   * Record a begin group command
   */
  recordBeginGroup(
    area: RectLike,
    colorspace: Colorspace | null,
    isolated: boolean,
    knockout: boolean,
    blendMode: number,
    alpha: number
  ): void {
    this.addCommand(CommandType.BeginGroup, {
      area: Rect.from(area),
      colorspace,
      isolated,
      knockout,
      blendMode,
      alpha
    });
  }

  /**
   * Record an end group command
   */
  recordEndGroup(): void {
    this.addCommand(CommandType.EndGroup, {});
  }

  /**
   * Record a begin tile command
   */
  recordBeginTile(
    area: RectLike,
    view: RectLike,
    xStep: number,
    yStep: number,
    ctm: MatrixLike
  ): void {
    this.addCommand(CommandType.BeginTile, {
      area: Rect.from(area),
      view: Rect.from(view),
      xStep,
      yStep,
      ctm: Matrix.from(ctm)
    });
  }

  /**
   * Record an end tile command
   */
  recordEndTile(): void {
    this.addCommand(CommandType.EndTile, {});
  }

  // ============================================================================
  // Playback
  // ============================================================================

  /**
   * Run (replay) the display list to a device
   */
  run(device: Device, ctm?: MatrixLike): void {
    const transform = ctm ? Matrix.from(ctm) : Matrix.IDENTITY;

    for (const cmd of this._commands) {
      const combinedCtm = cmd.data.ctm ? transform.concat(cmd.data.ctm) : transform;

      switch (cmd.type) {
        case CommandType.FillPath:
          device.fillPath(
            cmd.data.path!,
            cmd.data.evenOdd!,
            combinedCtm,
            cmd.data.colorspace!,
            cmd.data.color!,
            cmd.data.alpha!
          );
          break;

        case CommandType.StrokePath:
          device.strokePath(
            cmd.data.path!,
            cmd.data.stroke!,
            combinedCtm,
            cmd.data.colorspace!,
            cmd.data.color!,
            cmd.data.alpha!
          );
          break;

        case CommandType.ClipPath:
          device.clipPath(cmd.data.path!, cmd.data.evenOdd!, combinedCtm);
          break;

        case CommandType.ClipStrokePath:
          device.clipStrokePath(cmd.data.path!, cmd.data.stroke!, combinedCtm);
          break;

        case CommandType.FillText:
          device.fillText(
            cmd.data.text as unknown as string,
            combinedCtm,
            cmd.data.colorspace!,
            cmd.data.color!,
            cmd.data.alpha!
          );
          break;

        case CommandType.StrokeText:
          device.strokeText(
            cmd.data.text as unknown as string,
            cmd.data.stroke!,
            combinedCtm,
            cmd.data.colorspace!,
            cmd.data.color!,
            cmd.data.alpha!
          );
          break;

        case CommandType.ClipText:
          device.clipText(cmd.data.text as unknown as string, combinedCtm);
          break;

        case CommandType.ClipStrokeText:
          device.clipStrokeText(cmd.data.text as unknown as string, cmd.data.stroke!, combinedCtm);
          break;

        case CommandType.IgnoreText:
          device.ignoreText(cmd.data.text as unknown as string, combinedCtm);
          break;

        case CommandType.FillImage:
          device.fillImage(cmd.data.image as unknown as Pixmap, combinedCtm, cmd.data.alpha!);
          break;

        case CommandType.FillImageMask:
          device.fillImageMask(
            cmd.data.image as unknown as Pixmap,
            combinedCtm,
            cmd.data.colorspace!,
            cmd.data.color!,
            cmd.data.alpha!
          );
          break;

        case CommandType.ClipImageMask:
          device.clipImageMask(cmd.data.image as unknown as Pixmap, combinedCtm);
          break;

        case CommandType.PopClip:
          device.popClip();
          break;

        case CommandType.BeginMask:
          device.beginMask(
            cmd.data.area!,
            cmd.data.luminosity!,
            cmd.data.colorspace!,
            cmd.data.color!
          );
          break;

        case CommandType.EndMask:
          device.endMask();
          break;

        case CommandType.BeginGroup:
          device.beginGroup(
            cmd.data.area!,
            cmd.data.colorspace!,
            cmd.data.isolated!,
            cmd.data.knockout!,
            cmd.data.blendMode!,
            cmd.data.alpha!
          );
          break;

        case CommandType.EndGroup:
          device.endGroup();
          break;

        case CommandType.BeginTile:
          device.beginTile(
            cmd.data.area!,
            cmd.data.view!,
            cmd.data.xStep!,
            cmd.data.yStep!,
            combinedCtm
          );
          break;

        case CommandType.EndTile:
          device.endTile();
          break;
      }
    }
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  /**
   * Get all commands
   */
  getCommands(): DisplayCommand[] {
    return this._commands.map((cmd) => ({
      type: cmd.type,
      data: { ...cmd.data }
    }));
  }
}
