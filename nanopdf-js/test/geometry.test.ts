import { describe, it, expect } from 'vitest';
import { Point, Rect, IRect, Matrix, Quad } from '../src/geometry';

describe('Geometry Module', () => {
  describe('Point', () => {
    it('should create a point with x and y coordinates', () => {
      const p = new Point(10, 20);
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
    });

    it('should create a zero point', () => {
      const p = Point.zero();
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    });

    it('should calculate distance between two points', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      expect(p1.distance(p2)).toBe(5);
    });

    it('should add two points', () => {
      const p1 = new Point(10, 20);
      const p2 = new Point(5, 10);
      const result = p1.add(p2);
      expect(result.x).toBe(15);
      expect(result.y).toBe(30);
    });

    it('should subtract two points', () => {
      const p1 = new Point(10, 20);
      const p2 = new Point(5, 10);
      const result = p1.subtract(p2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });

    it('should scale a point', () => {
      const p = new Point(10, 20);
      const scaled = p.scale(2);
      expect(scaled.x).toBe(20);
      expect(scaled.y).toBe(40);
    });

    it('should check equality', () => {
      const p1 = new Point(10, 20);
      const p2 = new Point(10, 20);
      const p3 = new Point(15, 25);
      expect(p1.equals(p2)).toBe(true);
      expect(p1.equals(p3)).toBe(false);
    });

    it('should clone a point', () => {
      const p1 = new Point(10, 20);
      const p2 = p1.clone();
      expect(p2.x).toBe(10);
      expect(p2.y).toBe(20);
      expect(p2).not.toBe(p1);
    });

    it('should convert to string', () => {
      const p = new Point(10, 20);
      expect(p.toString()).toBe('Point(10, 20)');
    });
  });

  describe('Rect', () => {
    it('should create a rectangle', () => {
      const r = new Rect(10, 20, 100, 200);
      expect(r.x0).toBe(10);
      expect(r.y0).toBe(20);
      expect(r.x1).toBe(100);
      expect(r.y1).toBe(200);
    });

    it('should create an empty rectangle', () => {
      const r = Rect.empty();
      expect(r.isEmpty()).toBe(true);
    });

    it('should create an infinite rectangle', () => {
      const r = Rect.infinite();
      expect(r.isInfinite()).toBe(true);
    });

    it('should calculate width and height', () => {
      const r = new Rect(10, 20, 110, 120);
      expect(r.width).toBe(100);
      expect(r.height).toBe(100);
    });

    it('should check if rectangle is empty', () => {
      const r1 = new Rect(10, 20, 10, 20);
      const r2 = new Rect(10, 20, 100, 200);
      expect(r1.isEmpty()).toBe(true);
      expect(r2.isEmpty()).toBe(false);
    });

    it('should check if rectangle contains a point', () => {
      const r = new Rect(0, 0, 100, 100);
      expect(r.contains(new Point(50, 50))).toBe(true);
      expect(r.contains(new Point(150, 150))).toBe(false);
    });

    it('should check if rectangle contains another rectangle', () => {
      const r1 = new Rect(0, 0, 100, 100);
      const r2 = new Rect(25, 25, 75, 75);
      const r3 = new Rect(50, 50, 150, 150);
      expect(r1.containsRect(r2)).toBe(true);
      expect(r1.containsRect(r3)).toBe(false);
    });

    it('should intersect two rectangles', () => {
      const r1 = new Rect(0, 0, 100, 100);
      const r2 = new Rect(50, 50, 150, 150);
      const intersection = r1.intersect(r2);
      expect(intersection.x0).toBe(50);
      expect(intersection.y0).toBe(50);
      expect(intersection.x1).toBe(100);
      expect(intersection.y1).toBe(100);
    });

    it('should union two rectangles', () => {
      const r1 = new Rect(0, 0, 50, 50);
      const r2 = new Rect(25, 25, 100, 100);
      const union = r1.union(r2);
      expect(union.x0).toBe(0);
      expect(union.y0).toBe(0);
      expect(union.x1).toBe(100);
      expect(union.y1).toBe(100);
    });

    it('should expand rectangle by a value', () => {
      const r = new Rect(10, 10, 90, 90);
      const expanded = r.expand(10);
      expect(expanded.x0).toBe(0);
      expect(expanded.y0).toBe(0);
      expect(expanded.x1).toBe(100);
      expect(expanded.y1).toBe(100);
    });

    it('should translate rectangle', () => {
      const r = new Rect(0, 0, 100, 100);
      const translated = r.translate(10, 20);
      expect(translated.x0).toBe(10);
      expect(translated.y0).toBe(20);
      expect(translated.x1).toBe(110);
      expect(translated.y1).toBe(120);
    });

    it('should check equality', () => {
      const r1 = new Rect(0, 0, 100, 100);
      const r2 = new Rect(0, 0, 100, 100);
      const r3 = new Rect(0, 0, 50, 50);
      expect(r1.equals(r2)).toBe(true);
      expect(r1.equals(r3)).toBe(false);
    });

    it('should clone a rectangle', () => {
      const r1 = new Rect(10, 20, 100, 200);
      const r2 = r1.clone();
      expect(r2.x0).toBe(10);
      expect(r2.y0).toBe(20);
      expect(r2.x1).toBe(100);
      expect(r2.y1).toBe(200);
      expect(r2).not.toBe(r1);
    });

    it('should convert to string', () => {
      const r = new Rect(10, 20, 100, 200);
      expect(r.toString()).toBe('Rect(10, 20, 100, 200)');
    });

    it('should get center point', () => {
      const r = new Rect(0, 0, 100, 100);
      const center = r.center();
      expect(center.x).toBe(50);
      expect(center.y).toBe(50);
    });

    it('should scale rectangle', () => {
      const r = new Rect(0, 0, 100, 100);
      const scaled = r.scale(2);
      expect(scaled.x0).toBe(0);
      expect(scaled.y0).toBe(0);
      expect(scaled.x1).toBe(200);
      expect(scaled.y1).toBe(200);
    });
  });

  describe('IRect', () => {
    it('should create an integer rectangle', () => {
      const ir = new IRect(10, 20, 100, 200);
      expect(ir.x0).toBe(10);
      expect(ir.y0).toBe(20);
      expect(ir.x1).toBe(100);
      expect(ir.y1).toBe(200);
    });

    it('should create from a Rect', () => {
      const r = new Rect(10.5, 20.5, 100.5, 200.5);
      const ir = IRect.fromRect(r);
      expect(ir.x0).toBe(10);
      expect(ir.y0).toBe(20);
      expect(ir.x1).toBe(101);
      expect(ir.y1).toBe(201);
    });

    it('should round a Rect', () => {
      const r = new Rect(10.3, 20.7, 100.4, 200.8);
      const ir = IRect.round(r);
      expect(ir.x0).toBe(10);
      expect(ir.y0).toBe(21);
      expect(ir.x1).toBe(100);
      expect(ir.y1).toBe(201);
    });

    it('should calculate width and height', () => {
      const ir = new IRect(10, 20, 110, 120);
      expect(ir.width).toBe(100);
      expect(ir.height).toBe(100);
    });

    it('should check if empty', () => {
      const ir1 = new IRect(10, 20, 10, 20);
      const ir2 = new IRect(10, 20, 100, 200);
      expect(ir1.isEmpty()).toBe(true);
      expect(ir2.isEmpty()).toBe(false);
    });

    it('should check if contains point', () => {
      const ir = new IRect(0, 0, 100, 100);
      expect(ir.contains(new Point(50, 50))).toBe(true);
      expect(ir.contains(new Point(150, 150))).toBe(false);
    });

    it('should convert to Rect', () => {
      const ir = new IRect(10, 20, 100, 200);
      const r = ir.toRect();
      expect(r.x0).toBe(10);
      expect(r.y0).toBe(20);
      expect(r.x1).toBe(100);
      expect(r.y1).toBe(200);
    });
  });

  describe('Matrix', () => {
    it('should create an identity matrix', () => {
      const m = Matrix.IDENTITY;
      expect(m.a).toBe(1);
      expect(m.b).toBe(0);
      expect(m.c).toBe(0);
      expect(m.d).toBe(1);
      expect(m.e).toBe(0);
      expect(m.f).toBe(0);
    });

    it('should create a translation matrix', () => {
      const m = Matrix.translate(10, 20);
      expect(m.e).toBe(10);
      expect(m.f).toBe(20);
    });

    it('should create a scale matrix', () => {
      const m = Matrix.scale(2, 3);
      expect(m.a).toBe(2);
      expect(m.d).toBe(3);
    });

    it('should create a rotation matrix', () => {
      const m = Matrix.rotate(Math.PI / 2); // 90 degrees
      expect(Math.abs(m.a)).toBeLessThan(0.0001);
      expect(Math.abs(m.b - 1)).toBeLessThan(0.0001);
      expect(Math.abs(m.c + 1)).toBeLessThan(0.0001);
      expect(Math.abs(m.d)).toBeLessThan(0.0001);
    });

    it('should multiply matrices', () => {
      const m1 = Matrix.translate(10, 20);
      const m2 = Matrix.scale(2, 2);
      const result = m1.multiply(m2);
      expect(result.a).toBe(2);
      expect(result.d).toBe(2);
    });

    it('should transform a point', () => {
      const m = Matrix.translate(10, 20);
      const p = new Point(5, 5);
      const transformed = m.transformPoint(p);
      expect(transformed.x).toBe(15);
      expect(transformed.y).toBe(25);
    });

    it('should transform a rectangle', () => {
      const m = Matrix.translate(10, 20);
      const r = new Rect(0, 0, 100, 100);
      const transformed = m.transformRect(r);
      expect(transformed.x0).toBe(10);
      expect(transformed.y0).toBe(20);
      expect(transformed.x1).toBe(110);
      expect(transformed.y1).toBe(120);
    });

    it('should invert a matrix', () => {
      const m = Matrix.translate(10, 20);
      const inverted = m.invert();
      const identity = m.multiply(inverted);
      expect(Math.abs(identity.a - 1)).toBeLessThan(0.0001);
      expect(Math.abs(identity.d - 1)).toBeLessThan(0.0001);
      expect(Math.abs(identity.e)).toBeLessThan(0.0001);
      expect(Math.abs(identity.f)).toBeLessThan(0.0001);
    });

    it('should check if matrix is identity', () => {
      const m1 = Matrix.IDENTITY;
      const m2 = Matrix.translate(10, 20);
      expect(m1.isIdentity()).toBe(true);
      expect(m2.isIdentity()).toBe(false);
    });

    it('should clone a matrix', () => {
      const m1 = new Matrix(1, 2, 3, 4, 5, 6);
      const m2 = m1.clone();
      expect(m2.a).toBe(1);
      expect(m2.b).toBe(2);
      expect(m2.c).toBe(3);
      expect(m2.d).toBe(4);
      expect(m2.e).toBe(5);
      expect(m2.f).toBe(6);
      expect(m2).not.toBe(m1);
    });

    it('should calculate determinant', () => {
      const m = new Matrix(2, 0, 0, 3, 0, 0);
      expect(m.determinant()).toBe(6);
    });

    it('should check for rectilinear matrix', () => {
      const m1 = Matrix.scale(2, 2);
      const m2 = Matrix.rotate(Math.PI / 4);
      expect(m1.isRectilinear()).toBe(true);
      expect(m2.isRectilinear()).toBe(false);
    });

    it('should extract scale from matrix', () => {
      const m = Matrix.scale(2, 3);
      const scale = m.getScale();
      expect(Math.abs(scale.x - 2)).toBeLessThan(0.0001);
      expect(Math.abs(scale.y - 3)).toBeLessThan(0.0001);
    });
  });

  describe('Quad', () => {
    it('should create a quad from four points', () => {
      const q = new Quad(
        new Point(0, 0),
        new Point(100, 0),
        new Point(100, 100),
        new Point(0, 100)
      );
      expect(q.ul.x).toBe(0);
      expect(q.ul.y).toBe(0);
      expect(q.ur.x).toBe(100);
      expect(q.ur.y).toBe(0);
    });

    it('should create a quad from a rectangle', () => {
      const r = new Rect(0, 0, 100, 100);
      const q = Quad.fromRect(r);
      expect(q.ul.x).toBe(0);
      expect(q.ul.y).toBe(0);
      expect(q.lr.x).toBe(100);
      expect(q.lr.y).toBe(100);
    });

    it('should transform a quad with a matrix', () => {
      const q = new Quad(
        new Point(0, 0),
        new Point(100, 0),
        new Point(100, 100),
        new Point(0, 100)
      );
      const m = Matrix.translate(10, 20);
      const transformed = q.transform(m);
      expect(transformed.ul.x).toBe(10);
      expect(transformed.ul.y).toBe(20);
    });

    it('should get bounding box of quad', () => {
      const q = new Quad(
        new Point(10, 10),
        new Point(90, 20),
        new Point(80, 90),
        new Point(20, 80)
      );
      const bbox = q.bbox();
      expect(bbox.x0).toBe(10);
      expect(bbox.y0).toBe(10);
      expect(bbox.x1).toBe(90);
      expect(bbox.y1).toBe(90);
    });

    it('should check if quad is convex', () => {
      const q1 = Quad.fromRect(new Rect(0, 0, 100, 100));
      expect(q1.isConvex()).toBe(true);
    });

    it('should check if quad is rectilinear', () => {
      const q1 = Quad.fromRect(new Rect(0, 0, 100, 100));
      const q2 = new Quad(
        new Point(0, 0),
        new Point(100, 10),
        new Point(90, 100),
        new Point(0, 90)
      );
      expect(q1.isRectilinear()).toBe(true);
      expect(q2.isRectilinear()).toBe(false);
    });

    it('should clone a quad', () => {
      const q1 = Quad.fromRect(new Rect(0, 0, 100, 100));
      const q2 = q1.clone();
      expect(q2.ul.equals(q1.ul)).toBe(true);
      expect(q2).not.toBe(q1);
    });

    it('should convert to string', () => {
      const q = new Quad(
        new Point(0, 0),
        new Point(100, 0),
        new Point(100, 100),
        new Point(0, 100)
      );
      expect(q.toString()).toContain('Quad');
    });
  });
});
