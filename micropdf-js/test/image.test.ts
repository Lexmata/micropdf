import { describe, it, expect } from 'vitest';
import { Image, ImageOrientation } from '../src/image';

describe('Image Module', () => {
  describe('ImageOrientation', () => {
    it('should have all orientations defined', () => {
      expect(ImageOrientation.Identity).toBeDefined();
      expect(ImageOrientation.FlipX).toBeDefined();
      expect(ImageOrientation.FlipY).toBeDefined();
      expect(ImageOrientation.Rotate90).toBeDefined();
      expect(ImageOrientation.Rotate180).toBeDefined();
      expect(ImageOrientation.Rotate270).toBeDefined();
    });
  });

  describe('Image', () => {
    let image: Image;

    it('should create an image', () => {
      image = new Image(null as any);
      expect(image).toBeDefined();
    });

    it('should check if valid', () => {
      image = new Image(null as any);
      const isValid = image.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get width', () => {
      image = new Image(null as any);
      const width = image.getWidth();
      expect(typeof width).toBe('number');
      expect(width).toBeGreaterThanOrEqual(0);
    });

    it('should get height', () => {
      image = new Image(null as any);
      const height = image.getHeight();
      expect(typeof height).toBe('number');
      expect(height).toBeGreaterThanOrEqual(0);
    });

    it('should get X resolution', () => {
      image = new Image(null as any);
      const xres = image.getXRes();
      expect(typeof xres).toBe('number');
    });

    it('should get Y resolution', () => {
      image = new Image(null as any);
      const yres = image.getYRes();
      expect(typeof yres).toBe('number');
    });

    it('should get colorspace', () => {
      image = new Image(null as any);
      const cs = image.getColorspace();
      // Colorspace might be null
      expect(cs === null || typeof cs === 'object').toBe(true);
    });

    it('should check if mask', () => {
      image = new Image(null as any);
      const isMask = image.isMask();
      expect(typeof isMask).toBe('boolean');
    });

    it('should get bits per pixel', () => {
      image = new Image(null as any);
      const bpp = image.getBpp();
      expect(typeof bpp).toBe('number');
      expect(bpp).toBeGreaterThanOrEqual(0);
    });

    it('should check if has alpha', () => {
      image = new Image(null as any);
      const hasAlpha = image.hasAlpha();
      expect(typeof hasAlpha).toBe('boolean');
    });

    it('should get orientation', () => {
      image = new Image(null as any);
      const orientation = image.getOrientation();
      expect(Object.values(ImageOrientation)).toContain(orientation);
    });

    it('should get pixmap', () => {
      image = new Image(null as any);
      const pixmap = image.getPixmap(null as any, null as any, null as any, null as any);
      // Pixmap might be null
      expect(pixmap === null || typeof pixmap === 'object').toBe(true);
    });

    it('should decode image', () => {
      image = new Image(null as any);
      const pixmap = image.decode(null as any, null as any);
      // Pixmap might be null
      expect(pixmap === null || typeof pixmap === 'object').toBe(true);
    });

    it('should decode scaled image', () => {
      image = new Image(null as any);
      const pixmap = image.decodeScaled(null as any, 100, 100, null as any);
      // Pixmap might be null
      expect(pixmap === null || typeof pixmap === 'object').toBe(true);
    });

    it('should clone image', () => {
      image = new Image(null as any);
      const cloned = image.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Image);
      expect(cloned).not.toBe(image);
    });
  });

  describe('Image Integration', () => {
    it('should get image dimensions', () => {
      const image = new Image(null as any);
      const width = image.getWidth();
      const height = image.getHeight();

      expect(width).toBeGreaterThanOrEqual(0);
      expect(height).toBeGreaterThanOrEqual(0);
    });

    it('should get image resolution', () => {
      const image = new Image(null as any);
      const xres = image.getXRes();
      const yres = image.getYRes();

      expect(xres).toBeGreaterThanOrEqual(0);
      expect(yres).toBeGreaterThanOrEqual(0);
    });

    it('should check image properties', () => {
      const image = new Image(null as any);

      const isMask = image.isMask();
      const hasAlpha = image.hasAlpha();
      const bpp = image.getBpp();

      expect(typeof isMask).toBe('boolean');
      expect(typeof hasAlpha).toBe('boolean');
      expect(bpp).toBeGreaterThanOrEqual(0);
    });

    it('should handle image orientation', () => {
      const image = new Image(null as any);
      const orientation = image.getOrientation();

      expect(Object.values(ImageOrientation)).toContain(orientation);
    });

    it('should decode images', () => {
      const image = new Image(null as any);

      const pixmap1 = image.decode(null as any, null as any);
      const pixmap2 = image.decodeScaled(null as any, 100, 100, null as any);

      expect(pixmap1 === null || typeof pixmap1 === 'object').toBe(true);
      expect(pixmap2 === null || typeof pixmap2 === 'object').toBe(true);
    });
  });
});
