use crate::ffi::geometry::fz_rect;
/**
 * Display List FFI
 *
 * C-compatible FFI for display list operations.
 * Display lists cache rendering commands for efficient repeated rendering.
 */
use crate::ffi::{Handle, HandleStore};
use crate::fitz::display_list::DisplayList;
use crate::fitz::geometry::Rect;
use std::sync::LazyLock;

// ============================================================================
// Display List Handle Store
// ============================================================================

/// Global handle store for display lists
static DISPLAY_LIST_STORE: LazyLock<HandleStore<DisplayList>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Display List Operations
// ============================================================================

/// Create a new display list
///
/// # Safety
/// - ctx must be a valid context handle
/// - rect should be a valid bounding rectangle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_display_list(_ctx: Handle, rect: fz_rect) -> Handle {
    let bounds = Rect::new(rect.x0, rect.y0, rect.x1, rect.y1);
    let list = DisplayList::new(bounds);
    DISPLAY_LIST_STORE.insert(list)
}

/// Drop display list handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - list must be a valid display list handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_display_list(_ctx: Handle, list: Handle) {
    DISPLAY_LIST_STORE.remove(list);
}

/// Get display list bounds
///
/// # Safety
/// - ctx must be a valid context handle
/// - list must be a valid display list handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_bound_display_list(_ctx: Handle, list: Handle) -> fz_rect {
    let Some(arc) = DISPLAY_LIST_STORE.get(list) else {
        return fz_rect {
            x0: 0.0,
            y0: 0.0,
            x1: 0.0,
            y1: 0.0,
        };
    };
    let Ok(display_list) = arc.lock() else {
        return fz_rect {
            x0: 0.0,
            y0: 0.0,
            x1: 0.0,
            y1: 0.0,
        };
    };

    let mediabox = display_list.mediabox();
    fz_rect {
        x0: mediabox.x0,
        y0: mediabox.y0,
        x1: mediabox.x1,
        y1: mediabox.y1,
    }
}

/// Run display list on device
///
/// # Safety
/// - ctx must be a valid context handle
/// - list must be a valid display list handle
/// - device must be a valid device handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_run_display_list(
    _ctx: Handle,
    list: Handle,
    _device: Handle,
    _matrix: crate::ffi::geometry::fz_matrix,
    _rect: fz_rect,
) {
    // Simplified: Just validate handles
    let Some(arc) = DISPLAY_LIST_STORE.get(list) else {
        return;
    };
    let Ok(_display_list) = arc.lock() else {
        return;
    };

    // In full implementation:
    // - Transform device with matrix
    // - Clip to rect
    // - Run all cached commands through device
}

/// Create display list from page
///
/// # Safety
/// - ctx must be a valid context handle
/// - page must be a valid page handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_display_list_from_page(_ctx: Handle, page: Handle) -> Handle {
    // Simplified: Create empty display list
    // In full implementation, would:
    // - Get page from document store
    // - Parse page content stream
    // - Record all drawing operations
    // - Return cached display list

    // For now, use default US Letter bounds
    let _ = page; // Mark parameter as used
    let bounds = Rect::new(0.0, 0.0, 612.0, 792.0);

    let list = DisplayList::new(bounds);
    DISPLAY_LIST_STORE.insert(list)
}
