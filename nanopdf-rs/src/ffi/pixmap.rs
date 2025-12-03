//! C FFI for pixmap - MuPDF compatible (stub)

use super::context::fz_context;
use super::geometry::{fz_irect, fz_rect};
use std::ptr;

pub struct fz_colorspace;
pub struct fz_separations;

/// fz_pixmap - Pixel buffer
pub struct fz_pixmap {
    refs: i32,
    x: i32,
    y: i32,
    w: i32,
    h: i32,
    n: i32,
    alpha: i32,
    stride: i32,
    samples: Vec<u8>,
}

#[no_mangle]
pub extern "C" fn fz_new_pixmap(
    _ctx: *mut fz_context,
    _cs: *mut fz_colorspace,
    w: i32,
    h: i32,
    _seps: *mut fz_separations,
    alpha: i32,
) -> *mut fz_pixmap {
    let n = 3 + alpha; // Assume RGB for now
    let stride = w * n;
    let size = (stride * h) as usize;
    
    let pix = Box::new(fz_pixmap {
        refs: 1,
        x: 0,
        y: 0,
        w,
        h,
        n,
        alpha,
        stride,
        samples: vec![0u8; size],
    });
    Box::into_raw(pix)
}

#[no_mangle]
pub extern "C" fn fz_keep_pixmap(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> *mut fz_pixmap {
    if pix.is_null() {
        return ptr::null_mut();
    }
    unsafe {
        (*pix).refs += 1;
    }
    pix
}

#[no_mangle]
pub extern "C" fn fz_drop_pixmap(_ctx: *mut fz_context, pix: *mut fz_pixmap) {
    if pix.is_null() {
        return;
    }
    unsafe {
        (*pix).refs -= 1;
        if (*pix).refs <= 0 {
            drop(Box::from_raw(pix));
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_x(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).x } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_y(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).y } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_width(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).w } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_height(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).h } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_components(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).n } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_alpha(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).alpha } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_stride(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> i32 {
    if pix.is_null() { 0 } else { unsafe { (*pix).stride } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_samples(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> *mut u8 {
    if pix.is_null() { ptr::null_mut() } else { unsafe { (*pix).samples.as_mut_ptr() } }
}

#[no_mangle]
pub extern "C" fn fz_pixmap_bbox(_ctx: *mut fz_context, pix: *mut fz_pixmap) -> fz_irect {
    if pix.is_null() {
        return fz_irect { x0: 0, y0: 0, x1: 0, y1: 0 };
    }
    unsafe {
        fz_irect {
            x0: (*pix).x,
            y0: (*pix).y,
            x1: (*pix).x + (*pix).w,
            y1: (*pix).y + (*pix).h,
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_clear_pixmap(_ctx: *mut fz_context, pix: *mut fz_pixmap) {
    if pix.is_null() {
        return;
    }
    unsafe {
        (*pix).samples.fill(0);
    }
}

#[no_mangle]
pub extern "C" fn fz_clear_pixmap_with_value(_ctx: *mut fz_context, pix: *mut fz_pixmap, value: i32) {
    if pix.is_null() {
        return;
    }
    unsafe {
        (*pix).samples.fill(value as u8);
    }
}

