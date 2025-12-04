//! C FFI Module - MuPDF API Compatible Exports
//!
//! This module provides C-compatible exports that match MuPDF's API.
//! Uses safe Rust patterns with handle-based resource management.

// Clippy false positive: FFI functions with #[unsafe(no_mangle)] are inherently unsafe
// and all pointer dereferences are wrapped in unsafe blocks after null checks
#![allow(clippy::not_unsafe_ptr_arg_deref)]

pub mod annot;
pub mod archive;
pub mod buffer;
pub mod colorspace;
pub mod context;
pub mod cookie;
pub mod device;
pub mod display_list;
pub mod document;
pub mod enhanced;
pub mod font;
pub mod form;
pub mod geometry;
pub mod image;
pub mod link;
pub mod output;
pub mod path;
pub mod pdf_object;
pub mod pixmap;
pub mod stream;
pub mod text;

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
