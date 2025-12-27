/*
 * CBZ/CBR (Comic Book Archives) FFI
 *
 * Provides support for comic book archive formats, including ZIP-based CBZ
 * and RAR-based CBR, with image sequence handling and ComicInfo.xml metadata.
 */

#ifndef NANOPDF_FZ_CBZ_H
#define NANOPDF_FZ_CBZ_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Handle types */
typedef uint64_t fz_context;
typedef uint64_t cbz_document;
typedef uint64_t fz_stream;
typedef uint64_t fz_archive;

/* ============================================================================
 * Archive Format Constants
 * ============================================================================ */

#define CBZ_FORMAT_CBZ      0   /* ZIP-based */
#define CBZ_FORMAT_CBR      1   /* RAR-based */
#define CBZ_FORMAT_CB7      2   /* 7z-based */
#define CBZ_FORMAT_CBT      3   /* TAR-based */

/* ============================================================================
 * Image Format Constants
 * ============================================================================ */

#define CBZ_IMAGE_JPEG      0
#define CBZ_IMAGE_PNG       1
#define CBZ_IMAGE_GIF       2
#define CBZ_IMAGE_BMP       3
#define CBZ_IMAGE_TIFF      4
#define CBZ_IMAGE_WEBP      5
#define CBZ_IMAGE_JP2       6
#define CBZ_IMAGE_UNKNOWN   99

/* ============================================================================
 * Reading Direction Constants
 * ============================================================================ */

#define CBZ_READ_LTR        0   /* Left-to-right (Western) */
#define CBZ_READ_RTL        1   /* Right-to-left (Manga) */

/* ============================================================================
 * Manga Constants
 * ============================================================================ */

#define CBZ_MANGA_UNKNOWN   0
#define CBZ_MANGA_YES       1
#define CBZ_MANGA_NO        2
#define CBZ_MANGA_YES_RTL   3

/* ============================================================================
 * Document Management
 * ============================================================================ */

/**
 * Create a new CBZ document.
 */
cbz_document *cbz_new_document(fz_context *ctx);

/**
 * Drop a CBZ document.
 */
void cbz_drop_document(fz_context *ctx, cbz_document *doc);

/**
 * Open a CBZ document from a file path.
 */
cbz_document *cbz_open_document(fz_context *ctx, const char *filename);

/**
 * Open a CBZ document from a stream.
 */
cbz_document *cbz_open_document_with_stream(fz_context *ctx, fz_stream *stream);

/**
 * Open a CBZ document from an archive.
 */
cbz_document *cbz_open_document_with_archive(fz_context *ctx, fz_archive *archive);

/* ============================================================================
 * Document Properties
 * ============================================================================ */

/**
 * Get document format.
 */
int cbz_get_format(fz_context *ctx, cbz_document *doc);

/**
 * Get page count.
 */
int cbz_page_count(fz_context *ctx, cbz_document *doc);

/**
 * Add an entry to the document.
 * @return 1 on success, 0 on failure
 */
int cbz_add_entry(fz_context *ctx, cbz_document *doc, const char *name);

/**
 * Sort pages by natural order.
 * @return 1 on success, 0 on failure
 */
int cbz_sort_pages(fz_context *ctx, cbz_document *doc);

/* ============================================================================
 * Page Access
 * ============================================================================ */

/**
 * Get page filename.
 * @return Filename (caller must free) or NULL
 */
char *cbz_get_page_filename(fz_context *ctx, cbz_document *doc, int page_num);

/**
 * Get page image format.
 */
int cbz_get_page_format(fz_context *ctx, cbz_document *doc, int page_num);

/**
 * Get page dimensions.
 * @return 1 if valid, 0 if not
 */
int cbz_get_page_size(fz_context *ctx, cbz_document *doc, int page_num, int *width, int *height);

/**
 * Set page dimensions.
 * @return 1 on success, 0 on failure
 */
int cbz_set_page_size(fz_context *ctx, cbz_document *doc, int page_num, int width, int height);

/**
 * Check if page is double-page spread.
 * @return 1 if double, 0 if single
 */
int cbz_page_is_double(fz_context *ctx, cbz_document *doc, int page_num);

/**
 * Set page double-page spread flag.
 * @return 1 on success, 0 on failure
 */
int cbz_set_page_double(fz_context *ctx, cbz_document *doc, int page_num, int is_double);

/* ============================================================================
 * ComicInfo Metadata
 * ============================================================================ */

/**
 * Get comic title.
 * @return Title (caller must free) or NULL
 */
char *cbz_get_title(fz_context *ctx, cbz_document *doc);

/**
 * Set comic title.
 * @return 1 on success, 0 on failure
 */
int cbz_set_title(fz_context *ctx, cbz_document *doc, const char *title);

/**
 * Get series name.
 * @return Series (caller must free) or NULL
 */
char *cbz_get_series(fz_context *ctx, cbz_document *doc);

/**
 * Set series name.
 * @return 1 on success, 0 on failure
 */
int cbz_set_series(fz_context *ctx, cbz_document *doc, const char *series);

/**
 * Get issue number.
 * @return Number (caller must free) or NULL
 */
char *cbz_get_number(fz_context *ctx, cbz_document *doc);

/**
 * Set issue number.
 * @return 1 on success, 0 on failure
 */
int cbz_set_number(fz_context *ctx, cbz_document *doc, const char *number);

/**
 * Get writer.
 * @return Writer (caller must free) or NULL
 */
char *cbz_get_writer(fz_context *ctx, cbz_document *doc);

/**
 * Set writer.
 * @return 1 on success, 0 on failure
 */
int cbz_set_writer(fz_context *ctx, cbz_document *doc, const char *writer);

/**
 * Get publisher.
 * @return Publisher (caller must free) or NULL
 */
char *cbz_get_publisher(fz_context *ctx, cbz_document *doc);

/**
 * Set publisher.
 * @return 1 on success, 0 on failure
 */
int cbz_set_publisher(fz_context *ctx, cbz_document *doc, const char *publisher);

/**
 * Get publication year.
 * @return Year or 0 if not set
 */
int cbz_get_year(fz_context *ctx, cbz_document *doc);

/**
 * Set publication year.
 * @return 1 on success, 0 on failure
 */
int cbz_set_year(fz_context *ctx, cbz_document *doc, int year);

/**
 * Get manga reading direction.
 */
int cbz_get_manga(fz_context *ctx, cbz_document *doc);

/**
 * Set manga reading direction.
 * @return 1 on success, 0 on failure
 */
int cbz_set_manga(fz_context *ctx, cbz_document *doc, int manga);

/**
 * Get summary.
 * @return Summary (caller must free) or NULL
 */
char *cbz_get_summary(fz_context *ctx, cbz_document *doc);

/**
 * Set summary.
 * @return 1 on success, 0 on failure
 */
int cbz_set_summary(fz_context *ctx, cbz_document *doc, const char *summary);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * Free a string returned by CBZ functions.
 */
void cbz_free_string(char *s);

/**
 * Check if filename is a supported image.
 * @return 1 if image, 0 if not
 */
int cbz_is_image_file(fz_context *ctx, const char *filename);

/**
 * Get format name string.
 * @return Name (caller must free) or NULL
 */
char *cbz_format_name(fz_context *ctx, int format);

/**
 * Get image format name string.
 * @return Name (caller must free) or NULL
 */
char *cbz_image_format_name(fz_context *ctx, int format);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FZ_CBZ_H */
