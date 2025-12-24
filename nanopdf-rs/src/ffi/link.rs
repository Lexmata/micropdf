use crate::ffi::geometry::fz_rect;
/**
 * Link FFI
 *
 * C-compatible FFI for link operations.
 * Links provide navigation within and between PDF documents.
 */
use crate::ffi::{Handle, HandleStore};
use crate::fitz::geometry::Rect;
use crate::fitz::link::Link;
use std::ffi::{c_char, c_int};
use std::sync::LazyLock;

// ============================================================================
// Link Handle Store
// ============================================================================

/// Global handle store for links
static LINK_STORE: LazyLock<HandleStore<Link>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Link Operations
// ============================================================================

/// Load links from page
///
/// # Safety
/// - ctx must be a valid context handle
/// - page must be a valid page handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_load_links(_ctx: Handle, _page: Handle) -> Handle {
    // Simplified: Return dummy link
    // In full implementation, would:
    // - Get page from document store
    // - Parse page annotations
    // - Extract link annotations
    // - Return first link handle

    let link = Link::new(
        Rect::new(10.0, 10.0, 100.0, 30.0),
        "https://example.com".to_string(),
    );
    LINK_STORE.insert(link)
}

/// Get next link in list
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_next_link(_ctx: Handle, _link: Handle) -> Handle {
    // Simplified: Return 0 (no next link)
    0
}

/// Drop link handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_link(_ctx: Handle, link: Handle) {
    LINK_STORE.remove(link);
}

/// Get link rectangle
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_link_rect(_ctx: Handle, link: Handle) -> fz_rect {
    let Some(arc) = LINK_STORE.get(link) else {
        return fz_rect {
            x0: 0.0,
            y0: 0.0,
            x1: 0.0,
            y1: 0.0,
        };
    };
    let Ok(link_obj) = arc.lock() else {
        return fz_rect {
            x0: 0.0,
            y0: 0.0,
            x1: 0.0,
            y1: 0.0,
        };
    };

    let rect = &link_obj.rect;
    fz_rect {
        x0: rect.x0,
        y0: rect.y0,
        x1: rect.x1,
        y1: rect.y1,
    }
}

/// Get link URI
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
/// - buffer must be valid and have at least size bytes
#[unsafe(no_mangle)]
pub unsafe extern "C" fn fz_link_uri(_ctx: Handle, link: Handle, buffer: *mut c_char, size: usize) {
    if buffer.is_null() || size == 0 {
        return;
    }

    let uri = if let Some(arc) = LINK_STORE.get(link) {
        if let Ok(link_obj) = arc.lock() {
            link_obj.uri.clone()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let bytes = uri.as_bytes();
    let copy_len = bytes.len().min(size - 1);

    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), buffer as *mut u8, copy_len);
        *buffer.add(copy_len) = 0; // Null terminate
    }
}

/// Check if link is external
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_link_is_external(_ctx: Handle, link: Handle) -> c_int {
    let Some(arc) = LINK_STORE.get(link) else {
        return 0;
    };
    let Ok(link_obj) = arc.lock() else {
        return 0;
    };

    if link_obj.is_external() { 1 } else { 0 }
}

/// Resolve link destination page
///
/// # Returns
/// - Page number (0-indexed)
/// - -1 if link is external or invalid
///
/// # Safety
/// - ctx must be a valid context handle
/// - doc must be a valid document handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_resolve_link_page(_ctx: Handle, _doc: Handle, link: Handle) -> c_int {
    let Some(arc) = LINK_STORE.get(link) else {
        return -1;
    };
    let Ok(link_obj) = arc.lock() else {
        return -1;
    };

    // If external, return -1
    if link_obj.is_external() {
        return -1;
    }

    // Simplified: Parse URI for page number
    // In full implementation, would resolve named destinations, etc.
    let uri = &link_obj.uri;
    if let Some(page_str) = uri.strip_prefix("#page=") {
        page_str.parse::<c_int>().unwrap_or(-1)
    } else {
        -1
    }
}

/// Check if link is valid
///
/// # Safety
/// - ctx must be a valid context handle
/// - link must be a valid link handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_link_is_valid(_ctx: Handle, link: Handle) -> c_int {
    if LINK_STORE.get(link).is_some() { 1 } else { 0 }
}
