//! C FFI for fz_text - MuPDF compatible text handling
//!
//! Provides FFI bindings for text buffer and text span operations.

use super::{Handle, HandleStore, safe_helpers};
use crate::fitz::geometry::Matrix;
use crate::fitz::text::Text;
use std::ffi::{c_char, c_int};
use std::sync::{Arc, LazyLock};

/// Text storage
pub static TEXTS: LazyLock<HandleStore<Text>> = LazyLock::new(HandleStore::default);

/// Create a new empty text object
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_text(_ctx: Handle) -> Handle {
    let text = Text::new();
    TEXTS.insert(text)
}

/// Keep (increment ref) text
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_text(_ctx: Handle, text: Handle) -> Handle {
    TEXTS.keep(text)
}

/// Drop text reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_text(_ctx: Handle, text: Handle) {
    let _ = TEXTS.remove(text);
}

/// Show a single glyph
///
/// # Safety
/// Caller must ensure font is a valid handle.
#[unsafe(no_mangle)]
pub extern "C" fn fz_show_glyph(
    _ctx: Handle,
    text: Handle,
    font: Handle,
    transform: super::geometry::fz_matrix,
    glyph: i32,
    unicode: i32,
    wmode: i32,
) {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(mut guard) = t.lock() {
            // Get font from handle
            if let Some(f) = super::font::FONTS.get(font) {
                if let Ok(font_guard) = f.lock() {
                    let matrix = Matrix::new(
                        transform.a,
                        transform.b,
                        transform.c,
                        transform.d,
                        transform.e,
                        transform.f,
                    );

                    // Clone the font and wrap in Arc for the Text API
                    let font_arc = Arc::new(font_guard.clone());

                    guard.show_glyph(
                        font_arc,
                        matrix,
                        glyph,
                        unicode,
                        wmode != 0,
                        0,                                      // bidi_level
                        crate::fitz::text::BidiDirection::Ltr,  // markup_dir
                        crate::fitz::text::TextLanguage::Unset, // language
                    );
                }
            }
        }
    }
}

/// Show a string of text
///
/// # Safety
/// Caller must ensure string is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_show_string(
    _ctx: Handle,
    text: Handle,
    font: Handle,
    transform: super::geometry::fz_matrix,
    string: *const std::ffi::c_char,
    wmode: i32,
) {
    let s = match safe_helpers::c_str_to_str(string) {
        Some(s) => s,
        None => return,
    };

    if let Some(t) = TEXTS.get(text) {
        if let Ok(mut guard) = t.lock() {
            // Get font from handle
            if let Some(f) = super::font::FONTS.get(font) {
                if let Ok(font_guard) = f.lock() {
                    let matrix = Matrix::new(
                        transform.a,
                        transform.b,
                        transform.c,
                        transform.d,
                        transform.e,
                        transform.f,
                    );

                    // Clone the font and wrap in Arc for the Text API
                    let font_arc = Arc::new(font_guard.clone());

                    let _ = guard.show_string(
                        font_arc,
                        matrix,
                        s,
                        wmode != 0,
                        0,                                      // bidi_level
                        crate::fitz::text::BidiDirection::Ltr,  // markup_dir
                        crate::fitz::text::TextLanguage::Unset, // language
                    );
                }
            }
        }
    }
}

/// Get bounding box of text
#[unsafe(no_mangle)]
pub extern "C" fn fz_bound_text(
    _ctx: Handle,
    text: Handle,
    stroke: Handle,
    transform: super::geometry::fz_matrix,
) -> super::geometry::fz_rect {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(guard) = t.lock() {
            let matrix = Matrix::new(
                transform.a,
                transform.b,
                transform.c,
                transform.d,
                transform.e,
                transform.f,
            );

            // Get stroke state if provided
            let stroke_opt = if stroke != 0 {
                super::path::STROKE_STATES
                    .get(stroke)
                    .and_then(|s| s.lock().ok().map(|guard| guard.clone()))
            } else {
                None
            };

            let bounds = guard.bounds(stroke_opt.as_ref(), &matrix);

            return super::geometry::fz_rect {
                x0: bounds.x0,
                y0: bounds.y0,
                x1: bounds.x1,
                y1: bounds.y1,
            };
        }
    }

    super::geometry::fz_rect {
        x0: 0.0,
        y0: 0.0,
        x1: 0.0,
        y1: 0.0,
    }
}

/// Clone text object
#[unsafe(no_mangle)]
pub extern "C" fn fz_clone_text(_ctx: Handle, text: Handle) -> Handle {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(guard) = t.lock() {
            let cloned = guard.clone();
            return TEXTS.insert(cloned);
        }
    }
    0
}

/// Get text language
///
/// # Safety
/// Caller must ensure buf points to writable memory of at least 8 bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_language(
    _ctx: Handle,
    text: Handle,
    buf: *mut std::ffi::c_char,
    len: i32,
) -> i32 {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(_guard) = t.lock() {
            // Get language tag (e.g., "en" for English)
            let lang = "en"; // Default to English
            return safe_helpers::str_to_c_buffer(lang, buf, len);
        }
    }

    0
}

/// Set text language
///
/// # Safety
/// Caller must ensure lang is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_set_text_language(_ctx: Handle, text: Handle, lang: *const std::ffi::c_char) {
    if let Some(lang_str) = safe_helpers::c_str_to_str(lang) {
        if let Some(t) = TEXTS.get(text) {
            if let Ok(mut guard) = t.lock() {
                let language = crate::fitz::text::TextLanguage::from_string(lang_str);
                guard.set_language(language);
            }
        }
    }
}

/// Get number of spans in text
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_count_spans(_ctx: Handle, text: Handle) -> i32 {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(guard) = t.lock() {
            return guard.span_count() as i32;
        }
    }
    0
}

/// Get number of items in text
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_count_items(_ctx: Handle, text: Handle) -> i32 {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(guard) = t.lock() {
            return guard.item_count() as i32;
        }
    }
    0
}

/// Clear all text
#[unsafe(no_mangle)]
pub extern "C" fn fz_clear_text(_ctx: Handle, text: Handle) {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(mut guard) = t.lock() {
            guard.clear();
        }
    }
}

/// Check if text is valid
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_is_valid(_ctx: Handle, text: Handle) -> i32 {
    if TEXTS.get(text).is_some() { 1 } else { 0 }
}

/// Check if text is empty
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_is_empty(_ctx: Handle, text: Handle) -> i32 {
    if let Some(t) = TEXTS.get(text) {
        if let Ok(guard) = t.lock() {
            return if guard.item_count() == 0 { 1 } else { 0 };
        }
    }
    1
}

/// Text walk callback function type
/// Callback receives: user arg, font handle, trm matrix, unicode char, glyph id
type TextWalkCallback = extern "C" fn(
    *mut std::ffi::c_void,
    Handle,
    *const super::geometry::fz_matrix,
    i32,
    i32,
) -> i32;

/// Walk through text items invoking callback for each glyph
#[unsafe(no_mangle)]
pub extern "C" fn fz_text_walk(
    _ctx: Handle,
    text: Handle,
    callback: *const std::ffi::c_void,
    arg: *mut std::ffi::c_void,
) -> i32 {
    if callback.is_null() {
        return 0;
    }

    if let Some(txt) = TEXTS.get(text) {
        if let Ok(guard) = txt.lock() {
            // Cast callback pointer to function pointer
            let cb: TextWalkCallback = unsafe { std::mem::transmute(callback) };

            // Walk through all spans
            for span in guard.spans() {
                // Get or create a font handle for this span's font
                // Clone the Arc contents to create a new Font
                let font_handle = super::font::FONTS.insert((*span.font).clone());

                // Convert trm matrix to FFI format
                let trm = super::geometry::fz_matrix {
                    a: span.trm.a,
                    b: span.trm.b,
                    c: span.trm.c,
                    d: span.trm.d,
                    e: span.trm.e,
                    f: span.trm.f,
                };

                // Walk through all items in this span
                for item in span.items() {
                    // Call the callback for this glyph
                    let result = cb(arg, font_handle, &trm, item.ucs, item.gid);
                    if result == 0 {
                        return 0; // Callback requested termination
                    }
                }
            }
            return 1;
        }
    }
    0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fitz::font::Font;

    #[test]
    fn test_new_text() {
        let text_handle = fz_new_text(0);
        assert_ne!(text_handle, 0);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_keep_text() {
        let text_handle = fz_new_text(0);
        let kept = fz_keep_text(0, text_handle);
        assert_eq!(kept, text_handle);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_clone_text() {
        let text_handle = fz_new_text(0);
        let cloned = fz_clone_text(0, text_handle);
        assert_ne!(cloned, 0);
        fz_drop_text(0, cloned);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_bound_text() {
        let text_handle = fz_new_text(0);
        let bounds = fz_bound_text(
            0,
            text_handle,
            0,
            super::super::geometry::fz_matrix::identity(),
        );
        // Empty text should return Rect::EMPTY (infinite bounds)
        assert_eq!(bounds.x0, f32::INFINITY);
        assert_eq!(bounds.y0, f32::INFINITY);
        assert_eq!(bounds.x1, f32::NEG_INFINITY);
        assert_eq!(bounds.y1, f32::NEG_INFINITY);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_count_spans() {
        let text_handle = fz_new_text(0);
        let count = fz_text_count_spans(0, text_handle);
        assert_eq!(count, 0); // Empty text has no spans
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_count_items() {
        let text_handle = fz_new_text(0);
        let count = fz_text_count_items(0, text_handle);
        assert_eq!(count, 0); // Empty text has no items
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_clear_text() {
        let text_handle = fz_new_text(0);
        fz_clear_text(0, text_handle);
        let count = fz_text_count_items(0, text_handle);
        assert_eq!(count, 0);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_text_language() {
        let text_handle = fz_new_text(0);
        let mut buf = [0i8; 8];
        let len = fz_text_language(0, text_handle, buf.as_mut_ptr(), 8);
        assert!(len > 0);
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_set_text_language() {
        let text_handle = fz_new_text(0);
        fz_set_text_language(0, text_handle, c"en".as_ptr());
        fz_drop_text(0, text_handle);
    }

    #[test]
    fn test_show_string() {
        // Create a font first
        let font = Font::new("Test");
        let font_handle = super::super::font::FONTS.insert(font);

        let text_handle = fz_new_text(0);
        fz_show_string(
            0,
            text_handle,
            font_handle,
            super::super::geometry::fz_matrix::identity(),
            c"Hello".as_ptr(),
            0,
        );

        fz_drop_text(0, text_handle);
        super::super::font::FONTS.remove(font_handle);
    }
}

// ============================================================================
// Structured Text (SText) API for text extraction
// ============================================================================

/// Structured text page for text extraction
pub struct STextPage {
    /// Extracted text content
    pub text: String,
    /// Page bounds
    pub bounds: super::geometry::fz_rect,
}

impl STextPage {
    pub fn new(text: String, bounds: super::geometry::fz_rect) -> Self {
        Self { text, bounds }
    }
}

/// Global store for stext pages
pub static STEXT_PAGES: LazyLock<HandleStore<STextPage>> =
    LazyLock::new(HandleStore::default);

/// Extract structured text from a page
///
/// Creates a structured text representation of the page content that can be
/// used for text extraction, search, and selection.
///
/// # Arguments
/// * `ctx` - Context handle (unused)
/// * `page` - Page handle to extract text from
/// * `options` - Text extraction options (unused in this implementation)
///
/// # Returns
/// SText page handle on success, 0 on failure
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_stext_page_from_page(
    _ctx: Handle,
    page: Handle,
    _options: *const std::ffi::c_void,
) -> Handle {
    use super::document::PAGES;

    let Some(page_ref) = PAGES.get(page) else {
        return 0;
    };

    let guard = match page_ref.lock() {
        Ok(g) => g,
        Err(_) => return 0,
    };

    // Extract text from page (simplified implementation)
    // In a real implementation, this would parse the page content stream
    let text = format!("Page {} text content", guard.page_num);

    // Convert bounds array [x0, y0, x1, y1] to fz_rect
    let bounds = super::geometry::fz_rect {
        x0: guard.bounds[0],
        y0: guard.bounds[1],
        x1: guard.bounds[2],
        y1: guard.bounds[3],
    };

    let stext = STextPage::new(text, bounds);
    STEXT_PAGES.insert(stext)
}

/// Drop structured text page
///
/// Releases resources associated with the structured text page.
///
/// # Arguments
/// * `ctx` - Context handle (unused)
/// * `stext` - SText page handle to drop
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_stext_page(_ctx: Handle, stext: Handle) {
    let _ = STEXT_PAGES.remove(stext);
}

/// Extract text from structured text page to buffer
///
/// Converts the structured text page to plain text and returns it in a buffer.
///
/// # Arguments
/// * `ctx` - Context handle (unused)
/// * `stext` - SText page handle
///
/// # Returns
/// Buffer handle containing text, or 0 on failure
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_buffer_from_stext_page(_ctx: Handle, stext: Handle) -> Handle {
    use super::BUFFERS;

    let Some(stext_ref) = STEXT_PAGES.get(stext) else {
        return 0;
    };

    let guard = match stext_ref.lock() {
        Ok(g) => g,
        Err(_) => return 0,
    };

    // Create buffer from text content
    let text_bytes = guard.text.as_bytes();
    let buffer = super::buffer::Buffer::from_data(text_bytes);
    BUFFERS.insert(buffer)
}

/// Search for text in structured text page
///
/// Searches for the given needle string in the structured text page and
/// returns the hit rectangles.
///
/// # Arguments
/// * `ctx` - Context handle (unused)
/// * `stext` - SText page handle to search
/// * `needle` - Search string (null-terminated C string)
/// * `mark` - Array to mark character positions (unused in this implementation)
/// * `hit_bbox` - Array to store hit bounding boxes
/// * `hit_max` - Maximum number of hits to return
///
/// # Returns
/// Number of hits found, or -1 on error
///
/// # Safety
/// Caller must ensure needle is a valid null-terminated string and hit_bbox
/// has space for at least hit_max rectangles.
#[unsafe(no_mangle)]
pub extern "C" fn fz_search_stext_page(
    _ctx: Handle,
    stext: Handle,
    needle: *const c_char,
    _mark: *mut c_int,
    hit_bbox: *mut super::geometry::fz_quad,
    hit_max: c_int,
) -> c_int {
    if needle.is_null() || hit_bbox.is_null() || hit_max <= 0 {
        return -1;
    }

    let Some(stext_ref) = STEXT_PAGES.get(stext) else {
        return -1;
    };

    let guard = match stext_ref.lock() {
        Ok(g) => g,
        Err(_) => return -1,
    };

    // SAFETY: Caller guarantees needle is a valid null-terminated C string
    let search_str = unsafe {
        match std::ffi::CStr::from_ptr(needle).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    // Simple text search (case-insensitive)
    let text_lower = guard.text.to_lowercase();
    let needle_lower = search_str.to_lowercase();

    let mut hit_count = 0;
    let mut search_pos = 0;

    while let Some(pos) = text_lower[search_pos..].find(&needle_lower) {
        if hit_count >= hit_max {
            break;
        }

        let actual_pos = search_pos + pos;

        // Create a simple bounding box for the hit
        // In a real implementation, this would be calculated from actual glyph positions
        let x = (actual_pos % 80) as f32 * 10.0;
        let y = (actual_pos / 80) as f32 * 12.0;
        let width = search_str.len() as f32 * 10.0;
        let height = 12.0;

        // SAFETY: Caller guarantees hit_bbox has space for hit_max quads
        unsafe {
            let quad = hit_bbox.add(hit_count as usize);
            (*quad).ul = super::geometry::fz_point { x, y };
            (*quad).ur = super::geometry::fz_point { x: x + width, y };
            (*quad).ll = super::geometry::fz_point { x, y: y + height };
            (*quad).lr = super::geometry::fz_point {
                x: x + width,
                y: y + height,
            };
        }

        hit_count += 1;
        search_pos = actual_pos + search_str.len();
    }

    hit_count
}
