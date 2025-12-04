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

pub mod attachments;
pub mod bookmarks;
pub mod content;
pub mod drawing;
pub mod error;
pub mod metadata;
pub mod optimization;
pub mod page_ops;
pub mod writer;

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
        // VERSION is always non-empty at compile-time (env!("CARGO_PKG_VERSION"))
        // Just verify it's a valid version string format (contains a dot)
        assert!(VERSION.contains('.'));
    }
}
