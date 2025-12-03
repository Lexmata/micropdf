//! C FFI for geometry types - MuPDF compatible

use std::ffi::c_float;

/// fz_point - 2D point
#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct fz_point {
    pub x: c_float,
    pub y: c_float,
}

/// fz_rect - Rectangle
#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct fz_rect {
    pub x0: c_float,
    pub y0: c_float,
    pub x1: c_float,
    pub y1: c_float,
}

/// fz_irect - Integer rectangle
#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct fz_irect {
    pub x0: i32,
    pub y0: i32,
    pub x1: i32,
    pub y1: i32,
}

/// fz_matrix - Transformation matrix
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct fz_matrix {
    pub a: c_float,
    pub b: c_float,
    pub c: c_float,
    pub d: c_float,
    pub e: c_float,
    pub f: c_float,
}

impl Default for fz_matrix {
    fn default() -> Self {
        FZ_IDENTITY
    }
}

/// fz_quad - Quadrilateral
#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct fz_quad {
    pub ul: fz_point,
    pub ur: fz_point,
    pub ll: fz_point,
    pub lr: fz_point,
}

// Constants
pub const FZ_MIN_INF_RECT: i32 = i32::MIN;
pub const FZ_MAX_INF_RECT: i32 = 0x7fffff80;

#[no_mangle]
pub static fz_identity: fz_matrix = FZ_IDENTITY;

pub const FZ_IDENTITY: fz_matrix = fz_matrix {
    a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: 0.0, f: 0.0,
};

#[no_mangle]
pub static fz_empty_rect: fz_rect = fz_rect {
    x0: f32::INFINITY, y0: f32::INFINITY,
    x1: f32::NEG_INFINITY, y1: f32::NEG_INFINITY,
};

#[no_mangle]
pub static fz_infinite_rect: fz_rect = fz_rect {
    x0: FZ_MIN_INF_RECT as f32, y0: FZ_MIN_INF_RECT as f32,
    x1: FZ_MAX_INF_RECT as f32, y1: FZ_MAX_INF_RECT as f32,
};

#[no_mangle]
pub static fz_unit_rect: fz_rect = fz_rect {
    x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0,
};

#[no_mangle]
pub static fz_empty_irect: fz_irect = fz_irect {
    x0: 0, y0: 0, x1: 0, y1: 0,
};

#[no_mangle]
pub static fz_infinite_irect: fz_irect = fz_irect {
    x0: FZ_MIN_INF_RECT, y0: FZ_MIN_INF_RECT,
    x1: FZ_MAX_INF_RECT, y1: FZ_MAX_INF_RECT,
};

// ============================================================================
// Matrix functions
// ============================================================================

#[no_mangle]
pub extern "C" fn fz_concat(left: fz_matrix, right: fz_matrix) -> fz_matrix {
    fz_matrix {
        a: left.a * right.a + left.b * right.c,
        b: left.a * right.b + left.b * right.d,
        c: left.c * right.a + left.d * right.c,
        d: left.c * right.b + left.d * right.d,
        e: left.e * right.a + left.f * right.c + right.e,
        f: left.e * right.b + left.f * right.d + right.f,
    }
}

#[no_mangle]
pub extern "C" fn fz_scale(sx: c_float, sy: c_float) -> fz_matrix {
    fz_matrix { a: sx, b: 0.0, c: 0.0, d: sy, e: 0.0, f: 0.0 }
}

#[no_mangle]
pub extern "C" fn fz_pre_scale(m: fz_matrix, sx: c_float, sy: c_float) -> fz_matrix {
    fz_concat(fz_scale(sx, sy), m)
}

#[no_mangle]
pub extern "C" fn fz_post_scale(m: fz_matrix, sx: c_float, sy: c_float) -> fz_matrix {
    fz_concat(m, fz_scale(sx, sy))
}

#[no_mangle]
pub extern "C" fn fz_shear(sx: c_float, sy: c_float) -> fz_matrix {
    fz_matrix { a: 1.0, b: sy, c: sx, d: 1.0, e: 0.0, f: 0.0 }
}

#[no_mangle]
pub extern "C" fn fz_pre_shear(m: fz_matrix, sx: c_float, sy: c_float) -> fz_matrix {
    fz_concat(fz_shear(sx, sy), m)
}

#[no_mangle]
pub extern "C" fn fz_rotate(degrees: c_float) -> fz_matrix {
    let rad = degrees * std::f32::consts::PI / 180.0;
    let (s, c) = rad.sin_cos();
    fz_matrix { a: c, b: s, c: -s, d: c, e: 0.0, f: 0.0 }
}

#[no_mangle]
pub extern "C" fn fz_pre_rotate(m: fz_matrix, degrees: c_float) -> fz_matrix {
    fz_concat(fz_rotate(degrees), m)
}

#[no_mangle]
pub extern "C" fn fz_translate(tx: c_float, ty: c_float) -> fz_matrix {
    fz_matrix { a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: tx, f: ty }
}

#[no_mangle]
pub extern "C" fn fz_pre_translate(m: fz_matrix, tx: c_float, ty: c_float) -> fz_matrix {
    fz_concat(fz_translate(tx, ty), m)
}

#[no_mangle]
pub extern "C" fn fz_invert_matrix(m: fz_matrix) -> fz_matrix {
    let det = m.a * m.d - m.b * m.c;
    if det.abs() < 1e-6 {
        return m; // Singular matrix
    }
    let rdet = 1.0 / det;
    fz_matrix {
        a: m.d * rdet,
        b: -m.b * rdet,
        c: -m.c * rdet,
        d: m.a * rdet,
        e: (m.c * m.f - m.d * m.e) * rdet,
        f: (m.b * m.e - m.a * m.f) * rdet,
    }
}

#[no_mangle]
pub extern "C" fn fz_try_invert_matrix(inv: *mut fz_matrix, src: fz_matrix) -> i32 {
    let det = src.a * src.d - src.b * src.c;
    if det.abs() < 1e-6 {
        return 1; // Singular
    }
    let rdet = 1.0 / det;
    unsafe {
        (*inv) = fz_matrix {
            a: src.d * rdet,
            b: -src.b * rdet,
            c: -src.c * rdet,
            d: src.a * rdet,
            e: (src.c * src.f - src.d * src.e) * rdet,
            f: (src.b * src.e - src.a * src.f) * rdet,
        };
    }
    0
}

#[no_mangle]
pub extern "C" fn fz_matrix_expansion(m: fz_matrix) -> c_float {
    (m.a.abs() * m.d.abs() - m.b.abs() * m.c.abs()).abs().sqrt()
}

#[no_mangle]
pub extern "C" fn fz_matrix_max_expansion(m: fz_matrix) -> c_float {
    m.a.abs().max(m.b.abs()).max(m.c.abs()).max(m.d.abs())
}

#[no_mangle]
pub extern "C" fn fz_is_rectilinear(m: fz_matrix) -> i32 {
    if (m.b.abs() < 1e-6 && m.c.abs() < 1e-6) || (m.a.abs() < 1e-6 && m.d.abs() < 1e-6) {
        1
    } else {
        0
    }
}

// ============================================================================
// Rect functions
// ============================================================================

#[no_mangle]
pub extern "C" fn fz_intersect_rect(a: fz_rect, b: fz_rect) -> fz_rect {
    fz_rect {
        x0: a.x0.max(b.x0),
        y0: a.y0.max(b.y0),
        x1: a.x1.min(b.x1),
        y1: a.y1.min(b.y1),
    }
}

#[no_mangle]
pub extern "C" fn fz_intersect_irect(a: fz_irect, b: fz_irect) -> fz_irect {
    fz_irect {
        x0: a.x0.max(b.x0),
        y0: a.y0.max(b.y0),
        x1: a.x1.min(b.x1),
        y1: a.y1.min(b.y1),
    }
}

#[no_mangle]
pub extern "C" fn fz_union_rect(a: fz_rect, b: fz_rect) -> fz_rect {
    fz_rect {
        x0: a.x0.min(b.x0),
        y0: a.y0.min(b.y0),
        x1: a.x1.max(b.x1),
        y1: a.y1.max(b.y1),
    }
}

#[no_mangle]
pub extern "C" fn fz_irect_from_rect(rect: fz_rect) -> fz_irect {
    fz_irect {
        x0: rect.x0.floor() as i32,
        y0: rect.y0.floor() as i32,
        x1: rect.x1.ceil() as i32,
        y1: rect.y1.ceil() as i32,
    }
}

#[no_mangle]
pub extern "C" fn fz_round_rect(rect: fz_rect) -> fz_irect {
    fz_irect {
        x0: (rect.x0 + 0.001).floor() as i32,
        y0: (rect.y0 + 0.001).floor() as i32,
        x1: (rect.x1 - 0.001).ceil() as i32,
        y1: (rect.y1 - 0.001).ceil() as i32,
    }
}

#[no_mangle]
pub extern "C" fn fz_rect_from_irect(bbox: fz_irect) -> fz_rect {
    fz_rect {
        x0: bbox.x0 as f32,
        y0: bbox.y0 as f32,
        x1: bbox.x1 as f32,
        y1: bbox.y1 as f32,
    }
}

#[no_mangle]
pub extern "C" fn fz_expand_rect(r: fz_rect, expand: c_float) -> fz_rect {
    fz_rect {
        x0: r.x0 - expand,
        y0: r.y0 - expand,
        x1: r.x1 + expand,
        y1: r.y1 + expand,
    }
}

#[no_mangle]
pub extern "C" fn fz_expand_irect(r: fz_irect, expand: i32) -> fz_irect {
    fz_irect {
        x0: r.x0 - expand,
        y0: r.y0 - expand,
        x1: r.x1 + expand,
        y1: r.y1 + expand,
    }
}

#[no_mangle]
pub extern "C" fn fz_include_point_in_rect(r: fz_rect, p: fz_point) -> fz_rect {
    fz_rect {
        x0: r.x0.min(p.x),
        y0: r.y0.min(p.y),
        x1: r.x1.max(p.x),
        y1: r.y1.max(p.y),
    }
}

#[no_mangle]
pub extern "C" fn fz_translate_rect(r: fz_rect, xoff: c_float, yoff: c_float) -> fz_rect {
    fz_rect {
        x0: r.x0 + xoff,
        y0: r.y0 + yoff,
        x1: r.x1 + xoff,
        y1: r.y1 + yoff,
    }
}

#[no_mangle]
pub extern "C" fn fz_translate_irect(r: fz_irect, xoff: i32, yoff: i32) -> fz_irect {
    fz_irect {
        x0: r.x0 + xoff,
        y0: r.y0 + yoff,
        x1: r.x1 + xoff,
        y1: r.y1 + yoff,
    }
}

#[no_mangle]
pub extern "C" fn fz_contains_rect(a: fz_rect, b: fz_rect) -> i32 {
    if a.x0 <= b.x0 && a.y0 <= b.y0 && a.x1 >= b.x1 && a.y1 >= b.y1 {
        1
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn fz_overlaps_rect(a: fz_rect, b: fz_rect) -> i32 {
    if a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1 {
        1
    } else {
        0
    }
}

// ============================================================================
// Point/Transform functions
// ============================================================================

#[no_mangle]
pub extern "C" fn fz_transform_point(p: fz_point, m: fz_matrix) -> fz_point {
    fz_point {
        x: p.x * m.a + p.y * m.c + m.e,
        y: p.x * m.b + p.y * m.d + m.f,
    }
}

#[no_mangle]
pub extern "C" fn fz_transform_point_xy(x: c_float, y: c_float, m: fz_matrix) -> fz_point {
    fz_point {
        x: x * m.a + y * m.c + m.e,
        y: x * m.b + y * m.d + m.f,
    }
}

#[no_mangle]
pub extern "C" fn fz_transform_vector(v: fz_point, m: fz_matrix) -> fz_point {
    fz_point {
        x: v.x * m.a + v.y * m.c,
        y: v.x * m.b + v.y * m.d,
    }
}

#[no_mangle]
pub extern "C" fn fz_transform_rect(r: fz_rect, m: fz_matrix) -> fz_rect {
    if fz_is_rectilinear(m) != 0 {
        let p1 = fz_transform_point(fz_point { x: r.x0, y: r.y0 }, m);
        let p2 = fz_transform_point(fz_point { x: r.x1, y: r.y1 }, m);
        fz_rect {
            x0: p1.x.min(p2.x),
            y0: p1.y.min(p2.y),
            x1: p1.x.max(p2.x),
            y1: p1.y.max(p2.y),
        }
    } else {
        let p1 = fz_transform_point(fz_point { x: r.x0, y: r.y0 }, m);
        let p2 = fz_transform_point(fz_point { x: r.x1, y: r.y0 }, m);
        let p3 = fz_transform_point(fz_point { x: r.x0, y: r.y1 }, m);
        let p4 = fz_transform_point(fz_point { x: r.x1, y: r.y1 }, m);
        fz_rect {
            x0: p1.x.min(p2.x).min(p3.x).min(p4.x),
            y0: p1.y.min(p2.y).min(p3.y).min(p4.y),
            x1: p1.x.max(p2.x).max(p3.x).max(p4.x),
            y1: p1.y.max(p2.y).max(p3.y).max(p4.y),
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_normalize_vector(p: fz_point) -> fz_point {
    let len = (p.x * p.x + p.y * p.y).sqrt();
    if len < 1e-6 {
        return fz_point { x: 0.0, y: 0.0 };
    }
    fz_point { x: p.x / len, y: p.y / len }
}

// ============================================================================
// Quad functions
// ============================================================================

#[no_mangle]
pub extern "C" fn fz_quad_from_rect(r: fz_rect) -> fz_quad {
    fz_quad {
        ul: fz_point { x: r.x0, y: r.y0 },
        ur: fz_point { x: r.x1, y: r.y0 },
        ll: fz_point { x: r.x0, y: r.y1 },
        lr: fz_point { x: r.x1, y: r.y1 },
    }
}

#[no_mangle]
pub extern "C" fn fz_rect_from_quad(q: fz_quad) -> fz_rect {
    fz_rect {
        x0: q.ul.x.min(q.ur.x).min(q.ll.x).min(q.lr.x),
        y0: q.ul.y.min(q.ur.y).min(q.ll.y).min(q.lr.y),
        x1: q.ul.x.max(q.ur.x).max(q.ll.x).max(q.lr.x),
        y1: q.ul.y.max(q.ur.y).max(q.ll.y).max(q.lr.y),
    }
}

#[no_mangle]
pub extern "C" fn fz_transform_quad(q: fz_quad, m: fz_matrix) -> fz_quad {
    fz_quad {
        ul: fz_transform_point(q.ul, m),
        ur: fz_transform_point(q.ur, m),
        ll: fz_transform_point(q.ll, m),
        lr: fz_transform_point(q.lr, m),
    }
}

#[no_mangle]
pub extern "C" fn fz_is_point_inside_rect(p: fz_point, r: fz_rect) -> i32 {
    if p.x >= r.x0 && p.x < r.x1 && p.y >= r.y0 && p.y < r.y1 {
        1
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn fz_is_point_inside_irect(x: i32, y: i32, r: fz_irect) -> i32 {
    if x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1 {
        1
    } else {
        0
    }
}

// ============================================================================
// Version
// ============================================================================

#[no_mangle]
pub extern "C" fn fz_version() -> *const std::ffi::c_char {
    static VERSION: &[u8] = b"0.1.0\0";
    VERSION.as_ptr() as *const std::ffi::c_char
}

