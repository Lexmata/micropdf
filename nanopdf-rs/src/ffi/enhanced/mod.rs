//! Enhanced FFI - Functions beyond MuPDF API with `np_` prefix
//!
//! This module provides additional PDF manipulation functions that go beyond
//! the MuPDF API, using the `np_` prefix to distinguish them.

use super::Handle;

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

/// Merge multiple PDFs
///
/// # Safety
/// Caller must ensure paths points to an array of valid null-terminated C strings.
#[unsafe(no_mangle)]
pub extern "C" fn np_merge_pdfs(
    _ctx: Handle,
    paths: *const *const std::ffi::c_char,
    count: i32,
    output_path: *const std::ffi::c_char,
) -> i32 {
    if paths.is_null() || output_path.is_null() || count <= 0 {
        return -1;
    }
    // Placeholder - would use PdfMerger
    0
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
        assert_eq!(np_merge_pdfs(0, std::ptr::null(), 0, c"out.pdf".as_ptr()), -1);
    }

    #[test]
    fn test_split_pdf_null_path() {
        assert_eq!(np_split_pdf(0, std::ptr::null(), c"/tmp".as_ptr()), -1);
    }

    #[test]
    fn test_add_watermark_null_text() {
        assert_eq!(
            np_add_watermark(0, c"in.pdf".as_ptr(), c"out.pdf".as_ptr(), std::ptr::null(), 0.0, 0.0, 12.0, 0.5),
            -1
        );
    }

    #[test]
    fn test_add_watermark_invalid_opacity() {
        assert_eq!(
            np_add_watermark(0, c"in.pdf".as_ptr(), c"out.pdf".as_ptr(), c"TEST".as_ptr(), 0.0, 0.0, 12.0, 1.5),
            -1
        );
    }

    #[test]
    fn test_draw_line_invalid_color() {
        assert_eq!(np_draw_line(0, 0, 0.0, 0.0, 100.0, 100.0, 1.5, 0.5, 0.5, 1.0, 1.0), -1);
    }

    #[test]
    fn test_draw_rectangle_invalid_dimensions() {
        assert_eq!(np_draw_rectangle(0, 0, 0.0, 0.0, -10.0, 100.0, 0.5, 0.5, 0.5, 1.0, 1), -1);
    }

    #[test]
    fn test_draw_circle_invalid_radius() {
        assert_eq!(np_draw_circle(0, 0, 50.0, 50.0, -10.0, 0.5, 0.5, 0.5, 1.0, 1), -1);
    }
}
