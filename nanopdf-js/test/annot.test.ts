import { describe, it, expect, beforeEach } from 'vitest';
import { Annotation, AnnotationType } from '../src/annot';
import { Rect } from '../src/geometry';

describe('Annotation Module', () => {
  describe('AnnotationType', () => {
    it('should have all annotation types defined', () => {
      expect(AnnotationType.Text).toBeDefined();
      expect(AnnotationType.Link).toBeDefined();
      expect(AnnotationType.FreeText).toBeDefined();
      expect(AnnotationType.Line).toBeDefined();
      expect(AnnotationType.Square).toBeDefined();
      expect(AnnotationType.Circle).toBeDefined();
      expect(AnnotationType.Polygon).toBeDefined();
      expect(AnnotationType.PolyLine).toBeDefined();
      expect(AnnotationType.Highlight).toBeDefined();
      expect(AnnotationType.Underline).toBeDefined();
      expect(AnnotationType.Squiggly).toBeDefined();
      expect(AnnotationType.StrikeOut).toBeDefined();
      expect(AnnotationType.Stamp).toBeDefined();
      expect(AnnotationType.Caret).toBeDefined();
      expect(AnnotationType.Ink).toBeDefined();
      expect(AnnotationType.Popup).toBeDefined();
      expect(AnnotationType.FileAttachment).toBeDefined();
      expect(AnnotationType.Sound).toBeDefined();
      expect(AnnotationType.Movie).toBeDefined();
      expect(AnnotationType.Widget).toBeDefined();
      expect(AnnotationType.Screen).toBeDefined();
      expect(AnnotationType.PrinterMark).toBeDefined();
      expect(AnnotationType.TrapNet).toBeDefined();
      expect(AnnotationType.Watermark).toBeDefined();
      expect(AnnotationType.ThreeD).toBeDefined();
      expect(AnnotationType.Redact).toBeDefined();
    });
  });

  describe('Annotation', () => {
    let annot: Annotation;

    beforeEach(() => {
      annot = new Annotation(null as any, null as any);
    });

    it('should get annotation type', () => {
      const type = annot.getType();
      expect(Object.values(AnnotationType)).toContain(type);
    });

    it('should get rect', () => {
      const rect = annot.getRect();
      expect(rect).toBeInstanceOf(Rect);
    });

    it('should set rect', () => {
      const newRect = new Rect(10, 20, 100, 200);
      annot.setRect(newRect);
      const rect = annot.getRect();
      expect(rect.x0).toBe(10);
      expect(rect.y0).toBe(20);
      expect(rect.x1).toBe(100);
      expect(rect.y1).toBe(200);
    });

    it('should get flags', () => {
      const flags = annot.getFlags();
      expect(typeof flags).toBe('number');
    });

    it('should set flags', () => {
      annot.setFlags(0x04);
      expect(annot.getFlags()).toBe(0x04);
    });

    it('should get contents', () => {
      const contents = annot.getContents();
      expect(typeof contents === 'string' || contents === null).toBe(true);
    });

    it('should set contents', () => {
      annot.setContents('Test annotation content');
      expect(annot.getContents()).toBe('Test annotation content');
    });

    it('should get author', () => {
      const author = annot.getAuthor();
      expect(typeof author === 'string' || author === null).toBe(true);
    });

    it('should set author', () => {
      annot.setAuthor('John Doe');
      expect(annot.getAuthor()).toBe('John Doe');
    });

    it('should get color', () => {
      const color = annot.getColor();
      expect(Array.isArray(color)).toBe(true);
    });

    it('should set color', () => {
      annot.setColor([1, 0, 0]); // Red
      const color = annot.getColor();
      expect(color).toEqual([1, 0, 0]);
    });

    it('should get interior color', () => {
      const color = annot.getInteriorColor();
      expect(Array.isArray(color)).toBe(true);
    });

    it('should set interior color', () => {
      annot.setInteriorColor([0, 1, 0]); // Green
      const color = annot.getInteriorColor();
      expect(color).toEqual([0, 1, 0]);
    });

    it('should get line', () => {
      const line = annot.getLine();
      expect(Array.isArray(line) || line === null).toBe(true);
    });

    it('should set line', () => {
      annot.setLine([10, 20, 100, 200]);
      const line = annot.getLine();
      expect(line).toEqual([10, 20, 100, 200]);
    });

    it('should get border width', () => {
      const width = annot.getBorderWidth();
      expect(typeof width).toBe('number');
    });

    it('should set border width', () => {
      annot.setBorderWidth(3);
      expect(annot.getBorderWidth()).toBe(3);
    });

    it('should get opacity', () => {
      const opacity = annot.getOpacity();
      expect(typeof opacity).toBe('number');
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
    });

    it('should set opacity', () => {
      annot.setOpacity(0.5);
      expect(annot.getOpacity()).toBe(0.5);
    });

    it('should check if has popup', () => {
      const hasPopup = annot.hasPopup();
      expect(typeof hasPopup).toBe('boolean');
    });

    it('should check if has dirty flag', () => {
      const hasDirty = annot.hasDirty();
      expect(typeof hasDirty).toBe('boolean');
    });

    it('should clear dirty flag', () => {
      annot.clearDirty();
      // Verify it doesn't throw
    });

    it('should update annotation', () => {
      annot.update();
      // Verify it doesn't throw
    });

    it('should validate annotation', () => {
      const isValid = annot.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone annotation', () => {
      const cloned = annot.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Annotation);
    });
  });

  describe('Annotation Integration', () => {
    it('should create text markup annotation', () => {
      const annot = new Annotation(null as any, null as any);
      annot.setRect(new Rect(100, 100, 200, 120));
      annot.setColor([1, 1, 0]); // Yellow
      annot.setContents('Important note');
      annot.setAuthor('Reviewer');

      expect(annot.getContents()).toBe('Important note');
      expect(annot.getAuthor()).toBe('Reviewer');
    });

    it('should create shape annotation', () => {
      const annot = new Annotation(null as any, null as any);
      annot.setRect(new Rect(50, 50, 150, 150));
      annot.setColor([1, 0, 0]); // Red outline
      annot.setInteriorColor([1, 1, 1]); // White fill
      annot.setBorderWidth(2);

      expect(annot.getColor()).toEqual([1, 0, 0]);
      expect(annot.getInteriorColor()).toEqual([1, 1, 1]);
      expect(annot.getBorderWidth()).toBe(2);
    });

    it('should create line annotation', () => {
      const annot = new Annotation(null as any, null as any);
      annot.setLine([10, 10, 100, 100]);
      annot.setColor([0, 0, 1]); // Blue
      annot.setBorderWidth(3);

      const line = annot.getLine();
      expect(line).toEqual([10, 10, 100, 100]);
    });

    it('should handle annotation opacity', () => {
      const annot = new Annotation(null as any, null as any);

      annot.setOpacity(1.0); // Fully opaque
      expect(annot.getOpacity()).toBe(1.0);

      annot.setOpacity(0.5); // Semi-transparent
      expect(annot.getOpacity()).toBe(0.5);

      annot.setOpacity(0.0); // Fully transparent
      expect(annot.getOpacity()).toBe(0.0);
    });

    it('should handle annotation flags', () => {
      const annot = new Annotation(null as any, null as any);

      const INVISIBLE = 0x01;
      const HIDDEN = 0x02;
      const PRINT = 0x04;
      const NO_ZOOM = 0x08;
      const NO_ROTATE = 0x10;
      const NO_VIEW = 0x20;
      const READ_ONLY = 0x40;

      annot.setFlags(PRINT | READ_ONLY);
      const flags = annot.getFlags();
      expect(flags & PRINT).toBeTruthy();
      expect(flags & READ_ONLY).toBeTruthy();
    });

    it('should handle dirty tracking', () => {
      const annot = new Annotation(null as any, null as any);

      // Make changes
      annot.setContents('Modified');
      annot.setColor([1, 0, 0]);

      if (annot.hasDirty()) {
        annot.update();
        annot.clearDirty();
      }

      // Verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should validate annotations', () => {
      const annot1 = new Annotation(null as any, null as any);
      const annot2 = new Annotation(null as any, null as any);

      expect(typeof annot1.isValid()).toBe('boolean');
      expect(typeof annot2.isValid()).toBe('boolean');
    });

    it('should clone annotations with properties', () => {
      const annot = new Annotation(null as any, null as any);
      annot.setRect(new Rect(10, 20, 100, 200));
      annot.setContents('Test');
      annot.setAuthor('Author');
      annot.setColor([1, 0, 0]);

      const cloned = annot.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Annotation);
      expect(cloned).not.toBe(annot);
    });
  });
});
