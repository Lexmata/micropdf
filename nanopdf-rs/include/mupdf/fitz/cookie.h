// NanoPDF - MuPDF API Compatible C Header
// Auto-generated from Rust FFI - DO NOT EDIT MANUALLY
// Module: cookie

#ifndef MUPDF_FITZ_COOKIE_H
#define MUPDF_FITZ_COOKIE_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Cookie Functions (23 total)
// ============================================================================

void fz_abort_cookie(int32_t _ctx, int32_t cookie);
int32_t fz_clone_cookie(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_get_errors(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_get_progress_max(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_has_errors(int32_t _ctx, int32_t cookie);
void fz_cookie_inc_errors(int32_t _ctx, int32_t cookie);
void fz_cookie_inc_progress(int32_t _ctx, int32_t cookie);
int fz_cookie_is_aborted(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_is_complete(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_is_incomplete(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_is_valid(int32_t _ctx, int32_t cookie);
void fz_cookie_progress(int32_t _ctx, int32_t cookie, int * progress, int * progress_max, int * errors);
float fz_cookie_progress_float(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_progress_percent(int32_t _ctx, int32_t cookie);
int32_t fz_cookie_progress_remaining(int32_t _ctx, int32_t cookie);
void fz_cookie_reset(int32_t _ctx, int32_t cookie);
void fz_cookie_set_errors(int32_t _ctx, int32_t cookie, int32_t count);
void fz_cookie_set_incomplete(int32_t _ctx, int32_t cookie, int32_t value);
void fz_cookie_set_progress(int32_t _ctx, int32_t cookie, int32_t value);
void fz_cookie_set_progress_max(int32_t _ctx, int32_t cookie, int32_t value);
void fz_drop_cookie(int32_t _ctx, int32_t cookie);
int32_t fz_new_cookie(int32_t _ctx);
void fz_reset_cookie(int32_t _ctx, int32_t cookie);

#ifdef __cplusplus
}
#endif

#endif /* MUPDF_FITZ_COOKIE_H */
