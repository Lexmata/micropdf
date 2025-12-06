/**
 * NanoPDF Go FFI Header
 *
 * Clean C declarations for Go CGO bindings.
 * This provides the core functions needed for the Go wrapper.
 */

#ifndef NANOPDF_FFI_H
#define NANOPDF_FFI_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Type Aliases (Rust types for C/Go)
// ============================================================================

typedef int8_t i8;
typedef int16_t i16;
typedef int32_t i32;
typedef int64_t i64;
typedef uint8_t u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;
typedef size_t usize;
typedef float f32;
typedef double f64;

// ============================================================================
// Geometry Types
// ============================================================================

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

// ============================================================================
// Opaque Handle Types (represented as uint64_t in FFI)
// ============================================================================

typedef uint64_t fz_context;
typedef uint64_t fz_document;
typedef uint64_t fz_page;
typedef uint64_t fz_pixmap;
typedef uint64_t fz_buffer;
typedef uint64_t fz_colorspace;
typedef uint64_t fz_stext_page;
typedef uint64_t fz_link;
typedef uint64_t fz_device;
typedef uint64_t fz_stream;
typedef uint64_t fz_output;
typedef uint64_t fz_font;
typedef uint64_t fz_image;
typedef uint64_t fz_archive;

// ============================================================================
// Constants
// ============================================================================

#define FZ_STORE_DEFAULT (256 * 1024 * 1024)  // 256 MB

// ============================================================================
// Buffer Functions
// ============================================================================

fz_buffer fz_new_buffer(fz_context ctx, size_t capacity);
fz_buffer fz_new_buffer_from_copied_data(fz_context ctx, const unsigned char* data, size_t size);
fz_buffer fz_new_buffer_from_data(fz_context ctx, unsigned char* data, size_t size);
fz_buffer fz_keep_buffer(fz_context ctx, fz_buffer buf);
void fz_drop_buffer(fz_context ctx, fz_buffer buf);
size_t fz_buffer_storage(fz_context ctx, fz_buffer buf, unsigned char** datap);
void fz_append_data(fz_context ctx, fz_buffer buf, const void* data, size_t len);
void fz_append_string(fz_context ctx, fz_buffer buf, const char* str);
void fz_append_byte(fz_context ctx, fz_buffer buf, int c);
void fz_append_buffer(fz_context ctx, fz_buffer buf, fz_buffer src);
void fz_clear_buffer(fz_context ctx, fz_buffer buf);
void fz_resize_buffer(fz_context ctx, fz_buffer buf, size_t size);

// ============================================================================
// Context Functions
// ============================================================================

fz_context fz_new_context(const void* alloc, const void* locks, size_t max_store);
void fz_drop_context(fz_context ctx);
fz_context fz_clone_context(fz_context ctx);

// ============================================================================
// Document Functions
// ============================================================================

fz_document fz_open_document(fz_context ctx, const char* filename);
fz_document fz_open_document_with_buffer(fz_context ctx, const char* magic, const unsigned char* data, size_t len);
void fz_drop_document(fz_context ctx, fz_document doc);
int fz_count_pages(fz_context ctx, fz_document doc);
int fz_needs_password(fz_context ctx, fz_document doc);
int fz_authenticate_password(fz_context ctx, fz_document doc, const char* password);
int fz_has_permission(fz_context ctx, fz_document doc, int permission);
int fz_lookup_metadata(fz_context ctx, fz_document doc, const char* key, char* buf, int size);
void pdf_save_document(fz_context ctx, fz_document doc, const char* filename, const void* opts);
int pdf_lookup_named_dest(fz_context ctx, fz_document doc, const char* name);

// ============================================================================
// Page Functions
// ============================================================================

fz_page fz_load_page(fz_context ctx, fz_document doc, int number);
void fz_drop_page(fz_context ctx, fz_page page);
fz_rect fz_bound_page(fz_context ctx, fz_page page);

// ============================================================================
// Colorspace Functions
// ============================================================================

fz_colorspace fz_device_rgb(fz_context ctx);
fz_colorspace fz_device_gray(fz_context ctx);
fz_colorspace fz_device_cmyk(fz_context ctx);

// ============================================================================
// Matrix Functions
// ============================================================================

fz_matrix fz_identity(void);
fz_matrix fz_scale(float sx, float sy);
fz_matrix fz_translate(float tx, float ty);
fz_matrix fz_rotate(float degrees);
fz_matrix fz_concat(fz_matrix a, fz_matrix b);

// ============================================================================
// Pixmap Functions
// ============================================================================

fz_pixmap fz_new_pixmap_from_page(fz_context ctx, fz_page page, fz_matrix ctm, fz_colorspace cs, int alpha);
void fz_drop_pixmap(fz_context ctx, fz_pixmap pix);
int fz_pixmap_width(fz_context ctx, fz_pixmap pix);
int fz_pixmap_height(fz_context ctx, fz_pixmap pix);
int fz_pixmap_components(fz_context ctx, fz_pixmap pix);
unsigned char* fz_pixmap_samples(fz_context ctx, fz_pixmap pix);

// ============================================================================
// Buffer Functions
// ============================================================================

fz_buffer fz_new_buffer_from_pixmap_as_png(fz_context ctx, fz_pixmap pix, int color_params);
void fz_drop_buffer(fz_context ctx, fz_buffer buf);
const unsigned char* fz_buffer_data(fz_context ctx, fz_buffer buf, size_t* len);

// ============================================================================
// Text Extraction Functions
// ============================================================================

fz_stext_page fz_new_stext_page_from_page(fz_context ctx, fz_page page, const void* options);
void fz_drop_stext_page(fz_context ctx, fz_stext_page stext);
fz_buffer fz_new_buffer_from_stext_page(fz_context ctx, fz_stext_page stext);

// ============================================================================
// Link Functions
// ============================================================================

fz_link fz_load_links(fz_context ctx, fz_page page);
void fz_drop_link(fz_context ctx, fz_link link);
fz_rect fz_link_rect(fz_context ctx, fz_link link);
const char* fz_link_uri(fz_context ctx, fz_link link);
fz_link fz_link_next(fz_context ctx, fz_link link);

// ============================================================================
// Search Functions
// ============================================================================

int fz_search_stext_page(fz_context ctx, fz_stext_page stext, const char* needle, int* mark, fz_quad* hit_bbox, int hit_max);

// ============================================================================
// Font Functions
// ============================================================================

fz_font fz_new_font_from_memory(fz_context ctx, const char* name, const unsigned char* data, int len, int index, int use_glyph_bbox);
fz_font fz_new_font_from_file(fz_context ctx, const char* name, const char* path, int index, int use_glyph_bbox);
void fz_drop_font(fz_context ctx, fz_font font);

// ============================================================================
// Image Functions
// ============================================================================

fz_image fz_new_image_from_buffer(fz_context ctx, fz_buffer buffer);
fz_image fz_new_image_from_file(fz_context ctx, const char* path);
void fz_drop_image(fz_context ctx, fz_image image);
int fz_image_width(fz_context ctx, fz_image image);
int fz_image_height(fz_context ctx, fz_image image);

// ============================================================================
// Archive Functions
// ============================================================================

fz_archive fz_open_archive(fz_context ctx, const char* path);
fz_archive fz_open_archive_with_buffer(fz_context ctx, fz_buffer buffer);
void fz_drop_archive(fz_context ctx, fz_archive arch);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FFI_H */

