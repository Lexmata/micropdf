// NanoPDF - MuPDF API Compatible C Header
// Auto-generated from Rust FFI - DO NOT EDIT MANUALLY
// Module: display_list

#ifndef MUPDF_FITZ_DISPLAY_LIST_H
#define MUPDF_FITZ_DISPLAY_LIST_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Display_list Functions (11 total)
// ============================================================================

fz_rect fz_bound_display_list(int32_t _ctx, int32_t list);
int32_t fz_clone_display_list(int32_t _ctx, int32_t list);
void fz_display_list_clear(int32_t _ctx, int32_t list);
int32_t fz_display_list_count_commands(int32_t _ctx, int32_t list);
int32_t fz_display_list_is_empty(int32_t _ctx, int32_t list);
int32_t fz_display_list_is_valid(int32_t _ctx, int32_t list);
void fz_drop_display_list(int32_t _ctx, int32_t list);
int32_t fz_new_display_list(int32_t _ctx, fz_rect rect);
int32_t fz_new_display_list_from_page(int32_t _ctx, int32_t page);
void fz_run_display_list(int32_t _ctx, int32_t list, int32_t dev, fz_matrix ctm, fz_rect scissor);
void fz_run_display_list(int32_t _ctx, int32_t list, int32_t _device, fz_matrix _matrix, fz_rect _rect);

#ifdef __cplusplus
}
#endif

#endif /* MUPDF_FITZ_DISPLAY_LIST_H */
