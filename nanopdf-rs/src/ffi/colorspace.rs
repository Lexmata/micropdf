//! C FFI for colorspace - MuPDF compatible (stub)

use super::context::fz_context;
use std::ffi::c_char;
use std::ptr;

pub struct fz_colorspace {
    refs: i32,
    name: &'static str,
    n: i32,
    cs_type: i32,
}

// Colorspace type constants
pub const FZ_COLORSPACE_NONE: i32 = 0;
pub const FZ_COLORSPACE_GRAY: i32 = 1;
pub const FZ_COLORSPACE_RGB: i32 = 2;
pub const FZ_COLORSPACE_BGR: i32 = 3;
pub const FZ_COLORSPACE_CMYK: i32 = 4;
pub const FZ_COLORSPACE_LAB: i32 = 5;

// Static device colorspaces
static mut DEVICE_GRAY: fz_colorspace = fz_colorspace {
    refs: i32::MAX,
    name: "DeviceGray",
    n: 1,
    cs_type: FZ_COLORSPACE_GRAY,
};

static mut DEVICE_RGB: fz_colorspace = fz_colorspace {
    refs: i32::MAX,
    name: "DeviceRGB",
    n: 3,
    cs_type: FZ_COLORSPACE_RGB,
};

static mut DEVICE_BGR: fz_colorspace = fz_colorspace {
    refs: i32::MAX,
    name: "DeviceBGR",
    n: 3,
    cs_type: FZ_COLORSPACE_BGR,
};

static mut DEVICE_CMYK: fz_colorspace = fz_colorspace {
    refs: i32::MAX,
    name: "DeviceCMYK",
    n: 4,
    cs_type: FZ_COLORSPACE_CMYK,
};

#[no_mangle]
pub extern "C" fn fz_device_gray(_ctx: *mut fz_context) -> *mut fz_colorspace {
    unsafe { &mut DEVICE_GRAY as *mut fz_colorspace }
}

#[no_mangle]
pub extern "C" fn fz_device_rgb(_ctx: *mut fz_context) -> *mut fz_colorspace {
    unsafe { &mut DEVICE_RGB as *mut fz_colorspace }
}

#[no_mangle]
pub extern "C" fn fz_device_bgr(_ctx: *mut fz_context) -> *mut fz_colorspace {
    unsafe { &mut DEVICE_BGR as *mut fz_colorspace }
}

#[no_mangle]
pub extern "C" fn fz_device_cmyk(_ctx: *mut fz_context) -> *mut fz_colorspace {
    unsafe { &mut DEVICE_CMYK as *mut fz_colorspace }
}

#[no_mangle]
pub extern "C" fn fz_keep_colorspace(_ctx: *mut fz_context, cs: *mut fz_colorspace) -> *mut fz_colorspace {
    if cs.is_null() {
        return ptr::null_mut();
    }
    unsafe {
        if (*cs).refs != i32::MAX {
            (*cs).refs += 1;
        }
    }
    cs
}

#[no_mangle]
pub extern "C" fn fz_drop_colorspace(_ctx: *mut fz_context, cs: *mut fz_colorspace) {
    if cs.is_null() {
        return;
    }
    unsafe {
        if (*cs).refs != i32::MAX {
            (*cs).refs -= 1;
            if (*cs).refs <= 0 {
                drop(Box::from_raw(cs));
            }
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_colorspace_n(_ctx: *mut fz_context, cs: *mut fz_colorspace) -> i32 {
    if cs.is_null() { 0 } else { unsafe { (*cs).n } }
}

#[no_mangle]
pub extern "C" fn fz_colorspace_is_gray(_ctx: *mut fz_context, cs: *mut fz_colorspace) -> i32 {
    if cs.is_null() { 0 } else { if unsafe { (*cs).cs_type } == FZ_COLORSPACE_GRAY { 1 } else { 0 } }
}

#[no_mangle]
pub extern "C" fn fz_colorspace_is_rgb(_ctx: *mut fz_context, cs: *mut fz_colorspace) -> i32 {
    if cs.is_null() { 0 } else { if unsafe { (*cs).cs_type } == FZ_COLORSPACE_RGB { 1 } else { 0 } }
}

#[no_mangle]
pub extern "C" fn fz_colorspace_is_cmyk(_ctx: *mut fz_context, cs: *mut fz_colorspace) -> i32 {
    if cs.is_null() { 0 } else { if unsafe { (*cs).cs_type } == FZ_COLORSPACE_CMYK { 1 } else { 0 } }
}

