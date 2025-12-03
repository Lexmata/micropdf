//! PDF Dictionary Operations FFI Functions

use std::ffi::{c_char, CStr};
use super::super::Handle;
use super::types::{PdfObj, PdfObjHandle, PdfObjType, PDF_OBJECTS};
use super::refcount::{with_obj, with_obj_mut};

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_len(_ctx: Handle, dict: PdfObjHandle) -> i32 {
    with_obj(dict, 0, |o| match &o.obj_type {
        PdfObjType::Dict(d) => d.len() as i32,
        _ => 0,
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_puts(
    _ctx: Handle,
    dict: PdfObjHandle,
    key: *const c_char,
    val: PdfObjHandle,
) {
    if key.is_null() {
        return;
    }

    #[allow(unsafe_code)]
    let key_str = unsafe { CStr::from_ptr(key) }
        .to_str()
        .unwrap_or("")
        .to_string();

    let val_obj = with_obj(val, None, |o| Some(o.clone()));

    if let Some(val_clone) = val_obj {
        with_obj_mut(dict, (), |d| {
            if let PdfObjType::Dict(ref mut dict_entries) = d.obj_type {
                if let Some(entry) = dict_entries.iter_mut().find(|(k, _)| k == &key_str) {
                    entry.1 = val_clone;
                } else {
                    dict_entries.push((key_str.clone(), val_clone));
                }
                d.dirty = true;
            }
        });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_dels(_ctx: Handle, dict: PdfObjHandle, key: *const c_char) {
    if key.is_null() {
        return;
    }

    #[allow(unsafe_code)]
    let key_str = unsafe { CStr::from_ptr(key) }
        .to_str()
        .unwrap_or("")
        .to_string();

    with_obj_mut(dict, (), |d| {
        if let PdfObjType::Dict(ref mut dict_entries) = d.obj_type {
            dict_entries.retain(|(k, _)| k != &key_str);
            d.dirty = true;
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put_int(
    _ctx: Handle,
    dict: PdfObjHandle,
    key: PdfObjHandle,
    x: i64,
) {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    if let Some(key_str) = key_name {
        with_obj_mut(dict, (), |d| {
            if let PdfObjType::Dict(ref mut dict_entries) = d.obj_type {
                let val = PdfObj::new_int(x);
                if let Some(entry) = dict_entries.iter_mut().find(|(k, _)| k == &key_str) {
                    entry.1 = val;
                } else {
                    dict_entries.push((key_str.clone(), val));
                }
                d.dirty = true;
            }
        });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put_real(
    _ctx: Handle,
    dict: PdfObjHandle,
    key: PdfObjHandle,
    x: f64,
) {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    if let Some(key_str) = key_name {
        with_obj_mut(dict, (), |d| {
            if let PdfObjType::Dict(ref mut dict_entries) = d.obj_type {
                let val = PdfObj::new_real(x);
                if let Some(entry) = dict_entries.iter_mut().find(|(k, _)| k == &key_str) {
                    entry.1 = val;
                } else {
                    dict_entries.push((key_str.clone(), val));
                }
                d.dirty = true;
            }
        });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put_bool(
    _ctx: Handle,
    dict: PdfObjHandle,
    key: PdfObjHandle,
    x: i32,
) {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    if let Some(key_str) = key_name {
        with_obj_mut(dict, (), |d| {
            if let PdfObjType::Dict(ref mut dict_entries) = d.obj_type {
                let val = PdfObj::new_bool(x != 0);
                if let Some(entry) = dict_entries.iter_mut().find(|(k, _)| k == &key_str) {
                    entry.1 = val;
                } else {
                    dict_entries.push((key_str.clone(), val));
                }
                d.dirty = true;
            }
        });
    }
}

// ============================================================================
// PDF Dictionary Get/Put Operations
// ============================================================================

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_get(_ctx: Handle, dict: PdfObjHandle, key: PdfObjHandle) -> PdfObjHandle {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    let key_str = match key_name {
        Some(k) => k,
        None => return 0,
    };

    let obj = with_obj(dict, None, |o| match &o.obj_type {
        PdfObjType::Dict(entries) => {
            entries.iter()
                .find(|(k, _)| k == &key_str)
                .map(|(_, v)| v.clone())
        }
        _ => None,
    });

    match obj {
        Some(o) => PDF_OBJECTS.insert(o),
        None => 0,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_gets(_ctx: Handle, dict: PdfObjHandle, key: *const c_char) -> PdfObjHandle {
    if key.is_null() {
        return 0;
    }

    #[allow(unsafe_code)]
    let key_str = unsafe { CStr::from_ptr(key) }
        .to_str()
        .unwrap_or("")
        .to_string();

    let obj = with_obj(dict, None, |o| match &o.obj_type {
        PdfObjType::Dict(entries) => {
            entries.iter()
                .find(|(k, _)| k == &key_str)
                .map(|(_, v)| v.clone())
        }
        _ => None,
    });

    match obj {
        Some(o) => PDF_OBJECTS.insert(o),
        None => 0,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put(_ctx: Handle, dict: PdfObjHandle, key: PdfObjHandle, val: PdfObjHandle) {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    let key_str = match key_name {
        Some(k) => k,
        None => return,
    };

    let val_obj = with_obj(val, None, |o| Some(o.clone()));

    if let Some(val_clone) = val_obj {
        with_obj_mut(dict, (), |d| {
            if let PdfObjType::Dict(ref mut entries) = d.obj_type {
                if let Some(entry) = entries.iter_mut().find(|(k, _)| k == &key_str) {
                    entry.1 = val_clone;
                } else {
                    entries.push((key_str.clone(), val_clone));
                }
                d.dirty = true;
            }
        });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put_name(_ctx: Handle, dict: PdfObjHandle, key: PdfObjHandle, name: *const c_char) {
    if name.is_null() {
        return;
    }

    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    let key_str = match key_name {
        Some(k) => k,
        None => return,
    };

    #[allow(unsafe_code)]
    let name_str = unsafe { CStr::from_ptr(name) }
        .to_str()
        .unwrap_or("");

    with_obj_mut(dict, (), |d| {
        if let PdfObjType::Dict(ref mut entries) = d.obj_type {
            let val = PdfObj::new_name(name_str);
            if let Some(entry) = entries.iter_mut().find(|(k, _)| k == &key_str) {
                entry.1 = val;
            } else {
                entries.push((key_str.clone(), val));
            }
            d.dirty = true;
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn pdf_dict_put_string(_ctx: Handle, dict: PdfObjHandle, key: PdfObjHandle, str: *const c_char, len: usize) {
    let key_name = with_obj(key, None, |o| match &o.obj_type {
        PdfObjType::Name(s) => Some(s.clone()),
        _ => None,
    });

    let key_str = match key_name {
        Some(k) => k,
        None => return,
    };

    let data = if str.is_null() || len == 0 {
        Vec::new()
    } else {
        #[allow(unsafe_code)]
        unsafe { std::slice::from_raw_parts(str as *const u8, len) }.to_vec()
    };

    with_obj_mut(dict, (), |d| {
        if let PdfObjType::Dict(ref mut entries) = d.obj_type {
            let val = PdfObj::new_string(&data);
            if let Some(entry) = entries.iter_mut().find(|(k, _)| k == &key_str) {
                entry.1 = val;
            } else {
                entries.push((key_str.clone(), val));
            }
            d.dirty = true;
        }
    });
}

