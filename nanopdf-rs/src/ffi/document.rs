//! C FFI for document - MuPDF compatible
//! Safe Rust implementation using handle-based resource management

use super::{Handle, HandleStore, DOCUMENTS, STREAMS};
use std::ffi::c_char;
use std::sync::LazyLock;

/// Page storage
pub static PAGES: LazyLock<HandleStore<Page>> = LazyLock::new(HandleStore::default);

/// Outline storage
pub static OUTLINES: LazyLock<HandleStore<Outline>> = LazyLock::new(HandleStore::default);

/// Internal page state
pub struct Page {
    pub doc_handle: Handle,
    pub page_num: i32,
    pub bounds: [f32; 4], // x0, y0, x1, y1
}

impl Page {
    pub fn new(doc_handle: Handle, page_num: i32) -> Self {
        Self {
            doc_handle,
            page_num,
            bounds: [0.0, 0.0, 612.0, 792.0], // Default US Letter
        }
    }
}

/// Outline item (bookmark)
pub struct OutlineItem {
    pub title: String,
    pub uri: String,
    pub page: i32,
    pub children: Vec<OutlineItem>,
}

/// Document outline (table of contents)
pub struct Outline {
    pub items: Vec<OutlineItem>,
}

impl Default for Outline {
    fn default() -> Self {
        Self { items: Vec::new() }
    }
}

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

// ============================================================================
// Page Functions
// ============================================================================

/// Load a page from document
#[unsafe(no_mangle)]
pub extern "C" fn fz_load_page(_ctx: Handle, doc: Handle, page_num: i32) -> Handle {
    if DOCUMENTS.get(doc).is_none() {
        return 0;
    }

    // Validate page number
    let page_count = fz_count_pages(_ctx, doc);
    if page_num < 0 || page_num >= page_count {
        return 0;
    }

    PAGES.insert(Page::new(doc, page_num))
}

/// Load page by location (chapter, page)
#[unsafe(no_mangle)]
pub extern "C" fn fz_load_chapter_page(_ctx: Handle, doc: Handle, chapter: i32, page: i32) -> Handle {
    if chapter != 0 {
        return 0; // PDF only has chapter 0
    }
    fz_load_page(_ctx, doc, page)
}

/// Keep (increment ref) page
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_page(_ctx: Handle, page: Handle) -> Handle {
    PAGES.keep(page)
}

/// Drop page reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_page(_ctx: Handle, page: Handle) {
    let _ = PAGES.remove(page);
}

/// Get page bounds
#[unsafe(no_mangle)]
pub extern "C" fn fz_bound_page(_ctx: Handle, page: Handle) -> super::geometry::fz_rect {
    if let Some(p) = PAGES.get(page) {
        if let Ok(guard) = p.lock() {
            return super::geometry::fz_rect {
                x0: guard.bounds[0],
                y0: guard.bounds[1],
                x1: guard.bounds[2],
                y1: guard.bounds[3],
            };
        }
    }
    super::geometry::fz_rect {
        x0: 0.0,
        y0: 0.0,
        x1: 0.0,
        y1: 0.0,
    }
}

/// Get page bounds with specified box type
#[unsafe(no_mangle)]
pub extern "C" fn fz_bound_page_box(_ctx: Handle, page: Handle, _box_type: i32) -> super::geometry::fz_rect {
    fz_bound_page(_ctx, page)
}

// ============================================================================
// Outline Functions
// ============================================================================

/// Load document outline (table of contents)
#[unsafe(no_mangle)]
pub extern "C" fn fz_load_outline(_ctx: Handle, doc: Handle) -> Handle {
    if DOCUMENTS.get(doc).is_none() {
        return 0;
    }

    // For now, return an empty outline
    // Real implementation would parse the PDF outline tree
    OUTLINES.insert(Outline::default())
}

/// Drop outline
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_outline(_ctx: Handle, outline: Handle) {
    let _ = OUTLINES.remove(outline);
}

// ============================================================================
// Link Resolution
// ============================================================================

/// Resolve a link destination to a location
#[unsafe(no_mangle)]
pub extern "C" fn fz_resolve_link(
    _ctx: Handle,
    doc: Handle,
    uri: *const c_char,
    xp: *mut f32,
    yp: *mut f32,
) -> i32 {
    if uri.is_null() || DOCUMENTS.get(doc).is_none() {
        return -1;
    }

    // SAFETY: Caller guarantees uri is a valid null-terminated C string
    #[allow(unsafe_code)]
    let c_str = unsafe { std::ffi::CStr::from_ptr(uri) };
    let uri_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    // Parse page number from URI (e.g., "#page=5" or just "5")
    let page_num = if uri_str.starts_with("#page=") {
        uri_str[6..].parse::<i32>().ok()
    } else if uri_str.starts_with('#') {
        uri_str[1..].parse::<i32>().ok()
    } else {
        uri_str.parse::<i32>().ok()
    };

    match page_num {
        Some(n) => {
            // Set coordinates to top-left of page
            if !xp.is_null() {
                #[allow(unsafe_code)]
                unsafe { *xp = 0.0; }
            }
            if !yp.is_null() {
                #[allow(unsafe_code)]
                unsafe { *yp = 0.0; }
            }
            n
        }
        None => -1,
    }
}

/// Make a URI from a page location
///
/// # Safety
/// Caller must ensure `buf` points to writable memory of at least `size` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_make_location_uri(
    _ctx: Handle,
    _doc: Handle,
    page: i32,
    buf: *mut c_char,
    size: i32,
) -> *mut c_char {
    if buf.is_null() || size <= 0 {
        return std::ptr::null_mut();
    }

    let uri = format!("#page={}", page);
    let uri_bytes = uri.as_bytes();
    let copy_len = (uri_bytes.len()).min((size - 1) as usize);

    #[allow(unsafe_code)]
    unsafe {
        std::ptr::copy_nonoverlapping(uri_bytes.as_ptr(), buf as *mut u8, copy_len);
        *buf.add(copy_len) = 0; // Null terminate
    }

    buf
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

    // ============================================================================
    // Page Tests
    // ============================================================================

    #[test]
    fn test_load_page() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let page_handle = fz_load_page(0, doc_handle, 0);
        assert_ne!(page_handle, 0);

        fz_drop_page(0, page_handle);
        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_load_page_invalid_doc() {
        let page_handle = fz_load_page(0, 0, 0);
        assert_eq!(page_handle, 0);
    }

    #[test]
    fn test_load_page_invalid_page_num() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        // Negative page
        let page1 = fz_load_page(0, doc_handle, -1);
        assert_eq!(page1, 0);

        // Out of bounds
        let page2 = fz_load_page(0, doc_handle, 100);
        assert_eq!(page2, 0);

        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_load_chapter_page() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        // Chapter 0 should work
        let page1 = fz_load_chapter_page(0, doc_handle, 0, 0);
        assert_ne!(page1, 0);

        // Chapter 1 should fail
        let page2 = fz_load_chapter_page(0, doc_handle, 1, 0);
        assert_eq!(page2, 0);

        fz_drop_page(0, page1);
        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_keep_page() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let page_handle = fz_load_page(0, doc_handle, 0);
        let kept = fz_keep_page(0, page_handle);
        assert_eq!(kept, page_handle);

        fz_drop_page(0, page_handle);
        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_bound_page() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let page_handle = fz_load_page(0, doc_handle, 0);
        let bounds = fz_bound_page(0, page_handle);

        // Default US Letter size
        assert!((bounds.x1 - 612.0).abs() < 1.0);
        assert!((bounds.y1 - 792.0).abs() < 1.0);

        fz_drop_page(0, page_handle);
        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_bound_page_invalid() {
        let bounds = fz_bound_page(0, 0);
        assert_eq!(bounds.x0, 0.0);
        assert_eq!(bounds.y0, 0.0);
        assert_eq!(bounds.x1, 0.0);
        assert_eq!(bounds.y1, 0.0);
    }

    // ============================================================================
    // Outline Tests
    // ============================================================================

    #[test]
    fn test_load_outline() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let outline_handle = fz_load_outline(0, doc_handle);
        assert_ne!(outline_handle, 0);

        fz_drop_outline(0, outline_handle);
        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_load_outline_invalid_doc() {
        let outline_handle = fz_load_outline(0, 0);
        assert_eq!(outline_handle, 0);
    }

    // ============================================================================
    // Link Resolution Tests
    // ============================================================================

    #[test]
    fn test_resolve_link() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let mut x: f32 = 0.0;
        let mut y: f32 = 0.0;

        // Test #page=N format
        let result = fz_resolve_link(0, doc_handle, c"#page=5".as_ptr(), &mut x, &mut y);
        assert_eq!(result, 5);

        // Test #N format
        let result2 = fz_resolve_link(0, doc_handle, c"#10".as_ptr(), &mut x, &mut y);
        assert_eq!(result2, 10);

        // Test plain number
        let result3 = fz_resolve_link(0, doc_handle, c"3".as_ptr(), &mut x, &mut y);
        assert_eq!(result3, 3);

        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_resolve_link_invalid() {
        // Null URI
        let result1 = fz_resolve_link(0, 0, std::ptr::null(), std::ptr::null_mut(), std::ptr::null_mut());
        assert_eq!(result1, -1);

        // Invalid doc
        let result2 = fz_resolve_link(0, 0, c"#page=1".as_ptr(), std::ptr::null_mut(), std::ptr::null_mut());
        assert_eq!(result2, -1);
    }

    #[test]
    fn test_resolve_link_invalid_uri() {
        let pdf_data = b"%PDF-1.4\n/Type /Page\n%%EOF";
        let doc = Document::new(pdf_data.to_vec());
        let doc_handle = DOCUMENTS.insert(doc);

        let result = fz_resolve_link(0, doc_handle, c"invalid".as_ptr(), std::ptr::null_mut(), std::ptr::null_mut());
        assert_eq!(result, -1);

        fz_drop_document(0, doc_handle);
    }

    #[test]
    fn test_make_location_uri() {
        let mut buf = [0i8; 32];
        let result = fz_make_location_uri(0, 0, 5, buf.as_mut_ptr(), 32);
        assert!(!result.is_null());

        // Check the generated URI
        #[allow(unsafe_code)]
        let uri = unsafe { std::ffi::CStr::from_ptr(buf.as_ptr()) };
        assert_eq!(uri.to_str().unwrap(), "#page=5");
    }

    #[test]
    fn test_make_location_uri_null_buffer() {
        let result = fz_make_location_uri(0, 0, 5, std::ptr::null_mut(), 32);
        assert!(result.is_null());
    }
}

