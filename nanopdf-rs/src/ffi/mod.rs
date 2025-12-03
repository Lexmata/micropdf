//! C FFI Module - MuPDF API Compatible Exports
//!
//! This module provides C-compatible exports that match MuPDF's API.
//! When compiled as a staticlib or cdylib, these functions can be called
//! from C code using the same function signatures as MuPDF.

pub mod geometry;
pub mod buffer;
pub mod context;
pub mod stream;
pub mod pixmap;
pub mod colorspace;
pub mod document;

