# NanoPDF FFI Implementation Plan

## Objective
Eliminate ALL placeholder implementations and ensure 100% FFI parity with Rust backend.

## Current Status
- **Total FFI Functions in Rust**: 660+
- **TypeScript Files with Placeholders**: 6
  - document.ts (10 placeholders)
  - enhanced.ts (15 placeholders)
  - font.ts (2 placeholders)
  - image.ts (4 placeholders)
  - output.ts (1 placeholder)
  - archive.ts (2 placeholders)

## Implementation Priority

### Phase 1: Core Document Operations (HIGH PRIORITY)
**Files**: document.ts, native.ts
- [ ] fz_open_document_from_memory / fz_open_document
- [ ] fz_load_page / pdf_load_page
- [ ] fz_drop_page
- [ ] fz_bound_page
- [ ] pdf_page_write
- [ ] fz_count_pages
- [ ] Document metadata access
- [ ] Page rendering (fz_run_page, fz_new_bbox_device)
- [ ] PNG encoding (fz_new_pixmap_from_page, fz_save_pixmap_as_png)

### Phase 2: Text & Search (HIGH PRIORITY)
**Files**: document.ts, text.ts, native.ts
- [ ] fz_new_stext_page_from_page
- [ ] fz_search_stext_page
- [ ] fz_copy_selection / fz_highlight_selection
- [ ] Text extraction APIs

### Phase 3: Font Operations (MEDIUM PRIORITY)
**Files**: font.ts, native.ts
- [ ] fz_new_font_from_memory
- [ ] fz_new_font_from_file
- [ ] Font metrics and glyph operations

### Phase 4: Image Operations (MEDIUM PRIORITY)
**Files**: image.ts, native.ts
- [ ] fz_new_image_from_buffer
- [ ] fz_new_image_from_file
- [ ] fz_get_pixmap_from_image
- [ ] fz_scale_pixmap
- [ ] Image format decoders

### Phase 5: Output & Archive (MEDIUM PRIORITY)
**Files**: output.ts, archive.ts, native.ts
- [ ] fz_new_output_with_path
- [ ] fz_write_* functions
- [ ] fz_open_archive
- [ ] Archive entry iteration

### Phase 6: Enhanced API (LOWER PRIORITY)
**Files**: enhanced.ts, native.ts
- [ ] np_add_blank_page
- [ ] np_add_watermark
- [ ] np_draw_line, np_draw_rectangle, np_draw_circle
- [ ] np_merge_pdfs
- [ ] np_split_pdf
- [ ] np_optimize_pdf
- [ ] np_linearize_pdf
- [ ] np_write_pdf

### Phase 7: Authentication & Security
**Files**: document.ts, native.ts
- [ ] pdf_authenticate_password
- [ ] PDF permissions and encryption

## Implementation Strategy

1. **For each module**:
   - Add FFI function declarations to NativeAddon interface
   - Implement actual native calls (or throw clear errors if not bound)
   - Remove all placeholder comments
   - Update implementations to use FFI

2. **Testing Approach**:
   - Keep mock implementations as fallback for development
   - Add environment variable to force FFI usage
   - Update tests to expect FFI behavior

3. **Documentation**:
   - Document which FFI functions each TypeScript method uses
   - Add JSDoc with FFI function names

## Next Steps
1. Start with Phase 1 (Core Document Operations)
2. Implement native bindings one by one
3. Remove placeholders as we implement
4. Test incrementally

