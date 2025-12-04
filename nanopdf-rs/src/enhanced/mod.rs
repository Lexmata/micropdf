//! Enhanced PDF Manipulation Features
//!
//! This module provides features beyond the original MuPDF library,
//! inspired by pypdf and other Python PDF libraries.
//!
//! ## Features
//!
//! - **Document Creation**: Create PDFs from scratch
//! - **Page Manipulation**: Add, remove, reorder pages
//! - **Content Addition**: Text overlay, images, watermarks
//! - **Drawing**: Direct drawing with colors and opacity
//! - **Optimization**: Compression, cleanup, form flattening
//! - **Bookmarks**: Outline management
//! - **Attachments**: Embed and extract files
//! - **Metadata**: Enhanced metadata support

pub mod writer;
pub mod page_ops;
pub mod content;
pub mod drawing;
pub mod optimization;
pub mod bookmarks;
pub mod attachments;
pub mod metadata;
pub mod error;

pub use error::{EnhancedError, Result};

/// Enhanced module version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Check if enhanced features are available
pub fn is_available() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_enhanced_available() {
        assert!(is_available());
    }

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}

