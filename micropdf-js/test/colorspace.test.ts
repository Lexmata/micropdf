/**
 * Tests for Colorspace module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Colorspace, ColorspaceType } from '../src/index.js';

describe('Colorspace', () => {
  describe('built-in colorspaces', () => {
    it('should create DeviceGray', () => {
      const cs = Colorspace.deviceGray();
      expect(cs.type).toBe(ColorspaceType.Gray);
      expect(cs.n).toBe(1);
      expect(cs.name).toBe('DeviceGray');
    });

    it('should create DeviceRGB', () => {
      const cs = Colorspace.deviceRGB();
      expect(cs.type).toBe(ColorspaceType.RGB);
      expect(cs.n).toBe(3);
      expect(cs.name).toBe('DeviceRGB');
    });

    it('should create DeviceCMYK', () => {
      const cs = Colorspace.deviceCMYK();
      expect(cs.type).toBe(ColorspaceType.CMYK);
      expect(cs.n).toBe(4);
      expect(cs.name).toBe('DeviceCMYK');
    });

    it('should create DeviceBGR', () => {
      const cs = Colorspace.deviceBGR();
      expect(cs.type).toBe(ColorspaceType.BGR);
      expect(cs.n).toBe(3);
      expect(cs.name).toBe('DeviceBGR');
    });

    it('should create Lab', () => {
      const cs = Colorspace.deviceLab();
      expect(cs.type).toBe(ColorspaceType.Lab);
      expect(cs.n).toBe(3);
      expect(cs.name).toBe('Lab');
    });
  });

  describe('type checks', () => {
    it('should detect gray colorspace', () => {
      const cs = Colorspace.deviceGray();
      expect(cs.isGray).toBe(true);
      expect(cs.isRGB).toBe(false);
    });

    it('should detect RGB colorspace', () => {
      const cs = Colorspace.deviceRGB();
      expect(cs.isGray).toBe(false);
      expect(cs.isRGB).toBe(true);
      expect(cs.isCMYK).toBe(false);
    });

    it('should detect CMYK colorspace', () => {
      const cs = Colorspace.deviceCMYK();
      expect(cs.isCMYK).toBe(true);
      expect(cs.isRGB).toBe(false);
    });

    it('should detect Lab colorspace', () => {
      const cs = Colorspace.deviceLab();
      expect(cs.isLab).toBe(true);
    });

    it('should detect device colorspace', () => {
      expect(Colorspace.deviceRGB().isDevice).toBe(true);
      expect(Colorspace.deviceGray().isDevice).toBe(true);
      expect(Colorspace.deviceCMYK().isDevice).toBe(true);
    });
  });

  describe('color conversion', () => {
    it('should convert RGB to gray', () => {
      const rgb = Colorspace.deviceRGB();
      const rgbColor = [1.0, 0.5, 0.0]; // Orange

      // toRGB should return same values for RGB
      const result = rgb.toRGB(rgbColor);
      expect(result[0]).toBeCloseTo(1.0);
      expect(result[1]).toBeCloseTo(0.5);
      expect(result[2]).toBeCloseTo(0.0);
    });

    it('should convert gray to RGB', () => {
      const gray = Colorspace.deviceGray();
      const grayColor = [0.5];
      const result = gray.toRGB(grayColor);

      expect(result.length).toBe(3);
      expect(result[0]).toBeCloseTo(0.5);
      expect(result[1]).toBeCloseTo(0.5);
      expect(result[2]).toBeCloseTo(0.5);
    });

    it('should convert CMYK to RGB', () => {
      const cmyk = Colorspace.deviceCMYK();
      // Pure cyan: C=1, M=0, Y=0, K=0
      const cmykColor = [1.0, 0.0, 0.0, 0.0];
      const result = cmyk.toRGB(cmykColor);

      expect(result.length).toBe(3);
      expect(result[0]).toBeCloseTo(0); // No red
      expect(result[1]).toBeCloseTo(1); // Full green
      expect(result[2]).toBeCloseTo(1); // Full blue
    });

    it('should convert BGR to RGB', () => {
      const bgr = Colorspace.deviceBGR();
      const bgrColor = [0.0, 0.5, 1.0]; // B=0, G=0.5, R=1
      const result = bgr.toRGB(bgrColor);

      expect(result[0]).toBeCloseTo(1.0); // R
      expect(result[1]).toBeCloseTo(0.5); // G
      expect(result[2]).toBeCloseTo(0.0); // B
    });
  });
});
