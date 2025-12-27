/*
 * XPS (XML Paper Specification) Document FFI
 *
 * Provides support for Microsoft's XPS document format, including
 * document parsing, page rendering, and content extraction.
 */

#ifndef NANOPDF_FZ_XPS_H
#define NANOPDF_FZ_XPS_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Handle types */
typedef uint64_t fz_context;
typedef uint64_t xps_document;
typedef uint64_t fz_stream;
typedef uint64_t fz_archive;

/* ============================================================================
 * XPS Content Type Constants
 * ============================================================================ */

#define XPS_CONTENT_FIXED_DOC_SEQ   0
#define XPS_CONTENT_FIXED_DOC       1
#define XPS_CONTENT_FIXED_PAGE      2
#define XPS_CONTENT_FONT            3
#define XPS_CONTENT_IMAGE           4
#define XPS_CONTENT_ICC_PROFILE     5
#define XPS_CONTENT_RESOURCE_DICT   6
#define XPS_CONTENT_PRINT_TICKET    7
#define XPS_CONTENT_THUMBNAIL       8

/* ============================================================================
 * XPS Relationship Type Constants
 * ============================================================================ */

#define XPS_REL_CORE_PROPERTIES     0
#define XPS_REL_DIGITAL_SIGNATURE   1
#define XPS_REL_THUMBNAIL           2
#define XPS_REL_PRINT_TICKET        3
#define XPS_REL_RESTRICTED_FONT     4
#define XPS_REL_REQUIRED_RESOURCE   5

/* ============================================================================
 * Document Management
 * ============================================================================ */

/**
 * Create a new XPS document.
 */
xps_document *xps_new_document(fz_context *ctx);

/**
 * Drop an XPS document.
 */
void xps_drop_document(fz_context *ctx, xps_document *doc);

/**
 * Open an XPS document from a file path.
 */
xps_document *xps_open_document(fz_context *ctx, const char *filename);

/**
 * Open an XPS document from a stream.
 */
xps_document *xps_open_document_with_stream(fz_context *ctx, fz_stream *stream);

/**
 * Open an XPS document from an archive (directory).
 */
xps_document *xps_open_document_with_directory(fz_context *ctx, fz_archive *archive);

/* ============================================================================
 * Page Access
 * ============================================================================ */

/**
 * Count pages in the document.
 */
int xps_count_pages(fz_context *ctx, xps_document *doc);

/**
 * Get page dimensions.
 * @return 1 on success, 0 on failure
 */
int xps_get_page_size(fz_context *ctx, xps_document *doc, int page_num, float *width, float *height);

/**
 * Get page name/path.
 * @return Page path (caller must free) or NULL
 */
char *xps_get_page_name(fz_context *ctx, xps_document *doc, int page_num);

/* ============================================================================
 * Document Structure
 * ============================================================================ */

/**
 * Count fixed documents.
 */
int xps_count_documents(fz_context *ctx, xps_document *doc);

/**
 * Get document name.
 * @return Document path (caller must free) or NULL
 */
char *xps_get_document_name(fz_context *ctx, xps_document *doc, int doc_num);

/**
 * Count pages in a specific document.
 */
int xps_count_pages_in_document(fz_context *ctx, xps_document *doc, int doc_num);

/* ============================================================================
 * Part Access
 * ============================================================================ */

/**
 * Check if a part exists.
 * @return 1 if exists, 0 if not
 */
int xps_has_part(fz_context *ctx, xps_document *doc, const char *name);

/**
 * Get part data.
 * @return Pointer to data (owned by document) or NULL
 */
const uint8_t *xps_get_part_data(fz_context *ctx, xps_document *doc, const char *name, size_t *len_out);

/**
 * Get part content type.
 * @return Content type (caller must free) or NULL
 */
char *xps_get_part_content_type(fz_context *ctx, xps_document *doc, const char *name);

/**
 * Add a part to the document.
 * @return 1 on success, 0 on failure
 */
int xps_add_part(fz_context *ctx, xps_document *doc, const char *name, const uint8_t *data, size_t len, const char *content_type);

/* ============================================================================
 * Font Cache
 * ============================================================================ */

/**
 * Lookup a cached font.
 * @return 1 if found, 0 if not
 */
int xps_lookup_font(fz_context *ctx, xps_document *doc, const char *uri);

/**
 * Get font count.
 */
int xps_font_count(fz_context *ctx, xps_document *doc);

/* ============================================================================
 * Link Targets
 * ============================================================================ */

/**
 * Add a link target.
 * @return 1 on success, 0 on failure
 */
int xps_add_target(fz_context *ctx, xps_document *doc, const char *name, int page);

/**
 * Lookup a link target.
 * @return Page number or -1 if not found
 */
int xps_lookup_target(fz_context *ctx, xps_document *doc, const char *name);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * Free a string returned by XPS functions.
 */
void xps_free_string(char *s);

/**
 * Resolve a relative URL.
 * @return 1 on success, 0 on failure
 */
int xps_resolve_url(fz_context *ctx, const char *base_uri, const char *path, char *output, int output_size);

/**
 * Get content type string.
 * @return MIME type (caller must free) or NULL
 */
char *xps_content_type_string(fz_context *ctx, int content_type);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FZ_XPS_H */
