import { describe, it, expect } from 'vitest';
import { Font } from '../src/font';
import { Rect } from '../src/geometry';

describe('Font Module', () => {
  describe('Font', () => {
    let font: Font;

    it('should create a font', () => {
      font = new Font(null as any);
      expect(font).toBeDefined();
    });

    it('should check if valid', () => {
      font = new Font(null as any);
      const isValid = font.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get font name', () => {
      font = new Font(null as any);
      const name = font.getName();
      expect(typeof name).toBe('string');
    });

    it('should check if bold', () => {
      font = new Font(null as any);
      const isBold = font.isBold();
      expect(typeof isBold).toBe('boolean');
    });

    it('should check if italic', () => {
      font = new Font(null as any);
      const isItalic = font.isItalic();
      expect(typeof isItalic).toBe('boolean');
    });

    it('should check if serif', () => {
      font = new Font(null as any);
      const isSerif = font.isSerif();
      expect(typeof isSerif).toBe('boolean');
    });

    it('should check if monospaced', () => {
      font = new Font(null as any);
      const isMonospaced = font.isMonospaced();
      expect(typeof isMonospaced).toBe('boolean');
    });

    it('should check if embedded', () => {
      font = new Font(null as any);
      const isEmbedded = font.isEmbedded();
      expect(typeof isEmbedded).toBe('boolean');
    });

    it('should encode character', () => {
      font = new Font(null as any);
      const gid = font.encodeCharacter(65); // 'A'
      expect(typeof gid).toBe('number');
    });

    it('should encode character with fallback', () => {
      font = new Font(null as any);
      const result = font.encodeCharacterWithFallback(65, 0, 0);
      expect(typeof result).toBe('number');
    });

    it('should get glyph advance', () => {
      font = new Font(null as any);
      const advance = font.advanceGlyph(1, false);
      expect(typeof advance).toBe('number');
    });

    it('should get glyph bounding box', () => {
      font = new Font(null as any);
      const bbox = font.boundGlyph(1, Matrix.IDENTITY);
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should get font bounding box', () => {
      font = new Font(null as any);
      const bbox = font.bbox();
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should get glyph outline', () => {
      font = new Font(null as any);
      const outline = font.outlineGlyph(1, Matrix.IDENTITY);
      // Outline might be null for some glyphs
      expect(outline === null || typeof outline === 'object').toBe(true);
    });

    it('should get glyph name', () => {
      font = new Font(null as any);
      const name = font.glyphName(1);
      expect(typeof name === 'string' || name === null).toBe(true);
    });

    it('should get ascender', () => {
      font = new Font(null as any);
      const ascender = font.ascender();
      expect(typeof ascender).toBe('number');
    });

    it('should get descender', () => {
      font = new Font(null as any);
      const descender = font.descender();
      expect(typeof descender).toBe('number');
    });

    it('should clone font', () => {
      font = new Font(null as any);
      const cloned = font.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Font);
      expect(cloned).not.toBe(font);
    });
  });

  describe('Font Integration', () => {
    it('should get font properties', () => {
      const font = new Font(null as any);

      const name = font.getName();
      const isBold = font.isBold();
      const isItalic = font.isItalic();
      const isSerif = font.isSerif();
      const isMonospaced = font.isMonospaced();

      expect(typeof name).toBe('string');
      expect(typeof isBold).toBe('boolean');
      expect(typeof isItalic).toBe('boolean');
      expect(typeof isSerif).toBe('boolean');
      expect(typeof isMonospaced).toBe('boolean');
    });

    it('should handle character encoding', () => {
      const font = new Font(null as any);

      // Encode common characters
      const A = font.encodeCharacter(65);
      const B = font.encodeCharacter(66);
      const space = font.encodeCharacter(32);

      expect(typeof A).toBe('number');
      expect(typeof B).toBe('number');
      expect(typeof space).toBe('number');
    });

    it('should measure glyphs', () => {
      const font = new Font(null as any);
      const gid = font.encodeCharacter(65); // 'A'

      const advance = font.advanceGlyph(gid, false);
      const bbox = font.boundGlyph(gid, Matrix.IDENTITY);

      expect(typeof advance).toBe('number');
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should get font metrics', () => {
      const font = new Font(null as any);

      const bbox = font.bbox();
      const ascender = font.ascender();
      const descender = font.descender();

      expect(bbox).toBeInstanceOf(Rect);
      expect(typeof ascender).toBe('number');
      expect(typeof descender).toBe('number');
    });

    it('should handle glyph outlines', () => {
      const font = new Font(null as any);
      const gid = font.encodeCharacter(65); // 'A'

      const outline = font.outlineGlyph(gid, Matrix.IDENTITY);
      expect(outline === null || typeof outline === 'object').toBe(true);
    });
  });
});
