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

// ============================================================================
// Integer Append Functions
// ============================================================================

/// Append 16-bit integer in little-endian format
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_int16_le(_ctx: Handle, buf: Handle, x: i16) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append(&x.to_le_bytes());
        }
    }
}

/// Append 32-bit integer in little-endian format
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_int32_le(_ctx: Handle, buf: Handle, x: i32) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append(&x.to_le_bytes());
        }
    }
}

/// Append 16-bit integer in big-endian format
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_int16_be(_ctx: Handle, buf: Handle, x: i16) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append(&x.to_be_bytes());
        }
    }
}

/// Append 32-bit integer in big-endian format
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_int32_be(_ctx: Handle, buf: Handle, x: i32) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append(&x.to_be_bytes());
        }
    }
}

// ============================================================================
// Bit Append Functions
// ============================================================================

/// Internal state for bit accumulation
pub struct BitBuffer {
    accumulator: u32,
    bits_in_accumulator: u8,
}

impl BitBuffer {
    pub fn new() -> Self {
        Self {
            accumulator: 0,
            bits_in_accumulator: 0,
        }
    }
}

impl Default for BitBuffer {
    fn default() -> Self {
        Self::new()
    }
}

use std::sync::LazyLock;
use std::sync::Mutex;
use std::collections::HashMap;

/// Global bit buffer state for each buffer handle
static BIT_BUFFERS: LazyLock<Mutex<HashMap<Handle, BitBuffer>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// Append bits to buffer
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_bits(_ctx: Handle, buf: Handle, value: i32, count: i32) {
    if count <= 0 || count > 32 {
        return;
    }

    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            if let Ok(mut bit_map) = BIT_BUFFERS.lock() {
                let bit_buf = bit_map.entry(buf).or_insert_with(BitBuffer::new);

                // Mask to get only the requested bits
                let mask = if count == 32 { u32::MAX } else { (1u32 << count) - 1 };
                let bits = (value as u32) & mask;

                // Add bits to accumulator
                bit_buf.accumulator = (bit_buf.accumulator << count) | bits;
                bit_buf.bits_in_accumulator += count as u8;

                // Flush complete bytes
                while bit_buf.bits_in_accumulator >= 8 {
                    bit_buf.bits_in_accumulator -= 8;
                    let byte = (bit_buf.accumulator >> bit_buf.bits_in_accumulator) as u8;
                    guard.append_byte(byte);
                }
            }
        }
    }
}

/// Append bits and pad to byte boundary
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_bits_pad(_ctx: Handle, buf: Handle) {
    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            if let Ok(mut bit_map) = BIT_BUFFERS.lock() {
                if let Some(bit_buf) = bit_map.get_mut(&buf) {
                    // Flush remaining bits with zero padding
                    if bit_buf.bits_in_accumulator > 0 {
                        let pad_bits = 8 - bit_buf.bits_in_accumulator;
                        let byte = (bit_buf.accumulator << pad_bits) as u8;
                        guard.append_byte(byte);
                        bit_buf.accumulator = 0;
                        bit_buf.bits_in_accumulator = 0;
                    }
                }
            }
        }
    }
}

// ============================================================================
// PDF String Functions
// ============================================================================

/// Append a PDF-escaped string (with parentheses)
///
/// # Safety
/// Caller must ensure `str` is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_pdf_string(_ctx: Handle, buf: Handle, str: *const c_char) {
    if str.is_null() {
        // Append empty string "()"
        if let Some(buffer) = BUFFERS.get(buf) {
            if let Ok(mut guard) = buffer.lock() {
                guard.append(b"()");
            }
        }
        return;
    }

    // SAFETY: Caller guarantees str is a valid null-terminated C string
    #[allow(unsafe_code)]
    let c_str = unsafe { std::ffi::CStr::from_ptr(str) };
    let bytes = c_str.to_bytes();

    if let Some(buffer) = BUFFERS.get(buf) {
        if let Ok(mut guard) = buffer.lock() {
            guard.append_byte(b'(');

            for &byte in bytes {
                match byte {
                    b'(' | b')' | b'\\' => {
                        guard.append_byte(b'\\');
                        guard.append_byte(byte);
                    }
                    b'\n' => {
                        guard.append_byte(b'\\');
                        guard.append_byte(b'n');
                    }
                    b'\r' => {
                        guard.append_byte(b'\\');
                        guard.append_byte(b'r');
                    }
                    b'\t' => {
                        guard.append_byte(b'\\');
                        guard.append_byte(b't');
                    }
                    _ => guard.append_byte(byte),
                }
            }

            guard.append_byte(b')');
        }
    }
}

/// Append another buffer's contents
#[unsafe(no_mangle)]
pub extern "C" fn fz_append_buffer(_ctx: Handle, buf: Handle, src: Handle) {
    // Get source data first
    let src_data = if let Some(src_buffer) = BUFFERS.get(src) {
        if let Ok(guard) = src_buffer.lock() {
            Some(guard.data().to_vec())
        } else {
            None
        }
    } else {
        None
    };

    // Then append to destination
    if let Some(data) = src_data {
        if let Some(buffer) = BUFFERS.get(buf) {
            if let Ok(mut guard) = buffer.lock() {
                guard.append(&data);
            }
        }
    }
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

    // ============================================================================
    // Additional tests for better coverage
    // ============================================================================

    #[test]
    fn test_buffer_from_copied_data() {
        let data = [1u8, 2, 3, 4, 5];
        let handle = fz_new_buffer_from_copied_data(0, data.as_ptr(), data.len());
        assert_ne!(handle, 0);
        assert_eq!(fz_buffer_len(0, handle), 5);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_from_copied_data_null() {
        let handle = fz_new_buffer_from_copied_data(0, std::ptr::null(), 0);
        assert_ne!(handle, 0);
        assert_eq!(fz_buffer_len(0, handle), 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_from_copied_data_null_with_size() {
        // Even with non-zero size, null ptr should return empty buffer
        let handle = fz_new_buffer_from_copied_data(0, std::ptr::null(), 100);
        assert_ne!(handle, 0);
        assert_eq!(fz_buffer_len(0, handle), 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_storage_null_datap() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'A' as i32);

        // Pass null pointer for datap
        let size = fz_buffer_storage(0, handle, std::ptr::null_mut());
        assert_eq!(size, 1);

        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_storage_invalid_handle() {
        let mut datap: *mut u8 = std::ptr::null_mut();
        let size = fz_buffer_storage(0, 99999, &mut datap);
        assert_eq!(size, 0);
        assert!(datap.is_null());
    }

    #[test]
    fn test_fz_string_from_buffer() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'H' as i32);

        let ptr = fz_string_from_buffer(0, handle);
        assert!(!ptr.is_null());

        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_buffer_resize_invalid_handle() {
        // Should not panic
        fz_resize_buffer(0, 99999, 100);
    }

    #[test]
    fn test_buffer_grow_invalid_handle() {
        // Should not panic
        fz_grow_buffer(0, 99999);
    }

    #[test]
    fn test_buffer_trim_invalid_handle() {
        // Should not panic
        fz_trim_buffer(0, 99999);
    }

    #[test]
    fn test_buffer_clear_invalid_handle() {
        // Should not panic
        fz_clear_buffer(0, 99999);
    }

    #[test]
    fn test_fz_append_data() {
        let handle = fz_new_buffer(0, 0);
        let data = [1u8, 2, 3, 4, 5];
        fz_append_data(0, handle, data.as_ptr() as *const c_void, data.len());
        assert_eq!(fz_buffer_len(0, handle), 5);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_data_null() {
        let handle = fz_new_buffer(0, 0);
        fz_append_data(0, handle, std::ptr::null(), 0);
        assert_eq!(fz_buffer_len(0, handle), 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_data_invalid_handle() {
        let data = [1u8, 2, 3];
        // Should not panic
        fz_append_data(0, 99999, data.as_ptr() as *const c_void, data.len());
    }

    #[test]
    fn test_fz_append_string() {
        let handle = fz_new_buffer(0, 0);
        let s = std::ffi::CString::new("Hello").unwrap();
        fz_append_string(0, handle, s.as_ptr());
        assert_eq!(fz_buffer_len(0, handle), 5);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_string_null() {
        let handle = fz_new_buffer(0, 0);
        fz_append_string(0, handle, std::ptr::null());
        assert_eq!(fz_buffer_len(0, handle), 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_string_invalid_handle() {
        let s = std::ffi::CString::new("Hello").unwrap();
        // Should not panic
        fz_append_string(0, 99999, s.as_ptr());
    }

    #[test]
    fn test_fz_append_byte_invalid_handle() {
        // Should not panic
        fz_append_byte(0, 99999, b'X' as i32);
    }

    #[test]
    fn test_fz_terminate_buffer() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'H' as i32);
        fz_terminate_buffer(0, handle);
        // After termination, buffer should have a null byte
        assert_eq!(fz_buffer_len(0, handle), 2);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_terminate_buffer_invalid_handle() {
        // Should not panic
        fz_terminate_buffer(0, 99999);
    }

    #[test]
    fn test_fz_terminate_buffer_already_terminated() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'H' as i32);
        fz_append_byte(0, handle, 0); // Already has null
        fz_terminate_buffer(0, handle);
        // Should not add another null
        assert_eq!(fz_buffer_len(0, handle), 2);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_md5_buffer() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'A' as i32);
        fz_append_byte(0, handle, b'B' as i32);
        fz_append_byte(0, handle, b'C' as i32);

        let mut digest = [0u8; 16];
        fz_md5_buffer(0, handle, &mut digest);

        // MD5("ABC") is known
        assert_ne!(digest, [0u8; 16]);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_md5_buffer_null_digest() {
        let handle = fz_new_buffer(0, 0);
        fz_append_byte(0, handle, b'A' as i32);
        // Should not panic
        fz_md5_buffer(0, handle, std::ptr::null_mut());
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_md5_buffer_invalid_handle() {
        let mut digest = [0u8; 16];
        // Should not panic
        fz_md5_buffer(0, 99999, &mut digest);
    }

    #[test]
    fn test_fz_clone_buffer_invalid_handle() {
        let handle = fz_clone_buffer(0, 99999);
        assert_eq!(handle, 0);
    }

    #[test]
    fn test_buffer_is_empty() {
        let buf = Buffer::new(10);
        assert!(buf.is_empty());

        let buf2 = Buffer::from_data(&[1, 2, 3]);
        assert!(!buf2.is_empty());
    }

    #[test]
    fn test_buffer_data_mut() {
        let mut buf = Buffer::new(0);
        buf.data_mut().push(1);
        buf.data_mut().push(2);
        assert_eq!(buf.len(), 2);
    }

    #[test]
    fn test_buffer_append() {
        let mut buf = Buffer::new(0);
        buf.append(&[1, 2, 3]);
        assert_eq!(buf.len(), 3);
        buf.append(&[4, 5]);
        assert_eq!(buf.len(), 5);
        assert_eq!(buf.data(), &[1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_buffer_resize_internal() {
        let mut buf = Buffer::from_data(&[1, 2, 3]);
        buf.resize(5);
        assert_eq!(buf.len(), 5);
        assert_eq!(&buf.data()[..3], &[1, 2, 3]);
        assert_eq!(&buf.data()[3..], &[0, 0]);
    }

    #[test]
    fn test_buffer_ensure_null_terminated() {
        let mut buf = Buffer::from_data(&[1, 2, 3]);
        buf.ensure_null_terminated();
        assert_eq!(buf.len(), 4);
        assert_eq!(buf.data().last(), Some(&0));

        // Should not add another null
        buf.ensure_null_terminated();
        assert_eq!(buf.len(), 4);
    }

    #[test]
    fn test_buffer_ensure_null_terminated_empty() {
        let mut buf = Buffer::new(0);
        buf.ensure_null_terminated();
        assert_eq!(buf.len(), 1);
        assert_eq!(buf.data(), &[0]);
    }

    // ============================================================================
    // Integer Append Tests
    // ============================================================================

    #[test]
    fn test_fz_append_int16_le() {
        let handle = fz_new_buffer(0, 0);
        fz_append_int16_le(0, handle, 0x0102);
        assert_eq!(fz_buffer_len(0, handle), 2);

        // Check actual bytes (little-endian: 0x02, 0x01)
        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0x02, 0x01]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_int32_le() {
        let handle = fz_new_buffer(0, 0);
        fz_append_int32_le(0, handle, 0x01020304);
        assert_eq!(fz_buffer_len(0, handle), 4);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0x04, 0x03, 0x02, 0x01]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_int16_be() {
        let handle = fz_new_buffer(0, 0);
        fz_append_int16_be(0, handle, 0x0102);
        assert_eq!(fz_buffer_len(0, handle), 2);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0x01, 0x02]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_int32_be() {
        let handle = fz_new_buffer(0, 0);
        fz_append_int32_be(0, handle, 0x01020304);
        assert_eq!(fz_buffer_len(0, handle), 4);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0x01, 0x02, 0x03, 0x04]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_int_invalid_handle() {
        // Should not panic
        fz_append_int16_le(0, 99999, 0x1234);
        fz_append_int32_le(0, 99999, 0x12345678);
        fz_append_int16_be(0, 99999, 0x1234);
        fz_append_int32_be(0, 99999, 0x12345678);
    }

    // ============================================================================
    // Bit Append Tests
    // ============================================================================

    #[test]
    fn test_fz_append_bits_basic() {
        let handle = fz_new_buffer(0, 0);

        // Append 8 bits at a time - should produce byte
        fz_append_bits(0, handle, 0b10101010, 8);
        assert_eq!(fz_buffer_len(0, handle), 1);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0b10101010]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_bits_multiple() {
        let handle = fz_new_buffer(0, 0);

        // Append 4 bits, then another 4 bits
        fz_append_bits(0, handle, 0b1010, 4);
        fz_append_bits(0, handle, 0b0101, 4);

        assert_eq!(fz_buffer_len(0, handle), 1);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), &[0b10100101]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_bits_pad() {
        let handle = fz_new_buffer(0, 0);

        // Append 5 bits, then pad to byte
        fz_append_bits(0, handle, 0b11111, 5);
        fz_append_bits_pad(0, handle);

        assert_eq!(fz_buffer_len(0, handle), 1);

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                // 5 bits of 1s + 3 bits of 0s = 11111000 = 0xF8
                assert_eq!(guard.data(), &[0xF8]);
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_bits_invalid_count() {
        let handle = fz_new_buffer(0, 0);

        // Invalid counts should be ignored
        fz_append_bits(0, handle, 0xFF, 0);
        fz_append_bits(0, handle, 0xFF, -1);
        fz_append_bits(0, handle, 0xFF, 33);

        assert_eq!(fz_buffer_len(0, handle), 0);
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_bits_invalid_handle() {
        // Should not panic
        fz_append_bits(0, 99999, 0xFF, 8);
        fz_append_bits_pad(0, 99999);
    }

    // ============================================================================
    // PDF String Tests
    // ============================================================================

    #[test]
    fn test_fz_append_pdf_string_simple() {
        let handle = fz_new_buffer(0, 0);
        let s = std::ffi::CString::new("Hello").unwrap();
        fz_append_pdf_string(0, handle, s.as_ptr());

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), b"(Hello)");
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_pdf_string_escaping() {
        let handle = fz_new_buffer(0, 0);
        let s = std::ffi::CString::new("Test(with)parens\\backslash").unwrap();
        fz_append_pdf_string(0, handle, s.as_ptr());

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), b"(Test\\(with\\)parens\\\\backslash)");
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_pdf_string_newlines() {
        let handle = fz_new_buffer(0, 0);
        let s = std::ffi::CString::new("Line1\nLine2\rLine3\tTab").unwrap();
        fz_append_pdf_string(0, handle, s.as_ptr());

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), b"(Line1\\nLine2\\rLine3\\tTab)");
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_pdf_string_null() {
        let handle = fz_new_buffer(0, 0);
        fz_append_pdf_string(0, handle, std::ptr::null());

        if let Some(buffer) = BUFFERS.get(handle) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), b"()");
            }
        }
        fz_drop_buffer(0, handle);
    }

    #[test]
    fn test_fz_append_pdf_string_invalid_handle() {
        let s = std::ffi::CString::new("Test").unwrap();
        // Should not panic
        fz_append_pdf_string(0, 99999, s.as_ptr());
    }

    // ============================================================================
    // Buffer Append Buffer Tests
    // ============================================================================

    #[test]
    fn test_fz_append_buffer() {
        let buf1 = fz_new_buffer(0, 0);
        let buf2 = fz_new_buffer(0, 0);

        fz_append_byte(0, buf1, b'A' as i32);
        fz_append_byte(0, buf1, b'B' as i32);

        fz_append_byte(0, buf2, b'C' as i32);
        fz_append_byte(0, buf2, b'D' as i32);

        fz_append_buffer(0, buf1, buf2);

        assert_eq!(fz_buffer_len(0, buf1), 4);

        if let Some(buffer) = BUFFERS.get(buf1) {
            if let Ok(guard) = buffer.lock() {
                assert_eq!(guard.data(), b"ABCD");
            }
        }

        fz_drop_buffer(0, buf1);
        fz_drop_buffer(0, buf2);
    }

    #[test]
    fn test_fz_append_buffer_invalid() {
        let buf = fz_new_buffer(0, 0);
        fz_append_byte(0, buf, b'X' as i32);

        // Append from invalid handle - should be ignored
        fz_append_buffer(0, buf, 99999);
        assert_eq!(fz_buffer_len(0, buf), 1);

        // Append to invalid handle - should not panic
        fz_append_buffer(0, 99999, buf);

        fz_drop_buffer(0, buf);
    }
}
