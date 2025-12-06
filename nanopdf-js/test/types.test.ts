/**
 * Tests for types module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  NanoPDFError,
  Point,
  Rect,
  Matrix,
  Quad,
  IRect,
  type ColorspaceType
} from '../src/index.js';

describe('NanoPDFError', () => {
  it('should create argument errors', () => {
    const error = NanoPDFError.argument('invalid arg');
    expect(error.code).toBe('ARGUMENT');
    expect(error.message).toContain('invalid arg');
  });

  it('should create system errors', () => {
    const cause = new Error('io error');
    const error = NanoPDFError.system('system error', cause);
    expect(error.code).toBe('SYSTEM');
    expect(error.cause).toBe(cause);
  });

  it('should create generic errors', () => {
    const error = NanoPDFError.generic('something went wrong');
    expect(error.code).toBe('GENERIC');
    expect(error.message).toBe('something went wrong');
    expect(error.name).toBe('NanoPDFError');
  });

  it('should create format errors', () => {
    const error = NanoPDFError.format('bad format');
    expect(error.code).toBe('FORMAT');
  });

  it('should create unsupported errors', () => {
    const error = NanoPDFError.unsupported('feature X');
    expect(error.code).toBe('UNSUPPORTED');
  });
});

describe('Point', () => {
  it('should create a point', () => {
    const p = new Point(10, 20);
    expect(p.x).toBe(10);
    expect(p.y).toBe(20);
  });

  it('should add points', () => {
    const p1 = new Point(1, 2);
    const p2 = new Point(3, 4);
    const result = p1.add(p2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('should subtract points', () => {
    const p1 = new Point(5, 7);
    const p2 = new Point(2, 3);
    const result = p1.subtract(p2);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it('should calculate distance', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    expect(p1.distanceTo(p2)).toBe(5);
  });

  it('should transform with identity matrix', () => {
    const p = new Point(10, 20);
    const result = p.transform(Matrix.IDENTITY);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(20);
  });

  it('should have ORIGIN constant', () => {
    expect(Point.ORIGIN.x).toBe(0);
    expect(Point.ORIGIN.y).toBe(0);
  });
});

describe('Rect', () => {
  it('should create a rect', () => {
    const r = new Rect(0, 0, 100, 50);
    expect(r.x0).toBe(0);
    expect(r.y0).toBe(0);
    expect(r.x1).toBe(100);
    expect(r.y1).toBe(50);
  });

  it('should calculate width and height', () => {
    const r = new Rect(10, 20, 110, 70);
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
  });

  it('should check empty rect', () => {
    expect(new Rect(0, 0, 0, 0).isEmpty).toBe(true);
    expect(new Rect(0, 0, 10, 0).isEmpty).toBe(true);
    expect(new Rect(0, 0, 10, 10).isEmpty).toBe(false);
  });

  it('should check containment', () => {
    const outer = new Rect(0, 0, 100, 100);
    expect(outer.containsPoint(50, 50)).toBe(true);
    expect(outer.containsPoint(150, 50)).toBe(false);
  });

  it('should normalize rect', () => {
    const r = new Rect(100, 50, 0, 0);
    const n = r.normalize();
    expect(n.x0).toBe(0);
    expect(n.y0).toBe(0);
    expect(n.x1).toBe(100);
    expect(n.y1).toBe(50);
  });

  it('should calculate union', () => {
    const r1 = new Rect(0, 0, 50, 50);
    const r2 = new Rect(25, 25, 75, 75);
    const u = r1.union(r2);
    expect(u.x0).toBe(0);
    expect(u.y0).toBe(0);
    expect(u.x1).toBe(75);
    expect(u.y1).toBe(75);
  });

  it('should calculate intersection', () => {
    const r1 = new Rect(0, 0, 50, 50);
    const r2 = new Rect(25, 25, 75, 75);
    const i = r1.intersect(r2);
    expect(i.x0).toBe(25);
    expect(i.y0).toBe(25);
    expect(i.x1).toBe(50);
    expect(i.y1).toBe(50);
  });

  it('should create from XYWH', () => {
    const r = Rect.fromXYWH(10, 20, 100, 50);
    expect(r.x0).toBe(10);
    expect(r.y0).toBe(20);
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
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

  it('should create scale matrix', () => {
    const m = Matrix.scale(2, 3);
    expect(m.a).toBe(2);
    expect(m.d).toBe(3);
  });

  it('should create translate matrix', () => {
    const m = Matrix.translate(10, 20);
    expect(m.e).toBe(10);
    expect(m.f).toBe(20);
  });

  it('should create rotate matrix', () => {
    const m = Matrix.rotate(90);
    expect(m.a).toBeCloseTo(0);
    expect(m.b).toBeCloseTo(1);
    expect(m.c).toBeCloseTo(-1);
    expect(m.d).toBeCloseTo(0);
  });

  it('should concatenate matrices', () => {
    const scale = Matrix.scale(2, 2);
    const translate = Matrix.translate(10, 10);
    const result = translate.concat(scale);
    // Translate then scale: point (1,1) -> (11, 11) -> (22, 22)
    const p = new Point(1, 1).transform(result);
    expect(p.x).toBeCloseTo(22);
    expect(p.y).toBeCloseTo(22);
  });

  it('should calculate inverse', () => {
    const m = Matrix.scale(2, 4);
    const inv = m.invert();
    expect(inv.a).toBeCloseTo(0.5);
    expect(inv.d).toBeCloseTo(0.25);
  });

  it('should detect identity', () => {
    expect(Matrix.IDENTITY.isIdentity).toBe(true);
    expect(Matrix.scale(2, 2).isIdentity).toBe(false);
  });
});

describe('Quad', () => {
  it('should create a quad from rect', () => {
    const r = new Rect(0, 0, 100, 50);
    const q = Quad.fromRect(r);
    expect(q.ul.x).toBe(0);
    expect(q.ul.y).toBe(0);
    expect(q.lr.x).toBe(100);
    expect(q.lr.y).toBe(50);
  });

  it('should calculate bounding rect', () => {
    const q = Quad.fromRect(new Rect(10, 20, 110, 70));
    const r = q.bounds;
    expect(r.x0).toBe(10);
    expect(r.y0).toBe(20);
    expect(r.x1).toBe(110);
    expect(r.y1).toBe(70);
  });

  it('should transform quad', () => {
    const q = Quad.fromRect(new Rect(0, 0, 10, 10));
    const m = Matrix.translate(5, 5);
    const t = q.transform(m);
    expect(t.ul.x).toBe(5);
    expect(t.ul.y).toBe(5);
    expect(t.lr.x).toBe(15);
    expect(t.lr.y).toBe(15);
  });
});

describe('IRect', () => {
  it('should create from rect', () => {
    const r = new Rect(1.3, 2.7, 10.8, 20.2);
    const ir = IRect.fromRect(r);
    // Rounds to enclosing rectangle
    expect(ir.x0).toBe(1);
    expect(ir.y0).toBe(2);
    expect(ir.x1).toBe(11);
    expect(ir.y1).toBe(21);
  });

  it('should calculate width and height', () => {
    const ir = new IRect(0, 0, 100, 50);
    expect(ir.width).toBe(100);
    expect(ir.height).toBe(50);
  });
});

describe('Type exports', () => {
  it('should have ColorspaceType values', () => {
    const type: ColorspaceType = 'DeviceRGB';
    expect(type).toBe('DeviceRGB');
  });
});
