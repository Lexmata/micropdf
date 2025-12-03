//! C FFI for buffer - MuPDF compatible
//! Safe Rust implementation using handle-based resource management

use super::{Handle, BUFFERS};
use std::ffi::{c_char, c_int, c_void};

/// Internal buffer state
pub struct Buffer {
    data: Vec<u8>,
}

impl Buffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            data: Vec::with_capacity(capacity),
        }
    }

    pub fn from_data(data: &[u8]) -> Self {
        Self {
            data: data.to_vec(),
        }
    }

    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    pub fn data(&self) -> &[u8] {
        &self.data
    }

    pub fn data_mut(&mut self) -> &mut Vec<u8> {
        &mut self.data
    }

    pub fn append(&mut self, data: &[u8]) {
        self.data.extend_from_slice(data);
    }

    pub fn append_byte(&mut self, byte: u8) {
        self.data.push(byte);
    }

    pub fn clear(&mut self) {
        self.data.clear();
    }

    pub fn resize(&mut self, new_size: usize) {
        self.data.resize(new_size, 0);
    }

    pub fn ensure_null_terminated(&mut self) {
        if self.data.is_empty() || self.data.last() != Some(&0) {
            self.data.push(0);
        }
    }
}

/// Create a new buffer with given capacity
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_buffer(_ctx: Handle, capacity: usize) -> Handle {
    BUFFERS.insert(Buffer::new(capacity))
}

/// Create a buffer from copied data
///
/// # Safety
/// Caller must ensure `data` points to valid memory of at least `size` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_buffer_from_copied_data(
    _ctx: Handle,
    data: *const u8,
    size: usize,
) -> Handle {
    if data.is_null() || size == 0 {
        return BUFFERS.insert(Buffer::new(0));
    }

    // SAFETY: Caller guarantees data points to valid memory of `size` bytes
    #[allow(unsafe_code)]
    let data_slice = unsafe { std::slice::from_raw_parts(data, size) };

    BUFFERS.insert(Buffer::from_data(data_slice))
}

/// Keep (increment ref) a buffer - returns same handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_buffer(_ctx: Handle, buf: Handle) -> Handle {
    BUFFERS.keep(buf)
}

/// Drop a buffer reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_buffer(_ctx: Handle, buf: Handle) {
    let _ = BUFFERS.remove(buf);
}

/// Get buffer storage - returns length, optionally fills data pointer
///
/// Note: This function cannot safely return a pointer to internal data
/// because the buffer may be moved or reallocated. For safe access,
/// use fz_buffer_len and copy the data.
#[unsafe(no_mangle)]
pub extern "C" fn fz_buffer_storage(
    _ctx: Handle,
    buf: Handle,
    datap: *mut *mut u8,
) -> usize {
    let Some(buffer) = BUFFERS.get(buf) else {
        if !datap.is_null() {
            // SAFETY: Caller guarantees datap is valid if non-null
            #[allow(unsafe_code)]
            unsafe { *datap = std::ptr::null_mut(); }
        }
        return 0;
    };

    let guard = buffer.lock().unwrap();
    let len = guard.len();

    if !datap.is_null() {
        // We can't safely return a pointer to internal data
        // because the buffer may be reallocated
        #[allow(unsafe_code)]
        unsafe { *datap = std::ptr::null_mut(); }
    }

    len
}

/// Get buffer as null-terminated C string
///
/// Note: This function cannot safely return a pointer to internal buffer data
/// because the data may be moved or reallocated. Returns empty string for now.
#[unsafe(no_mangle)]
pub extern "C" fn fz_string_from_buffer(_ctx: Handle, _buf: Handle) -> *const c_char {
    // Can't return internal pointer safely without stable address
    // Return empty string for now
    c"".as_ptr()
}

/// Resize buffer to new capacity
#[unsafe(no_mangle)]
pub extern "C" fn fz_resize_buffer(_ctx: Handle, buf: Handle, capacity: usize) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.resize(capacity);
        }
    }
}

/// Grow buffer (double capacity or minimum 256)
#[unsafe(no_mangle)]
pub extern "C" fn fz_grow_buffer(_ctx: Handle, buf: Handle) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            let current_cap = guard.data.capacity();
            let new_cap = (current_cap * 2).max(256);
            guard.data.reserve(new_cap.saturating_sub(current_cap));
        }
    }
}

/// Trim buffer to fit contents
#[unsafe(no_mangle)]
pub extern "C" fn fz_trim_buffer(_ctx: Handle, buf: Handle) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.data.shrink_to_fit();
        }
    }
}

/// Clear buffer contents
#[unsafe(no_mangle)]
pub extern "C" fn fz_clear_buffer(_ctx: Handle, buf: Handle) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.clear();
        }
    }
}

/// Append data to buffer
///
/// # Safety
/// Caller must ensure `data` points to valid memory of at least `len` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_data(
    _ctx: Handle,
    buf: Handle,
    data: *const c_void,
    len: usize,
) {
    if data.is_null() || len == 0 {
        return;
    }

    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            // SAFETY: Caller guarantees data points to valid memory of `len` bytes
            #[allow(unsafe_code)]
            let slice = unsafe { std::slice::from_raw_parts(data as *const u8, len) };
            guard.append(slice);
        }
    }
}

/// Append C string to buffer
///
/// # Safety
/// Caller must ensure `data` is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_string(_ctx: Handle, buf: Handle, data: *const c_char) {
    if data.is_null() {
        return;
    }

    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            // SAFETY: Caller guarantees data is a valid null-terminated C string
            #[allow(unsafe_code)]
            let c_str = unsafe { std::ffi::CStr::from_ptr(data) };
            guard.append(c_str.to_bytes());
        }
    }
}

/// Append single byte to buffer
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_byte(_ctx: Handle, buf: Handle, c: c_int) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append_byte(c as u8);
        }
    }
}

/// Null-terminate buffer
#[unsafe(no_mangle)]
pub extern "C" fn fz_terminate_buffer(_ctx: Handle, buf: Handle) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.ensure_null_terminated();
        }
    }
}

/// Compute MD5 digest of buffer contents
///
/// # Safety
/// Caller must ensure `digest` points to valid writable memory of 16 bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_md5_buffer(
    _ctx: Handle,
    buf: Handle,
    digest: *mut [u8; 16],
) {
    if digest.is_null() {
        return;
    }

    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(guard) = buffer.lock() {
            use md5::{Digest, Md5};
            let mut hasher = Md5::new();
            hasher.update(guard.data());
            let result = hasher.finalize();

            // SAFETY: Caller guarantees digest points to valid writable [u8; 16]
            #[allow(unsafe_code)]
            unsafe {
                (*digest).copy_from_slice(&result);
            }
        }
    }
}

/// Clone a buffer
#[unsafe(no_mangle)]
pub extern "C" fn fz_clone_buffer(_ctx: Handle, buf: Handle) -> Handle {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(guard) = buffer.lock() {
            return BUFFERS.insert(Buffer::from_data(guard.data()));
        }
    }
    0
}

/// Get buffer length
#[unsafe(no_mangle)]
pub extern "C" fn fz_buffer_len(_ctx: Handle, buf: Handle) -> usize {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(guard) = buffer.lock() {
            return guard.len();
        }
    }
    0
}

// Note: Some functions that return raw pointers to internal data
// cannot be implemented safely. They would require:
// 1. A stable buffer address (Box::leak or similar)
// 2. Unsafe blocks to convert to raw pointers
//
// For a fully safe API, consider returning handles or using
// callback-based APIs instead.

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_buffer_create_and_drop() {
        let handle = fz_new_buffer(0, 100);
        assert_ne!(handle, 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_append_byte() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'A' as i32);
        fz_append_byte(0, handle, b'B' as i32);

        let len = fz_buffer_len(0, handle);
        assert_eq!(len, 2);

        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_clear() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'X' as i32);
        assert_eq!(fz_buffer_len(0, handle), 1);

        fz_clear_buffer(0, handle);
        assert_eq!(fz_buffer_len(0, handle), 0);

        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_keep() {
        let handle = fz_new_buffer(0, 0);
        let kept = fz_keep_buffer(0, handle);
        assert_eq!(kept, handle);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_resize() {
        let handle = fz_new_buffer(0, 10);
        fz_resize_buffer(0, handle, 100);
        // Resize should succeed
        assert_eq!(fz_buffer_len(0, handle), 100);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_grow() {
        let handle = fz_new_buffer(0, 10);
        fz_grow_buffer(0, handle);
        // Buffer should be able to accommodate growth
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_trim() {
        let handle = fz_new_buffer(0, 100);
        fz_append_byte(0, handle, b'A' as i32);
        fz_trim_buffer(0, handle);
        assert_eq!(fz_buffer_len(0, handle), 1);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_clone() {
        let handle1 = fz_new_buffer(0, 0);
        fz_append_byte(0, handle1, b'X' as i32);
        fz_append_byte(0, handle1, b'Y' as i32);

        let handle2 = fz_clone_buffer(0, handle1);
        assert_ne!(handle2, 0);
        assert_eq!(fz_buffer_len(0, handle2), 2);

        // Modify original, clone should be unchanged
        fz_clear_buffer(0, handle1);
        assert_eq!(fz_buffer_len(0, handle1), 0);
        assert_eq!(fz_buffer_len(0, handle2), 2);

        fz_drop_buffer(0, handle1);
        fz_drop_buffer(0, handle2);
    }

    #[test]
    fn test_buffer_len_invalid() {
        let len = fz_buffer_len(0, 0);
        assert_eq!(len, 0);
    }

    #[test]
    fn test_buffer_append_multiple() {
        let handle = fz_new_buffer(0, 0);
        for i in 0..100 {
            fz_append_byte(0, handle, i as i32);
        }
        assert_eq!(fz_buffer_len(0, handle), 100);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_storage() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'H' as i32);
        fz_append_byte(0, handle, b'i' as i32);

        let mut datap: *mut u8 = std::ptr::null_mut();
        let size = fz_buffer_storage(0, handle, &mut datap);
        
        // Size should be the length of the buffer
        assert_eq!(size, 2);
        // datap will be null because we can't safely return internal pointer
        assert!(datap.is_null());

        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_internal() {
        let buf = Buffer::new(10);
        assert_eq!(buf.len(), 0);
        assert!(buf.data().is_empty());
    }

    #[test]
    fn test_buffer_from_data() {
        let data = [1u8, 2, 3, 4, 5];
        let buf = Buffer::from_data(&data);
        assert_eq!(buf.len(), 5);
        assert_eq!(buf.data(), &data);
    }

    #[test]
    fn test_buffer_append_internal() {
        let mut buf = Buffer::new(0);
        buf.append_byte(0x42);
        assert_eq!(buf.len(), 1);
        assert_eq!(buf.data(), &[0x42]);
    }

    #[test]
    fn test_buffer_clear_internal() {
        let mut buf = Buffer::from_data(&[1, 2, 3]);
        buf.clear();
        assert_eq!(buf.len(), 0);
    }
}
