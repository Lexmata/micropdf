//! Fitz - Core rendering and document infrastructure
//!
//! This module provides foundational types for document handling,
//! geometry, rendering, and I/O operations.

pub mod error;
pub mod geometry;
pub mod buffer;
pub mod stream;
pub mod output;
pub mod link;
pub mod hash;
pub mod archive;
pub mod cookie;
pub mod colorspace;
pub mod pixmap;
pub mod font;
pub mod path;
pub mod text;
pub mod image;
pub mod device;
pub mod display_list;
pub mod document;
pub mod page;

#[cfg(feature = "parallel")]
pub mod parallel;

#[cfg(feature = "async")]
pub mod async_io;

