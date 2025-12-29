import { describe, it, expect, beforeEach } from 'vitest';
import { Path, StrokeState, LineCapStyle, LineJoinStyle } from '../src/path';
import { Point, Rect, Matrix } from '../src/geometry';

describe('Path Module', () => {
  describe('Path', () => {
    let path: Path;

    beforeEach(() => {
      path = new Path();
    });

    it('should create an empty path', () => {
      expect(path).toBeDefined();
      expect(path.isEmpty()).toBe(true);
    });

    it('should move to a point', () => {
      path.moveTo(10, 20);
      expect(path.isEmpty()).toBe(false);
    });

    it('should add a line', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 100);
      expect(path.isEmpty()).toBe(false);
    });

    it('should add a quadratic curve', () => {
      path.moveTo(0, 0);
      path.quadTo(50, 100, 100, 0);
      expect(path.isEmpty()).toBe(false);
    });

    it('should add a cubic curve', () => {
      path.moveTo(0, 0);
      path.curveTo(30, 100, 70, 100, 100, 0);
      expect(path.isEmpty()).toBe(false);
    });

    it('should close the path', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 0);
      path.lineTo(100, 100);
      path.close();
      expect(path.isEmpty()).toBe(false);
    });

    it('should add a rectangle', () => {
      path.rect(10, 20, 100, 200);
      expect(path.isEmpty()).toBe(false);
    });

    it('should get bounding box', () => {
      path.moveTo(10, 20);
      path.lineTo(100, 200);
      const bbox = path.bbox();
      expect(bbox).toBeDefined();
      expect(bbox.x0).toBeLessThanOrEqual(10);
      expect(bbox.y0).toBeLessThanOrEqual(20);
      expect(bbox.x1).toBeGreaterThanOrEqual(100);
      expect(bbox.y1).toBeGreaterThanOrEqual(200);
    });

    it('should transform path with matrix', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 100);
      const matrix = Matrix.translate(10, 20);
      const transformed = path.transform(matrix);
      expect(transformed).toBeDefined();
      expect(transformed.isEmpty()).toBe(false);
    });

    it('should clone a path', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 100);
      const cloned = path.clone();
      expect(cloned).toBeDefined();
      expect(cloned).not.toBe(path);
      expect(cloned.isEmpty()).toBe(false);
    });

    it('should clear the path', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 100);
      expect(path.isEmpty()).toBe(false);
      path.clear();
      expect(path.isEmpty()).toBe(true);
    });

    it('should support method chaining', () => {
      const result = path.moveTo(0, 0).lineTo(100, 0).lineTo(100, 100).lineTo(0, 100).close();
      expect(result).toBe(path);
      expect(path.isEmpty()).toBe(false);
    });

    it('should handle multiple subpaths', () => {
      path.moveTo(0, 0);
      path.lineTo(50, 50);
      path.moveTo(100, 100);
      path.lineTo(150, 150);
      expect(path.isEmpty()).toBe(false);
    });

    it('should get commands', () => {
      path.moveTo(10, 20);
      path.lineTo(100, 200);
      const commands = path.getCommands();
      expect(commands).toBeDefined();
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should create path from SVG-like commands', () => {
      path.moveTo(0, 0);
      path.lineTo(100, 0);
      path.quadTo(150, 50, 100, 100);
      path.lineTo(0, 100);
      path.close();
      expect(path.isEmpty()).toBe(false);
    });

    it('should handle edge case: empty transform', () => {
      const transformed = path.transform(Matrix.IDENTITY);
      expect(transformed.isEmpty()).toBe(true);
    });

    it('should handle edge case: degenerate rectangle', () => {
      path.rect(10, 10, 10, 10);
      expect(path.isEmpty()).toBe(false);
    });
  });

  describe('StrokeState', () => {
    let stroke: StrokeState;

    beforeEach(() => {
      stroke = new StrokeState();
    });

    it('should create with default values', () => {
      expect(stroke.lineWidth).toBe(1);
      expect(stroke.lineCap).toBe(LineCapStyle.Butt);
      expect(stroke.lineJoin).toBe(LineJoinStyle.Miter);
      expect(stroke.miterLimit).toBe(10);
    });

    it('should set line width', () => {
      stroke.setLineWidth(5);
      expect(stroke.lineWidth).toBe(5);
    });

    it('should set start cap', () => {
      stroke.setStartCap(LineCapStyle.Round);
      expect(stroke.startCap).toBe(LineCapStyle.Round);
    });

    it('should set dash cap', () => {
      stroke.setDashCap(LineCapStyle.Square);
      expect(stroke.dashCap).toBe(LineCapStyle.Square);
    });

    it('should set end cap', () => {
      stroke.setEndCap(LineCapStyle.Triangle);
      expect(stroke.endCap).toBe(LineCapStyle.Triangle);
    });

    it('should set line join', () => {
      stroke.setLineJoin(LineJoinStyle.Round);
      expect(stroke.lineJoin).toBe(LineJoinStyle.Round);
    });

    it('should set miter limit', () => {
      stroke.setMiterLimit(5);
      expect(stroke.miterLimit).toBe(5);
    });

    it('should set dash pattern', () => {
      const pattern = [5, 3, 1, 3];
      stroke.setDash(pattern, 0);
      expect(stroke.dashPattern).toEqual(pattern);
      expect(stroke.dashPhase).toBe(0);
    });

    it('should set dash phase', () => {
      stroke.setDash([5, 3], 2);
      expect(stroke.dashPhase).toBe(2);
    });

    it('should get dash pattern length', () => {
      stroke.setDash([5, 3, 1, 3], 0);
      expect(stroke.dashLen).toBe(4);
    });

    it('should clone stroke state', () => {
      stroke.setLineWidth(5);
      stroke.setStartCap(LineCapStyle.Round);
      stroke.setDash([5, 3], 1);

      const cloned = stroke.clone();
      expect(cloned).toBeDefined();
      expect(cloned).not.toBe(stroke);
      expect(cloned.lineWidth).toBe(5);
      expect(cloned.startCap).toBe(LineCapStyle.Round);
      expect(cloned.dashPattern).toEqual([5, 3]);
      expect(cloned.dashPhase).toBe(1);
    });

    it('should support method chaining', () => {
      const result = stroke
        .setLineWidth(3)
        .setStartCap(LineCapStyle.Round)
        .setLineJoin(LineJoinStyle.Bevel);
      expect(result).toBe(stroke);
    });

    it('should handle empty dash pattern', () => {
      stroke.setDash([], 0);
      expect(stroke.dashPattern).toEqual([]);
      expect(stroke.dashLen).toBe(0);
    });

    it('should handle solid line (no dash)', () => {
      stroke.setDash([], 0);
      expect(stroke.dashPattern.length).toBe(0);
    });
  });

  describe('LineCapStyle', () => {
    it('should have Butt style', () => {
      expect(LineCapStyle.Butt).toBeDefined();
    });

    it('should have Round style', () => {
      expect(LineCapStyle.Round).toBeDefined();
    });

    it('should have Square style', () => {
      expect(LineCapStyle.Square).toBeDefined();
    });

    it('should have Triangle style', () => {
      expect(LineCapStyle.Triangle).toBeDefined();
    });
  });

  describe('LineJoinStyle', () => {
    it('should have Miter style', () => {
      expect(LineJoinStyle.Miter).toBeDefined();
    });

    it('should have Round style', () => {
      expect(LineJoinStyle.Round).toBeDefined();
    });

    it('should have Bevel style', () => {
      expect(LineJoinStyle.Bevel).toBeDefined();
    });

    it('should have MiterXPS style', () => {
      expect(LineJoinStyle.MiterXPS).toBeDefined();
    });
  });

  describe('Path Integration', () => {
    it('should create complex shapes', () => {
      const path = new Path();

      // Draw a house
      path.moveTo(50, 100); // Bottom left
      path.lineTo(150, 100); // Bottom right
      path.lineTo(150, 50); // Right wall
      path.lineTo(100, 20); // Roof peak
      path.lineTo(50, 50); // Left wall
      path.close();

      // Door
      path.moveTo(80, 100);
      path.lineTo(80, 70);
      path.lineTo(100, 70);
      path.lineTo(100, 100);
      path.close();

      expect(path.isEmpty()).toBe(false);
    });

    it('should create rounded rectangle', () => {
      const path = new Path();
      const r = 10; // corner radius

      path.moveTo(r, 0);
      path.lineTo(100 - r, 0);
      path.quadTo(100, 0, 100, r);
      path.lineTo(100, 100 - r);
      path.quadTo(100, 100, 100 - r, 100);
      path.lineTo(r, 100);
      path.quadTo(0, 100, 0, 100 - r);
      path.lineTo(0, r);
      path.quadTo(0, 0, r, 0);
      path.close();

      expect(path.isEmpty()).toBe(false);
    });

    it('should create circle approximation', () => {
      const path = new Path();
      const cx = 50,
        cy = 50,
        r = 30;
      const k = 0.5522848; // magic number for circle approximation

      path.moveTo(cx, cy - r);
      path.curveTo(cx + k * r, cy - r, cx + r, cy - k * r, cx + r, cy);
      path.curveTo(cx + r, cy + k * r, cx + k * r, cy + r, cx, cy + r);
      path.curveTo(cx - k * r, cy + r, cx - r, cy + k * r, cx - r, cy);
      path.curveTo(cx - r, cy - k * r, cx - k * r, cy - r, cx, cy - r);
      path.close();

      expect(path.isEmpty()).toBe(false);
    });
  });
});
