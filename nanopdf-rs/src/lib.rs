//! NanoPDF - A native Rust PDF library inspired by MuPDF
//!
//! This library provides PDF parsing, rendering, and manipulation capabilities.
//!
//! # Modules
//!
//! - `fitz` - Core rendering and document infrastructure (MuPDF compatible)
//! - `pdf` - PDF-specific parsing and manipulation (MuPDF compatible)
//! - `ffi` - C-compatible FFI exports (MuPDF API compatible)
//! - `enhanced` - Extended features beyond MuPDF (pypdf-inspired)
//!
//! # FFI Module
//!
//! The `ffi` module provides C-compatible exports that match MuPDF's API.
//! When compiled as a staticlib or cdylib, these functions can be called
//! from C code using the same function signatures as MuPDF.
//!
//! # Enhanced Module
//!
//! The `enhanced` module provides features beyond the original MuPDF library,
//! inspired by pypdf and other Python PDF libraries. This includes document
//! creation, advanced page manipulation, watermarking, optimization, and more.

pub mod enhanced;
pub mod ffi;
pub mod fitz;
pub mod pdf;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
