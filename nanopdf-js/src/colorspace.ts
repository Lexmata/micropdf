/**
 * Colorspace - PDF color space handling
 * 
 * Stub module for Device dependencies. Full implementation coming in Phase 3.
 */

export enum ColorspaceType {
  Gray = 0,
  RGB = 1,
  CMYK = 2,
  Lab = 3,
  Indexed = 4,
  Separation = 5,
}

export class Colorspace {
  private _type: ColorspaceType;
  private _n: number;

  constructor(type: ColorspaceType, n: number) {
    this._type = type;
    this._n = n;
  }

  static createGray(): Colorspace {
    return new Colorspace(ColorspaceType.Gray, 1);
  }

  static createRGB(): Colorspace {
    return new Colorspace(ColorspaceType.RGB, 3);
  }

  static createCMYK(): Colorspace {
    return new Colorspace(ColorspaceType.CMYK, 4);
  }

  get type(): ColorspaceType {
    return this._type;
  }

  get n(): number {
    return this._n;
  }
}
