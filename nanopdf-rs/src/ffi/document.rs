//! C FFI for document - MuPDF compatible
//! Safe Rust implementation using handle-based resource management

use super::{Handle, DOCUMENTS, STREAMS};
use std::ffi::c_char;

/// Internal document state
pub struct Document {
    // PDF document data - will be expanded with actual PDF parsing
    data: Vec<u8>,
    page_count: i32,
    needs_password: bool,
    authenticated: bool,
}

impl Document {
    pub fn new(data: Vec<u8>) -> Self {
        // Basic PDF detection and page count estimation
        // In a real implementation, this would parse the PDF structure
        let page_count = Self::estimate_page_count(&data);

        Self {
            data,
            page_count,
            needs_password: false,
            authenticated: true,
        }
    }

    fn estimate_page_count(data: &[u8]) -> i32 {
        // Simple heuristic: count /Type /Page occurrences
        // Real implementation would parse the PDF properly
        let mut count = 0;
        let pattern = b"/Type /Page";

        for window in data.windows(pattern.len()) {
            if window == pattern {
                count += 1;
            }
        }

        count.max(1) // At least 1 page
    }
}

/// Open a document from file
///
/// # Safety
/// Caller must ensure `filename` is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_open_document(_ctx: Handle, filename: *const c_char) -> Handle {
    if filename.is_null() {
        return 0;
    }

    // SAFETY: Caller guarantees filename is a valid null-terminated C string
    #[allow(unsafe_code)]
    let c_str = unsafe { std::ffi::CStr::from_ptr(filename) };
    let path = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return 0,
    };

    match std::fs::read(path) {
        Ok(data) => DOCUMENTS.insert(Document::new(data)),
        Err(_) => 0,
    }
}

/// Open a document from stream
#[unsafe(no_mangle)]
pub extern "C" fn fz_open_document_with_stream(
    _ctx: Handle,
    _magic: *const c_char,
    stm: Handle,
) -> Handle {
    // Read all data from stream
    if let Some(stream) = STREAMS.get(stm) {
        if let Ok(guard) = stream.lock() {
            return DOCUMENTS.insert(Document::new(guard.data.clone()));
        }
    }
    0
}

/// Keep (increment ref) document
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_document(_ctx: Handle, doc: Handle) -> Handle {
    DOCUMENTS.keep(doc)
}

/// Drop document reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_document(_ctx: Handle, doc: Handle) {
    let _ = DOCUMENTS.remove(doc);
}

/// Check if document needs a password
#[unsafe(no_mangle)]
pub extern "C" fn fz_needs_password(_ctx: Handle, doc: Handle) -> i32 {
    if let Some(d) = DOCUMENTS.get(doc) {
        if let Ok(guard) = d.lock() {
            return i32::from(guard.needs_password);
        }
    }
    0
}

/// Authenticate with password
#[unsafe(no_mangle)]
pub extern "C" fn fz_authenticate_password(
    _ctx: Handle,
    doc: Handle,
    _password: *const c_char,
) -> i32 {
    if let Some(document) = DOCUMENTS.get(doc) {
        if let Ok(mut d) = document.lock() {
            // For now, always succeed if no password needed
            if !d.needs_password {
                d.authenticated = true;
                return 1;
            }
            // TODO: Implement actual password verification
        }
    }
    0
}

/// Count pages in document
#[unsafe(no_mangle)]
pub extern "C" fn fz_count_pages(_ctx: Handle, doc: Handle) -> i32 {
    if let Some(d) = DOCUMENTS.get(doc) {
        if let Ok(guard) = d.lock() {
            return guard.page_count;
        }
    }
    0
}

/// Count chapters in document (PDF has 1 chapter)
#[unsafe(no_mangle)]
pub extern "C" fn fz_count_chapters(_ctx: Handle, _doc: Handle) -> i32 {
    1
}

/// Count pages in chapter
#[unsafe(no_mangle)]
pub extern "C" fn fz_count_chapter_pages(_ctx: Handle, doc: Handle, _chapter: i32) -> i32 {
    fz_count_pages(_ctx, doc)
}

/// Get page number from location
#[unsafe(no_mangle)]
pub extern "C" fn fz_page_number_from_location(
    _ctx: Handle,
    _doc: Handle,
    chapter: i32,
    page: i32,
) -> i32 {
    if chapter == 0 {
        page
    } else {
        -1
    }
}

/// Check document permission
#[unsafe(no_mangle)]
pub extern "C" fn fz_has_permission(_ctx: Handle, doc: Handle, _permission: i32) -> i32 {
    // For now, allow all permissions if document is open
    if DOCUMENTS.get(doc).is_some() {
        1
    } else {
        0
    }
}

// Permission flags
pub const FZ_PERMISSION_PRINT: i32 = 1 << 0;
pub const FZ_PERMISSION_COPY: i32 = 1 << 1;
pub const FZ_PERMISSION_EDIT: i32 = 1 << 2;
pub const FZ_PERMISSION_ANNOTATE: i32 = 1 << 3;

/// Lookup metadata
///
/// # Safety
/// Caller must ensure `buf` points to writable memory of at least `size` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_lookup_metadata(
    _ctx: Handle,
    _doc: Handle,
    _key: *const c_char,
    buf: *mut c_char,
    size: i32,
) -> i32 {
    // Return empty string for now
    if !buf.is_null() && size > 0 {
        // SAFETY: Caller guarantees buf points to writable memory of `size` bytes
        #[allow(unsafe_code)]
        unsafe {
            *buf = 0; // Null terminate
        }
    }
    -1 // Key not found
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::STREAMS;
    use super::super::stream::Stream;

    #[test]
    fn test_document_handle() {
        // Create a minimal "PDF" for testing
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());

        let handle = DOCUMENTS.insert(doc);
        assert_ne!(handle, 0);

        assert_eq!(fz_count_chapters(0, handle), 1);
        assert!(fz_count_pages(0, handle) >= 1);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_document_new() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        assert_eq!(doc.page_count, 2);
        assert!(!doc.needs_password);
        assert!(doc.authenticated);
    }

    #[test]
    fn test_document_estimate_page_count() {
        // No pages
        let empty = b"%PDF-1.4\n%%EOF";
        let doc1 = Document::new(empty.to_vec());
        assert_eq!(doc1.page_count, 1); // Minimum 1

        // Multiple pages
        let multi = b"%PDF-1.4\n/Type /Page\n/Type /Page\n/Type /Page\n%%EOF";
        let doc2 = Document::new(multi.to_vec());
        assert_eq!(doc2.page_count, 3);
    }

    #[test]
    fn test_keep_document() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        let kept = fz_keep_document(0, handle);
        assert_eq!(kept, handle);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_needs_password() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        assert_eq!(fz_needs_password(0, handle), 0);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_needs_password_invalid_handle() {
        assert_eq!(fz_needs_password(0, 0), 0);
    }

    #[test]
    fn test_authenticate_password() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        // No password needed, should succeed
        let result = fz_authenticate_password(0, handle, c"".as_ptr());
        assert_eq!(result, 1);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_authenticate_password_invalid_handle() {
        let result = fz_authenticate_password(0, 0, c"".as_ptr());
        assert_eq!(result, 0);
    }

    #[test]
    fn test_count_pages() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        assert_eq!(fz_count_pages(0, handle), 2);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_count_pages_invalid_handle() {
        assert_eq!(fz_count_pages(0, 0), 0);
    }

    #[test]
    fn test_count_chapters() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        // PDFs always have 1 chapter
        assert_eq!(fz_count_chapters(0, handle), 1);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_count_chapter_pages() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        assert_eq!(fz_count_chapter_pages(0, handle, 0), 2);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_page_number_from_location() {
        assert_eq!(fz_page_number_from_location(0, 0, 0, 5), 5);
        assert_eq!(fz_page_number_from_location(0, 0, 0, 0), 0);
        assert_eq!(fz_page_number_from_location(0, 0, 1, 5), -1); // Invalid chapter
    }

    #[test]
    fn test_has_permission() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        assert_eq!(fz_has_permission(0, handle, FZ_PERMISSION_PRINT), 1);
        assert_eq!(fz_has_permission(0, handle, FZ_PERMISSION_COPY), 1);
        assert_eq!(fz_has_permission(0, handle, FZ_PERMISSION_EDIT), 1);
        assert_eq!(fz_has_permission(0, handle, FZ_PERMISSION_ANNOTATE), 1);

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_has_permission_invalid_handle() {
        assert_eq!(fz_has_permission(0, 0, FZ_PERMISSION_PRINT), 0);
    }

    #[test]
    fn test_lookup_metadata() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let handle = DOCUMENTS.insert(doc);

        let mut buf = [0i8; 100];
        let result = fz_lookup_metadata(0, handle, c"Title".as_ptr(), buf.as_mut_ptr(), 100);
        assert_eq!(result, -1); // Not found

        fz_drop_document(0, handle);
    }

    #[test]
    fn test_lookup_metadata_null_buffer() {
        let result = fz_lookup_metadata(0, 0, c"Title".as_ptr(), std::ptr::null_mut(), 0);
        assert_eq!(result, -1);
    }

    #[test]
    fn test_open_document_null_filename() {
        let handle = fz_open_document(0, std::ptr::null());
        assert_eq!(handle, 0);
    }

    #[test]
    fn test_open_document_with_stream() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let stream = Stream::from_memory(pdf_data.to_vec());
        let stream_handle = STREAMS.insert(stream);

        let doc_handle = fz_open_document_with_stream(0, std::ptr::null(), stream_handle);
        assert_ne!(doc_handle, 0);

        assert_eq!(fz_count_pages(0, doc_handle), 1);

        fz_drop_document(0, doc_handle);
        super::super::STREAMS.remove(stream_handle);
    }

    #[test]
    fn test_open_document_with_invalid_stream() {
        let doc_handle = fz_open_document_with_stream(0, std::ptr::null(), 0);
        assert_eq!(doc_handle, 0);
    }

    #[test]
    fn test_permission_constants() {
        assert_eq!(FZ_PERMISSION_PRINT, 1);
        assert_eq!(FZ_PERMISSION_COPY, 2);
        assert_eq!(FZ_PERMISSION_EDIT, 4);
        assert_eq!(FZ_PERMISSION_ANNOTATE, 8);
    }
}

