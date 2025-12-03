//! C FFI for stream - MuPDF compatible (stub)

use super::context::fz_context;
use super::buffer::fz_buffer;
use std::ffi::c_char;
use std::ptr;

/// Opaque stream type
pub struct fz_stream {
    // TODO: Implement stream internals
    _private: (),
}

#[no_mangle]
pub extern "C" fn fz_keep_stream(_ctx: *mut fz_context, stm: *mut fz_stream) -> *mut fz_stream {
    stm // Stub
}

#[no_mangle]
pub extern "C" fn fz_drop_stream(_ctx: *mut fz_context, _stm: *mut fz_stream) {
    // Stub
}

#[no_mangle]
pub extern "C" fn fz_open_file(_ctx: *mut fz_context, _filename: *const c_char) -> *mut fz_stream {
    ptr::null_mut() // Stub - not implemented yet
}

#[no_mangle]
pub extern "C" fn fz_open_memory(
    _ctx: *mut fz_context,
    _data: *const u8,
    _len: usize,
) -> *mut fz_stream {
    ptr::null_mut() // Stub
}

#[no_mangle]
pub extern "C" fn fz_open_buffer(_ctx: *mut fz_context, _buf: *mut fz_buffer) -> *mut fz_stream {
    ptr::null_mut() // Stub
}

#[no_mangle]
pub extern "C" fn fz_read(
    _ctx: *mut fz_context,
    _stm: *mut fz_stream,
    _data: *mut u8,
    _len: usize,
) -> usize {
    0 // Stub
}

#[no_mangle]
pub extern "C" fn fz_read_byte(_ctx: *mut fz_context, _stm: *mut fz_stream) -> i32 {
    -1 // EOF
}

#[no_mangle]
pub extern "C" fn fz_is_eof(_ctx: *mut fz_context, _stm: *mut fz_stream) -> i32 {
    1 // Always EOF for stub
}

#[no_mangle]
pub extern "C" fn fz_seek(_ctx: *mut fz_context, _stm: *mut fz_stream, _offset: i64, _whence: i32) {
    // Stub
}

#[no_mangle]
pub extern "C" fn fz_tell(_ctx: *mut fz_context, _stm: *mut fz_stream) -> i64 {
    0 // Stub
}

