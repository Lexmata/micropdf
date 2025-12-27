//! C FFI Module - MuPDF API Compatible Exports
//!
//! This module provides C-compatible exports that match MuPDF's API.
//! Uses safe Rust patterns with handle-based resource management.

// Clippy false positive: FFI functions with #[unsafe(no_mangle)] are inherently unsafe
// and all pointer dereferences are wrapped in unsafe blocks after null checks
#![allow(clippy::not_unsafe_ptr_arg_deref)]

pub mod annot;
pub mod archive;
pub mod band_writer;
pub mod barcode;
pub mod bidi;
pub mod bitmap;
pub mod buffer;
pub mod color;
pub mod colorspace;
pub mod compress;
pub mod context;
pub mod cookie;
pub mod deskew;
pub mod device;
pub mod display_list;
pub mod document;
pub mod draw_device;
pub mod enhanced;
pub mod filter;
pub mod font;
pub mod form;
pub mod geometry;
pub mod glyph;
pub mod glyph_cache;
pub mod heap;
pub mod hyphen;
pub mod image;
pub mod json;
pub mod link;
pub mod log;
pub mod outline;
pub mod output;
pub mod path;
pub mod pdf_clean;
pub mod pdf_cmap;
pub mod pdf_event;
pub mod pdf_font;
pub mod pdf_image_rewriter;
pub mod pdf_interpret;
pub mod pdf_javascript;
pub mod pdf_layer;
pub mod pdf_name_table;
pub mod pdf_object;
pub mod pdf_page;
pub mod pdf_parse;
pub mod pdf_recolor;
pub mod pdf_redact;
pub mod pdf_resource;
pub mod pdf_signature;
pub mod pdf_zugferd;
pub mod pixmap;
pub mod pool;
pub mod separation;
pub mod shade;
pub mod stext;
pub mod store;
pub mod story;
pub mod stream;
pub mod string_util;
pub mod text;
pub mod transition;
pub mod tree;
pub mod util;
pub mod write_pixmap;
pub mod writer;
pub mod xml;

// Safe helper functions for common FFI patterns
mod safe_helpers;

use std::collections::HashMap;
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicU64, Ordering},
};

/// Global handle manager for safe FFI resource management
static HANDLE_COUNTER: AtomicU64 = AtomicU64::new(1);

/// Type alias for handles
pub type Handle = u64;

/// Generate a new unique handle
pub fn new_handle() -> Handle {
    HANDLE_COUNTER.fetch_add(1, Ordering::SeqCst)
}

/// Thread-safe handle storage for a specific type
pub struct HandleStore<T> {
    store: Mutex<HashMap<Handle, Arc<Mutex<T>>>>,
}

impl<T> HandleStore<T> {
    pub fn new() -> Self {
        Self {
            store: Mutex::new(HashMap::new()),
        }
    }

    pub fn insert(&self, value: T) -> Handle {
        let handle = new_handle();
        let mut store = self.store.lock().unwrap();
        store.insert(handle, Arc::new(Mutex::new(value)));
        handle
    }

    pub fn get(&self, handle: Handle) -> Option<Arc<Mutex<T>>> {
        let store = self.store.lock().unwrap();
        store.get(&handle).cloned()
    }

    pub fn remove(&self, handle: Handle) -> Option<Arc<Mutex<T>>> {
        let mut store = self.store.lock().unwrap();
        store.remove(&handle)
    }

    pub fn keep(&self, handle: Handle) -> Handle {
        // For reference counting, we just return the same handle
        // The Arc inside handles ref counting automatically
        handle
    }
}

impl<T> Default for HandleStore<T> {
    fn default() -> Self {
        Self::new()
    }
}

// Lazy initialization for handle stores
use std::sync::LazyLock;

pub static CONTEXTS: LazyLock<HandleStore<context::Context>> = LazyLock::new(HandleStore::new);
pub static BUFFERS: LazyLock<HandleStore<buffer::Buffer>> = LazyLock::new(HandleStore::new);
pub static STREAMS: LazyLock<HandleStore<stream::Stream>> = LazyLock::new(HandleStore::new);
pub static PIXMAPS: LazyLock<HandleStore<pixmap::Pixmap>> = LazyLock::new(HandleStore::new);
pub static DOCUMENTS: LazyLock<HandleStore<document::Document>> = LazyLock::new(HandleStore::new);
