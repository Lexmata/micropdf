// NanoPDF - MuPDF API Compatible C Header
// Auto-generated from Rust FFI - DO NOT EDIT MANUALLY
// Module: device

#ifndef MUPDF_FITZ_DEVICE_H
#define MUPDF_FITZ_DEVICE_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Device Functions (6 total)
// ============================================================================

void fz_begin_page(int32_t _ctx, int32_t device, fz_rect _rect);
void fz_close_device(int32_t _ctx, int32_t device);
void fz_drop_device(int32_t _ctx, int32_t device);
void fz_end_page(int32_t _ctx, int32_t device);
int32_t fz_new_draw_device(int32_t _ctx, int32_t pixmap);
int32_t fz_new_list_device(int32_t _ctx, int32_t list);

#ifdef __cplusplus
}
#endif

#endif /* MUPDF_FITZ_DEVICE_H */
