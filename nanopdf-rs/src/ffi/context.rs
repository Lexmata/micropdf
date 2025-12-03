//! C FFI for context - MuPDF compatible

use std::ffi::{c_char, c_int, c_void, CStr};
use std::ptr;

/// Opaque context type
pub struct fz_context {
    user_data: *mut c_void,
}

#[no_mangle]
pub extern "C" fn fz_new_context(
    _alloc: *const c_void,
    _locks: *const c_void,
    _max_store: usize,
) -> *mut fz_context {
    let ctx = Box::new(fz_context {
        user_data: ptr::null_mut(),
    });
    Box::into_raw(ctx)
}

#[no_mangle]
pub extern "C" fn fz_clone_context(ctx: *mut fz_context) -> *mut fz_context {
    if ctx.is_null() {
        return ptr::null_mut();
    }
    let new_ctx = Box::new(fz_context {
        user_data: unsafe { (*ctx).user_data },
    });
    Box::into_raw(new_ctx)
}

#[no_mangle]
pub extern "C" fn fz_drop_context(ctx: *mut fz_context) {
    if !ctx.is_null() {
        unsafe {
            drop(Box::from_raw(ctx));
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_set_user_context(ctx: *mut fz_context, user: *mut c_void) {
    if !ctx.is_null() {
        unsafe {
            (*ctx).user_data = user;
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_user_context(ctx: *mut fz_context) -> *mut c_void {
    if ctx.is_null() {
        return ptr::null_mut();
    }
    unsafe { (*ctx).user_data }
}

// Memory allocation (using system allocator)
#[no_mangle]
pub extern "C" fn fz_malloc(_ctx: *mut fz_context, size: usize) -> *mut c_void {
    let layout = std::alloc::Layout::from_size_align(size, 8).unwrap();
    unsafe { std::alloc::alloc(layout) as *mut c_void }
}

#[no_mangle]
pub extern "C" fn fz_malloc_no_throw(_ctx: *mut fz_context, size: usize) -> *mut c_void {
    let layout = std::alloc::Layout::from_size_align(size, 8).unwrap();
    unsafe { std::alloc::alloc(layout) as *mut c_void }
}

#[no_mangle]
pub extern "C" fn fz_calloc(_ctx: *mut fz_context, count: usize, size: usize) -> *mut c_void {
    let total = count.saturating_mul(size);
    let layout = std::alloc::Layout::from_size_align(total, 8).unwrap();
    unsafe { std::alloc::alloc_zeroed(layout) as *mut c_void }
}

#[no_mangle]
pub extern "C" fn fz_free(_ctx: *mut fz_context, ptr: *mut c_void) {
    // Note: In a real implementation, we'd need to track allocation sizes
    // For now, this is a stub that leaks memory
    let _ = ptr;
}

#[no_mangle]
pub extern "C" fn fz_strdup(_ctx: *mut fz_context, s: *const c_char) -> *mut c_char {
    if s.is_null() {
        return ptr::null_mut();
    }
    unsafe {
        let len = CStr::from_ptr(s).to_bytes().len();
        let ptr = fz_malloc(_ctx, len + 1) as *mut c_char;
        if !ptr.is_null() {
            ptr::copy_nonoverlapping(s, ptr, len + 1);
        }
        ptr
    }
}

// Error handling stubs
#[no_mangle]
pub extern "C" fn fz_caught(_ctx: *mut fz_context) -> c_int {
    0
}

#[no_mangle]
pub extern "C" fn fz_caught_message(_ctx: *mut fz_context) -> *const c_char {
    static MSG: &[u8] = b"No error\0";
    MSG.as_ptr() as *const c_char
}

