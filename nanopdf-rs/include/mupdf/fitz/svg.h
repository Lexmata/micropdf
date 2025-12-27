/*
 * SVG (Scalable Vector Graphics) FFI
 *
 * Provides support for SVG document format, including DOM parsing,
 * path commands, transformations, filters, and text layout.
 */

#ifndef NANOPDF_FZ_SVG_H
#define NANOPDF_FZ_SVG_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Handle types */
typedef uint64_t fz_context;
typedef uint64_t svg_document;
typedef uint64_t svg_element;
typedef uint64_t fz_stream;
typedef uint64_t fz_output;
typedef uint64_t fz_device;

/* ============================================================================
 * SVG Text Format Constants
 * ============================================================================ */

#define SVG_TEXT_AS_PATH    0
#define SVG_TEXT_AS_TEXT    1

/* ============================================================================
 * SVG Path Command Constants
 * ============================================================================ */

#define SVG_PATH_MOVE           0
#define SVG_PATH_LINE           1
#define SVG_PATH_HLINE          2
#define SVG_PATH_VLINE          3
#define SVG_PATH_CUBIC          4
#define SVG_PATH_SMOOTH_CUBIC   5
#define SVG_PATH_QUAD           6
#define SVG_PATH_SMOOTH_QUAD    7
#define SVG_PATH_ARC            8
#define SVG_PATH_CLOSE          9

/* ============================================================================
 * SVG Element Type Constants
 * ============================================================================ */

#define SVG_ELEM_SVG                0
#define SVG_ELEM_G                  1
#define SVG_ELEM_DEFS               2
#define SVG_ELEM_SYMBOL             3
#define SVG_ELEM_USE                4
#define SVG_ELEM_RECT               5
#define SVG_ELEM_CIRCLE             6
#define SVG_ELEM_ELLIPSE            7
#define SVG_ELEM_LINE               8
#define SVG_ELEM_POLYLINE           9
#define SVG_ELEM_POLYGON            10
#define SVG_ELEM_PATH               11
#define SVG_ELEM_TEXT               12
#define SVG_ELEM_TSPAN              13
#define SVG_ELEM_IMAGE              14
#define SVG_ELEM_LINEAR_GRADIENT    15
#define SVG_ELEM_RADIAL_GRADIENT    16
#define SVG_ELEM_STOP               17
#define SVG_ELEM_CLIPPATH           18
#define SVG_ELEM_MASK               19
#define SVG_ELEM_PATTERN            20
#define SVG_ELEM_FILTER             21
#define SVG_ELEM_UNKNOWN            99

/* ============================================================================
 * SVG Transform Type Constants
 * ============================================================================ */

#define SVG_TRANSFORM_MATRIX        0
#define SVG_TRANSFORM_TRANSLATE     1
#define SVG_TRANSFORM_SCALE         2
#define SVG_TRANSFORM_ROTATE        3
#define SVG_TRANSFORM_SKEWX         4
#define SVG_TRANSFORM_SKEWY         5

/* ============================================================================
 * Document Management
 * ============================================================================ */

/**
 * Create a new SVG document.
 */
svg_document *svg_new_document(fz_context *ctx);

/**
 * Drop an SVG document.
 */
void svg_drop_document(fz_context *ctx, svg_document *doc);

/**
 * Open an SVG document from a file path.
 */
svg_document *svg_open_document(fz_context *ctx, const char *filename);

/**
 * Open an SVG document from a stream.
 */
svg_document *svg_open_document_with_stream(fz_context *ctx, fz_stream *stream);

/* ============================================================================
 * Document Properties
 * ============================================================================ */

/**
 * Get document width.
 */
float svg_get_width(fz_context *ctx, svg_document *doc);

/**
 * Get document height.
 */
float svg_get_height(fz_context *ctx, svg_document *doc);

/**
 * Set document size.
 * @return 1 on success, 0 on failure
 */
int svg_set_size(fz_context *ctx, svg_document *doc, float width, float height);

/**
 * Set viewBox.
 * @return 1 on success, 0 on failure
 */
int svg_set_viewbox(fz_context *ctx, svg_document *doc, float min_x, float min_y, float width, float height);

/**
 * Get viewBox.
 * @return 1 if viewBox is set, 0 if not
 */
int svg_get_viewbox(fz_context *ctx, svg_document *doc, float *min_x, float *min_y, float *width, float *height);

/* ============================================================================
 * Element Management
 * ============================================================================ */

/**
 * Create a new SVG element.
 */
svg_element *svg_new_element(fz_context *ctx, int element_type);

/**
 * Drop an SVG element.
 */
void svg_drop_element(fz_context *ctx, svg_element *elem);

/**
 * Set element ID.
 * @return 1 on success, 0 on failure
 */
int svg_set_element_id(fz_context *ctx, svg_element *elem, const char *id);

/**
 * Get element ID.
 * @return ID (caller must free) or NULL
 */
char *svg_get_element_id(fz_context *ctx, svg_element *elem);

/**
 * Get element type.
 */
int svg_get_element_type(fz_context *ctx, svg_element *elem);

/**
 * Set element attribute.
 * @return 1 on success, 0 on failure
 */
int svg_set_attribute(fz_context *ctx, svg_element *elem, const char *name, const char *value);

/**
 * Get element attribute.
 * @return Value (caller must free) or NULL
 */
char *svg_get_attribute(fz_context *ctx, svg_element *elem, const char *name);

/* ============================================================================
 * Transform
 * ============================================================================ */

/**
 * Set element transform (matrix).
 * @return 1 on success, 0 on failure
 */
int svg_set_transform_matrix(fz_context *ctx, svg_element *elem, float a, float b, float c, float d, float e, float f);

/**
 * Set element transform (translate).
 * @return 1 on success, 0 on failure
 */
int svg_set_transform_translate(fz_context *ctx, svg_element *elem, float tx, float ty);

/**
 * Set element transform (scale).
 * @return 1 on success, 0 on failure
 */
int svg_set_transform_scale(fz_context *ctx, svg_element *elem, float sx, float sy);

/**
 * Set element transform (rotate).
 * @return 1 on success, 0 on failure
 */
int svg_set_transform_rotate(fz_context *ctx, svg_element *elem, float angle, float cx, float cy);

/* ============================================================================
 * Style
 * ============================================================================ */

/**
 * Set fill color.
 * @return 1 on success, 0 on failure
 */
int svg_set_fill(fz_context *ctx, svg_element *elem, uint8_t r, uint8_t g, uint8_t b, uint8_t a);

/**
 * Set stroke color.
 * @return 1 on success, 0 on failure
 */
int svg_set_stroke(fz_context *ctx, svg_element *elem, uint8_t r, uint8_t g, uint8_t b, uint8_t a);

/**
 * Set stroke width.
 * @return 1 on success, 0 on failure
 */
int svg_set_stroke_width(fz_context *ctx, svg_element *elem, float width);

/**
 * Set opacity.
 * @return 1 on success, 0 on failure
 */
int svg_set_opacity(fz_context *ctx, svg_element *elem, float opacity);

/* ============================================================================
 * Path Commands
 * ============================================================================ */

/**
 * Add path command.
 * @return 1 on success, 0 on failure
 */
int svg_add_path_command(fz_context *ctx, svg_element *elem, int cmd, int relative, const float *args, int num_args);

/**
 * Get path command count.
 */
int svg_path_command_count(fz_context *ctx, svg_element *elem);

/* ============================================================================
 * SVG Output Device
 * ============================================================================ */

/**
 * Create SVG output device.
 */
fz_device *svg_new_device(fz_context *ctx, fz_output *output, float page_width, float page_height, int text_format, int reuse_images);

/**
 * Parse SVG device options from string.
 * @return 1 on success, 0 on failure
 */
int svg_parse_device_options(fz_context *ctx, const char *args, int *text_format, int *reuse_images, int *resolution);

/* ============================================================================
 * Color Parsing
 * ============================================================================ */

/**
 * Parse SVG color string (hex or named).
 * @return 1 on success, 0 on failure
 */
int svg_parse_color(fz_context *ctx, const char *str, uint8_t *r, uint8_t *g, uint8_t *b);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * Free a string returned by SVG functions.
 */
void svg_free_string(char *s);

/**
 * Get element type name.
 * @return Name (caller must free) or NULL
 */
char *svg_element_type_name(fz_context *ctx, int element_type);

/**
 * Get path command name.
 * @return Name (caller must free) or NULL
 */
char *svg_path_command_name(fz_context *ctx, int cmd, int relative);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FZ_SVG_H */
