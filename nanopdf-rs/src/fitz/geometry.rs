//! Geometry primitives - Point, Rect, Matrix, Quad

use std::f32::{INFINITY, NEG_INFINITY};

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Point { pub x: f32, pub y: f32 }

impl Point {
    pub const ORIGIN: Point = Point { x: 0.0, y: 0.0 };
    pub fn new(x: f32, y: f32) -> Self { Self { x, y } }
    pub fn transform(&self, m: &Matrix) -> Self {
        Self {
            x: self.x * m.a + self.y * m.c + m.e,
            y: self.x * m.b + self.y * m.d + m.f,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Rect { pub x0: f32, pub y0: f32, pub x1: f32, pub y1: f32 }

impl Rect {
    pub const EMPTY: Rect = Rect { x0: INFINITY, y0: INFINITY, x1: NEG_INFINITY, y1: NEG_INFINITY };
    pub const INFINITE: Rect = Rect { x0: NEG_INFINITY, y0: NEG_INFINITY, x1: INFINITY, y1: INFINITY };
    pub const UNIT: Rect = Rect { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 };

    pub fn new(x0: f32, y0: f32, x1: f32, y1: f32) -> Self { Self { x0, y0, x1, y1 } }
    pub fn width(&self) -> f32 { self.x1 - self.x0 }
    pub fn height(&self) -> f32 { self.y1 - self.y0 }
    pub fn is_empty(&self) -> bool { self.x0 >= self.x1 || self.y0 >= self.y1 }
    pub fn is_infinite(&self) -> bool { self.x0 == NEG_INFINITY }
    pub fn contains(&self, x: f32, y: f32) -> bool {
        x >= self.x0 && x < self.x1 && y >= self.y0 && y < self.y1
    }
    pub fn union(&self, other: &Rect) -> Rect {
        Rect {
            x0: self.x0.min(other.x0), y0: self.y0.min(other.y0),
            x1: self.x1.max(other.x1), y1: self.y1.max(other.y1),
        }
    }
    pub fn intersect(&self, other: &Rect) -> Rect {
        Rect {
            x0: self.x0.max(other.x0), y0: self.y0.max(other.y0),
            x1: self.x1.min(other.x1), y1: self.y1.min(other.y1),
        }
    }
    pub fn include_point(&mut self, p: Point) {
        self.x0 = self.x0.min(p.x); self.y0 = self.y0.min(p.y);
        self.x1 = self.x1.max(p.x); self.y1 = self.y1.max(p.y);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct IRect { pub x0: i32, pub y0: i32, pub x1: i32, pub y1: i32 }

impl IRect {
    pub fn new(x0: i32, y0: i32, x1: i32, y1: i32) -> Self { Self { x0, y0, x1, y1 } }
    pub fn width(&self) -> i32 { self.x1 - self.x0 }
    pub fn height(&self) -> i32 { self.y1 - self.y0 }
    pub fn is_empty(&self) -> bool { self.x0 >= self.x1 || self.y0 >= self.y1 }
}

impl From<Rect> for IRect {
    fn from(r: Rect) -> Self {
        IRect { x0: r.x0.floor() as i32, y0: r.y0.floor() as i32,
                x1: r.x1.ceil() as i32, y1: r.y1.ceil() as i32 }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Matrix { pub a: f32, pub b: f32, pub c: f32, pub d: f32, pub e: f32, pub f: f32 }

impl Default for Matrix {
    fn default() -> Self { Self::IDENTITY }
}

impl Matrix {
    pub const IDENTITY: Matrix = Matrix { a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: 0.0, f: 0.0 };

    pub fn new(a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) -> Self { Self { a, b, c, d, e, f } }
    pub fn translate(tx: f32, ty: f32) -> Self { Self { a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: tx, f: ty } }
    pub fn scale(sx: f32, sy: f32) -> Self { Self { a: sx, b: 0.0, c: 0.0, d: sy, e: 0.0, f: 0.0 } }
    pub fn rotate(degrees: f32) -> Self {
        let rad = degrees * std::f32::consts::PI / 180.0;
        let (s, c) = (rad.sin(), rad.cos());
        Self { a: c, b: s, c: -s, d: c, e: 0.0, f: 0.0 }
    }
    pub fn concat(&self, m: &Matrix) -> Self {
        Self {
            a: self.a * m.a + self.b * m.c,
            b: self.a * m.b + self.b * m.d,
            c: self.c * m.a + self.d * m.c,
            d: self.c * m.b + self.d * m.d,
            e: self.e * m.a + self.f * m.c + m.e,
            f: self.e * m.b + self.f * m.d + m.f,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Quad { pub ul: Point, pub ur: Point, pub ll: Point, pub lr: Point }

impl Quad {
    pub fn from_rect(r: &Rect) -> Self {
        Self {
            ul: Point::new(r.x0, r.y0), ur: Point::new(r.x1, r.y0),
            ll: Point::new(r.x0, r.y1), lr: Point::new(r.x1, r.y1),
        }
    }
    pub fn transform(&self, m: &Matrix) -> Self {
        Self {
            ul: self.ul.transform(m), ur: self.ur.transform(m),
            ll: self.ll.transform(m), lr: self.lr.transform(m),
        }
    }
}

