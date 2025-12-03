/**
 * NanoPDF C API Header
 *
 * This header defines the C API for the NanoPDF Rust library.
 * The actual implementation is provided by the Rust static library.
 */

#ifndef NANOPDF_H
#define NANOPDF_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Error codes */
typedef enum {
    NANOPDF_OK = 0,
    NANOPDF_ERROR_GENERIC = 1,
    NANOPDF_ERROR_IO = 2,
    NANOPDF_ERROR_FORMAT = 3,
    NANOPDF_ERROR_MEMORY = 4,
    NANOPDF_ERROR_ARGUMENT = 5,
    NANOPDF_ERROR_UNSUPPORTED = 6,
} nanopdf_error_t;

/* Opaque types */
typedef struct nanopdf_buffer nanopdf_buffer_t;
typedef struct nanopdf_document nanopdf_document_t;
typedef struct nanopdf_page nanopdf_page_t;
typedef struct nanopdf_pixmap nanopdf_pixmap_t;

/* Geometry types */
typedef struct {
    float x;
    float y;
} nanopdf_point_t;

typedef struct {
    float x0;
    float y0;
    float x1;
    float y1;
} nanopdf_rect_t;

typedef struct {
    float a, b, c, d, e, f;
} nanopdf_matrix_t;

/* Buffer API */
nanopdf_buffer_t* nanopdf_buffer_new(size_t capacity);
nanopdf_buffer_t* nanopdf_buffer_from_data(const uint8_t* data, size_t len);
void nanopdf_buffer_free(nanopdf_buffer_t* buf);
size_t nanopdf_buffer_len(const nanopdf_buffer_t* buf);
const uint8_t* nanopdf_buffer_data(const nanopdf_buffer_t* buf);
nanopdf_error_t nanopdf_buffer_append(nanopdf_buffer_t* buf, const uint8_t* data, size_t len);

/* Geometry API */
nanopdf_matrix_t nanopdf_matrix_identity(void);
nanopdf_matrix_t nanopdf_matrix_translate(float tx, float ty);
nanopdf_matrix_t nanopdf_matrix_scale(float sx, float sy);
nanopdf_matrix_t nanopdf_matrix_rotate(float degrees);
nanopdf_matrix_t nanopdf_matrix_concat(nanopdf_matrix_t a, nanopdf_matrix_t b);
nanopdf_point_t nanopdf_point_transform(nanopdf_point_t p, nanopdf_matrix_t m);

nanopdf_rect_t nanopdf_rect_empty(void);
nanopdf_rect_t nanopdf_rect_unit(void);
int nanopdf_rect_is_empty(nanopdf_rect_t r);
nanopdf_rect_t nanopdf_rect_union(nanopdf_rect_t a, nanopdf_rect_t b);
nanopdf_rect_t nanopdf_rect_intersect(nanopdf_rect_t a, nanopdf_rect_t b);

/* Version */
const char* nanopdf_version(void);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_H */

