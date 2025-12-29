import { describe, it, expect } from 'vitest';
import { Text, Language } from '../src/text';
import { Rect, Matrix } from '../src/geometry';

describe('Text Module', () => {
  describe('Language', () => {
    it('should have language codes defined', () => {
      expect(Language.UNSET).toBeDefined();
      expect(Language.zh).toBeDefined();
      expect(Language.en).toBeDefined();
      expect(Language.es).toBeDefined();
      expect(Language.fr).toBeDefined();
      expect(Language.de).toBeDefined();
      expect(Language.ja).toBeDefined();
      expect(Language.ko).toBeDefined();
    });
  });

  describe('Text', () => {
    let text: Text;

    it('should create a text object', () => {
      text = new Text(null as any);
      expect(text).toBeDefined();
    });

    it('should check if valid', () => {
      text = new Text(null as any);
      const isValid = text.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should check if empty', () => {
      text = new Text(null as any);
      const isEmpty = text.isEmpty();
      expect(typeof isEmpty).toBe('boolean');
    });

    it('should get language', () => {
      text = new Text(null as any);
      const lang = text.getLanguage();
      expect(typeof lang).toBe('number');
    });

    it('should set language', () => {
      text = new Text(null as any);
      text.setLanguage(Language.en);
      expect(text.getLanguage()).toBe(Language.en);
    });

    it('should get bounding box', () => {
      text = new Text(null as any);
      const bbox = text.getBounds(null as any, Matrix.IDENTITY);
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should show glyph', () => {
      text = new Text(null as any);
      text.showGlyph(null as any, Matrix.IDENTITY, 65, 0x41, false, null as any);
      // Verify it doesn't throw
    });

    it('should show string', () => {
      text = new Text(null as any);
      text.showString(null as any, Matrix.IDENTITY, 'Hello', false, null as any);
      // Verify it doesn't throw
    });

    it('should clear text', () => {
      text = new Text(null as any);
      text.clear();
      expect(text.isEmpty()).toBe(true);
    });

    it('should clone text', () => {
      text = new Text(null as any);
      const cloned = text.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Text);
    });

    it('should count spans', () => {
      text = new Text(null as any);
      const count = text.countSpans();
      expect(typeof count).toBe('number');
    });

    it('should count items', () => {
      text = new Text(null as any);
      const count = text.countItems();
      expect(typeof count).toBe('number');
    });

    it('should walk text', () => {
      text = new Text(null as any);
      const visited: any[] = [];
      text.walk((span: any) => {
        visited.push(span);
        return true;
      });
      expect(Array.isArray(visited)).toBe(true);
    });
  });

  describe('Text Integration', () => {
    it('should handle text rendering', () => {
      const text = new Text(null as any);
      const matrix = Matrix.IDENTITY;

      text.showString(null as any, matrix, 'Hello, World!', false, null as any);
      expect(text.isEmpty()).toBe(false);
    });

    it('should handle multiple languages', () => {
      const text1 = new Text(null as any);
      const text2 = new Text(null as any);
      const text3 = new Text(null as any);

      text1.setLanguage(Language.en);
      text2.setLanguage(Language.es);
      text3.setLanguage(Language.zh);

      expect(text1.getLanguage()).toBe(Language.en);
      expect(text2.getLanguage()).toBe(Language.es);
      expect(text3.getLanguage()).toBe(Language.zh);
    });

    it('should handle text bounding boxes', () => {
      const text = new Text(null as any);
      const matrix = Matrix.IDENTITY;

      const bbox = text.getBounds(null as any, matrix);
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should clone text with content', () => {
      const text = new Text(null as any);
      text.showString(null as any, Matrix.IDENTITY, 'Test', false, null as any);

      const cloned = text.clone();
      expect(cloned).toBeDefined();
      expect(cloned).not.toBe(text);
    });
  });
});
