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
// fz_pixmap is defined later with specific functions
typedef int32_t fz_buffer;
typedef int32_t fz_stext_page;
typedef int32_t fz_link;
typedef int32_t fz_archive;

// Forward declarations for types defined later with specific functions
typedef uint64_t fz_colorspace;
typedef uint64_t fz_device;
typedef uint64_t fz_font;
typedef uint64_t fz_stream;
typedef uint64_t fz_output;

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
// Matrix Functions
// ============================================================================

fz_matrix fz_identity();
fz_matrix fz_scale(float sx, float sy);
fz_matrix fz_translate(float tx, float ty);
fz_matrix fz_rotate(float degrees);
fz_matrix fz_concat(fz_matrix a, fz_matrix b);

// ============================================================================
// Buffer Functions
// ============================================================================

// fz_new_buffer_from_pixmap_as_png is declared after fz_pixmap typedef
void fz_drop_buffer(fz_context ctx, fz_buffer buf);
size_t fz_buffer_storage(fz_context ctx, fz_buffer buf, const unsigned char** data);
const unsigned char* fz_buffer_data(fz_context ctx, fz_buffer buf, size_t* len);

// ============================================================================
// Text Extraction Functions
// ============================================================================

fz_stext_page fz_new_stext_page_from_page(fz_context ctx, fz_page page, const void* options);
void fz_drop_stext_page(fz_context ctx, fz_stext_page stext);
fz_buffer fz_new_buffer_from_stext_page(fz_context ctx, fz_stext_page stext);
fz_rect fz_bound_stext_page(fz_context ctx, fz_stext_page stext);

// ============================================================================
// Search Functions
// ============================================================================

int fz_search_stext_page(fz_context ctx, fz_stext_page stext, const char* needle, int* mark, fz_quad* hit_bbox, int hit_max);

// ============================================================================
// Archive Functions
// ============================================================================

fz_archive fz_open_archive(fz_context ctx, const char* path);
fz_archive fz_open_archive_with_buffer(fz_context ctx, fz_buffer buffer);
void fz_drop_archive(fz_context ctx, fz_archive arch);

// ============================================================================
// Annotation Functions
// ============================================================================

typedef int32_t pdf_annot;

pdf_annot pdf_create_annot(fz_context ctx, fz_page page, int type);
void pdf_delete_annot(fz_context ctx, fz_page page, pdf_annot annot);
void pdf_drop_annot(fz_context ctx, pdf_annot annot);

int pdf_annot_type(fz_context ctx, pdf_annot annot);
fz_rect pdf_annot_rect(fz_context ctx, pdf_annot annot);
void pdf_set_annot_rect(fz_context ctx, pdf_annot annot, fz_rect rect);

unsigned int pdf_annot_flags(fz_context ctx, pdf_annot annot);
void pdf_set_annot_flags(fz_context ctx, pdf_annot annot, unsigned int flags);

void pdf_annot_contents(fz_context ctx, pdf_annot annot, char* buf, int size);
void pdf_set_annot_contents(fz_context ctx, pdf_annot annot, const char* text);

void pdf_annot_author(fz_context ctx, pdf_annot annot, char* buf, int size);
void pdf_set_annot_author(fz_context ctx, pdf_annot annot, const char* author);

float pdf_annot_opacity(fz_context ctx, pdf_annot annot);
void pdf_set_annot_opacity(fz_context ctx, pdf_annot annot, float opacity);

int pdf_annot_has_dirty(fz_context ctx, pdf_annot annot);
void pdf_annot_clear_dirty(fz_context ctx, pdf_annot annot);
int pdf_update_annot(fz_context ctx, pdf_annot annot);

pdf_annot pdf_clone_annot(fz_context ctx, pdf_annot annot);
int pdf_annot_is_valid(fz_context ctx, pdf_annot annot);

// ============================================================================
// Display List Functions
// ============================================================================

typedef uint64_t fz_display_list_handle;

fz_display_list_handle fz_new_display_list(fz_context ctx, fz_rect rect);
void fz_drop_display_list(fz_context ctx, fz_display_list_handle list);
fz_rect fz_bound_display_list(fz_context ctx, fz_display_list_handle list);
void fz_run_display_list(fz_context ctx, fz_display_list_handle list, fz_device device, fz_matrix matrix, fz_rect rect);
fz_display_list_handle fz_new_display_list_from_page(fz_context ctx, fz_page page);

// ============================================================================
// Colorspace Functions
// ============================================================================

typedef uint64_t fz_colorspace_handle;

uint64_t fz_device_gray(fz_context ctx);
uint64_t fz_device_rgb(fz_context ctx);
uint64_t fz_device_bgr(fz_context ctx);
uint64_t fz_device_cmyk(fz_context ctx);
int fz_colorspace_n(fz_context ctx, fz_colorspace_handle cs);
const char* fz_colorspace_name(fz_context ctx, fz_colorspace_handle cs);

// ============================================================================
// Font Functions
// ============================================================================

typedef uint64_t fz_font;

fz_font fz_new_font(fz_context ctx, const char* name, int is_bold, int is_italic, uint64_t font_file);
fz_font fz_new_font_from_file(fz_context ctx, const char* name, const char* path, int index, int use_glyph_bbox);
fz_font fz_new_font_from_memory(fz_context ctx, const char* name, const unsigned char* data, int len, int index, int use_glyph_bbox);
void fz_drop_font(fz_context ctx, fz_font font);
void fz_font_name(fz_context ctx, fz_font font, char* buf, int size);
int fz_font_is_bold(fz_context ctx, fz_font font);
int fz_font_is_italic(fz_context ctx, fz_font font);
int fz_encode_character(fz_context ctx, fz_font font, int unicode);
float fz_advance_glyph(fz_context ctx, fz_font font, int glyph, int wmode);

// ============================================================================
// Stream Functions
// ============================================================================

fz_stream fz_open_file(fz_context ctx, const char* filename);
fz_stream fz_open_memory(fz_context ctx, const unsigned char* data, size_t len);
void fz_drop_stream(fz_context ctx, fz_stream stm);
size_t fz_read(fz_context ctx, fz_stream stm, unsigned char* data, size_t len);
int fz_read_byte(fz_context ctx, fz_stream stm);
int fz_is_eof(fz_context ctx, fz_stream stm);
void fz_seek(fz_context ctx, fz_stream stm, int64_t offset, int whence);
int64_t fz_tell(fz_context ctx, fz_stream stm);

// ============================================================================
// Output Functions
// ============================================================================

fz_output fz_new_output_with_path(fz_context ctx, const char* filename, int append);
fz_output fz_new_output_with_buffer(fz_context ctx, uint64_t buf);
void fz_drop_output(fz_context ctx, fz_output out);
void fz_write_data(fz_context ctx, fz_output out, const void* data, size_t size);
void fz_write_string(fz_context ctx, fz_output out, const char* s);
void fz_write_byte(fz_context ctx, fz_output out, unsigned char byte);
void fz_close_output(fz_context ctx, fz_output out);
int64_t fz_tell_output(fz_context ctx, fz_output out);

// ============================================================================
// Image Functions
// ============================================================================

typedef uint64_t fz_image;

fz_image fz_new_image_from_file(fz_context ctx, const char* filename);
fz_image fz_new_image_from_buffer_data(fz_context ctx, const uint8_t* data, size_t len);
void fz_drop_image(fz_context ctx, fz_image image);
int fz_image_width(fz_context ctx, fz_image image);
int fz_image_height(fz_context ctx, fz_image image);
uint64_t fz_image_colorspace(fz_context ctx, fz_image image);
// fz_get_pixmap_from_image is declared after fz_pixmap typedef

// ============================================================================
// Pixmap Functions
// ============================================================================

typedef uint64_t fz_pixmap;

// Legacy page-to-pixmap function (compatibility)
fz_pixmap fz_new_pixmap_from_page(fz_context ctx, fz_page page, fz_matrix ctm, fz_colorspace cs, int alpha);

// Core pixmap functions
fz_pixmap fz_new_pixmap(fz_context ctx, uint64_t colorspace, int w, int h, int alpha);
void fz_drop_pixmap(fz_context ctx, fz_pixmap pixmap);
int fz_pixmap_width(fz_context ctx, fz_pixmap pixmap);
int fz_pixmap_height(fz_context ctx, fz_pixmap pixmap);
void fz_pixmap_samples(fz_context ctx, fz_pixmap pixmap, uint8_t** data, size_t* size);
unsigned char* fz_pixmap_samples_old(fz_context ctx, fz_pixmap pix);
size_t fz_pixmap_stride(fz_context ctx, fz_pixmap pixmap);
int fz_pixmap_components(fz_context ctx, fz_pixmap pixmap);
void fz_clear_pixmap(fz_context ctx, fz_pixmap pixmap, int value);

// Pixmap-to-buffer conversion
fz_buffer fz_new_buffer_from_pixmap_as_png(fz_context ctx, fz_pixmap pix, int color_params);

// Image-to-pixmap conversion (needs fz_image and fz_pixmap defined)
fz_pixmap fz_get_pixmap_from_image(fz_context ctx, fz_image image, const fz_irect* subarea, fz_matrix* ctm, int* w, int* h);

// ============================================================================
// Path Functions
// ============================================================================

typedef uint64_t fz_path_handle;
typedef uint64_t fz_stroke_handle;

fz_path_handle fz_new_path(fz_context ctx);
void fz_drop_path(fz_context ctx, fz_path_handle path);
void fz_moveto(fz_context ctx, fz_path_handle path, float x, float y);
void fz_lineto(fz_context ctx, fz_path_handle path, float x, float y);
void fz_curveto(fz_context ctx, fz_path_handle path, float x1, float y1, float x2, float y2, float x3, float y3);
void fz_closepath(fz_context ctx, fz_path_handle path);
void fz_rectto(fz_context ctx, fz_path_handle path, float x, float y, float w, float h);
fz_rect fz_bound_path(fz_context ctx, fz_path_handle path, fz_stroke_handle stroke);

// ============================================================================
// Device Functions
// ============================================================================

typedef uint64_t fz_device_handle;

fz_device_handle fz_new_draw_device(fz_context ctx, fz_pixmap pixmap);
fz_device_handle fz_new_list_device(fz_context ctx, fz_display_list_handle list);
void fz_drop_device(fz_context ctx, fz_device_handle device);
void fz_close_device(fz_context ctx, fz_device_handle device);
void fz_begin_page(fz_context ctx, fz_device_handle device, fz_rect rect);
void fz_end_page(fz_context ctx, fz_device_handle device);

// ============================================================================
// Cookie Functions
// ============================================================================

typedef uint64_t fz_cookie_handle;

fz_cookie_handle fz_new_cookie(fz_context ctx);
void fz_drop_cookie(fz_context ctx, fz_cookie_handle cookie);
void fz_abort_cookie(fz_context ctx, fz_cookie_handle cookie);
void fz_cookie_progress(fz_context ctx, fz_cookie_handle cookie, int* progress, int* progress_max, int* errors);
int fz_cookie_is_aborted(fz_context ctx, fz_cookie_handle cookie);
void fz_reset_cookie(fz_context ctx, fz_cookie_handle cookie);

// ============================================================================
// Link Functions
// ============================================================================

typedef uint64_t fz_link_handle;

fz_link_handle fz_load_links(fz_context ctx, fz_page page);
fz_link_handle fz_next_link(fz_context ctx, fz_link_handle link);
void fz_drop_link(fz_context ctx, fz_link_handle link);
fz_rect fz_link_rect(fz_context ctx, fz_link_handle link);
void fz_link_uri(fz_context ctx, fz_link_handle link, char* buf, int size);
int fz_link_is_external(fz_context ctx, fz_link_handle link);
int fz_resolve_link_page(fz_context ctx, fz_document doc, fz_link_handle link);
int fz_link_is_valid(fz_context ctx, fz_link_handle link);

// ============================================================================
// Form Widget Functions
// ============================================================================

typedef uint64_t pdf_widget;

// Widget navigation
pdf_widget pdf_first_widget(fz_context ctx, fz_page page);
pdf_widget pdf_next_widget(fz_context ctx, pdf_widget widget);
void pdf_drop_widget(fz_context ctx, pdf_widget widget);

// Widget properties
int pdf_widget_type(fz_context ctx, pdf_widget widget);
void pdf_widget_name(fz_context ctx, pdf_widget widget, char* buf, int size);
fz_rect pdf_widget_rect(fz_context ctx, pdf_widget widget);

// Widget values
void pdf_widget_value(fz_context ctx, pdf_widget widget, char* buf, int size);
int pdf_set_widget_value(fz_context ctx, pdf_widget widget, const char* value);

// Widget state
int pdf_widget_is_readonly(fz_context ctx, pdf_widget widget);
int pdf_widget_is_required(fz_context ctx, pdf_widget widget);
int pdf_widget_is_valid(fz_context ctx, pdf_widget widget);

// Text field specific
int pdf_widget_text_format(fz_context ctx, pdf_widget widget);
int pdf_widget_max_len(fz_context ctx, pdf_widget widget);
int pdf_widget_is_multiline(fz_context ctx, pdf_widget widget);

// Checkbox/radio specific
int pdf_widget_is_checked(fz_context ctx, pdf_widget widget);
void pdf_set_widget_checked(fz_context ctx, pdf_widget widget, int checked);

// Choice field specific
int pdf_widget_option_count(fz_context ctx, pdf_widget widget);
void pdf_widget_option(fz_context ctx, pdf_widget widget, int index, char* buf, int size);

// Widget updates
int pdf_update_widget(fz_context ctx, pdf_widget widget);

#ifdef __cplusplus
}
#endif

#endif /* MUPDF_MINIMAL_H */

