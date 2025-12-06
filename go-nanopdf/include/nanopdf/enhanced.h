// NanoPDF - Enhanced/Extended Functions
// Auto-generated from Rust FFI - DO NOT EDIT MANUALLY
// Module: enhanced
//
// These are NanoPDF-specific extensions beyond MuPDF compatibility.
// All functions are prefixed with np_* to distinguish from MuPDF functions.

#ifndef NANOPDF_ENHANCED_H
#define NANOPDF_ENHANCED_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Enhanced Functions (10 total)
// ============================================================================

int32_t np_add_blank_page(int32_t _ctx, int32_t _doc, float width, float height);
int32_t np_add_watermark(int32_t _ctx, const char * input_path, const char * output_path, const char * text, float _x, float _y, float font_size, float opacity);
int32_t np_draw_circle(int32_t _ctx, int32_t _page, float _x, float _y, float radius, float r, float g, float b, float alpha, int32_t _fill);
int32_t np_draw_line(int32_t _ctx, int32_t _page, float _x0, float _y0, float _x1, float _y1, float r, float g, float b, float alpha, float line_width);
int32_t np_draw_rectangle(int32_t _ctx, int32_t _page, float _x, float _y, float width, float height, float r, float g, float b, float alpha, int32_t _fill);
int32_t np_linearize_pdf(int32_t _ctx, const char * input_path, const char * output_path);
int32_t np_merge_pdfs(int32_t _ctx, const char * paths, int32_t count, const char * output_path);
int32_t np_optimize_pdf(int32_t _ctx, const char * path);
int32_t np_split_pdf(int32_t _ctx, const char * input_path, const char * output_dir);
int32_t np_write_pdf(int32_t _ctx, int32_t _doc, const char * _path);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_ENHANCED_H */
