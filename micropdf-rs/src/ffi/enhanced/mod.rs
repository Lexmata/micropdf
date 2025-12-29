//! Enhanced FFI - Functions beyond MuPDF API with `np_` prefix
//!
//! This module provides additional PDF manipulation functions that go beyond
//! the MuPDF API, using the `np_` prefix to distinguish them.

use super::Handle;
use crate::enhanced::page_ops;
use std::ffi::CStr;

/// Write PDF to file
///
/// # Safety
/// Caller must ensure path is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn np_write_pdf(_ctx: Handle, _doc: Handle, _path: *const std::ffi::c_char) -> i32 {
    // Placeholder for PDF writing functionality
    // This would use the enhanced PdfWriter
    0
}

/// Add blank page to PDF
#[unsafe(no_mangle)]
pub extern "C" fn np_add_blank_page(_ctx: Handle, _doc: Handle, width: f32, height: f32) -> i32 {
    if width <= 0.0 || height <= 0.0 {
        return -1;
    }
    // Placeholder - would use PdfWriter::add_blank_page
    0
}

/// Merge multiple PDFs into a single output file
///
/// # Arguments
/// * `_ctx` - Context handle (currently unused)
/// * `paths` - Pointer to array of null-terminated C string paths
/// * `count` - Number of PDF paths in the array
/// * `output_path` - Null-terminated C string path for merged output
///
/// # Returns
/// * Number of pages in the merged PDF on success
/// * -1 on error (invalid inputs, missing files, merge failure)
///
/// # Safety
/// Caller must ensure:
/// * `paths` points to an array of at least `count` valid C string pointers
/// * Each path pointer in the array points to a valid null-terminated C string
/// * `output_path` points to a valid null-terminated C string
/// * All pointed-to memory remains valid for the duration of the call
///
/// # Example
/// ```c
/// const char* inputs[] = {"doc1.pdf", "doc2.pdf", "doc3.pdf"};
/// int page_count = np_merge_pdfs(ctx, inputs, 3, "merged.pdf");
/// if (page_count > 0) {
///     printf("Merged %d pages\n", page_count);
/// }
/// ```
#[unsafe(no_mangle)]
pub extern "C" fn np_merge_pdfs(
    _ctx: Handle,
    paths: *const *const std::ffi::c_char,
    count: i32,
    output_path: *const std::ffi::c_char,
) -> i32 {
    // Validate inputs
    if paths.is_null() || output_path.is_null() || count <= 0 {
        eprintln!("np_merge_pdfs: Invalid parameters");
        return -1;
    }

    // Convert C strings to Rust Strings
    let mut input_paths = Vec::with_capacity(count as usize);

    for i in 0..count {
        // SAFETY: We check that paths is not null and i is within bounds
        let path_ptr = unsafe { *paths.offset(i as isize) };

        if path_ptr.is_null() {
            eprintln!("np_merge_pdfs: Null path at index {}", i);
            return -1;
        }

        // SAFETY: We validated path_ptr is not null
        let path_str = match unsafe { CStr::from_ptr(path_ptr) }.to_str() {
            Ok(s) => s.to_string(),
            Err(e) => {
                eprintln!("np_merge_pdfs: Invalid UTF-8 in path {}: {}", i, e);
                return -1;
            }
        };

        input_paths.push(path_str);
    }

    // Convert output path
    // SAFETY: We validated output_path is not null
    let output_str = match unsafe { CStr::from_ptr(output_path) }.to_str() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("np_merge_pdfs: Invalid UTF-8 in output path: {}", e);
            return -1;
        }
    };

    // Perform the merge
    match page_ops::merge_pdf(&input_paths, output_str) {
        Ok(page_count) => page_count as i32,
        Err(e) => {
            eprintln!("np_merge_pdfs: Merge failed: {}", e);
            -1
        }
    }
}

/// Split PDF into separate files
///
/// # Safety
/// Caller must ensure input_path and output_dir are valid null-terminated C strings.
#[unsafe(no_mangle)]
pub extern "C" fn np_split_pdf(
    _ctx: Handle,
    input_path: *const std::ffi::c_char,
    output_dir: *const std::ffi::c_char,
) -> i32 {
    if input_path.is_null() || output_dir.is_null() {
        return -1;
    }
    // Placeholder - would use split_pdf function
    0
}

/// Add watermark to PDF pages
///
/// # Safety
/// Caller must ensure all string parameters are valid null-terminated C strings.
#[unsafe(no_mangle)]
pub extern "C" fn np_add_watermark(
    _ctx: Handle,
    input_path: *const std::ffi::c_char,
    output_path: *const std::ffi::c_char,
    text: *const std::ffi::c_char,
    _x: f32,
    _y: f32,
    font_size: f32,
    opacity: f32,
) -> i32 {
    if input_path.is_null() || output_path.is_null() || text.is_null() {
        return -1;
    }

    if font_size <= 0.0 || !(0.0..=1.0).contains(&opacity) {
        return -1;
    }

    // Placeholder - would use Watermark::apply
    0
}

/// Optimize PDF (compress, remove duplicates, etc.)
///
/// # Safety
/// Caller must ensure path is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn np_optimize_pdf(_ctx: Handle, path: *const std::ffi::c_char) -> i32 {
    if path.is_null() {
        return -1;
    }
    // Placeholder - would use optimization functions
    0
}

/// Linearize PDF for fast web viewing
///
/// # Safety
/// Caller must ensure path is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn np_linearize_pdf(
    _ctx: Handle,
    input_path: *const std::ffi::c_char,
    output_path: *const std::ffi::c_char,
) -> i32 {
    if input_path.is_null() || output_path.is_null() {
        return -1;
    }
    // Placeholder - would use linearize function
    0
}

/// Draw line on PDF page
#[unsafe(no_mangle)]
pub extern "C" fn np_draw_line(
    _ctx: Handle,
    _page: Handle,
    _x0: f32,
    _y0: f32,
    _x1: f32,
    _y1: f32,
    r: f32,
    g: f32,
    b: f32,
    alpha: f32,
    line_width: f32,
) -> i32 {
    if !(0.0..=1.0).contains(&r) || !(0.0..=1.0).contains(&g) || !(0.0..=1.0).contains(&b) {
        return -1;
    }

    if !(0.0..=1.0).contains(&alpha) {
        return -1;
    }

    if line_width <= 0.0 {
        return -1;
    }

    // Placeholder - would use DrawingContext::draw_line
    0
}

/// Draw rectangle on PDF page
#[unsafe(no_mangle)]
pub extern "C" fn np_draw_rectangle(
    _ctx: Handle,
    _page: Handle,
    _x: f32,
    _y: f32,
    width: f32,
    height: f32,
    r: f32,
    g: f32,
    b: f32,
    alpha: f32,
    _fill: i32,
) -> i32 {
    if width <= 0.0 || height <= 0.0 {
        return -1;
    }

    if !(0.0..=1.0).contains(&r) || !(0.0..=1.0).contains(&g) || !(0.0..=1.0).contains(&b) {
        return -1;
    }

    if !(0.0..=1.0).contains(&alpha) {
        return -1;
    }

    // Placeholder - would use DrawingContext::draw_rect
    0
}

/// Draw circle on PDF page
#[unsafe(no_mangle)]
pub extern "C" fn np_draw_circle(
    _ctx: Handle,
    _page: Handle,
    _x: f32,
    _y: f32,
    radius: f32,
    r: f32,
    g: f32,
    b: f32,
    alpha: f32,
    _fill: i32,
) -> i32 {
    if radius <= 0.0 {
        return -1;
    }

    if !(0.0..=1.0).contains(&r) || !(0.0..=1.0).contains(&g) || !(0.0..=1.0).contains(&b) {
        return -1;
    }

    if !(0.0..=1.0).contains(&alpha) {
        return -1;
    }

    // Placeholder - would use DrawingContext::draw_circle
    0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_blank_page_invalid_dimensions() {
        assert_eq!(np_add_blank_page(0, 0, -10.0, 100.0), -1);
        assert_eq!(np_add_blank_page(0, 0, 100.0, 0.0), -1);
    }

    #[test]
    fn test_merge_pdfs_null_paths() {
        assert_eq!(
            np_merge_pdfs(0, std::ptr::null(), 0, c"out.pdf".as_ptr()),
            -1
        );
    }

    #[test]
    fn test_split_pdf_null_path() {
        assert_eq!(np_split_pdf(0, std::ptr::null(), c"/tmp".as_ptr()), -1);
    }

    #[test]
    fn test_add_watermark_null_text() {
        assert_eq!(
            np_add_watermark(
                0,
                c"in.pdf".as_ptr(),
                c"out.pdf".as_ptr(),
                std::ptr::null(),
                0.0,
                0.0,
                12.0,
                0.5
            ),
            -1
        );
    }

    #[test]
    fn test_add_watermark_invalid_opacity() {
        assert_eq!(
            np_add_watermark(
                0,
                c"in.pdf".as_ptr(),
                c"out.pdf".as_ptr(),
                c"TEST".as_ptr(),
                0.0,
                0.0,
                12.0,
                1.5
            ),
            -1
        );
    }

    #[test]
    fn test_draw_line_invalid_color() {
        assert_eq!(
            np_draw_line(0, 0, 0.0, 0.0, 100.0, 100.0, 1.5, 0.5, 0.5, 1.0, 1.0),
            -1
        );
    }

    #[test]
    fn test_draw_rectangle_invalid_dimensions() {
        assert_eq!(
            np_draw_rectangle(0, 0, 0.0, 0.0, -10.0, 100.0, 0.5, 0.5, 0.5, 1.0, 1),
            -1
        );
    }

    #[test]
    fn test_draw_circle_invalid_radius() {
        assert_eq!(
            np_draw_circle(0, 0, 50.0, 50.0, -10.0, 0.5, 0.5, 0.5, 1.0, 1),
            -1
        );
    }
}
