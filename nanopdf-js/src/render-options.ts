/**
 * Advanced Rendering Options
 *
 * Provides fine-grained control over PDF rendering quality, colorspace,
 * and performance characteristics.
 */

import type { Colorspace } from './colorspace.js';
import type { Matrix } from './geometry.js';

/**
 * Anti-aliasing level
 *
 * Controls the quality of anti-aliasing applied during rendering.
 * Higher levels produce smoother output but are slower.
 */
export enum AntiAliasLevel {
  /** No anti-aliasing - fastest, lowest quality */
  None = 0,
  /** Low anti-aliasing - 2x2 sampling */
  Low = 2,
  /** Medium anti-aliasing - 4x4 sampling */
  Medium = 4,
  /** High anti-aliasing - 8x8 sampling - best quality, slowest */
  High = 8
}

/**
 * Rendering options
 *
 * Configures how a PDF page is rendered to a pixmap.
 *
 * @example
 * ```typescript
 * const options: RenderOptions = {
 *   dpi: 300,
 *   colorspace: Colorspace.deviceRGB(),
 *   alpha: true,
 *   antiAlias: AntiAliasLevel.High
 * };
 *
 * const pixmap = page.renderWithOptions(options);
 * ```
 */
export interface RenderOptions {
  /**
   * Resolution in dots per inch
   *
   * Common values:
   * - 72: Screen resolution (1:1)
   * - 150: Low-quality print
   * - 300: Standard print quality
   * - 600: High-quality print
   *
   * @default 72
   */
  dpi?: number;

  /**
   * Target colorspace
   *
   * Determines the color model of the output pixmap.
   *
   * @default Colorspace.deviceRGB()
   */
  colorspace?: Colorspace;

  /**
   * Include alpha channel
   *
   * If true, the output pixmap will have an alpha (transparency) channel.
   *
   * @default false
   */
  alpha?: boolean;

  /**
   * Anti-aliasing level
   *
   * Controls the quality of anti-aliasing applied during rendering.
   *
   * @default AntiAliasLevel.High
   */
  antiAlias?: AntiAliasLevel;

  /**
   * Transformation matrix
   *
   * Optional matrix to transform the page before rendering.
   * If provided, DPI is ignored.
   */
  transform?: Matrix;

  /**
   * Render annotations
   *
   * If true, annotations will be rendered on the page.
   *
   * @default true
   */
  renderAnnotations?: boolean;

  /**
   * Render form fields
   *
   * If true, form fields will be rendered on the page.
   *
   * @default true
   */
  renderFormFields?: boolean;
}

/**
 * Render progress callback
 *
 * Called periodically during rendering to report progress.
 *
 * @param current - Current progress value
 * @param total - Total progress value
 * @returns true to continue rendering, false to abort
 */
export type RenderProgressCallback = (current: number, total: number) => boolean;

/**
 * Render error callback
 *
 * Called when an error occurs during rendering.
 *
 * @param error - Error message
 */
export type RenderErrorCallback = (error: string) => void;

/**
 * Extended rendering options with progress tracking
 *
 * Adds progress and error callbacks for long-running render operations.
 *
 * @example
 * ```typescript
 * const options: ExtendedRenderOptions = {
 *   dpi: 300,
 *   alpha: true,
 *   onProgress: (current, total) => {
 *     console.log(`Rendering: ${current}/${total}`);
 *     return true; // Continue
 *   },
 *   onError: (error) => {
 *     console.error('Render error:', error);
 *   }
 * };
 * ```
 */
export interface ExtendedRenderOptions extends RenderOptions {
  /**
   * Progress callback
   *
   * Called periodically during rendering to report progress.
   * Return false to abort rendering.
   */
  onProgress?: RenderProgressCallback;

  /**
   * Error callback
   *
   * Called when an error occurs during rendering.
   */
  onError?: RenderErrorCallback;

  /**
   * Timeout in milliseconds
   *
   * If rendering takes longer than this, it will be aborted.
   *
   * @default undefined (no timeout)
   */
  timeout?: number;
}

/**
 * Get default render options
 *
 * @returns Default rendering options
 *
 * @example
 * ```typescript
 * const defaults = getDefaultRenderOptions();
 * const custom = { ...defaults, dpi: 300 };
 * ```
 */
export function getDefaultRenderOptions(): RenderOptions {
  return {
    dpi: 72,
    alpha: false,
    antiAlias: AntiAliasLevel.High,
    renderAnnotations: true,
    renderFormFields: true
  };
}

/**
 * Calculate scale matrix from DPI
 *
 * @param dpi - Target resolution in dots per inch
 * @returns Scale factor
 *
 * @example
 * ```typescript
 * const scale = dpiToScale(300); // 4.166... (300/72)
 * ```
 */
export function dpiToScale(dpi: number): number {
  return dpi / 72.0;
}

/**
 * Calculate DPI from scale matrix
 *
 * @param scale - Scale factor
 * @returns Resolution in dots per inch
 *
 * @example
 * ```typescript
 * const dpi = scaleToDpi(2.0); // 144 (72 * 2)
 * ```
 */
export function scaleToDpi(scale: number): number {
  return scale * 72.0;
}

/**
 * Validate render options
 *
 * Checks that all options are within valid ranges.
 *
 * @param options - Options to validate
 * @throws Error if options are invalid
 *
 * @example
 * ```typescript
 * validateRenderOptions({ dpi: 300, alpha: true });
 * ```
 */
export function validateRenderOptions(options: RenderOptions): void {
  if (options.dpi !== undefined) {
    if (options.dpi <= 0) {
      throw new Error('DPI must be positive');
    }
    if (options.dpi > 2400) {
      throw new Error('DPI too high (max 2400)');
    }
  }

  if (options.antiAlias !== undefined) {
    const validLevels = [
      AntiAliasLevel.None,
      AntiAliasLevel.Low,
      AntiAliasLevel.Medium,
      AntiAliasLevel.High
    ];
    if (!validLevels.includes(options.antiAlias)) {
      throw new Error(`Invalid anti-alias level: ${options.antiAlias}`);
    }
  }
}

/**
 * Merge render options with defaults
 *
 * @param options - User-provided options
 * @returns Complete options with defaults filled in
 *
 * @example
 * ```typescript
 * const options = mergeRenderOptions({ dpi: 300 });
 * // { dpi: 300, alpha: false, antiAlias: 8, ... }
 * ```
 */
export function mergeRenderOptions(options: RenderOptions): Required<RenderOptions> {
  const defaults = getDefaultRenderOptions();
  return {
    dpi: options.dpi ?? defaults.dpi!,
    colorspace: options.colorspace ?? defaults.colorspace,
    alpha: options.alpha ?? defaults.alpha!,
    antiAlias: options.antiAlias ?? defaults.antiAlias!,
    transform: options.transform ?? defaults.transform,
    renderAnnotations: options.renderAnnotations ?? defaults.renderAnnotations!,
    renderFormFields: options.renderFormFields ?? defaults.renderFormFields!
  };
}

