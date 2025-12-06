/**
 * Render Options Tests
 */

import { describe, it, expect } from 'vitest';
import {
  AntiAliasLevel,
  getDefaultRenderOptions,
  dpiToScale,
  scaleToDpi,
  validateRenderOptions,
  mergeRenderOptions,
  type RenderOptions
} from '../src/render-options.js';
import { Colorspace } from '../src/colorspace.js';
import { Matrix } from '../src/geometry.js';

describe('AntiAliasLevel', () => {
  it('should have correct enum values', () => {
    expect(AntiAliasLevel.None).toBe(0);
    expect(AntiAliasLevel.Low).toBe(2);
    expect(AntiAliasLevel.Medium).toBe(4);
    expect(AntiAliasLevel.High).toBe(8);
  });
});

describe('getDefaultRenderOptions', () => {
  it('should return default options', () => {
    const defaults = getDefaultRenderOptions();

    expect(defaults.dpi).toBe(72);
    expect(defaults.alpha).toBe(false);
    expect(defaults.antiAlias).toBe(AntiAliasLevel.High);
    expect(defaults.renderAnnotations).toBe(true);
    expect(defaults.renderFormFields).toBe(true);
  });

  it('should return new object each time', () => {
    const defaults1 = getDefaultRenderOptions();
    const defaults2 = getDefaultRenderOptions();

    expect(defaults1).not.toBe(defaults2);
    expect(defaults1).toEqual(defaults2);
  });
});

describe('dpiToScale', () => {
  it('should convert DPI to scale factor', () => {
    expect(dpiToScale(72)).toBe(1.0);
    expect(dpiToScale(144)).toBe(2.0);
    expect(dpiToScale(300)).toBeCloseTo(4.166666, 5);
    expect(dpiToScale(600)).toBeCloseTo(8.333333, 5);
  });

  it('should handle fractional DPI', () => {
    expect(dpiToScale(36)).toBeCloseTo(0.5, 5);
    expect(dpiToScale(90)).toBeCloseTo(1.25, 5);
  });
});

describe('scaleToDpi', () => {
  it('should convert scale factor to DPI', () => {
    expect(scaleToDpi(1.0)).toBe(72);
    expect(scaleToDpi(2.0)).toBe(144);
    expect(scaleToDpi(4.0)).toBe(288);
  });

  it('should be inverse of dpiToScale', () => {
    const dpi = 300;
    const scale = dpiToScale(dpi);
    const backToDpi = scaleToDpi(scale);
    expect(backToDpi).toBeCloseTo(dpi, 5);
  });

  it('should handle fractional scales', () => {
    expect(scaleToDpi(0.5)).toBe(36);
    expect(scaleToDpi(1.5)).toBe(108);
  });
});

describe('validateRenderOptions', () => {
  it('should accept valid options', () => {
    expect(() => validateRenderOptions({ dpi: 300 })).not.toThrow();
    expect(() => validateRenderOptions({ alpha: true })).not.toThrow();
    expect(() =>
      validateRenderOptions({ antiAlias: AntiAliasLevel.Medium })
    ).not.toThrow();
  });

  it('should reject negative DPI', () => {
    expect(() => validateRenderOptions({ dpi: -100 })).toThrow('DPI must be positive');
    expect(() => validateRenderOptions({ dpi: 0 })).toThrow('DPI must be positive');
  });

  it('should reject DPI too high', () => {
    expect(() => validateRenderOptions({ dpi: 3000 })).toThrow('DPI too high');
    expect(() => validateRenderOptions({ dpi: 2400 })).not.toThrow();
    expect(() => validateRenderOptions({ dpi: 2401 })).toThrow('DPI too high');
  });

  it('should reject invalid anti-alias levels', () => {
    expect(() => validateRenderOptions({ antiAlias: 3 as AntiAliasLevel })).toThrow(
      'Invalid anti-alias level'
    );
    expect(() => validateRenderOptions({ antiAlias: 16 as AntiAliasLevel })).toThrow(
      'Invalid anti-alias level'
    );
  });

  it('should accept valid anti-alias levels', () => {
    expect(() =>
      validateRenderOptions({ antiAlias: AntiAliasLevel.None })
    ).not.toThrow();
    expect(() =>
      validateRenderOptions({ antiAlias: AntiAliasLevel.Low })
    ).not.toThrow();
    expect(() =>
      validateRenderOptions({ antiAlias: AntiAliasLevel.Medium })
    ).not.toThrow();
    expect(() =>
      validateRenderOptions({ antiAlias: AntiAliasLevel.High })
    ).not.toThrow();
  });
});

describe('mergeRenderOptions', () => {
  it('should merge with defaults', () => {
    const options: RenderOptions = { dpi: 300 };
    const merged = mergeRenderOptions(options);

    expect(merged.dpi).toBe(300);
    expect(merged.alpha).toBe(false);
    expect(merged.antiAlias).toBe(AntiAliasLevel.High);
  });

  it('should preserve provided options', () => {
    const options: RenderOptions = {
      dpi: 600,
      alpha: true,
      antiAlias: AntiAliasLevel.Low,
      renderAnnotations: false
    };
    const merged = mergeRenderOptions(options);

    expect(merged.dpi).toBe(600);
    expect(merged.alpha).toBe(true);
    expect(merged.antiAlias).toBe(AntiAliasLevel.Low);
    expect(merged.renderAnnotations).toBe(false);
  });

  it('should handle empty options', () => {
    const merged = mergeRenderOptions({});
    const defaults = getDefaultRenderOptions();

    expect(merged.dpi).toBe(defaults.dpi);
    expect(merged.alpha).toBe(defaults.alpha);
    expect(merged.antiAlias).toBe(defaults.antiAlias);
  });

  it('should handle partial options', () => {
    const options: RenderOptions = {
      dpi: 150,
      renderFormFields: false
    };
    const merged = mergeRenderOptions(options);

    expect(merged.dpi).toBe(150);
    expect(merged.alpha).toBe(false); // Default
    expect(merged.antiAlias).toBe(AntiAliasLevel.High); // Default
    expect(merged.renderFormFields).toBe(false);
    expect(merged.renderAnnotations).toBe(true); // Default
  });

  it('should handle colorspace option', () => {
    const colorspace = Colorspace.deviceGray();
    const options: RenderOptions = { colorspace };
    const merged = mergeRenderOptions(options);

    expect(merged.colorspace).toBe(colorspace);
  });

  it('should handle transform option', () => {
    const transform = Matrix.scale(2, 2);
    const options: RenderOptions = { transform };
    const merged = mergeRenderOptions(options);

    expect(merged.transform).toBe(transform);
  });

  it('should handle all options at once', () => {
    const colorspace = Colorspace.deviceRGB();
    const transform = Matrix.scale(3, 3);
    const options: RenderOptions = {
      dpi: 300,
      colorspace,
      alpha: true,
      antiAlias: AntiAliasLevel.Medium,
      transform,
      renderAnnotations: false,
      renderFormFields: false
    };
    const merged = mergeRenderOptions(options);

    expect(merged.dpi).toBe(300);
    expect(merged.colorspace).toBe(colorspace);
    expect(merged.alpha).toBe(true);
    expect(merged.antiAlias).toBe(AntiAliasLevel.Medium);
    expect(merged.transform).toBe(transform);
    expect(merged.renderAnnotations).toBe(false);
    expect(merged.renderFormFields).toBe(false);
  });
});

describe('RenderOptions Interface', () => {
  it('should allow partial options', () => {
    const options1: RenderOptions = { dpi: 300 };
    const options2: RenderOptions = { alpha: true };
    const options3: RenderOptions = { antiAlias: AntiAliasLevel.Low };
    const options4: RenderOptions = {};

    expect(options1.dpi).toBe(300);
    expect(options2.alpha).toBe(true);
    expect(options3.antiAlias).toBe(AntiAliasLevel.Low);
    expect(options4).toEqual({});
  });

  it('should allow full options', () => {
    const options: RenderOptions = {
      dpi: 600,
      colorspace: Colorspace.deviceRGB(),
      alpha: true,
      antiAlias: AntiAliasLevel.High,
      transform: Matrix.identity(),
      renderAnnotations: true,
      renderFormFields: true
    };

    expect(options.dpi).toBe(600);
    expect(options.alpha).toBe(true);
  });
});

describe('Common Use Cases', () => {
  it('should support screen resolution', () => {
    const options = mergeRenderOptions({ dpi: 72 });
    expect(options.dpi).toBe(72);
    expect(dpiToScale(options.dpi)).toBe(1.0);
  });

  it('should support print resolution', () => {
    const options = mergeRenderOptions({ dpi: 300 });
    expect(options.dpi).toBe(300);
    expect(dpiToScale(options.dpi)).toBeCloseTo(4.166666, 5);
  });

  it('should support high-DPI displays', () => {
    const options = mergeRenderOptions({ dpi: 144 }); // 2x Retina
    expect(options.dpi).toBe(144);
    expect(dpiToScale(options.dpi)).toBe(2.0);
  });

  it('should support fast preview rendering', () => {
    const options = mergeRenderOptions({
      dpi: 72,
      antiAlias: AntiAliasLevel.None
    });
    expect(options.dpi).toBe(72);
    expect(options.antiAlias).toBe(AntiAliasLevel.None);
  });

  it('should support high-quality output', () => {
    const options = mergeRenderOptions({
      dpi: 600,
      alpha: true,
      antiAlias: AntiAliasLevel.High
    });
    expect(options.dpi).toBe(600);
    expect(options.alpha).toBe(true);
    expect(options.antiAlias).toBe(AntiAliasLevel.High);
  });
});

