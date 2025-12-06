/**
 * Minimal MuPDF C Header
 *
 * Clean C-compatible declarations for only the functions we need.
 * This bypasses the auto-generated headers that contain Rust syntax.
 */

#ifndef MUPDF_MINIMAL_H
#define MUPDF_MINIMAL_H

#include "nanopdf/types.h"

#ifdef __cplusplus
extern "C" {
#endif

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
// Opaque Handle Types (all represented as int32_t in FFI)
// ============================================================================

typedef int32_t fz_context;
typedef int32_t fz_document;
typedef int32_t fz_page;
typedef int32_t fz_pixmap;
typedef int32_t fz_buffer;
typedef int32_t fz_colorspace;
typedef int32_t fz_stext_page;
typedef int32_t fz_link;
typedef int32_t fz_device;
typedef int32_t fz_stream;
typedef int32_t fz_output;
typedef int32_t fz_font;
typedef int32_t fz_image;
typedef int32_t fz_archive;

// ============================================================================
// Context Functions
// ============================================================================

#define FZ_STORE_DEFAULT 256 * 1024 * 1024  // 256 MB

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

// PDF-specific document functions
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

fz_matrix fz_identity();
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
size_t fz_buffer_storage(fz_context ctx, fz_buffer buf, const unsigned char** data);
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

#endif /* MUPDF_MINIMAL_H */

