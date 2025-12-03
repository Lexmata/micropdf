//! PDF String Extraction FFI Functions

use std::ffi::c_char;
use std::sync::{LazyLock, Mutex};
use super::super::Handle;
use super::types::{PdfObjHandle, PdfObjType};
use super::refcount::with_obj;

static STRING_STORAGE: LazyLock<Mutex<Vec<Vec<u8>>>> = LazyLock::new(|| Mutex::new(Vec::new()));

#[unsafe(no_mangle)]
pub extern "C" fn pdf_to_string(_ctx: Handle, obj: PdfObjHandle, sizep: *mut usize) -> *const c_char {
    let data = with_obj(obj, None, |o| match &o.obj_type {
        PdfObjType::String(s) => Some(s.clone()),
        _ => None,
    });

    match data {
        Some(s) => {
            if !sizep.is_null() {
                #[allow(unsafe_code)]
                unsafe { *sizep = s.len(); }
            }
            let ptr = s.as_ptr() as *const c_char;
            if let Ok(mut storage) = STRING_STORAGE.lock() {
                storage.push(s);
            }
            ptr
        }
        None => {
            if !sizep.is_null() {
                #[allow(unsafe_code)]
                unsafe { *sizep = 0; }
            }
            std::ptr::null()
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_to_str_buf(_ctx: Handle, obj: PdfObjHandle) -> *const c_char {
    pdf_to_string(_ctx, obj, std::ptr::null_mut())
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_to_str_len(_ctx: Handle, obj: PdfObjHandle) -> usize {
    with_obj(obj, 0, |o| match &o.obj_type {
        PdfObjType::String(s) => s.len(),
        _ => 0,
    })
}

