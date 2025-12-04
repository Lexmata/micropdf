//! Enhanced FFI Module - NanoPDF Extended Features (np_ prefix)
//!
//! This module provides C-compatible FFI exports for enhanced features
//! that go beyond the MuPDF API. All functions use the "np_" prefix.

pub mod drawing;

use crate::enhanced;
use super::Handle;
use std::sync::LazyLock;

/// Handle stores for enhanced types
pub static DRAWING_CONTEXTS: LazyLock<super::HandleStore<enhanced::drawing::DrawingContext>> =
    LazyLock::new(super::HandleStore::new);
pub static PDF_DRAWINGS: LazyLock<super::HandleStore<enhanced::drawing::PdfDrawing>> =
    LazyLock::new(super::HandleStore::new);

