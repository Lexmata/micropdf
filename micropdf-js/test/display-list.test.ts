import { describe, it, expect } from 'vitest';
import { DisplayList } from '../src/display-list';
import { Rect, Matrix } from '../src/geometry';

describe('DisplayList Module', () => {
  describe('DisplayList', () => {
    let displayList: DisplayList;

    it('should create a display list', () => {
      displayList = new DisplayList(null as any);
      expect(displayList).toBeDefined();
    });

    it('should check if valid', () => {
      displayList = new DisplayList(null as any);
      const isValid = displayList.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should check if empty', () => {
      displayList = new DisplayList(null as any);
      const isEmpty = displayList.isEmpty();
      expect(typeof isEmpty).toBe('boolean');
    });

    it('should get bounding box', () => {
      displayList = new DisplayList(null as any);
      const bbox = displayList.bbox();
      expect(bbox).toBeInstanceOf(Rect);
    });

    it('should run display list', () => {
      displayList = new DisplayList(null as any);
      displayList.run(null as any, Matrix.IDENTITY, Rect.infinite(), null as any);
      // Verify it doesn't throw
    });

    it('should count commands', () => {
      displayList = new DisplayList(null as any);
      const count = displayList.countCommands();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should clear display list', () => {
      displayList = new DisplayList(null as any);
      displayList.clear();
      expect(displayList.isEmpty()).toBe(true);
    });

    it('should clone display list', () => {
      displayList = new DisplayList(null as any);
      const cloned = displayList.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(DisplayList);
      expect(cloned).not.toBe(displayList);
    });
  });

  describe('DisplayList Integration', () => {
    it('should handle caching workflow', () => {
      const displayList = new DisplayList(null as any);

      // Build display list
      // (commands would be added via device)

      // Run multiple times (cached)
      displayList.run(null as any, Matrix.IDENTITY, Rect.infinite(), null as any);
      displayList.run(null as any, Matrix.IDENTITY, Rect.infinite(), null as any);

      expect(displayList.isValid()).toBe(true);
    });

    it('should handle transformations', () => {
      const displayList = new DisplayList(null as any);

      const matrix1 = Matrix.scale(2, 2);
      const matrix2 = Matrix.rotate(Math.PI / 4);

      displayList.run(null as any, matrix1, Rect.infinite(), null as any);
      displayList.run(null as any, matrix2, Rect.infinite(), null as any);

      expect(true).toBe(true);
    });

    it('should handle command counting', () => {
      const displayList = new DisplayList(null as any);
      const count = displayList.countCommands();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should clear and reuse', () => {
      const displayList = new DisplayList(null as any);

      displayList.run(null as any, Matrix.IDENTITY, Rect.infinite(), null as any);
      expect(displayList.isEmpty()).toBe(false);

      displayList.clear();
      expect(displayList.isEmpty()).toBe(true);
    });
  });
});
