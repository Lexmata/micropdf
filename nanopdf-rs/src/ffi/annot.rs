//! PDF Annotation FFI
//!
//! C-compatible FFI functions for PDF annotation operations.

use super::{Handle, HandleStore};
use std::ffi::{c_char, c_float, c_int, c_uint};
use std::sync::LazyLock;

/// PDF Annotation representation
#[derive(Debug, Clone)]
pub struct Annotation {
    /// Annotation type (0-27)
    pub annot_type: i32,
    /// Bounding rectangle
    pub rect: super::geometry::fz_rect,
    /// Flags
    pub flags: u32,
    /// Contents text
    pub contents: String,
    /// Author
    pub author: String,
    /// Opacity (0.0-1.0)
    pub opacity: f32,
    /// Dirty flag
    pub dirty: bool,
}

impl Annotation {
    pub fn new(annot_type: i32, rect: super::geometry::fz_rect) -> Self {
        Self {
            annot_type,
            rect,
            flags: 0,
            contents: String::new(),
            author: String::new(),
            opacity: 1.0,
            dirty: false,
        }
    }
}

/// Global annotation handle store
pub static ANNOTATIONS: LazyLock<HandleStore<Annotation>> = LazyLock::new(HandleStore::default);

/// Create a new annotation on a page
///
/// # Safety
/// Caller must ensure `page` is a valid handle and `annot_type` is 0-27.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_create_annot(_ctx: Handle, _page: Handle, annot_type: c_int) -> Handle {
    // Validate annotation type (0-27)
    if annot_type < 0 || annot_type > 27 {
        return 0;
    }

    // Create default rectangle
    let rect = super::geometry::fz_rect {
        x0: 0.0,
        y0: 0.0,
        x1: 100.0,
        y1: 100.0,
    };

    let annot = Annotation::new(annot_type, rect);
    ANNOTATIONS.insert(annot)
}

/// Delete an annotation from a page
///
/// # Safety
/// Caller must ensure `page` and `annot` are valid handles.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_delete_annot(_ctx: Handle, _page: Handle, annot: Handle) {
    let _ = ANNOTATIONS.remove(annot);
}

/// Drop an annotation handle
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_drop_annot(_ctx: Handle, annot: Handle) {
    let _ = ANNOTATIONS.remove(annot);
}

/// Get annotation type
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_type(_ctx: Handle, annot: Handle) -> c_int {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return -1;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => return -1,
    };

    guard.annot_type
}

/// Get annotation rectangle
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_rect(_ctx: Handle, annot: Handle) -> super::geometry::fz_rect {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return super::geometry::fz_rect {
            x0: 0.0,
            y0: 0.0,
            x1: 0.0,
            y1: 0.0,
        };
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => {
            return super::geometry::fz_rect {
                x0: 0.0,
                y0: 0.0,
                x1: 0.0,
                y1: 0.0,
            };
        }
    };

    guard.rect
}

/// Set annotation rectangle
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_rect(_ctx: Handle, annot: Handle, rect: super::geometry::fz_rect) {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    if let Ok(mut guard) = annot_ref.lock() {
        guard.rect = rect;
        guard.dirty = true;
    }
}

/// Get annotation flags
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_flags(_ctx: Handle, annot: Handle) -> c_uint {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return 0;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => return 0,
    };

    guard.flags
}

/// Set annotation flags
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_flags(_ctx: Handle, annot: Handle, flags: c_uint) {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    if let Ok(mut guard) = annot_ref.lock() {
        guard.flags = flags;
        guard.dirty = true;
    }
}

/// Get annotation contents
///
/// # Safety
/// Caller must ensure `annot` is a valid handle and `buf` points to writable memory of at least `size` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_contents(_ctx: Handle, annot: Handle, buf: *mut c_char, size: c_int) {
    if buf.is_null() || size <= 0 {
        return;
    }

    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        unsafe {
            *buf = 0;
        }
        return;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => {
            unsafe {
                *buf = 0;
            }
            return;
        }
    };

    let contents_bytes = guard.contents.as_bytes();
    let copy_len = (size as usize - 1).min(contents_bytes.len());

    unsafe {
        std::ptr::copy_nonoverlapping(contents_bytes.as_ptr(), buf as *mut u8, copy_len);
        *buf.add(copy_len) = 0; // Null terminator
    }
}

/// Set annotation contents
///
/// # Safety
/// Caller must ensure `annot` is a valid handle and `text` is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_contents(_ctx: Handle, annot: Handle, text: *const c_char) {
    if text.is_null() {
        return;
    }

    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    let c_str = unsafe { std::ffi::CStr::from_ptr(text) };
    let text_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return,
    };

    if let Ok(mut guard) = annot_ref.lock() {
        guard.contents = text_str.to_string();
        guard.dirty = true;
    }
}

/// Get annotation author
///
/// # Safety
/// Caller must ensure `annot` is a valid handle and `buf` points to writable memory of at least `size` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_author(_ctx: Handle, annot: Handle, buf: *mut c_char, size: c_int) {
    if buf.is_null() || size <= 0 {
        return;
    }

    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        unsafe {
            *buf = 0;
        }
        return;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => {
            unsafe {
                *buf = 0;
            }
            return;
        }
    };

    let author_bytes = guard.author.as_bytes();
    let copy_len = (size as usize - 1).min(author_bytes.len());

    unsafe {
        std::ptr::copy_nonoverlapping(author_bytes.as_ptr(), buf as *mut u8, copy_len);
        *buf.add(copy_len) = 0; // Null terminator
    }
}

/// Set annotation author
///
/// # Safety
/// Caller must ensure `annot` is a valid handle and `author` is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_author(_ctx: Handle, annot: Handle, author: *const c_char) {
    if author.is_null() {
        return;
    }

    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    let c_str = unsafe { std::ffi::CStr::from_ptr(author) };
    let author_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return,
    };

    if let Ok(mut guard) = annot_ref.lock() {
        guard.author = author_str.to_string();
        guard.dirty = true;
    }
}

/// Get annotation opacity
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_opacity(_ctx: Handle, annot: Handle) -> c_float {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return 1.0;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => return 1.0,
    };

    guard.opacity
}

/// Set annotation opacity
///
/// # Safety
/// Caller must ensure `annot` is a valid handle and `opacity` is 0.0-1.0.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_opacity(_ctx: Handle, annot: Handle, opacity: c_float) {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    // Clamp opacity to valid range
    let clamped_opacity = opacity.max(0.0).min(1.0);

    if let Ok(mut guard) = annot_ref.lock() {
        guard.opacity = clamped_opacity;
        guard.dirty = true;
    }
}

/// Check if annotation is dirty (modified)
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_has_dirty(_ctx: Handle, annot: Handle) -> c_int {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return 0;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => return 0,
    };

    if guard.dirty { 1 } else { 0 }
}

/// Clear annotation dirty flag
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_clear_dirty(_ctx: Handle, annot: Handle) {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return;
    };

    if let Ok(mut guard) = annot_ref.lock() {
        guard.dirty = false;
    }
}

/// Update annotation appearance
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_update_annot(_ctx: Handle, annot: Handle) -> c_int {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return 0;
    };

    if let Ok(mut guard) = annot_ref.lock() {
        // In a real implementation, this would regenerate the annotation's appearance stream
        // For now, just clear the dirty flag
        guard.dirty = false;
        return 1; // Success
    }

    0 // Failure
}

/// Clone an annotation
///
/// # Safety
/// Caller must ensure `annot` is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_clone_annot(_ctx: Handle, annot: Handle) -> Handle {
    let Some(annot_ref) = ANNOTATIONS.get(annot) else {
        return 0;
    };

    let guard = match annot_ref.lock() {
        Ok(g) => g,
        Err(_) => return 0,
    };

    let cloned = guard.clone();
    ANNOTATIONS.insert(cloned)
}

/// Check if annotation is valid
///
/// # Safety
/// Caller must ensure `annot` is a handle (may be invalid).
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_is_valid(_ctx: Handle, annot: Handle) -> c_int {
    if ANNOTATIONS.get(annot).is_some() {
        1
    } else {
        0
    }
}
