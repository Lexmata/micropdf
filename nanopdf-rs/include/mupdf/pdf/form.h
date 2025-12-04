// NanoPDF - MuPDF API Compatible C Header
// Auto-generated from Rust FFI - DO NOT EDIT MANUALLY
// Module: form

#ifndef MUPDF_PDF_FORM_H
#define MUPDF_PDF_FORM_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Form Functions (36 total)
// ============================================================================

int32_t pdf_clone_field(int32_t _ctx, int32_t field);
int32_t pdf_create_text_field(int32_t _ctx, int32_t _form, const char * name, float x, float y, float width, float height, int32_t max_len);
void pdf_drop_widget(int32_t _ctx, int32_t widget);
int32_t pdf_field_alignment(int32_t _ctx, int32_t field);
void pdf_field_bg_color(int32_t _ctx, int32_t field, float * color);
void pdf_field_clear_selection(int32_t _ctx, int32_t field);
float pdf_field_font_size(int32_t _ctx, int32_t field);
int32_t pdf_field_is_combo(int32_t _ctx, int32_t field);
int32_t pdf_field_is_edit(int32_t _ctx, int32_t field);
int32_t pdf_field_is_multiselect(int32_t _ctx, int32_t field);
int32_t pdf_field_is_valid(int32_t _ctx, int32_t field);
int32_t pdf_field_selected_index(int32_t _ctx, int32_t field);
int32_t pdf_first_widget(int32_t _ctx, int32_t _page);
int32_t pdf_next_widget(int32_t _ctx, int32_t _widget);
int32_t pdf_next_widget(int32_t _ctx, int32_t widget);
int32_t pdf_remove_field_choice(int32_t _ctx, int32_t field, int32_t idx);
void pdf_set_field_alignment(int32_t _ctx, int32_t field, int32_t align);
void pdf_set_field_bg_color(int32_t _ctx, int32_t field, const float * color);
void pdf_set_field_font_size(int32_t _ctx, int32_t field, float size);
int32_t pdf_set_field_selected_index(int32_t _ctx, int32_t field, int32_t idx);
void pdf_set_widget_checked(int32_t _ctx, int32_t widget, int checked);
int pdf_set_widget_value(int32_t _ctx, int32_t widget, const char * value);
int pdf_update_widget(int32_t _ctx, int32_t widget);
int pdf_widget_is_checked(int32_t _ctx, int32_t widget);
int pdf_widget_is_multiline(int32_t _ctx, int32_t widget);
int pdf_widget_is_readonly(int32_t _ctx, int32_t widget);
int pdf_widget_is_required(int32_t _ctx, int32_t widget);
int pdf_widget_is_valid(int32_t _ctx, int32_t widget);
int pdf_widget_max_len(int32_t _ctx, int32_t widget);
void pdf_widget_name(int32_t _ctx, int32_t widget, char * buffer, size_t size);
void pdf_widget_option(int32_t _ctx, int32_t widget, int index, char * buffer, size_t size);
int pdf_widget_option_count(int32_t _ctx, int32_t widget);
fz_rect pdf_widget_rect(int32_t _ctx, int32_t widget);
int pdf_widget_text_format(int32_t _ctx, int32_t widget);
int pdf_widget_type(int32_t _ctx, int32_t widget);
void pdf_widget_value(int32_t _ctx, int32_t widget, char * buffer, size_t size);

#ifdef __cplusplus
}
#endif

#endif /* MUPDF_PDF_FORM_H */
