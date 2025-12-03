//! C FFI for buffer - MuPDF compatible

use super::context::fz_context;
use std::ffi::{c_char, c_int, c_uchar, c_void};
use std::ptr;
use std::slice;

/// fz_buffer - Dynamic byte buffer
pub struct fz_buffer {
    refs: c_int,
    data: Vec<u8>,
    shared: bool,
}

#[no_mangle]
pub extern "C" fn fz_new_buffer(_ctx: *mut fz_context, capacity: usize) -> *mut fz_buffer {
    let buf = Box::new(fz_buffer {
        refs: 1,
        data: Vec::with_capacity(capacity),
        shared: false,
    });
    Box::into_raw(buf)
}

#[no_mangle]
pub extern "C" fn fz_new_buffer_from_copied_data(
    _ctx: *mut fz_context,
    data: *const c_uchar,
    size: usize,
) -> *mut fz_buffer {
    if data.is_null() || size == 0 {
        return fz_new_buffer(_ctx, 0);
    }
    let buf = Box::new(fz_buffer {
        refs: 1,
        data: unsafe { slice::from_raw_parts(data, size).to_vec() },
        shared: false,
    });
    Box::into_raw(buf)
}

#[no_mangle]
pub extern "C" fn fz_keep_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) -> *mut fz_buffer {
    if buf.is_null() {
        return ptr::null_mut();
    }
    unsafe {
        (*buf).refs += 1;
    }
    buf
}

#[no_mangle]
pub extern "C" fn fz_drop_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) {
    if buf.is_null() {
        return;
    }
    unsafe {
        (*buf).refs -= 1;
        if (*buf).refs <= 0 {
            drop(Box::from_raw(buf));
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_buffer_storage(
    _ctx: *mut fz_context,
    buf: *mut fz_buffer,
    datap: *mut *mut c_uchar,
) -> usize {
    if buf.is_null() {
        if !datap.is_null() {
            unsafe { *datap = ptr::null_mut(); }
        }
        return 0;
    }
    unsafe {
        if !datap.is_null() {
            *datap = (*buf).data.as_mut_ptr();
        }
        (*buf).data.len()
    }
}

#[no_mangle]
pub extern "C" fn fz_string_from_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) -> *const c_char {
    if buf.is_null() {
        return ptr::null();
    }
    unsafe {
        // Ensure null termination
        if (*buf).data.is_empty() || *(*buf).data.last().unwrap() != 0 {
            (*buf).data.push(0);
        }
        (*buf).data.as_ptr() as *const c_char
    }
}

#[no_mangle]
pub extern "C" fn fz_resize_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer, capacity: usize) {
    if buf.is_null() {
        return;
    }
    unsafe {
        (*buf).data.resize(capacity, 0);
    }
}

#[no_mangle]
pub extern "C" fn fz_grow_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) {
    if buf.is_null() {
        return;
    }
    unsafe {
        let new_cap = ((*buf).data.capacity() * 2).max(256);
        (*buf).data.reserve(new_cap - (*buf).data.capacity());
    }
}

#[no_mangle]
pub extern "C" fn fz_trim_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) {
    if buf.is_null() {
        return;
    }
    unsafe {
        (*buf).data.shrink_to_fit();
    }
}

#[no_mangle]
pub extern "C" fn fz_clear_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) {
    if buf.is_null() {
        return;
    }
    unsafe {
        (*buf).data.clear();
    }
}

#[no_mangle]
pub extern "C" fn fz_append_data(
    _ctx: *mut fz_context,
    buf: *mut fz_buffer,
    data: *const c_void,
    len: usize,
) {
    if buf.is_null() || data.is_null() || len == 0 {
        return;
    }
    unsafe {
        let slice = slice::from_raw_parts(data as *const u8, len);
        (*buf).data.extend_from_slice(slice);
    }
}

#[no_mangle]
pub extern "C" fn fz_append_string(_ctx: *mut fz_context, buf: *mut fz_buffer, data: *const c_char) {
    if buf.is_null() || data.is_null() {
        return;
    }
    unsafe {
        let cstr = std::ffi::CStr::from_ptr(data);
        (*buf).data.extend_from_slice(cstr.to_bytes());
    }
}

#[no_mangle]
pub extern "C" fn fz_append_byte(_ctx: *mut fz_context, buf: *mut fz_buffer, c: c_int) {
    if buf.is_null() {
        return;
    }
    unsafe {
        (*buf).data.push(c as u8);
    }
}

#[no_mangle]
pub extern "C" fn fz_terminate_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) {
    if buf.is_null() {
        return;
    }
    unsafe {
        if (*buf).data.is_empty() || *(*buf).data.last().unwrap() != 0 {
            (*buf).data.push(0);
            (*buf).data.pop(); // Don't count the null in length
        }
    }
}

#[no_mangle]
pub extern "C" fn fz_md5_buffer(
    _ctx: *mut fz_context,
    buf: *mut fz_buffer,
    digest: *mut [u8; 16],
) {
    if buf.is_null() || digest.is_null() {
        return;
    }
    unsafe {
        use md5::{Digest, Md5};
        let mut hasher = Md5::new();
        hasher.update(&(*buf).data);
        let result = hasher.finalize();
        (*digest).copy_from_slice(&result);
    }
}

#[no_mangle]
pub extern "C" fn fz_clone_buffer(_ctx: *mut fz_context, buf: *mut fz_buffer) -> *mut fz_buffer {
    if buf.is_null() {
        return ptr::null_mut();
    }
    unsafe {
        fz_new_buffer_from_copied_data(_ctx, (*buf).data.as_ptr(), (*buf).data.len())
    }
}

#[no_mangle]
pub extern "C" fn fz_buffer_extract(
    _ctx: *mut fz_context,
    buf: *mut fz_buffer,
    data: *mut *mut c_uchar,
) -> usize {
    if buf.is_null() {
        if !data.is_null() {
            unsafe { *data = ptr::null_mut(); }
        }
        return 0;
    }
    unsafe {
        let len = (*buf).data.len();
        let ptr = fz_malloc(_ctx, len) as *mut c_uchar;
        if !ptr.is_null() {
            ptr::copy_nonoverlapping((*buf).data.as_ptr(), ptr, len);
        }
        if !data.is_null() {
            *data = ptr;
        }
        (*buf).data.clear();
        len
    }
}

use super::context::fz_malloc;

