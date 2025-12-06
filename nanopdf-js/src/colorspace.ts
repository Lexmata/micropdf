/**
 * Colorspace - PDF color space handling
 *
 * This module provides 100% API compatibility with MuPDF's colorspace operations.
 * Handles color spaces, conversion, and color manipulation.
 */

/**
 * Colorspace types
 */
export enum ColorspaceType {
  None = 0,
  Gray = 1,
  RGB = 2,
  BGR = 3,
  CMYK = 4,
  Lab = 5,
  Indexed = 6,
  Separation = 7,
  DeviceN = 8,
  ICC = 9
}

/**
 * A PDF colorspace
 */
export class Colorspace {
  private _type: ColorspaceType;
  private _n: number;
  private _name: string;
  private _refCount: number = 1;
  private _base: Colorspace | null = null;
  private _high: number = 255;
  private _lookup: Uint8Array | null = null;
  private _colorants: string[] = [];

  constructor(type: ColorspaceType, n: number, name?: string) {
    this._type = type;
    this._n = n;
    this._name = name || this.getDefaultName(type);
  }

  private getDefaultName(type: ColorspaceType): string {
    const names: Record<ColorspaceType, string> = {
      [ColorspaceType.None]: 'None',
      [ColorspaceType.Gray]: 'DeviceGray',
      [ColorspaceType.RGB]: 'DeviceRGB',
      [ColorspaceType.BGR]: 'DeviceBGR',
      [ColorspaceType.CMYK]: 'DeviceCMYK',
      [ColorspaceType.Lab]: 'Lab',
      [ColorspaceType.Indexed]: 'Indexed',
      [ColorspaceType.Separation]: 'Separation',
      [ColorspaceType.DeviceN]: 'DeviceN',
      [ColorspaceType.ICC]: 'ICCBased'
    };
    return names[type];
  }

  // ============================================================================
  // Device Colorspaces (Singletons)
  // ============================================================================

  private static _deviceGray: Colorspace | null = null;
  private static _deviceRGB: Colorspace | null = null;
  private static _deviceBGR: Colorspace | null = null;
  private static _deviceCMYK: Colorspace | null = null;
  private static _deviceLab: Colorspace | null = null;
  private static _deviceSRGB: Colorspace | null = null;
  private static _deviceGrayscale: Colorspace | null = null;

  static deviceGray(): Colorspace {
    if (!Colorspace._deviceGray) {
      Colorspace._deviceGray = new Colorspace(ColorspaceType.Gray, 1);
    }
    return Colorspace._deviceGray;
  }

  static deviceRGB(): Colorspace {
    if (!Colorspace._deviceRGB) {
      Colorspace._deviceRGB = new Colorspace(ColorspaceType.RGB, 3);
    }
    return Colorspace._deviceRGB;
  }

  static deviceBGR(): Colorspace {
    if (!Colorspace._deviceBGR) {
      Colorspace._deviceBGR = new Colorspace(ColorspaceType.BGR, 3);
    }
    return Colorspace._deviceBGR;
  }

  static deviceCMYK(): Colorspace {
    if (!Colorspace._deviceCMYK) {
      Colorspace._deviceCMYK = new Colorspace(ColorspaceType.CMYK, 4);
    }
    return Colorspace._deviceCMYK;
  }

  static deviceLab(): Colorspace {
    if (!Colorspace._deviceLab) {
      Colorspace._deviceLab = new Colorspace(ColorspaceType.Lab, 3);
    }
    return Colorspace._deviceLab;
  }

  static deviceSRGB(): Colorspace {
    if (!Colorspace._deviceSRGB) {
      Colorspace._deviceSRGB = new Colorspace(ColorspaceType.RGB, 3, 'sRGB');
    }
    return Colorspace._deviceSRGB;
  }

  static deviceGrayscale(): Colorspace {
    if (!Colorspace._deviceGrayscale) {
      Colorspace._deviceGrayscale = new Colorspace(ColorspaceType.Gray, 1, 'Grayscale');
    }
    return Colorspace._deviceGrayscale;
  }

  // Convenience aliases
  static createGray(): Colorspace {
    return Colorspace.deviceGray();
  }

  static createRGB(): Colorspace {
    return Colorspace.deviceRGB();
  }

  static createCMYK(): Colorspace {
    return Colorspace.deviceCMYK();
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
   * Clone this colorspace
   */
  clone(): Colorspace {
    const cloned = new Colorspace(this._type, this._n, this._name);
    cloned._base = this._base;
    cloned._high = this._high;
    cloned._lookup = this._lookup ? new Uint8Array(this._lookup) : null;
    cloned._colorants = [...this._colorants];
    return cloned;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Get number of components
   */
  get n(): number {
    return this._n;
  }

  /**
   * Get colorspace type
   */
  get type(): ColorspaceType {
    return this._type;
  }

  /**
   * Get colorspace name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get name as string (alias)
   */
  nameString(): string {
    return this._name;
  }

  /**
   * Get base colorspace (for indexed/separation)
   */
  base(): Colorspace | null {
    return this._base;
  }

  /**
   * Get base colorspace component count
   */
  baseN(): number {
    return this._base ? this._base.n : 0;
  }

  /**
   * Get high value (for indexed)
   */
  high(): number {
    return this._high;
  }

  /**
   * Get lookup table (for indexed)
   */
  lookup(): Uint8Array | null {
    return this._lookup;
  }

  /**
   * Get maximum color value
   */
  max(): number {
    return this._type === ColorspaceType.Lab ? 100 : 1;
  }

  // ============================================================================
  // Type Checking
  // ============================================================================

  isGray(): boolean {
    return this._type === ColorspaceType.Gray;
  }

  isRGB(): boolean {
    return this._type === ColorspaceType.RGB || this._type === ColorspaceType.BGR;
  }

  isCMYK(): boolean {
    return this._type === ColorspaceType.CMYK;
  }

  isLab(): boolean {
    return this._type === ColorspaceType.Lab;
  }

  isDevice(): boolean {
    return (
      this._type === ColorspaceType.Gray ||
      this._type === ColorspaceType.RGB ||
      this._type === ColorspaceType.BGR ||
      this._type === ColorspaceType.CMYK
    );
  }

  isIndexed(): boolean {
    return this._type === ColorspaceType.Indexed;
  }

  isDeviceN(): boolean {
    return this._type === ColorspaceType.DeviceN;
  }

  isICC(): boolean {
    return this._type === ColorspaceType.ICC;
  }

  isSubtractive(): boolean {
    return this._type === ColorspaceType.CMYK;
  }

  // ============================================================================
  // DeviceN Colorspace Checks
  // ============================================================================

  deviceNHasCMYK(): boolean {
    if (this._type !== ColorspaceType.DeviceN) {
      return false;
    }
    return this._colorants.some((c) => ['Cyan', 'Magenta', 'Yellow', 'Black'].includes(c));
  }

  deviceNHasOnlyCMYK(): boolean {
    if (this._type !== ColorspaceType.DeviceN) {
      return false;
    }
    return this._colorants.every((c) => ['Cyan', 'Magenta', 'Yellow', 'Black'].includes(c));
  }

  hasSpots(): boolean {
    return this._type === ColorspaceType.Separation || this._type === ColorspaceType.DeviceN;
  }

  numSpots(): number {
    if (this._type === ColorspaceType.Separation) {
      return 1;
    }
    if (this._type === ColorspaceType.DeviceN) {
      return this._colorants.length;
    }
    return 0;
  }

  // ============================================================================
  // Colorants
  // ============================================================================

  /**
   * Get colorant name by index
   */
  colorant(index: number): string | null {
    return this._colorants[index] || null;
  }

  /**
   * Get number of colorants
   */
  numColorants(): number {
    return this._colorants.length;
  }

  /**
   * Get all colorants
   */
  getColorants(): string[] {
    return [...this._colorants];
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create indexed colorspace
   */
  static createIndexed(base: Colorspace, high: number, lookup: Uint8Array): Colorspace {
    const cs = new Colorspace(ColorspaceType.Indexed, 1, 'Indexed');
    cs._base = base;
    cs._high = high;
    cs._lookup = lookup;
    return cs;
  }

  /**
   * Create DeviceN colorspace
   */
  static createDeviceN(colorants: string[]): Colorspace {
    const cs = new Colorspace(ColorspaceType.DeviceN, colorants.length, 'DeviceN');
    cs._colorants = [...colorants];
    return cs;
  }

  /**
   * Create ICC-based colorspace
   */
  static createICC(n: number, name?: string): Colorspace {
    return new Colorspace(ColorspaceType.ICC, n, name || 'ICCBased');
  }

  // ============================================================================
  // Color Conversion
  // ============================================================================

  /**
   * Convert color from this colorspace to another
   */
  convertColor(destCS: Colorspace, srcColor: number[]): number[] {
    if (this.equals(destCS)) {
      return [...srcColor];
    }

    // Convert to RGB as intermediate
    const rgb = this.toRGB(srcColor);

    // Convert from RGB to destination
    return destCS.fromRGB(rgb);
  }

  /**
   * Convert color to RGB
   */
  private toRGB(color: number[]): [number, number, number] {
    switch (this._type) {
      case ColorspaceType.Gray:
        return [color[0]!, color[0]!, color[0]!];

      case ColorspaceType.RGB:
        return [color[0]!, color[1]!, color[2]!];

      case ColorspaceType.BGR:
        return [color[2]!, color[1]!, color[0]!];

      case ColorspaceType.CMYK: {
        const c = color[0]!;
        const m = color[1]!;
        const y = color[2]!;
        const k = color[3]!;
        return [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
      }

      default:
        return [0, 0, 0];
    }
  }

  /**
   * Convert RGB to this colorspace
   */
  private fromRGB(rgb: [number, number, number]): number[] {
    const [r, g, b] = rgb;

    switch (this._type) {
      case ColorspaceType.Gray:
        return [0.299 * r + 0.587 * g + 0.114 * b];

      case ColorspaceType.RGB:
        return [r, g, b];

      case ColorspaceType.BGR:
        return [b, g, r];

      case ColorspaceType.CMYK: {
        const k = 1 - Math.max(r, g, b);
        if (k === 1) {
          return [0, 0, 0, 1];
        }
        return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
      }

      default:
        return new Array(this._n).fill(0);
    }
  }

  /**
   * Convert a single pixel
   */
  convertPixel(destCS: Colorspace, srcPixel: Uint8Array, destPixel: Uint8Array): void {
    const srcColor = Array.from(srcPixel.slice(0, this._n)).map((v) => v / 255);
    const destColor = this.convertColor(destCS, srcColor);
    for (let i = 0; i < destCS._n; i++) {
      destPixel[i] = Math.round(destColor[i]! * 255);
    }
  }

  /**
   * Clamp color values to valid range
   */
  clampColor(color: number[]): number[] {
    const max = this.max();
    return color.map((v) => Math.max(0, Math.min(max, v)));
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Check if two colorspaces are equal
   */
  equals(other: Colorspace): boolean {
    if (this._type !== other._type) {
      return false;
    }
    if (this._n !== other._n) {
      return false;
    }
    if (this._name !== other._name) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if colorspace is valid
   */
  isValid(): boolean {
    if (this._n <= 0 || this._n > 32) {
      return false;
    }
    if (this._type === ColorspaceType.None) {
      return false;
    }
    return true;
  }
}
