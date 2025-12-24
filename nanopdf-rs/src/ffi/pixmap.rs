/**
 * Pixmap FFI
 *
 * C-compatible FFI for pixmap operations.
 * Pixmaps are pixel buffers for rendering output.
 */
use crate::ffi::Handle;
use crate::fitz::colorspace::Colorspace;
pub use crate::fitz::pixmap::Pixmap;
use std::ffi::{c_int, c_uchar};

// ============================================================================
// Pixmap Operations
// ============================================================================

/// Create a new pixmap
///
/// # Safety
/// - ctx must be a valid context handle
/// - colorspace can be 0 for alpha-only pixmap, or valid colorspace handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_pixmap(
    _ctx: Handle,
    colorspace: Handle,
    w: c_int,
    h: c_int,
    alpha: c_int,
) -> Handle {
    // Convert colorspace handle to fitz::colorspace::Colorspace
    let cs = if colorspace != 0 {
        // Device colorspaces have handles 1-5
        match colorspace {
            1 => Some(Colorspace::device_gray()),
            2 => Some(Colorspace::device_rgb()),
            4 => Some(Colorspace::device_cmyk()),
            _ => None, // Custom colorspaces (>= 100) not yet supported
        }
    } else {
        None
    };

    let Ok(pixmap) = Pixmap::new(cs, w, h, alpha != 0) else {
        return 0;
    };

    super::PIXMAPS.insert(pixmap)
}

/// Drop pixmap handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_pixmap(_ctx: Handle, pixmap: Handle) {
    super::PIXMAPS.remove(pixmap);
}

/// Get pixmap width
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_pixmap_width(_ctx: Handle, pixmap: Handle) -> c_int {
    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return 0;
    };
    let Ok(pm) = arc.lock() else {
        return 0;
    };

    pm.width()
}

/// Get pixmap height
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_pixmap_height(_ctx: Handle, pixmap: Handle) -> c_int {
    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return 0;
    };
    let Ok(pm) = arc.lock() else {
        return 0;
    };

    pm.height()
}

/// Get pixmap samples (pixel data)
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
/// - data and size must be valid pointers
#[unsafe(no_mangle)]
pub unsafe extern "C" fn fz_pixmap_samples(
    _ctx: Handle,
    pixmap: Handle,
    data: *mut *const c_uchar,
    size: *mut usize,
) {
    if data.is_null() || size.is_null() {
        return;
    }

    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return;
    };
    let Ok(pm) = arc.lock() else {
        return;
    };

    let samples = pm.samples();

    unsafe {
        *data = samples.as_ptr();
        *size = samples.len();
    }
}

/// Get pixmap stride (bytes per row)
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_pixmap_stride(_ctx: Handle, pixmap: Handle) -> usize {
    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return 0;
    };
    let Ok(pm) = arc.lock() else {
        return 0;
    };

    pm.stride()
}

/// Get number of components (including alpha)
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_pixmap_components(_ctx: Handle, pixmap: Handle) -> c_int {
    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return 0;
    };
    let Ok(pm) = arc.lock() else {
        return 0;
    };

    pm.n() as c_int
}

/// Clear pixmap to a color
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_clear_pixmap(_ctx: Handle, pixmap: Handle, value: c_int) {
    let Some(arc) = super::PIXMAPS.get(pixmap) else {
        return;
    };
    let Ok(mut pm) = arc.lock() else {
        return;
    };

    pm.clear(value as u8);
}
