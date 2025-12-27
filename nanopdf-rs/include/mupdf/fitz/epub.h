/*
 * EPUB (Electronic Publication) Document FFI
 *
 * Provides support for EPUB e-book format, including container parsing,
 * OPF manifest handling, navigation (NCX/NAV), and content rendering.
 */

#ifndef NANOPDF_FZ_EPUB_H
#define NANOPDF_FZ_EPUB_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Handle types */
typedef uint64_t fz_context;
typedef uint64_t epub_document;
typedef uint64_t fz_stream;
typedef uint64_t fz_archive;

/* ============================================================================
 * EPUB Version Constants
 * ============================================================================ */

#define EPUB_VERSION_2  2
#define EPUB_VERSION_3  3

/* ============================================================================
 * Reading Direction Constants
 * ============================================================================ */

#define EPUB_DIRECTION_LTR      0
#define EPUB_DIRECTION_RTL      1
#define EPUB_DIRECTION_DEFAULT  2

/* ============================================================================
 * Media Type Constants
 * ============================================================================ */

#define EPUB_MEDIA_XHTML    0
#define EPUB_MEDIA_CSS      1
#define EPUB_MEDIA_IMAGE    2
#define EPUB_MEDIA_FONT     3
#define EPUB_MEDIA_AUDIO    4
#define EPUB_MEDIA_VIDEO    5
#define EPUB_MEDIA_NCX      6
#define EPUB_MEDIA_SVG      7
#define EPUB_MEDIA_JS       8
#define EPUB_MEDIA_SMIL     9
#define EPUB_MEDIA_OTHER    99

/* ============================================================================
 * Document Management
 * ============================================================================ */

/**
 * Create a new EPUB document.
 */
epub_document *epub_new_document(fz_context *ctx);

/**
 * Drop an EPUB document.
 */
void epub_drop_document(fz_context *ctx, epub_document *doc);

/**
 * Open an EPUB document from a file path.
 */
epub_document *epub_open_document(fz_context *ctx, const char *filename);

/**
 * Open an EPUB document from a stream.
 */
epub_document *epub_open_document_with_stream(fz_context *ctx, fz_stream *stream);

/**
 * Open an EPUB document from an archive.
 */
epub_document *epub_open_document_with_archive(fz_context *ctx, fz_archive *archive);

/* ============================================================================
 * Document Properties
 * ============================================================================ */

/**
 * Get EPUB version (2 or 3).
 */
int epub_get_version(fz_context *ctx, epub_document *doc);

/**
 * Set EPUB version.
 * @return 1 on success, 0 on failure
 */
int epub_set_version(fz_context *ctx, epub_document *doc, int version);

/**
 * Get reading direction.
 */
int epub_get_direction(fz_context *ctx, epub_document *doc);

/**
 * Set reading direction.
 * @return 1 on success, 0 on failure
 */
int epub_set_direction(fz_context *ctx, epub_document *doc, int direction);

/* ============================================================================
 * Metadata
 * ============================================================================ */

/**
 * Get book title.
 * @return Title (caller must free) or NULL
 */
char *epub_get_title(fz_context *ctx, epub_document *doc);

/**
 * Set book title.
 * @return 1 on success, 0 on failure
 */
int epub_set_title(fz_context *ctx, epub_document *doc, const char *title);

/**
 * Get creator count.
 */
int epub_get_creator_count(fz_context *ctx, epub_document *doc);

/**
 * Get creator at index.
 * @return Creator name (caller must free) or NULL
 */
char *epub_get_creator(fz_context *ctx, epub_document *doc, int index);

/**
 * Add creator.
 * @return 1 on success, 0 on failure
 */
int epub_add_creator(fz_context *ctx, epub_document *doc, const char *creator);

/**
 * Get language (BCP 47 code).
 * @return Language (caller must free) or NULL
 */
char *epub_get_language(fz_context *ctx, epub_document *doc);

/**
 * Set language.
 * @return 1 on success, 0 on failure
 */
int epub_set_language(fz_context *ctx, epub_document *doc, const char *lang);

/**
 * Get unique identifier.
 * @return Identifier (caller must free) or NULL
 */
char *epub_get_identifier(fz_context *ctx, epub_document *doc);

/**
 * Set identifier.
 * @return 1 on success, 0 on failure
 */
int epub_set_identifier(fz_context *ctx, epub_document *doc, const char *id);

/* ============================================================================
 * Manifest
 * ============================================================================ */

/**
 * Count manifest items.
 */
int epub_manifest_count(fz_context *ctx, epub_document *doc);

/**
 * Add manifest item.
 * @return 1 on success, 0 on failure
 */
int epub_add_manifest_item(fz_context *ctx, epub_document *doc, const char *id, const char *href, const char *media_type);

/**
 * Get manifest item href by ID.
 * @return Href (caller must free) or NULL
 */
char *epub_get_manifest_href(fz_context *ctx, epub_document *doc, const char *id);

/**
 * Get manifest item media type.
 * @return Media type constant or EPUB_MEDIA_OTHER
 */
int epub_get_manifest_media_type(fz_context *ctx, epub_document *doc, const char *id);

/* ============================================================================
 * Spine (Reading Order)
 * ============================================================================ */

/**
 * Count spine items.
 */
int epub_spine_count(fz_context *ctx, epub_document *doc);

/**
 * Add spine item.
 * @param linear 1 for linear, 0 for non-linear
 * @return 1 on success, 0 on failure
 */
int epub_add_spine_item(fz_context *ctx, epub_document *doc, const char *idref, int linear);

/**
 * Get spine item idref.
 * @return Idref (caller must free) or NULL
 */
char *epub_get_spine_idref(fz_context *ctx, epub_document *doc, int index);

/**
 * Check if spine item is linear.
 * @return 1 if linear, 0 if not
 */
int epub_spine_item_is_linear(fz_context *ctx, epub_document *doc, int index);

/* ============================================================================
 * Navigation (Table of Contents)
 * ============================================================================ */

/**
 * Count TOC entries (top level).
 */
int epub_toc_count(fz_context *ctx, epub_document *doc);

/**
 * Add TOC entry.
 * @return 1 on success, 0 on failure
 */
int epub_add_toc_entry(fz_context *ctx, epub_document *doc, const char *id, const char *label, const char *content);

/**
 * Get TOC entry label.
 * @return Label (caller must free) or NULL
 */
char *epub_get_toc_label(fz_context *ctx, epub_document *doc, int index);

/**
 * Get TOC entry content (href).
 * @return Content href (caller must free) or NULL
 */
char *epub_get_toc_content(fz_context *ctx, epub_document *doc, int index);

/* ============================================================================
 * File Access
 * ============================================================================ */

/**
 * Check if file exists.
 * @return 1 if exists, 0 if not
 */
int epub_has_file(fz_context *ctx, epub_document *doc, const char *path);

/**
 * Get file data.
 * @return Pointer to data (owned by document) or NULL
 */
const uint8_t *epub_get_file_data(fz_context *ctx, epub_document *doc, const char *path, size_t *len_out);

/**
 * Add file data.
 * @return 1 on success, 0 on failure
 */
int epub_add_file(fz_context *ctx, epub_document *doc, const char *path, const uint8_t *data, size_t len);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * Free a string returned by EPUB functions.
 */
void epub_free_string(char *s);

/**
 * Get media type string.
 * @return MIME type (caller must free) or NULL
 */
char *epub_media_type_string(fz_context *ctx, int media_type);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FZ_EPUB_H */
