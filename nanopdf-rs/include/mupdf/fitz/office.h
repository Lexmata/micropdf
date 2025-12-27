/*
 * Office Document Formats FFI
 *
 * Provides support for Microsoft Office Open XML formats (DOCX, XLSX, PPTX)
 * and OpenDocument formats (ODT, ODS, ODP). These formats are ZIP-based
 * archives containing XML content.
 */

#ifndef NANOPDF_FZ_OFFICE_H
#define NANOPDF_FZ_OFFICE_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Handle types */
typedef uint64_t fz_context;
typedef uint64_t office_document;

/* ============================================================================
 * Document Type Constants
 * ============================================================================ */

#define OFFICE_TYPE_DOCX        0   /* Microsoft Word */
#define OFFICE_TYPE_XLSX        1   /* Microsoft Excel */
#define OFFICE_TYPE_PPTX        2   /* Microsoft PowerPoint */
#define OFFICE_TYPE_ODT         3   /* OpenDocument Text */
#define OFFICE_TYPE_ODS         4   /* OpenDocument Spreadsheet */
#define OFFICE_TYPE_ODP         5   /* OpenDocument Presentation */
#define OFFICE_TYPE_UNKNOWN     99

/* ============================================================================
 * Content Type Constants
 * ============================================================================ */

#define OFFICE_CONTENT_PARAGRAPH    0
#define OFFICE_CONTENT_TABLE        1
#define OFFICE_CONTENT_IMAGE        2
#define OFFICE_CONTENT_HEADING      3
#define OFFICE_CONTENT_LIST         4
#define OFFICE_CONTENT_PAGE_BREAK   5
#define OFFICE_CONTENT_SECTION_BREAK 6
#define OFFICE_CONTENT_DRAWING      7
#define OFFICE_CONTENT_CHART        8
#define OFFICE_CONTENT_HYPERLINK    9
#define OFFICE_CONTENT_CELL         10
#define OFFICE_CONTENT_ROW          11
#define OFFICE_CONTENT_SLIDE        12
#define OFFICE_CONTENT_RUN          13

/* ============================================================================
 * Text Alignment Constants
 * ============================================================================ */

#define OFFICE_ALIGN_LEFT       0
#define OFFICE_ALIGN_CENTER     1
#define OFFICE_ALIGN_RIGHT      2
#define OFFICE_ALIGN_JUSTIFY    3

/* ============================================================================
 * Cell Type Constants
 * ============================================================================ */

#define OFFICE_CELL_EMPTY       0
#define OFFICE_CELL_STRING      1
#define OFFICE_CELL_NUMBER      2
#define OFFICE_CELL_BOOLEAN     3
#define OFFICE_CELL_FORMULA     4
#define OFFICE_CELL_ERROR       5
#define OFFICE_CELL_DATE        6

/* ============================================================================
 * Document Management
 * ============================================================================ */

/**
 * Create a new office document.
 */
office_document *office_new_document(fz_context *ctx, int doc_type);

/**
 * Create a new DOCX document.
 */
office_document *office_new_docx(fz_context *ctx);

/**
 * Create a new XLSX document.
 */
office_document *office_new_xlsx(fz_context *ctx);

/**
 * Create a new PPTX document.
 */
office_document *office_new_pptx(fz_context *ctx);

/**
 * Drop an office document.
 */
void office_drop_document(fz_context *ctx, office_document *doc);

/**
 * Open an office document from a file path.
 */
office_document *office_open_document(fz_context *ctx, const char *filename);

/* ============================================================================
 * Document Properties
 * ============================================================================ */

/**
 * Get document type.
 */
int office_get_type(fz_context *ctx, office_document *doc);

/**
 * Get page/slide count.
 */
int office_page_count(fz_context *ctx, office_document *doc);

/**
 * Get page dimensions.
 * @return 1 on success, 0 on failure
 */
int office_get_page_size(fz_context *ctx, office_document *doc, float *width, float *height);

/**
 * Set page dimensions.
 * @return 1 on success, 0 on failure
 */
int office_set_page_size(fz_context *ctx, office_document *doc, float width, float height);

/* ============================================================================
 * Metadata
 * ============================================================================ */

/**
 * Get document title.
 * @return Title (caller must free) or NULL
 */
char *office_get_title(fz_context *ctx, office_document *doc);

/**
 * Set document title.
 * @return 1 on success, 0 on failure
 */
int office_set_title(fz_context *ctx, office_document *doc, const char *title);

/**
 * Get document creator/author.
 * @return Creator (caller must free) or NULL
 */
char *office_get_creator(fz_context *ctx, office_document *doc);

/**
 * Set document creator/author.
 * @return 1 on success, 0 on failure
 */
int office_set_creator(fz_context *ctx, office_document *doc, const char *creator);

/* ============================================================================
 * DOCX Content
 * ============================================================================ */

/**
 * Add paragraph to document.
 * @return 1 on success, 0 on failure
 */
int office_add_paragraph(fz_context *ctx, office_document *doc, const char *text);

/**
 * Add heading to document.
 * @param level Heading level (1-9)
 * @return 1 on success, 0 on failure
 */
int office_add_heading(fz_context *ctx, office_document *doc, const char *text, int level);

/**
 * Get content element count.
 */
int office_content_count(fz_context *ctx, office_document *doc);

/* ============================================================================
 * XLSX Sheets
 * ============================================================================ */

/**
 * Add sheet to spreadsheet.
 * @return Sheet index (0-based) or -1 on failure
 */
int office_add_sheet(fz_context *ctx, office_document *doc, const char *name);

/**
 * Get sheet count.
 */
int office_sheet_count(fz_context *ctx, office_document *doc);

/**
 * Get sheet name.
 * @return Sheet name (caller must free) or NULL
 */
char *office_get_sheet_name(fz_context *ctx, office_document *doc, int sheet_idx);

/**
 * Set cell string value.
 * @return 1 on success, 0 on failure
 */
int office_set_cell_string(fz_context *ctx, office_document *doc, int sheet_idx, int row, int col, const char *value);

/**
 * Set cell number value.
 * @return 1 on success, 0 on failure
 */
int office_set_cell_number(fz_context *ctx, office_document *doc, int sheet_idx, int row, int col, double value);

/**
 * Get cell value as string.
 * @return Cell value (caller must free) or NULL
 */
char *office_get_cell_string(fz_context *ctx, office_document *doc, int sheet_idx, int row, int col);

/* ============================================================================
 * PPTX Slides
 * ============================================================================ */

/**
 * Add slide to presentation.
 * @return Slide number (1-based) or -1 on failure
 */
int office_add_slide(fz_context *ctx, office_document *doc);

/**
 * Get slide count.
 */
int office_slide_count(fz_context *ctx, office_document *doc);

/**
 * Set slide title.
 * @param slide_num Slide number (1-based)
 * @return 1 on success, 0 on failure
 */
int office_set_slide_title(fz_context *ctx, office_document *doc, int slide_num, const char *title);

/**
 * Get slide title.
 * @param slide_num Slide number (1-based)
 * @return Title (caller must free) or NULL
 */
char *office_get_slide_title(fz_context *ctx, office_document *doc, int slide_num);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * Free a string returned by office functions.
 */
void office_free_string(char *s);

/**
 * Get document type name.
 * @return Type name (caller must free) or NULL
 */
char *office_type_name(fz_context *ctx, int doc_type);

/**
 * Get file extension for document type.
 * @return Extension (caller must free) or NULL
 */
char *office_type_extension(fz_context *ctx, int doc_type);

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_FZ_OFFICE_H */
