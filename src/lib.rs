//! NanoPDF - A native Rust PDF library inspired by MuPDF
//!
//! This library provides PDF parsing, rendering, and manipulation capabilities.

pub mod fitz;
pub mod pdf;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

