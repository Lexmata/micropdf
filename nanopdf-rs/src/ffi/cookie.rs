/**
 * Cookie FFI
 *
 * C-compatible FFI for cookie operations.
 * Cookies provide progress tracking and cancellation for long-running operations.
 */
use crate::ffi::{Handle, HandleStore};
use crate::fitz::cookie::Cookie;
use std::ffi::c_int;
use std::sync::LazyLock;

// ============================================================================
// Cookie Handle Store
// ============================================================================

/// Global handle store for cookies
pub static COOKIE_STORE: LazyLock<HandleStore<Cookie>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Cookie Operations
// ============================================================================

/// Create a new cookie
///
/// # Safety
/// - ctx must be a valid context handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_cookie(_ctx: Handle) -> Handle {
    let cookie = Cookie::new();
    COOKIE_STORE.insert(cookie)
}

/// Drop cookie handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - cookie must be a valid cookie handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_cookie(_ctx: Handle, cookie: Handle) {
    COOKIE_STORE.remove(cookie);
}

/// Abort operation via cookie
///
/// # Safety
/// - ctx must be a valid context handle
/// - cookie must be a valid cookie handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_abort_cookie(_ctx: Handle, cookie: Handle) {
    let Some(arc) = COOKIE_STORE.get(cookie) else {
        return;
    };
    let Ok(cookie_obj) = arc.lock() else {
        return;
    };

    cookie_obj.abort();
}

/// Get cookie progress
///
/// # Safety
/// - ctx must be a valid context handle
/// - cookie must be a valid cookie handle
/// - progress, progress_max, errors must be valid pointers
#[unsafe(no_mangle)]
pub unsafe extern "C" fn fz_cookie_progress(
    _ctx: Handle,
    cookie: Handle,
    progress: *mut c_int,
    progress_max: *mut c_int,
    errors: *mut c_int,
) {
    if progress.is_null() || progress_max.is_null() || errors.is_null() {
        return;
    }

    let Some(arc) = COOKIE_STORE.get(cookie) else {
        return;
    };
    let Ok(cookie_obj) = arc.lock() else {
        return;
    };

    unsafe {
        *progress = cookie_obj.progress();
        *progress_max = cookie_obj.progress_max();
        *errors = cookie_obj.errors();
    }
}

/// Check if cookie has been aborted
///
/// # Safety
/// - ctx must be a valid context handle
/// - cookie must be a valid cookie handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_cookie_is_aborted(_ctx: Handle, cookie: Handle) -> c_int {
    let Some(arc) = COOKIE_STORE.get(cookie) else {
        return 0;
    };
    let Ok(cookie_obj) = arc.lock() else {
        return 0;
    };

    if cookie_obj.should_abort() { 1 } else { 0 }
}

/// Reset cookie state
///
/// # Safety
/// - ctx must be a valid context handle
/// - cookie must be a valid cookie handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_reset_cookie(_ctx: Handle, cookie: Handle) {
    let Some(arc) = COOKIE_STORE.get(cookie) else {
        return;
    };
    let Ok(cookie_obj) = arc.lock() else {
        return;
    };

    cookie_obj.reset_abort();
}
