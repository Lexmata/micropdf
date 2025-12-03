/**
 * Colorspace - Color management
 *
 * This implementation mirrors the Rust `fitz::colorspace::Colorspace` for 100% API compatibility.
 */

import { ColorspaceType, type ColorspaceLike } from './types.js';

/**
 * A colorspace for interpreting color values
 */
export class Colorspace implements ColorspaceLike {
  readonly name: string;
  readonly n: number;
  readonly type: ColorspaceType;

  private constructor(name: string, n: number, type: ColorspaceType) {
    this.name = name;
    this.n = n;
    this.type = type;
  }

  // ============================================================================
  // Device Colorspaces
  // ============================================================================

  /**
   * DeviceGray colorspace (1 component)
   */
  static deviceGray(): Colorspace {
    return new Colorspace('DeviceGray', 1, ColorspaceType.Gray);
  }

  /**
   * DeviceRGB colorspace (3 components)
   */
  static deviceRGB(): Colorspace {
    return new Colorspace('DeviceRGB', 3, ColorspaceType.RGB);
  }

  /**
   * DeviceBGR colorspace (3 components)
   */
  static deviceBGR(): Colorspace {
    return new Colorspace('DeviceBGR', 3, ColorspaceType.BGR);
  }

  /**
   * DeviceCMYK colorspace (4 components)
   */
  static deviceCMYK(): Colorspace {
    return new Colorspace('DeviceCMYK', 4, ColorspaceType.CMYK);
  }

  /**
   * Lab colorspace (3 components)
   */
  static deviceLab(): Colorspace {
    return new Colorspace('Lab', 3, ColorspaceType.Lab);
  }

  // ============================================================================
  // Type Checks
  // ============================================================================

  /**
   * Check if this is a grayscale colorspace
   */
  get isGray(): boolean {
    return this.type === ColorspaceType.Gray;
  }

  /**
   * Check if this is an RGB colorspace
   */
  get isRGB(): boolean {
    return this.type === ColorspaceType.RGB;
  }

  /**
   * Check if this is a BGR colorspace
   */
  get isBGR(): boolean {
    return this.type === ColorspaceType.BGR;
  }

  /**
   * Check if this is a CMYK colorspace
   */
  get isCMYK(): boolean {
    return this.type === ColorspaceType.CMYK;
  }

  /**
   * Check if this is a Lab colorspace
   */
  get isLab(): boolean {
    return this.type === ColorspaceType.Lab;
  }

  /**
   * Check if this is an indexed colorspace
   */
  get isIndexed(): boolean {
    return this.type === ColorspaceType.Indexed;
  }

  /**
   * Check if this is a device colorspace
   */
  get isDevice(): boolean {
    return (
      this.type === ColorspaceType.Gray ||
      this.type === ColorspaceType.RGB ||
      this.type === ColorspaceType.BGR ||
      this.type === ColorspaceType.CMYK
    );
  }

  // ============================================================================
  // Color Conversion
  // ============================================================================

  /**
   * Convert color values to RGB
   */
  toRGB(values: number[]): [number, number, number] {
    if (values.length < this.n) {
      throw new Error(`Expected ${this.n} color values, got ${values.length}`);
    }

    switch (this.type) {
      case ColorspaceType.Gray: {
        const g = Math.max(0, Math.min(1, values[0] ?? 0));
        return [g, g, g];
      }
      case ColorspaceType.RGB: {
        return [
          Math.max(0, Math.min(1, values[0] ?? 0)),
          Math.max(0, Math.min(1, values[1] ?? 0)),
          Math.max(0, Math.min(1, values[2] ?? 0)),
        ];
      }
      case ColorspaceType.BGR: {
        return [
          Math.max(0, Math.min(1, values[2] ?? 0)),
          Math.max(0, Math.min(1, values[1] ?? 0)),
          Math.max(0, Math.min(1, values[0] ?? 0)),
        ];
      }
      case ColorspaceType.CMYK: {
        const c = Math.max(0, Math.min(1, values[0] ?? 0));
        const m = Math.max(0, Math.min(1, values[1] ?? 0));
        const y = Math.max(0, Math.min(1, values[2] ?? 0));
        const k = Math.max(0, Math.min(1, values[3] ?? 0));
        return [
          (1 - c) * (1 - k),
          (1 - m) * (1 - k),
          (1 - y) * (1 - k),
        ];
      }
      case ColorspaceType.Lab: {
        // Simplified Lab to RGB conversion
        const L = (values[0] ?? 0) * 100;
        const a = (values[1] ?? 0) * 256 - 128;
        const b = (values[2] ?? 0) * 256 - 128;

        // Lab to XYZ
        const fy = (L + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - b / 200;

        const xr = fx > 0.206893 ? fx * fx * fx : (fx - 16 / 116) / 7.787;
        const yr = L > 7.9996 ? Math.pow((L + 16) / 116, 3) : L / 903.3;
        const zr = fz > 0.206893 ? fz * fz * fz : (fz - 16 / 116) / 7.787;

        // D65 illuminant
        const X = xr * 0.95047;
        const Y = yr * 1.0;
        const Z = zr * 1.08883;

        // XYZ to RGB
        const r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
        const g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
        const bl = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

        return [
          Math.max(0, Math.min(1, r)),
          Math.max(0, Math.min(1, g)),
          Math.max(0, Math.min(1, bl)),
        ];
      }
      default:
        throw new Error(`Unsupported colorspace: ${this.type}`);
    }
  }

  /**
   * Convert color values to CMYK
   */
  toCMYK(values: number[]): [number, number, number, number] {
    const rgb = this.toRGB(values);
    const k = 1 - Math.max(rgb[0], rgb[1], rgb[2]);
    if (k === 1) {
      return [0, 0, 0, 1];
    }
    return [
      (1 - rgb[0] - k) / (1 - k),
      (1 - rgb[1] - k) / (1 - k),
      (1 - rgb[2] - k) / (1 - k),
      k,
    ];
  }

  /**
   * Convert color values to grayscale
   */
  toGray(values: number[]): number {
    const rgb = this.toRGB(values);
    // Luminance formula
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  // ============================================================================
  // Utility
  // ============================================================================

  toString(): string {
    return `Colorspace(${this.name}, n=${this.n})`;
  }

  /**
   * Clone this colorspace
   */
  clone(): Colorspace {
    return new Colorspace(this.name, this.n, this.type);
  }
}

/**
 * Convert a color from one colorspace to another
 */
export function convertColor(
  srcColorspace: Colorspace,
  srcValues: number[],
  dstColorspace: Colorspace
): number[] {
  // First convert to RGB
  const rgb = srcColorspace.toRGB(srcValues);

  // Then convert from RGB to destination
  switch (dstColorspace.type) {
    case ColorspaceType.Gray:
      return [0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]];
    case ColorspaceType.RGB:
      return [...rgb];
    case ColorspaceType.BGR:
      return [rgb[2], rgb[1], rgb[0]];
    case ColorspaceType.CMYK: {
      const k = 1 - Math.max(rgb[0], rgb[1], rgb[2]);
      if (k === 1) {
        return [0, 0, 0, 1];
      }
      return [
        (1 - rgb[0] - k) / (1 - k),
        (1 - rgb[1] - k) / (1 - k),
        (1 - rgb[2] - k) / (1 - k),
        k,
      ];
    }
    default:
      throw new Error(`Unsupported destination colorspace: ${dstColorspace.type}`);
  }
}

