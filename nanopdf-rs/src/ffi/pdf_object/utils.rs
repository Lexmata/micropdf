//! PDF Object Utility Functions (Geometry, Key Access, etc.)

use super::super::Handle;
use super::types::{PdfObj, PdfObjHandle, PdfObjType, PDF_OBJECTS};
use super::refcount::with_obj;

// ============================================================================
// PDF Geometry Object Creation
// ============================================================================

/// Create a PDF array representing a point [x, y]
#[unsafe(no_mangle)]
pub extern "C" fn pdf_new_point(_ctx: Handle, _doc: Handle, x: f32, y: f32) -> PdfObjHandle {
    let mut arr = PdfObj::new_array(2);
    if let PdfObjType::Array(ref mut a) = arr.obj_type {
        a.push(PdfObj::new_real(x as f64));
        a.push(PdfObj::new_real(y as f64));
    }
    PDF_OBJECTS.insert(arr)
}

/// Create a PDF array representing a rect [x0, y0, x1, y1]
#[unsafe(no_mangle)]
pub extern "C" fn pdf_new_rect(_ctx: Handle, _doc: Handle, x0: f32, y0: f32, x1: f32, y1: f32) -> PdfObjHandle {
    let mut arr = PdfObj::new_array(4);
    if let PdfObjType::Array(ref mut a) = arr.obj_type {
        a.push(PdfObj::new_real(x0 as f64));
        a.push(PdfObj::new_real(y0 as f64));
        a.push(PdfObj::new_real(x1 as f64));
        a.push(PdfObj::new_real(y1 as f64));
    }
    PDF_OBJECTS.insert(arr)
}

/// Create a PDF array representing a matrix [a, b, c, d, e, f]
#[unsafe(no_mangle)]
pub extern "C" fn pdf_new_matrix(_ctx: Handle, _doc: Handle, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) -> PdfObjHandle {
    let mut arr = PdfObj::new_array(6);
    if let PdfObjType::Array(ref mut arr_vec) = arr.obj_type {
        arr_vec.push(PdfObj::new_real(a as f64));
        arr_vec.push(PdfObj::new_real(b as f64));
        arr_vec.push(PdfObj::new_real(c as f64));
        arr_vec.push(PdfObj::new_real(d as f64));
        arr_vec.push(PdfObj::new_real(e as f64));
        arr_vec.push(PdfObj::new_real(f as f64));
    }
    PDF_OBJECTS.insert(arr)
}

/// Create a PDF date string from components
#[unsafe(no_mangle)]
pub extern "C" fn pdf_new_date(_ctx: Handle, _doc: Handle, year: i32, month: i32, day: i32, hour: i32, minute: i32, second: i32) -> PdfObjHandle {
    // PDF date format: D:YYYYMMDDHHmmSS
    let date_str = format!(
        "D:{:04}{:02}{:02}{:02}{:02}{:02}",
        year, month, day, hour, minute, second
    );
    PDF_OBJECTS.insert(PdfObj::new_string(date_str.as_bytes()))
}

// ============================================================================
// PDF Array/Dict Key Access
// ============================================================================

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_get_key(_ctx: Handle, dict: PdfObjHandle, index: i32) -> PdfObjHandle {
    let key = with_obj(dict, None, |o| match &o.obj_type {
        PdfObjType::Dict(entries) => {
            let idx = index as usize;
            if idx < entries.len() {
                Some(PdfObj::new_name(&entries[idx].0))
            } else {
                None
            }
        }
        _ => None,
    });

    match key {
        Some(k) => PDF_OBJECTS.insert(k),
        None => 0,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_get_val(_ctx: Handle, dict: PdfObjHandle, index: i32) -> PdfObjHandle {
    let val = with_obj(dict, None, |o| match &o.obj_type {
        PdfObjType::Dict(entries) => {
            let idx = index as usize;
            if idx < entries.len() {
                Some(entries[idx].1.clone())
            } else {
                None
            }
        }
        _ => None,
    });

    match val {
        Some(v) => PDF_OBJECTS.insert(v),
        None => 0,
    }
}

