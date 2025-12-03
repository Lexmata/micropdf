import { describe, it, expect } from 'vitest';
import { Point, Rect, Matrix, Quad } from './geometry.js';

describe('Point', () => {
  it('should create a point', () => {
    const p = new Point(10, 20);
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
  });

  it('should have origin constant', () => {
    expect(Point.ORIGIN.x).toBe(0);
    expect(Point.ORIGIN.y).toBe(0);
  });

  it('should transform by identity matrix', () => {
    const p = new Point(10, 20);
    const result = p.transform(Matrix.IDENTITY);
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
  });

  it('should transform by translation', () => {
    const p = new Point(10, 20);
    const m = Matrix.translate(5, 10);
    const result = p.transform(m);
    expect(result.x).toBe(15);
    expect(result.y).toBe(30);
  });

  it('should calculate distance', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    expect(p1.distanceTo(p2)).toBe(5);
  });

  it('should add points', () => {
    const p1 = new Point(10, 20);
    const p2 = new Point(5, 10);
    const result = p1.add(p2);
    expect(result.x).toBe(15);
    expect(result.y).toBe(30);
  });

  it('should subtract points', () => {
    const p1 = new Point(10, 20);
    const p2 = new Point(5, 10);
    const result = p1.subtract(p2);
    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
  });
});

describe('Rect', () => {
  it('should create a rect', () => {
    const r = new Rect(0, 0, 100, 200);
    expect(r.x0).toBe(0);
    expect(r.y0).toBe(0);
    expect(r.x1).toBe(100);
    expect(r.y1).toBe(200);
  });

  it('should calculate width and height', () => {
    const r = new Rect(10, 20, 110, 220);
    expect(r.width).toBe(100);
    expect(r.height).toBe(200);
  });

  it('should check empty', () => {
    const empty = new Rect(10, 10, 10, 10);
    const notEmpty = new Rect(0, 0, 10, 10);
    expect(empty.isEmpty).toBe(true);
    expect(notEmpty.isEmpty).toBe(false);
  });

  it('should check contains', () => {
    const r = new Rect(0, 0, 100, 100);
    expect(r.contains(50, 50)).toBe(true);
    expect(r.contains(150, 50)).toBe(false);
    expect(r.contains(new Point(50, 50))).toBe(true);
  });

  it('should union rects', () => {
    const r1 = new Rect(0, 0, 50, 50);
    const r2 = new Rect(25, 25, 100, 100);
    const result = r1.union(r2);
    expect(result.x0).toBe(0);
    expect(result.y0).toBe(0);
    expect(result.x1).toBe(100);
    expect(result.y1).toBe(100);
  });

  it('should intersect rects', () => {
    const r1 = new Rect(0, 0, 50, 50);
    const r2 = new Rect(25, 25, 100, 100);
    const result = r1.intersect(r2);
    expect(result.x0).toBe(25);
    expect(result.y0).toBe(25);
    expect(result.x1).toBe(50);
    expect(result.y1).toBe(50);
  });

  it('should create from XYWH', () => {
    const r = Rect.fromXYWH(10, 20, 100, 200);
    expect(r.x0).toBe(10);
    expect(r.y0).toBe(20);
    expect(r.width).toBe(100);
    expect(r.height).toBe(200);
  });
});

describe('Matrix', () => {
  it('should have identity constant', () => {
    const m = Matrix.IDENTITY;
    expect(m.a).toBe(1);
    expect(m.b).toBe(0);
    expect(m.c).toBe(0);
    expect(m.d).toBe(1);
    expect(m.e).toBe(0);
    expect(m.f).toBe(0);
  });

  it('should create translation', () => {
    const m = Matrix.translate(10, 20);
    expect(m.e).toBe(10);
    expect(m.f).toBe(20);
  });

  it('should create scale', () => {
    const m = Matrix.scale(2, 3);
    expect(m.a).toBe(2);
    expect(m.d).toBe(3);
  });

  it('should create rotation', () => {
    const m = Matrix.rotate(90);
    expect(Math.abs(m.a)).toBeLessThan(0.0001); // cos(90) ≈ 0
    expect(Math.abs(m.b - 1)).toBeLessThan(0.0001); // sin(90) ≈ 1
  });

  it('should concatenate matrices', () => {
    const t = Matrix.translate(10, 0);
    const s = Matrix.scale(2, 2);
    const result = t.concat(s);
    // Translate then scale: point (0,0) -> (10,0) -> (20,0)
    const p = new Point(0, 0).transform(result);
    expect(p.x).toBe(20);
    expect(p.y).toBe(0);
  });
});

describe('Quad', () => {
  it('should create from rect', () => {
    const r = new Rect(0, 0, 100, 100);
    const q = Quad.fromRect(r);
    expect(q.ul.x).toBe(0);
    expect(q.ul.y).toBe(0);
    expect(q.lr.x).toBe(100);
    expect(q.lr.y).toBe(100);
  });

  it('should transform', () => {
    const r = new Rect(0, 0, 100, 100);
    const q = Quad.fromRect(r);
    const m = Matrix.translate(50, 50);
    const result = q.transform(m);
    expect(result.ul.x).toBe(50);
    expect(result.ul.y).toBe(50);
  });

  it('should calculate bounds', () => {
    const q = new Quad(
      new Point(0, 0),
      new Point(100, 0),
      new Point(0, 100),
      new Point(100, 100)
    );
    const bounds = q.bounds;
    expect(bounds.width).toBe(100);
    expect(bounds.height).toBe(100);
  });
});

