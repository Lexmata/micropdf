//! C FFI for pdf_annot - MuPDF compatible annotation handling
//!
//! Provides FFI bindings for PDF annotation operations.

use super::{Handle, HandleStore};
use crate::pdf::annot::{Annotation, AnnotType, AnnotFlags};
use std::sync::LazyLock;

/// Annotation storage
pub static ANNOTATIONS: LazyLock<HandleStore<Annotation>> =
    LazyLock::new(HandleStore::default);

// ============================================================================
// Annotation Creation
// ============================================================================

/// Create a new annotation
#[unsafe(no_mangle)]
pub extern "C" fn pdf_create_annot(
    _ctx: Handle,
    _page: Handle,
    annot_type: i32,
) -> Handle {
    let atype = match annot_type {
        0 => AnnotType::Text,
        1 => AnnotType::Link,
        2 => AnnotType::FreeText,
        3 => AnnotType::Line,
        4 => AnnotType::Square,
        5 => AnnotType::Circle,
        6 => AnnotType::Polygon,
        7 => AnnotType::PolyLine,
        8 => AnnotType::Highlight,
        9 => AnnotType::Underline,
        10 => AnnotType::Squiggly,
        11 => AnnotType::StrikeOut,
        12 => AnnotType::Redact,
        13 => AnnotType::Stamp,
        14 => AnnotType::Caret,
        15 => AnnotType::Ink,
        16 => AnnotType::Popup,
        17 => AnnotType::FileAttachment,
        18 => AnnotType::Sound,
        19 => AnnotType::Movie,
        20 => AnnotType::RichMedia,
        21 => AnnotType::Widget,
        22 => AnnotType::Screen,
        23 => AnnotType::PrinterMark,
        24 => AnnotType::TrapNet,
        25 => AnnotType::Watermark,
        26 => AnnotType::ThreeD,
        27 => AnnotType::Projection,
        _ => AnnotType::Unknown,
    };

    let rect = crate::fitz::geometry::Rect {
        x0: 0.0,
        y0: 0.0,
        x1: 100.0,
        y1: 100.0,
    };

    let annot = Annotation::new(atype, rect);
    ANNOTATIONS.insert(annot)
}

/// Delete an annotation
#[unsafe(no_mangle)]
pub extern "C" fn pdf_delete_annot(_ctx: Handle, _page: Handle, annot: Handle) {
    ANNOTATIONS.remove(annot);
}

/// Keep annotation reference
#[unsafe(no_mangle)]
pub extern "C" fn pdf_keep_annot(_ctx: Handle, annot: Handle) -> Handle {
    if ANNOTATIONS.get(annot).is_some() {
        return annot;
    }
    0
}

/// Drop annotation reference
#[unsafe(no_mangle)]
pub extern "C" fn pdf_drop_annot(_ctx: Handle, annot: Handle) {
    ANNOTATIONS.remove(annot);
}

// ============================================================================
// Annotation Iteration
// ============================================================================

/// Get first annotation on page
#[unsafe(no_mangle)]
pub extern "C" fn pdf_first_annot(_ctx: Handle, _page: Handle) -> Handle {
    // For now, return 0 (no annotations)
    // Full implementation would iterate page annotations
    0
}

/// Get next annotation
#[unsafe(no_mangle)]
pub extern "C" fn pdf_next_annot(_ctx: Handle, _annot: Handle) -> Handle {
    // For now, return 0 (end of list)
    0
}

// ============================================================================
// Annotation Properties
// ============================================================================

/// Get annotation type
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_type(_ctx: Handle, annot: Handle) -> i32 {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return guard.annot_type() as i32;
        }
    }
    -1 // Unknown
}

/// Get annotation rectangle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_rect(_ctx: Handle, annot: Handle) -> super::geometry::fz_rect {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            let rect = guard.rect();
            return super::geometry::fz_rect {
                x0: rect.x0,
                y0: rect.y0,
                x1: rect.x1,
                y1: rect.y1,
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

/// Set annotation rectangle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_rect(_ctx: Handle, annot: Handle, rect: super::geometry::fz_rect) {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            let new_rect = crate::fitz::geometry::Rect {
                x0: rect.x0,
                y0: rect.y0,
                x1: rect.x1,
                y1: rect.y1,
            };
            guard.set_rect(new_rect);
        }
    }
}

/// Get annotation flags
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_flags(_ctx: Handle, annot: Handle) -> u32 {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return guard.flags().value();
        }
    }
    0
}

/// Set annotation flags
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_flags(_ctx: Handle, annot: Handle, flags: u32) {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            guard.set_flags(AnnotFlags::new(flags));
        }
    }
}

// ============================================================================
// Annotation Content
// ============================================================================

/// Get annotation contents (text)
///
/// # Safety
/// Caller must ensure buf points to valid memory of at least size bytes
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_contents(
    _ctx: Handle,
    annot: Handle,
    buf: *mut std::ffi::c_char,
    size: i32,
) -> i32 {
    if buf.is_null() || size <= 0 {
        return 0;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return super::safe_helpers::str_to_c_buffer(guard.contents(), buf, size);
        }
    }

    0
}

/// Set annotation contents (text)
///
/// # Safety
/// Caller must ensure text is a valid null-terminated C string
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_contents(_ctx: Handle, annot: Handle, text: *const std::ffi::c_char) {
    if text.is_null() {
        return;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            if let Some(s) = super::safe_helpers::c_str_to_str(text) {
                guard.set_contents(s);
            }
        }
    }
}

/// Get annotation author
///
/// # Safety
/// Caller must ensure buf points to valid memory of at least size bytes
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_author(
    _ctx: Handle,
    annot: Handle,
    buf: *mut std::ffi::c_char,
    size: i32,
) -> i32 {
    if buf.is_null() || size <= 0 {
        return 0;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return super::safe_helpers::str_to_c_buffer(guard.author(), buf, size);
        }
    }

    0
}

/// Set annotation author
///
/// # Safety
/// Caller must ensure text is a valid null-terminated C string
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_author(_ctx: Handle, annot: Handle, text: *const std::ffi::c_char) {
    if text.is_null() {
        return;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            if let Some(s) = super::safe_helpers::c_str_to_str(text) {
                guard.set_author(s);
            }
        }
    }
}

// ============================================================================
// Annotation Colors
// ============================================================================

/// Get annotation color
///
/// # Safety
/// Caller must ensure color array points to valid memory for n floats
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_color(_ctx: Handle, annot: Handle, n: *mut i32, color: *mut f32) {
    if n.is_null() || color.is_null() {
        return;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            if let Some(c) = guard.color() {
                unsafe {
                    *n = c.len() as i32;
                    for (i, &val) in c.iter().enumerate().take(4) {
                        *color.add(i) = val;
                    }
                }
            } else {
                unsafe {
                    *n = 0;
                }
            }
        }
    }
}

/// Set annotation color
///
/// # Safety
/// Caller must ensure color array points to valid memory with n floats
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_color(_ctx: Handle, annot: Handle, n: i32, color: *const f32) {
    if color.is_null() || n <= 0 || n > 4 {
        return;
    }

    if n != 3 {
        return;
    }

    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            unsafe {
                let c = [
                    *color.add(0),
                    *color.add(1),
                    *color.add(2),
                ];
                guard.set_color(Some(c));
            }
        }
    }
}

/// Get annotation interior color (for shapes)
///
/// # Safety
/// Caller must ensure color array points to valid memory for n floats
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_interior_color(_ctx: Handle, _annot: Handle, n: *mut i32, _color: *mut f32) {
    if n.is_null() {
        return;
    }

    // Interior color not yet implemented in Rust API
    unsafe {
        *n = 0;
    }
}

/// Set annotation interior color
///
/// # Safety
/// Caller must ensure color array points to valid memory with n floats
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_interior_color(_ctx: Handle, _annot: Handle, _n: i32, _color: *const f32) {
    // Interior color not yet implemented in Rust API
}

// ============================================================================
// Annotation Line Properties
// ============================================================================

/// Get line annotation properties
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_line(
    _ctx: Handle,
    _annot: Handle,
    _a: *mut super::geometry::fz_point,
    _b: *mut super::geometry::fz_point,
) -> i32 {
    // Line properties not yet implemented in Rust API
    0
}

/// Set line annotation properties
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_line(
    _ctx: Handle,
    _annot: Handle,
    _a: super::geometry::fz_point,
    _b: super::geometry::fz_point,
) {
    // Line properties not yet implemented in Rust API
}

// ============================================================================
// Annotation Border
// ============================================================================

/// Get annotation border width
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_border_width(_ctx: Handle, annot: Handle) -> f32 {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return guard.border().width;
        }
    }
    1.0 // Default border width
}

/// Set annotation border width
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_border_width(_ctx: Handle, annot: Handle, width: f32) {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            let mut border = guard.border().clone();
            border.width = width;
            guard.set_border(border);
        }
    }
}

// ============================================================================
// Annotation Modification
// ============================================================================

/// Check if annotation has been modified
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_has_dirty(_ctx: Handle, _annot: Handle) -> i32 {
    // Dirty tracking not yet implemented in Rust API
    0
}

/// Mark annotation as clean
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_clear_dirty(_ctx: Handle, _annot: Handle) {
    // Dirty tracking not yet implemented in Rust API
}

/// Update annotation appearance
#[unsafe(no_mangle)]
pub extern "C" fn pdf_update_annot(_ctx: Handle, _annot: Handle) -> i32 {
    // Appearance update not yet implemented in Rust API
    1 // Return success
}

/// Check if an annotation is valid
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_is_valid(_ctx: Handle, annot: Handle) -> i32 {
    if ANNOTATIONS.get(annot).is_some() { 1 } else { 0 }
}

/// Clone an annotation (create new copy)
#[unsafe(no_mangle)]
pub extern "C" fn pdf_clone_annot(_ctx: Handle, annot: Handle) -> Handle {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            let cloned = guard.clone();
            return ANNOTATIONS.insert(cloned);
        }
    }
    0
}

/// Get annotation opacity
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_opacity(_ctx: Handle, annot: Handle) -> f32 {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return guard.opacity();
        }
    }
    1.0
}

/// Set annotation opacity
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_annot_opacity(_ctx: Handle, annot: Handle, opacity: f32) {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(mut guard) = a.lock() {
            guard.set_opacity(opacity.clamp(0.0, 1.0));
        }
    }
}

/// Check if annotation has popup
#[unsafe(no_mangle)]
pub extern "C" fn pdf_annot_has_popup(_ctx: Handle, annot: Handle) -> i32 {
    if let Some(a) = ANNOTATIONS.get(annot) {
        if let Ok(guard) = a.lock() {
            return if guard.popup().is_some() { 1 } else { 0 };
        }
    }
    0
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_annot() {
        let annot = pdf_create_annot(0, 0, 0); // Text annotation
        assert_ne!(annot, 0);
        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_type() {
        let annot = pdf_create_annot(0, 0, 8); // Highlight
        assert_eq!(pdf_annot_type(0, annot), 8);
        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_rect() {
        let annot = pdf_create_annot(0, 0, 4); // Square
        let rect = pdf_annot_rect(0, annot);
        assert_eq!(rect.x0, 0.0);
        assert_eq!(rect.y0, 0.0);
        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_flags() {
        let annot = pdf_create_annot(0, 0, 0);
        let flags = pdf_annot_flags(0, annot);
        assert_ne!(flags, 0); // Should have PRINT flag by default
        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_contents() {
        use std::ffi::CString;

        let annot = pdf_create_annot(0, 0, 0);

        let text = CString::new("Test annotation").unwrap();
        pdf_set_annot_contents(0, annot, text.as_ptr());

        let mut buf = [0i8; 256];
        let len = pdf_annot_contents(0, annot, buf.as_mut_ptr(), 256);
        assert!(len > 0);

        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_border_width() {
        let annot = pdf_create_annot(0, 0, 4); // Square

        pdf_set_annot_border_width(0, annot, 2.5);
        let width = pdf_annot_border_width(0, annot);
        assert_eq!(width, 2.5);

        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_color() {
        let annot = pdf_create_annot(0, 0, 8); // Highlight

        let color = [1.0f32, 0.0, 0.0]; // Red
        pdf_set_annot_color(0, annot, 3, color.as_ptr());

        let mut n = 0i32;
        let mut retrieved = [0.0f32; 4];
        pdf_annot_color(0, annot, &mut n, retrieved.as_mut_ptr());

        assert_eq!(n, 3);
        assert_eq!(retrieved[0], 1.0);

        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_annot_validation() {
        let annot = pdf_create_annot(0, 0, 1); // Text
        assert_eq!(pdf_annot_is_valid(0, annot), 1);
        assert_eq!(pdf_annot_is_valid(0, 99999), 0);
        pdf_drop_annot(0, annot);
    }

    #[test]
    fn test_clone_annot() {
        let annot = pdf_create_annot(0, 0, 1);
        let cloned = pdf_clone_annot(0, annot);
        assert_ne!(cloned, 0);
        assert_ne!(cloned, annot);
        pdf_drop_annot(0, annot);
        pdf_drop_annot(0, cloned);
    }
}

