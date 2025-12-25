"""
FFI bindings to the NanoPDF Rust library.

This module uses cffi to interface with the compiled Rust library.
It defines all the C function signatures and provides a low-level interface.
"""

import os
import sys
from typing import Optional
from cffi import FFI

# Initialize FFI
ffi = FFI()

# Define C structures and function signatures
ffi.cdef("""
    // Type aliases
    typedef int8_t i8;
    typedef int16_t i16;
    typedef int32_t i32;
    typedef int64_t i64;
    typedef uint8_t u8;
    typedef uint16_t u16;
    typedef uint32_t u32;
    typedef uint64_t u64;
    typedef float f32;
    typedef double f64;

    // Geometry structures
    typedef struct {
        float x, y;
    } fz_point;

    typedef struct {
        float x0, y0, x1, y1;
    } fz_rect;

    typedef struct {
        int x0, y0, x1, y1;
    } fz_irect;

    typedef struct {
        float a, b, c, d, e, f;
    } fz_matrix;

    typedef struct {
        fz_point ul, ur, ll, lr;
    } fz_quad;

    // Opaque handle types
    typedef uint64_t fz_context;
    typedef uint64_t fz_document;
    typedef uint64_t fz_page;
    typedef uint64_t fz_pixmap;
    typedef uint64_t fz_buffer;
    typedef uint64_t fz_colorspace;
    typedef uint64_t fz_stext_page;
    typedef uint64_t fz_link;
    typedef uint64_t fz_stream;
    typedef uint64_t fz_output;
    typedef uint64_t fz_font;
    typedef uint64_t fz_image;
    typedef uint64_t fz_cookie;
    typedef uint64_t fz_device_handle;
    typedef uint64_t fz_path;

    // Context functions
    fz_context fz_new_context(const void* alloc, const void* locks, size_t max_store);
    void fz_drop_context(fz_context ctx);
    fz_context fz_clone_context(fz_context ctx);

    // Document functions
    fz_document fz_open_document(fz_context ctx, const char* filename);
    fz_document fz_open_document_with_buffer(fz_context ctx, const char* magic, const unsigned char* data, size_t len);
    void fz_drop_document(fz_context ctx, fz_document doc);
    int fz_count_pages(fz_context ctx, fz_document doc);
    int fz_needs_password(fz_context ctx, fz_document doc);
    int fz_authenticate_password(fz_context ctx, fz_document doc, const char* password);
    int fz_has_permission(fz_context ctx, fz_document doc, int permission);
    int fz_lookup_metadata(fz_context ctx, fz_document doc, const char* key, char* buf, int size);
    void pdf_save_document(fz_context ctx, fz_document doc, const char* filename, const void* opts);

    // Page functions
    fz_page fz_load_page(fz_context ctx, fz_document doc, int number);
    void fz_drop_page(fz_context ctx, fz_page page);
    fz_rect fz_bound_page(fz_context ctx, fz_page page);

    // Colorspace functions
    fz_colorspace fz_device_rgb(fz_context ctx);
    fz_colorspace fz_device_gray(fz_context ctx);
    fz_colorspace fz_device_bgr(fz_context ctx);
    fz_colorspace fz_device_cmyk(fz_context ctx);
    int fz_colorspace_n(fz_context ctx, fz_colorspace cs);
    const char* fz_colorspace_name(fz_context ctx, fz_colorspace cs);

    // Matrix functions
    fz_matrix fz_identity(void);
    fz_matrix fz_scale(float sx, float sy);
    fz_matrix fz_translate(float tx, float ty);
    fz_matrix fz_rotate(float degrees);
    fz_matrix fz_concat(fz_matrix a, fz_matrix b);

    // Pixmap functions
    fz_pixmap fz_new_pixmap(fz_context ctx, fz_colorspace cs, int w, int h, int alpha);
    fz_pixmap fz_new_pixmap_from_page(fz_context ctx, fz_page page, fz_matrix ctm, fz_colorspace cs, int alpha);
    void fz_drop_pixmap(fz_context ctx, fz_pixmap pix);
    int fz_pixmap_width(fz_context ctx, fz_pixmap pix);
    int fz_pixmap_height(fz_context ctx, fz_pixmap pix);
    int fz_pixmap_components(fz_context ctx, fz_pixmap pix);
    int fz_pixmap_stride(fz_context ctx, fz_pixmap pix);
    unsigned char* fz_pixmap_samples(fz_context ctx, fz_pixmap pix);
    void fz_clear_pixmap(fz_context ctx, fz_pixmap pix);

    // Buffer functions
    fz_buffer fz_new_buffer(fz_context ctx, size_t capacity);
    fz_buffer fz_new_buffer_from_copied_data(fz_context ctx, const unsigned char* data, size_t size);
    void fz_drop_buffer(fz_context ctx, fz_buffer buf);
    size_t fz_buffer_storage(fz_context ctx, fz_buffer buf, unsigned char** datap);
    const unsigned char* fz_buffer_data(fz_context ctx, fz_buffer buf, size_t* len);
    void fz_append_data(fz_context ctx, fz_buffer buf, const void* data, size_t len);
    void fz_append_string(fz_context ctx, fz_buffer buf, const char* str);
    void fz_clear_buffer(fz_context ctx, fz_buffer buf);
    fz_buffer fz_new_buffer_from_pixmap_as_png(fz_context ctx, fz_pixmap pix, int color_params);

    // Text extraction functions
    fz_stext_page fz_new_stext_page_from_page(fz_context ctx, fz_page page, const void* options);
    void fz_drop_stext_page(fz_context ctx, fz_stext_page stext);
    fz_buffer fz_new_buffer_from_stext_page(fz_context ctx, fz_stext_page stext);

    // Search functions
    int fz_search_stext_page(fz_context ctx, fz_stext_page stext, const char* needle, int* mark, fz_quad* hit_bbox, int hit_max);

    // Link functions
    fz_link fz_load_links(fz_context ctx, fz_page page);
    void fz_drop_link(fz_context ctx, fz_link link);
    fz_rect fz_link_rect(fz_context ctx, fz_link link);
    const char* fz_link_uri(fz_context ctx, fz_link link);
    fz_link fz_link_next(fz_context ctx, fz_link link);

    // Stream functions
    fz_stream fz_open_file(fz_context ctx, const char* filename);
    fz_stream fz_open_memory(fz_context ctx, const unsigned char* data, size_t len);
    void fz_drop_stream(fz_context ctx, fz_stream stm);
    size_t fz_read(fz_context ctx, fz_stream stm, unsigned char* data, size_t len);
    int fz_read_byte(fz_context ctx, fz_stream stm);
    int fz_is_eof(fz_context ctx, fz_stream stm);
    void fz_seek(fz_context ctx, fz_stream stm, int64_t offset, int whence);
    int64_t fz_tell(fz_context ctx, fz_stream stm);

    // Output functions
    fz_output fz_new_output_with_path(fz_context ctx, const char* filename, int append);
    fz_output fz_new_output_with_buffer(fz_context ctx, fz_buffer buf);
    void fz_drop_output(fz_context ctx, fz_output out);
    void fz_write_data(fz_context ctx, fz_output out, const void* data, size_t size);
    void fz_write_string(fz_context ctx, fz_output out, const char* s);
    void fz_write_byte(fz_context ctx, fz_output out, unsigned char byte);
    int64_t fz_tell_output(fz_context ctx, fz_output out);

    // Font functions
    fz_font fz_new_font(fz_context ctx, const char* name, int is_bold, int is_italic, uint64_t font_file);
    fz_font fz_new_font_from_file(fz_context ctx, const char* name, const char* path, int index, int use_glyph_bbox);
    fz_font fz_new_font_from_memory(fz_context ctx, const char* name, const unsigned char* data, int len, int index, int use_glyph_bbox);
    void fz_drop_font(fz_context ctx, fz_font font);
    void fz_font_name(fz_context ctx, fz_font font, char* buf, int size);
    int fz_font_is_bold(fz_context ctx, fz_font font);
    int fz_font_is_italic(fz_context ctx, fz_font font);

    // Image functions
    fz_image fz_new_image_from_file(fz_context ctx, const char* path);
    fz_image fz_new_image_from_buffer(fz_context ctx, fz_buffer buffer);
    fz_image fz_new_image_from_pixmap(fz_context ctx, fz_pixmap pixmap, fz_image mask);
    void fz_drop_image(fz_context ctx, fz_image image);
    int fz_image_width(fz_context ctx, fz_image image);
    int fz_image_height(fz_context ctx, fz_image image);

    // Cookie functions (progress tracking)
    fz_cookie fz_new_cookie(fz_context ctx);
    void fz_drop_cookie(fz_context ctx, fz_cookie cookie);
    void fz_abort_cookie(fz_context ctx, fz_cookie cookie);
    int fz_cookie_is_aborted(fz_context ctx, fz_cookie cookie);

    // Path functions
    fz_path fz_new_path(fz_context ctx);
    void fz_drop_path(fz_context ctx, fz_path path);
    void fz_moveto(fz_context ctx, fz_path path, float x, float y);
    void fz_lineto(fz_context ctx, fz_path path, float x, float y);
    void fz_curveto(fz_context ctx, fz_path path, float x1, float y1, float x2, float y2, float x3, float y3);
    void fz_closepath(fz_context ctx, fz_path path);
    void fz_rectto(fz_context ctx, fz_path path, float x, float y, float w, float h);
""")

# Constants
FZ_STORE_DEFAULT = 256 * 1024 * 1024  # 256 MB


def _find_library() -> Optional[str]:
    """Find the NanoPDF shared library."""
    # Possible library names
    lib_names = ["libnanopdf.so", "libnanopdf.dylib", "nanopdf.dll", "libnanopdf.a"]

    # Search paths
    search_paths = [
        # Relative to this file
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "nanopdf-rs", "target", "release"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "nanopdf-rs", "target", "debug"),
        # System paths
        "/usr/local/lib",
        "/usr/lib",
        os.path.expanduser("~/.local/lib"),
    ]

    # Platform-specific additions
    if sys.platform == "darwin":
        search_paths.append("/opt/homebrew/lib")

    # Search for library
    for path in search_paths:
        for lib_name in lib_names:
            lib_path = os.path.join(path, lib_name)
            if os.path.exists(lib_path):
                return lib_path

    return None


# Load the library
_lib_path = _find_library()
if _lib_path is None:
    raise ImportError(
        "Could not find libnanopdf library. "
        "Please build the Rust library first: cd nanopdf-rs && cargo build --release"
    )

try:
    lib = ffi.dlopen(_lib_path)
except OSError as e:
    raise ImportError(f"Could not load libnanopdf from {_lib_path}: {e}") from e

__all__ = ["ffi", "lib", "FZ_STORE_DEFAULT"]

