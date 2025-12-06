/**
 * Device FFI
 *
 * C-compatible FFI for device operations.
 * Devices are the destination for rendering operations.
 */

use crate::ffi::{Handle, HandleStore};
use crate::ffi::geometry::{fz_matrix, fz_rect};
use std::sync::LazyLock;

// ============================================================================
// Device Handle Store
// ============================================================================

/// Simplified device wrapper for FFI
pub struct FfiDevice {
    device_type: DeviceType,
    target_handle: Handle,
    closed: bool,
}

#[derive(Debug, Clone, Copy)]
enum DeviceType {
    Draw,   // Renders to pixmap
    List,   // Records to display list
}

impl FfiDevice {
    fn new(device_type: DeviceType, target_handle: Handle) -> Self {
        Self {
            device_type,
            target_handle,
            closed: false,
        }
    }
}

/// Global handle store for devices
pub static DEVICE_STORE: LazyLock<HandleStore<FfiDevice>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Device Operations
// ============================================================================

/// Create a draw device for pixmap rendering
///
/// # Safety
/// - ctx must be a valid context handle
/// - pixmap must be a valid pixmap handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_draw_device(_ctx: Handle, pixmap: Handle) -> Handle {
    let device = FfiDevice::new(DeviceType::Draw, pixmap);
    DEVICE_STORE.insert(device)
}

/// Create a display list device
///
/// # Safety
/// - ctx must be a valid context handle
/// - list must be a valid display list handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_list_device(_ctx: Handle, list: Handle) -> Handle {
    let device = FfiDevice::new(DeviceType::List, list);
    DEVICE_STORE.insert(device)
}

/// Drop device handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - device must be a valid device handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_device(_ctx: Handle, device: Handle) {
    DEVICE_STORE.remove(device);
}

/// Close device (finish rendering)
///
/// # Safety
/// - ctx must be a valid context handle
/// - device must be a valid device handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_close_device(_ctx: Handle, device: Handle) {
    let Some(arc) = DEVICE_STORE.get(device) else {
        return;
    };
    let Ok(mut dev) = arc.lock() else {
        return;
    };
    
    dev.closed = true;
}

/// Begin new page on device
///
/// # Safety
/// - ctx must be a valid context handle
/// - device must be a valid device handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_begin_page(_ctx: Handle, device: Handle, _rect: fz_rect) {
    let Some(arc) = DEVICE_STORE.get(device) else {
        return;
    };
    let Ok(_dev) = arc.lock() else {
        return;
    };
    
    // Mark page begin
}

/// End current page on device
///
/// # Safety
/// - ctx must be a valid context handle
/// - device must be a valid device handle
#[unsafe(no_mangle)]
pub extern "C" fn fz_end_page(_ctx: Handle, device: Handle) {
    let Some(arc) = DEVICE_STORE.get(device) else {
        return;
    };
    let Ok(_dev) = arc.lock() else {
        return;
    };
    
    // Mark page end
}
