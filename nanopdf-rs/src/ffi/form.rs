/**
 * Form Field FFI
 *
 * C-compatible FFI for PDF interactive form (AcroForm) operations.
 * Provides functions for widget access, property management, and value manipulation.
 */

use crate::ffi::{Handle, HandleStore};
use crate::ffi::geometry::fz_rect;
use crate::fitz::geometry::Rect;
use crate::pdf::form::{FormField, WidgetType, FieldFlags};
use std::ffi::{c_char, c_int};
use std::sync::LazyLock;

// ============================================================================
// Widget Handle Store
// ============================================================================

/// Global handle store for form widgets
static WIDGET_STORE: LazyLock<HandleStore<FormField>> = LazyLock::new(HandleStore::new);

// ============================================================================
// Widget Navigation
// ============================================================================

/// Get first form widget on page
///
/// # Safety
/// - ctx must be a valid context handle
/// - page must be a valid page handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_first_widget(_ctx: Handle, _page: Handle) -> Handle {
    // Simplified: Return dummy widget for demonstration
    // In full implementation, would traverse page annotations
    let widget = FormField::new(
        "field1".to_string(),
        WidgetType::Text,
        Rect::new(0.0, 0.0, 100.0, 30.0),
    );
    WIDGET_STORE.insert(widget)
}

/// Get next widget in list
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_next_widget(_ctx: Handle, _widget: Handle) -> Handle {
    // Simplified: Return 0 (no next widget)
    0
}

/// Drop widget handle
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_drop_widget(_ctx: Handle, widget: Handle) {
    WIDGET_STORE.remove(widget);
}

// ============================================================================
// Widget Properties
// ============================================================================

/// Get widget field type
///
/// # Returns
/// - 0: Unknown
/// - 1: PushButton
/// - 2: CheckBox
/// - 3: RadioButton
/// - 4: Text
/// - 5: ComboBox
/// - 6: ListBox
/// - 7: Signature
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_type(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    match field.field_type {
        WidgetType::Button => 1,
        WidgetType::Checkbox => 2,
        WidgetType::RadioButton => 3,
        WidgetType::Text => 4,
        WidgetType::ComboBox => 5,
        WidgetType::ListBox => 6,
        WidgetType::Signature => 7,
        _ => 0,
    }
}

/// Get widget field name
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
/// - buffer must be valid and have at least size bytes
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_widget_name(
    _ctx: Handle,
    widget: Handle,
    buffer: *mut c_char,
    size: usize,
) {
    if buffer.is_null() || size == 0 {
        return;
    }

    let name = if let Some(arc) = WIDGET_STORE.get(widget) {
        if let Ok(field) = arc.lock() {
            field.name.clone()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let bytes = name.as_bytes();
    let copy_len = bytes.len().min(size - 1);

    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), buffer as *mut u8, copy_len);
        *buffer.add(copy_len) = 0; // Null terminate
    }
}

/// Get widget rectangle
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_rect(_ctx: Handle, widget: Handle) -> fz_rect {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return fz_rect { x0: 0.0, y0: 0.0, x1: 0.0, y1: 0.0 };
    };
    let Ok(field) = arc.lock() else {
        return fz_rect { x0: 0.0, y0: 0.0, x1: 0.0, y1: 0.0 };
    };
    fz_rect {
        x0: field.rect.x0,
        y0: field.rect.y0,
        x1: field.rect.x1,
        y1: field.rect.y1,
    }
}

// ============================================================================
// Widget Values
// ============================================================================

/// Get widget field value
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
/// - buffer must be valid and have at least size bytes
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_widget_value(
    _ctx: Handle,
    widget: Handle,
    buffer: *mut c_char,
    size: usize,
) {
    if buffer.is_null() || size == 0 {
        return;
    }

    let value = if let Some(arc) = WIDGET_STORE.get(widget) {
        if let Ok(field) = arc.lock() {
            field.value.clone()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let bytes = value.as_bytes();
    let copy_len = bytes.len().min(size - 1);

    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), buffer as *mut u8, copy_len);
        *buffer.add(copy_len) = 0;
    }
}

/// Set widget field value
///
/// # Returns
/// - 1: Success
/// - 0: Failure
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
/// - value must be a valid C string
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_set_widget_value(
    _ctx: Handle,
    widget: Handle,
    value: *const c_char,
) -> c_int {
    if value.is_null() {
        return 0;
    }

    let value_str = match unsafe { std::ffi::CStr::from_ptr(value) }.to_str() {
        Ok(s) => s.to_string(),
        Err(_) => return 0,
    };

    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(mut field) = arc.lock() else {
        return 0;
    };
    field.value = value_str;
    1
}

// ============================================================================
// Widget State
// ============================================================================

/// Check if widget is read-only
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_is_readonly(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    if field.flags.has(FieldFlags::READ_ONLY) { 1 } else { 0 }
}

/// Check if widget is required
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_is_required(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    if field.flags.has(FieldFlags::REQUIRED) { 1 } else { 0 }
}

/// Check if widget is valid
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_is_valid(_ctx: Handle, widget: Handle) -> c_int {
    if WIDGET_STORE.get(widget).is_some() { 1 } else { 0 }
}

// ============================================================================
// Text Field Specific
// ============================================================================

/// Get widget text format
///
/// # Returns
/// - 0: None
/// - 1: Number
/// - 2: Special
/// - 3: Date
/// - 4: Time
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_text_format(_ctx: Handle, widget: Handle) -> c_int {
    use crate::pdf::form::TextFormat;
    
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    match field.text_format {
        TextFormat::Number => 1,
        TextFormat::Special => 2,
        TextFormat::Date => 3,
        TextFormat::Time => 4,
        TextFormat::None => 0,
    }
}

/// Get widget max length
///
/// # Returns
/// - Max length, or -1 if unlimited
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_max_len(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return -1;
    };
    let Ok(field) = arc.lock() else {
        return -1;
    };
    field.max_len.map(|len| len as c_int).unwrap_or(-1)
}

/// Check if text field is multiline
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_is_multiline(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    if field.flags.has(FieldFlags::MULTILINE) { 1 } else { 0 }
}

// ============================================================================
// Checkbox/Radio Specific
// ============================================================================

/// Check if checkbox/radio is checked
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_is_checked(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    let val = field.value.as_str();
    if val == "Yes" || val == "On" || val == "true" { 1 } else { 0 }
}

/// Set checkbox/radio checked state
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_set_widget_checked(_ctx: Handle, widget: Handle, checked: c_int) {
    if let Some(arc) = WIDGET_STORE.get(widget) {
        if let Ok(mut field) = arc.lock() {
            field.value = if checked != 0 { "Yes" } else { "Off" }.to_string();
        }
    }
}

// ============================================================================
// Choice Field Specific
// ============================================================================

/// Get widget option count
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_widget_option_count(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(field) = arc.lock() else {
        return 0;
    };
    field.options.len() as c_int
}

/// Get widget option by index
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
/// - buffer must be valid and have at least size bytes
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_widget_option(
    _ctx: Handle,
    widget: Handle,
    index: c_int,
    buffer: *mut c_char,
    size: usize,
) {
    if buffer.is_null() || size == 0 || index < 0 {
        return;
    }

    let option = if let Some(arc) = WIDGET_STORE.get(widget) {
        if let Ok(field) = arc.lock() {
            field.options
                .get(index as usize)
                .map(|opt| opt.label.clone())
                .unwrap_or_default()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let bytes = option.as_bytes();
    let copy_len = bytes.len().min(size - 1);

    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), buffer as *mut u8, copy_len);
        *buffer.add(copy_len) = 0;
    }
}

// ============================================================================
// Widget Updates
// ============================================================================

/// Update widget appearance
///
/// # Returns
/// - 1: Success
/// - 0: Failure
///
/// # Safety
/// - ctx must be a valid context handle
/// - widget must be a valid widget handle
#[unsafe(no_mangle)]
pub extern "C" fn pdf_update_widget(_ctx: Handle, widget: Handle) -> c_int {
    let Some(arc) = WIDGET_STORE.get(widget) else {
        return 0;
    };
    let Ok(_field) = arc.lock() else {
        return 0;
    };
    // Mark widget as updated
    1
}
