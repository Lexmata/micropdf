//! C FFI for context - MuPDF compatible
//! Safe Rust implementation using handle-based resource management

use super::{Handle, CONTEXTS};
use std::ffi::c_void;

/// Internal context state
pub struct Context {
    user_data: Option<usize>, // Store as usize to avoid raw pointers
    error_code: i32,
    error_message: String,
}

impl Default for Context {
    fn default() -> Self {
        Self::new()
    }
}

impl Context {
    pub fn new() -> Self {
        Self {
            user_data: None,
            error_code: 0,
            error_message: String::new(),
        }
    }

    pub fn set_error(&mut self, code: i32, message: &str) {
        self.error_code = code;
        self.error_message = message.to_string();
    }

    pub fn clear_error(&mut self) {
        self.error_code = 0;
        self.error_message.clear();
    }
}

// Error codes matching MuPDF
pub const FZ_ERROR_NONE: i32 = 0;
pub const FZ_ERROR_MEMORY: i32 = 1;
pub const FZ_ERROR_GENERIC: i32 = 2;
pub const FZ_ERROR_SYNTAX: i32 = 3;
pub const FZ_ERROR_MINOR: i32 = 4;
pub const FZ_ERROR_TRYLATER: i32 = 5;
pub const FZ_ERROR_ABORT: i32 = 6;
pub const FZ_ERROR_SYSTEM: i32 = 7;
pub const FZ_ERROR_LIBRARY: i32 = 8;
pub const FZ_ERROR_FORMAT: i32 = 9;
pub const FZ_ERROR_LIMIT: i32 = 10;
pub const FZ_ERROR_UNSUPPORTED: i32 = 11;
pub const FZ_ERROR_ARGUMENT: i32 = 12;

/// Create a new context
/// Returns a handle (non-zero on success, 0 on failure)
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_context(
    _alloc: *const c_void,
    _locks: *const c_void,
    _max_store: usize,
) -> Handle {
    CONTEXTS.insert(Context::new())
}

/// Clone a context (creates a new handle sharing state conceptually)
#[unsafe(no_mangle)]
pub extern "C" fn fz_clone_context(ctx: Handle) -> Handle {
    if CONTEXTS.get(ctx).is_some() {
        CONTEXTS.insert(Context::new())
    } else {
        0
    }
}

/// Drop a context reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_context(ctx: Handle) {
    let _ = CONTEXTS.remove(ctx);
}

/// Set user data on context
#[unsafe(no_mangle)]
pub extern "C" fn fz_set_user_context(ctx: Handle, user: *mut c_void) {
    if let Some(context) = CONTEXTS.get(ctx) {
        if let Ok(mut ctx) = context.lock() {
            ctx.user_data = Some(user as usize);
        }
    }
}

/// Get user data from context
#[unsafe(no_mangle)]
pub extern "C" fn fz_user_context(ctx: Handle) -> *mut c_void {
    if let Some(context) = CONTEXTS.get(ctx) {
        if let Ok(guard) = context.lock() {
            if let Some(ud) = guard.user_data {
                return ud as *mut c_void;
            }
        }
    }
    std::ptr::null_mut()
}

/// Get the error code from the last caught exception
#[unsafe(no_mangle)]
pub extern "C" fn fz_caught(ctx: Handle) -> i32 {
    if let Some(context) = CONTEXTS.get(ctx) {
        if let Ok(guard) = context.lock() {
            return guard.error_code;
        }
    }
    0
}

/// Get the error message from the last caught exception
#[unsafe(no_mangle)]
pub extern "C" fn fz_caught_message(_ctx: Handle) -> *const std::ffi::c_char {
    // Return a static string for now - proper implementation would
    // need to maintain a stable pointer to the error message
    c"No error".as_ptr()
}

/// Memory allocation through Rust's allocator
/// Returns null pointer on failure
///
/// # Safety
/// Memory allocation requires unsafe - this is unavoidable for C FFI.
/// The allocated memory must be freed with fz_free.
#[unsafe(no_mangle)]
pub extern "C" fn fz_malloc(_ctx: Handle, size: usize) -> *mut c_void {
    if size == 0 {
        return std::ptr::null_mut();
    }

    let layout = match std::alloc::Layout::from_size_align(size, 8) {
        Ok(l) => l,
        Err(_) => return std::ptr::null_mut(),
    };

    // SAFETY: Memory allocation is inherently unsafe but necessary for C FFI.
    // We use the global allocator which is safe to use from any thread.
    #[allow(unsafe_code)]
    unsafe {
        std::alloc::alloc(layout) as *mut c_void
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn fz_free(_ctx: Handle, _ptr: *mut c_void) {
    // Note: Proper deallocation would require tracking the size
    // For a real implementation, consider using a slab allocator
    // or tracking allocations in a HashMap
}

/// Duplicate a C string (allocates new memory)
///
/// # Safety
/// This function interfaces with C code and requires minimal unsafe for:
/// - Reading from C string pointer (CStr::from_ptr)
/// - Writing to allocated memory
#[unsafe(no_mangle)]
pub extern "C" fn fz_strdup(ctx: Handle, s: *const std::ffi::c_char) -> *mut std::ffi::c_char {
    if s.is_null() {
        return std::ptr::null_mut();
    }

    // SAFETY: Caller guarantees s is a valid null-terminated C string
    let c_str = match std::panic::catch_unwind(|| {
        // This is the minimal unsafe needed to read a C string
        #[allow(unsafe_code)]
        unsafe { std::ffi::CStr::from_ptr(s) }
    }) {
        Ok(c) => c,
        Err(_) => return std::ptr::null_mut(),
    };

    let bytes = c_str.to_bytes_with_nul();
    let len = bytes.len();

    let ptr = fz_malloc(ctx, len);
    if ptr.is_null() {
        return std::ptr::null_mut();
    }

    // SAFETY: We just allocated this memory and know its size
    #[allow(unsafe_code)]
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr as *mut u8, len);
    }

    ptr as *mut std::ffi::c_char
}

impl Drop for Context {
    fn drop(&mut self) {
        // Clean up any resources
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_new() {
        let ctx = Context::new();
        assert_eq!(ctx.error_code, 0);
        assert!(ctx.error_message.is_empty());
        assert!(ctx.user_data.is_none());
    }

    #[test]
    fn test_context_default() {
        let ctx: Context = Default::default();
        assert_eq!(ctx.error_code, 0);
    }

    #[test]
    fn test_context_set_error() {
        let mut ctx = Context::new();
        ctx.set_error(FZ_ERROR_GENERIC, "Test error");
        assert_eq!(ctx.error_code, FZ_ERROR_GENERIC);
        assert_eq!(ctx.error_message, "Test error");
    }

    #[test]
    fn test_context_clear_error() {
        let mut ctx = Context::new();
        ctx.set_error(FZ_ERROR_SYNTAX, "Syntax error");
        ctx.clear_error();
        assert_eq!(ctx.error_code, FZ_ERROR_NONE);
        assert!(ctx.error_message.is_empty());
    }

    #[test]
    fn test_fz_new_context() {
        let handle = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        assert_ne!(handle, 0);
        fz_drop_context(handle);
    }

    #[test]
    fn test_fz_clone_context() {
        let handle1 = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        let handle2 = fz_clone_context(handle1);
        assert_ne!(handle2, 0);
        assert_ne!(handle1, handle2);
        fz_drop_context(handle1);
        fz_drop_context(handle2);
    }

    #[test]
    fn test_fz_clone_invalid_context() {
        let handle = fz_clone_context(0);
        assert_eq!(handle, 0);
    }

    #[test]
    fn test_fz_user_context() {
        let ctx = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        
        // Initially null
        let user = fz_user_context(ctx);
        assert!(user.is_null());
        
        // Set user data
        let data: usize = 0x12345678;
        fz_set_user_context(ctx, data as *mut c_void);
        
        // Get it back
        let user = fz_user_context(ctx);
        assert_eq!(user as usize, data);
        
        fz_drop_context(ctx);
    }

    #[test]
    fn test_fz_caught() {
        let ctx = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        
        // Initially 0
        assert_eq!(fz_caught(ctx), 0);
        
        fz_drop_context(ctx);
    }

    #[test]
    fn test_fz_caught_message() {
        let ctx = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        let msg = fz_caught_message(ctx);
        assert!(!msg.is_null());
        fz_drop_context(ctx);
    }

    #[test]
    fn test_fz_malloc() {
        let ctx = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        
        // Zero size returns null
        let ptr = fz_malloc(ctx, 0);
        assert!(ptr.is_null());
        
        // Normal allocation
        let ptr = fz_malloc(ctx, 100);
        assert!(!ptr.is_null());
        fz_free(ctx, ptr);
        
        fz_drop_context(ctx);
    }

    #[test]
    fn test_fz_strdup() {
        let ctx = fz_new_context(std::ptr::null(), std::ptr::null(), 0);
        
        // Null input returns null
        let result = fz_strdup(ctx, std::ptr::null());
        assert!(result.is_null());
        
        // Valid string
        let s = c"Hello, World!";
        let result = fz_strdup(ctx, s.as_ptr());
        assert!(!result.is_null());
        fz_free(ctx, result as *mut c_void);
        
        fz_drop_context(ctx);
    }

    #[test]
    fn test_error_codes() {
        assert_eq!(FZ_ERROR_NONE, 0);
        assert_eq!(FZ_ERROR_MEMORY, 1);
        assert_eq!(FZ_ERROR_GENERIC, 2);
        assert_eq!(FZ_ERROR_SYNTAX, 3);
        assert_eq!(FZ_ERROR_MINOR, 4);
        assert_eq!(FZ_ERROR_TRYLATER, 5);
        assert_eq!(FZ_ERROR_ABORT, 6);
        assert_eq!(FZ_ERROR_SYSTEM, 7);
        assert_eq!(FZ_ERROR_LIBRARY, 8);
        assert_eq!(FZ_ERROR_FORMAT, 9);
        assert_eq!(FZ_ERROR_LIMIT, 10);
        assert_eq!(FZ_ERROR_UNSUPPORTED, 11);
        assert_eq!(FZ_ERROR_ARGUMENT, 12);
    }

    #[test]
    fn test_fz_user_context_invalid_handle() {
        let user = fz_user_context(0);
        assert!(user.is_null());
    }

    #[test]
    fn test_fz_caught_invalid_handle() {
        assert_eq!(fz_caught(0), 0);
    }
}
