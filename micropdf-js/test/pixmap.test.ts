/**
 * Tests for Pixmap module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Pixmap, Colorspace, IRect, ColorspaceType } from '../src/index.js';

describe('Pixmap', () => {
  describe('creation', () => {
    it('should create RGB pixmap', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 100, 50, true);

      expect(pixmap.width).toBe(100);
      expect(pixmap.height).toBe(50);
      expect(pixmap.n).toBe(4); // RGB + alpha
      expect(pixmap.alpha).toBe(true);
    });

    it('should create grayscale pixmap without alpha', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 200, 100, false);

      expect(pixmap.width).toBe(200);
      expect(pixmap.height).toBe(100);
      expect(pixmap.n).toBe(1);
      expect(pixmap.alpha).toBe(false);
    });

    it('should create pixmap with bbox', () => {
      const cs = Colorspace.deviceRGB();
      const bbox = new IRect(10, 20, 110, 70);
      const pixmap = Pixmap.createWithBbox(cs, bbox, true);

      expect(pixmap.x).toBe(10);
      expect(pixmap.y).toBe(20);
      expect(pixmap.width).toBe(100);
      expect(pixmap.height).toBe(50);
    });

    it('should create from samples', () => {
      const cs = Colorspace.deviceGray();
      const samples = new Uint8Array([0, 64, 128, 192, 255, 0, 64, 128, 192, 255]);
      const pixmap = Pixmap.fromSamples(cs, 5, 2, false, samples);

      expect(pixmap.width).toBe(5);
      expect(pixmap.height).toBe(2);
    });
  });

  describe('properties', () => {
    it('should get dimensions', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 100, 50, true);

      expect(pixmap.width).toBe(100);
      expect(pixmap.height).toBe(50);
    });

    it('should get colorspace', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 10, 10, false);

      expect(pixmap.colorspace?.type).toBe(ColorspaceType.RGB);
    });

    it('should get stride', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 100, 50, true);

      // stride should be at least width * n
      expect(pixmap.stride).toBeGreaterThanOrEqual(100 * 4);
    });
  });

  describe('pixel operations', () => {
    it('should get pixel', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 10, 10, true);
      pixmap.clearWithValue(255);

      const pixel = pixmap.getPixel(5, 5);
      expect(pixel.length).toBe(4);
      expect(pixel[0]).toBe(255);
      expect(pixel[1]).toBe(255);
      expect(pixel[2]).toBe(255);
      expect(pixel[3]).toBe(255);
    });

    it('should set pixel', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 10, 10, true);

      pixmap.setPixel(3, 3, [255, 0, 0, 255]); // Red
      const pixel = pixmap.getPixel(3, 3);

      expect(pixel[0]).toBe(255);
      expect(pixel[1]).toBe(0);
      expect(pixel[2]).toBe(0);
      expect(pixel[3]).toBe(255);
    });

    it('should clear to value', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 5, 5, false);
      pixmap.clearWithValue(128);

      const pixel = pixmap.getPixel(0, 0);
      expect(pixel[0]).toBe(128);
    });
  });

  describe('transformations', () => {
    it('should invert colors', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 2, 2, false);
      pixmap.clearWithValue(64);

      pixmap.invert();
      const pixel = pixmap.getPixel(0, 0);
      expect(pixel[0]).toBe(255 - 64);
    });

    it('should apply gamma', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 2, 2, false);
      pixmap.clearWithValue(128);

      // Gamma correction: output = input^(1/gamma)
      // With gamma=2.0, invGamma=0.5
      // (128/255)^0.5 = 0.707..., * 255 ≈ 180
      pixmap.gamma(2.0);
      const pixel = pixmap.getPixel(0, 0);

      // Result should be approximately sqrt(0.5) * 255 ≈ 180
      expect(pixel[0]).toBeGreaterThan(170);
      expect(pixel[0]).toBeLessThan(190);
    });

    it('should tint pixmap', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 2, 2, false);
      pixmap.clearWithValue(255); // White

      pixmap.tint([1.0, 0.0, 0.0]); // Red tint
      const pixel = pixmap.getPixel(0, 0);

      expect(pixel[0]).toBe(255);
      expect(pixel[1]).toBe(0);
      expect(pixel[2]).toBe(0);
    });
  });

  describe('samples access', () => {
    it('should get samples', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 3, 2, false);
      pixmap.clearWithValue(100);

      const samples = pixmap.samples;
      expect(samples.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('conversion', () => {
    it('should convert to RGBA', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 2, 2, true);
      pixmap.clearWithValue(255);

      const rgba = pixmap.toRGBA();
      expect(rgba.length).toBe(2 * 2 * 4);
    });

    it('should convert gray to RGBA', () => {
      const cs = Colorspace.deviceGray();
      const pixmap = Pixmap.create(cs, 2, 2, false);
      pixmap.clearWithValue(128);

      const rgba = pixmap.toRGBA();
      expect(rgba.length).toBe(2 * 2 * 4);
      expect(rgba[0]).toBe(128); // R
      expect(rgba[1]).toBe(128); // G
      expect(rgba[2]).toBe(128); // B
      expect(rgba[3]).toBe(255); // A
    });

    it('should clone pixmap', () => {
      const cs = Colorspace.deviceRGB();
      const pixmap = Pixmap.create(cs, 10, 10, true);
      pixmap.setPixel(5, 5, [255, 0, 0, 255]);

      const clone = pixmap.clone();
      expect(clone.width).toBe(pixmap.width);
      expect(clone.height).toBe(pixmap.height);

      const pixel = clone.getPixel(5, 5);
      expect(pixel[0]).toBe(255);
    });
  });
});
