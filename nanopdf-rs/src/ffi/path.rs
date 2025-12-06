/**
 * Path FFI
 *
 * C-compatible FFI for path operations.
 * Paths represent vector graphics for stroking and filling.
 */

use crate::ffi::{Handle, HandleStore};
use crate::ffi::geometry::fz_rect;
use crate::fitz::geometry::{Point, Rect};
use crate::fitz::path::{Path, StrokeState};
use std::ffi::c_float;
use std::sync::LazyLock;

// ============================================================================
// Path Handle Store
// ============================================================================

/// Global handle store for paths
pub static PATH_STORE: LazyLock<HandleStore<Path>> = LazyLock::new(HandleStore::new);

/// Global handle store for stroke states
pub static STROKE_STORE: LazyLock<HandleStore<StrokeState>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Path Operations
// ============================================================================

/// Create a new empty path
///
/// # Safety
/// - ctx must be a valid context handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_path(_ctx: Handle) -> Handle {
    let path = Path::new();
    PATH_STORE.insert(path)
}

/// Drop path handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_path(_ctx: Handle, path: Handle) {
    PATH_STORE.remove(path);
}

/// Move to a point (start new subpath)
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_moveto(_ctx: Handle, path: Handle, x: c_float, y: c_float) {
    let Some(arc) = PATH_STORE.get(path) else {
        return;
    };
    let Ok(mut path_obj) = arc.lock() else {
        return;
    };
    
    path_obj.move_to(Point::new(x, y));
}

/// Line to a point
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_lineto(_ctx: Handle, path: Handle, x: c_float, y: c_float) {
    let Some(arc) = PATH_STORE.get(path) else {
        return;
    };
    let Ok(mut path_obj) = arc.lock() else {
        return;
    };
    
    path_obj.line_to(Point::new(x, y));
}

/// Cubic Bezier curve to a point
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_curveto(
    _ctx: Handle,
    path: Handle,
    x1: c_float,
    y1: c_float,
    x2: c_float,
    y2: c_float,
    x3: c_float,
    y3: c_float,
) {
    let Some(arc) = PATH_STORE.get(path) else {
        return;
    };
    let Ok(mut path_obj) = arc.lock() else {
        return;
    };
    
    path_obj.curve_to(Point::new(x1, y1), Point::new(x2, y2), Point::new(x3, y3));
}

/// Close the current subpath
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_closepath(_ctx: Handle, path: Handle) {
    let Some(arc) = PATH_STORE.get(path) else {
        return;
    };
    let Ok(mut path_obj) = arc.lock() else {
        return;
    };
    
    path_obj.close();
}

/// Add rectangle to path
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_rectto(_ctx: Handle, path: Handle, x: c_float, y: c_float, w: c_float, h: c_float) {
    let Some(arc) = PATH_STORE.get(path) else {
        return;
    };
    let Ok(mut path_obj) = arc.lock() else {
        return;
    };
    
    let rect = Rect::new(x, y, x + w, y + h);
    path_obj.rect(rect);
}

/// Get path bounding box
///
/// # Safety
/// - ctx must be a valid context handle
/// - path must be a valid path handle
/// - stroke can be 0 for no stroke, or a valid stroke state handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_bound_path(_ctx: Handle, path: Handle, stroke: Handle) -> fz_rect {
    let Some(arc) = PATH_STORE.get(path) else {
        return fz_rect { x0: 0.0, y0: 0.0, x1: 0.0, y1: 0.0 };
    };
    let Ok(path_obj) = arc.lock() else {
        return fz_rect { x0: 0.0, y0: 0.0, x1: 0.0, y1: 0.0 };
    };
    
    // For now, just use bounds() regardless of stroke
    // TODO: Implement proper stroke bounds calculation
    let bounds = path_obj.bounds();
    
    fz_rect {
        x0: bounds.x0,
        y0: bounds.y0,
        x1: bounds.x1,
        y1: bounds.y1,
    }
}
