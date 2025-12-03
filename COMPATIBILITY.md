# NanoPDF / MuPDF Compatibility Report

> **Last Updated:** December 2024
> **MuPDF Reference Version:** 1.26.3
> **NanoPDF Version:** 0.1.0

## Executive Summary

| Metric | Status |
|--------|--------|
| **Overall API Coverage** | 42% |
| **Fitz (Core) Modules** | 14/53 (26%) |
| **PDF Modules** | 4/19 (21%) |
| **C Header Files** | 17/72 (24%) |
| **FFI Functions Implemented** | ~195 |

---

## Module-by-Module Compatibility

### Fitz (Core) Layer

| MuPDF Module | NanoPDF Status | Coverage | Notes |
|--------------|----------------|----------|-------|
| `geometry.h` | ✅ Complete | 100% | Point, Rect, IRect, Matrix, Quad |
| `buffer.h` | ✅ Complete | 100% | Memory buffers, MD5 |
| `stream.h` | ✅ Complete | 100% | I/O streams, seek, read |
| `context.h` | ✅ Complete | 100% | Context management, error handling |
| `color.h` | ✅ Complete | 100% | Colorspaces, conversion |
| `pixmap.h` | ✅ Complete | 100% | Pixel buffers, manipulation |
| `document.h` | ⚠️ Partial | 85% | Document, page loading, outlines |
| `device.h` | ⚠️ Partial | 30% | Device trait defined |
| `font.h` | ⚠️ Partial | 20% | Basic font structures |
| `path.h` | ⚠️ Partial | 20% | Path primitives |
| `text.h` | ⚠️ Partial | 20% | Text span structures |
| `image.h` | ⚠️ Partial | 30% | Image loading basics |
| `link.h` | ⚠️ Partial | 30% | Link resolution |
| `outline.h` | ⚠️ Partial | 40% | Outline loading |
| `version.h` | ✅ Complete | 100% | Version macros |
| `system.h` | ✅ Complete | 100% | System definitions |
| `archive.h` | ❌ Not Started | 0% | |
| `band-writer.h` | ❌ Not Started | 0% | |
| `barcode.h` | ❌ Not Started | 0% | |
| `bidi.h` | ❌ Not Started | 0% | |
| `bitmap.h` | ❌ Not Started | 0% | |
| `compress.h` | ❌ Not Started | 0% | |
| `compressed-buffer.h` | ❌ Not Started | 0% | |
| `config.h` | ❌ Not Started | 0% | |
| `crypt.h` | ❌ Not Started | 0% | |
| `deskew.h` | ❌ Not Started | 0% | |
| `display-list.h` | ❌ Not Started | 0% | |
| `export.h` | ❌ Not Started | 0% | |
| `filter.h` | ❌ Not Started | 0% | |
| `getopt.h` | ❌ Not Started | 0% | |
| `glyph-cache.h` | ❌ Not Started | 0% | |
| `glyph.h` | ❌ Not Started | 0% | |
| `hash.h` | ❌ Not Started | 0% | |
| `heap.h` | ❌ Not Started | 0% | |
| `json.h` | ❌ Not Started | 0% | |
| `log.h` | ❌ Not Started | 0% | |
| `output.h` | ❌ Not Started | 0% | |
| `output-svg.h` | ❌ Not Started | 0% | |
| `pool.h` | ❌ Not Started | 0% | |
| `separation.h` | ❌ Not Started | 0% | |
| `shade.h` | ❌ Not Started | 0% | |
| `store.h` | ❌ Not Started | 0% | |
| `story.h` | ❌ Not Started | 0% | |
| `story-writer.h` | ❌ Not Started | 0% | |
| `string-util.h` | ❌ Not Started | 0% | |
| `structured-text.h` | ❌ Not Started | 0% | |
| `transition.h` | ❌ Not Started | 0% | |
| `tree.h` | ❌ Not Started | 0% | |
| `types.h` | ❌ Not Started | 0% | |
| `util.h` | ❌ Not Started | 0% | |
| `write-pixmap.h` | ❌ Not Started | 0% | |
| `writer.h` | ❌ Not Started | 0% | |
| `xml.h` | ❌ Not Started | 0% | |

### PDF Layer

| MuPDF Module | NanoPDF Status | Coverage | Notes |
|--------------|----------------|----------|-------|
| `object.h` | ⚠️ Partial | 75% | 85 of ~120 functions implemented |
| `document.h` | ⚠️ Partial | 40% | PDF document handling |
| `xref.h` | ⚠️ Partial | 50% | Cross-reference tables |
| `crypt.h` | ⚠️ Partial | 40% | RC4, AES encryption |
| `font.h` | ⚠️ Partial | 30% | PDF font handling |
| `cmap.h` | ⚠️ Partial | 30% | Character maps |
| `annot.h` | ⚠️ Partial | 20% | Annotations |
| `form.h` | ⚠️ Partial | 20% | Interactive forms |
| `page.h` | ⚠️ Stub | 10% | Page handling |
| `parse.h` | ⚠️ Partial | 50% | PDF parsing |
| `interpret.h` | ⚠️ Partial | 20% | Content stream interpretation |
| `clean.h` | ❌ Not Started | 0% | |
| `event.h` | ❌ Not Started | 0% | |
| `image-rewriter.h` | ❌ Not Started | 0% | |
| `javascript.h` | ❌ Not Started | 0% | |
| `name-table.h` | ❌ Not Started | 0% | |
| `recolor.h` | ❌ Not Started | 0% | |
| `resource.h` | ❌ Not Started | 0% | |
| `zugferd.h` | ❌ Not Started | 0% | |

---

## FFI Function Coverage

### Geometry (`fz_geometry.h`)

| Function | Status |
|----------|--------|
| `fz_make_point` | ✅ |
| `fz_make_rect` | ✅ |
| `fz_make_irect` | ✅ |
| `fz_make_matrix` | ✅ |
| `fz_rect_from_irect` | ✅ |
| `fz_irect_from_rect` | ✅ |
| `fz_round_rect` | ✅ |
| `fz_intersect_rect` | ✅ |
| `fz_intersect_irect` | ✅ |
| `fz_union_rect` | ✅ |
| `fz_translate` | ✅ |
| `fz_scale` | ✅ |
| `fz_rotate` | ✅ |
| `fz_shear` | ✅ |
| `fz_concat` | ✅ |
| `fz_invert_matrix` | ✅ |
| `fz_transform_point` | ✅ |
| `fz_transform_rect` | ✅ |
| `fz_normalize_vector` | ✅ |
| `fz_is_empty_rect` | ✅ |
| `fz_is_infinite_rect` | ✅ |
| `fz_contains_rect` | ✅ |
| `fz_quad_from_rect` | ✅ |
| `fz_rect_from_quad` | ✅ |
| `fz_transform_quad` | ✅ |
| `fz_is_point_inside_rect` | ✅ |
| `fz_is_point_inside_quad` | ✅ |

### Context (`fz_context.h`)

| Function | Status |
|----------|--------|
| `fz_new_context` | ✅ |
| `fz_drop_context` | ✅ |
| `fz_clone_context` | ✅ |
| `fz_set_user_context` | ✅ |
| `fz_user_context` | ✅ |
| `fz_caught` | ✅ |
| `fz_caught_message` | ✅ |
| `fz_try` / `fz_catch` | N/A (Rust uses `Result`) |
| `fz_throw` | N/A (Rust uses `Result`) |
| `fz_rethrow` | N/A (Rust uses `Result`) |
| `fz_warn` | ❌ |
| `fz_flush_warnings` | ❌ |

### Buffer (`fz_buffer.h`)

| Function | Status |
|----------|--------|
| `fz_new_buffer` | ✅ |
| `fz_new_buffer_from_data` | ✅ |
| `fz_new_buffer_from_shared_data` | ✅ |
| `fz_keep_buffer` | ✅ |
| `fz_drop_buffer` | ✅ |
| `fz_buffer_storage` | ✅ |
| `fz_buffer_len` | ✅ |
| `fz_buffer_data` | ✅ |
| `fz_resize_buffer` | ✅ |
| `fz_grow_buffer` | ✅ |
| `fz_trim_buffer` | ✅ |
| `fz_clear_buffer` | ✅ |
| `fz_append_buffer` | ✅ |
| `fz_append_byte` | ✅ |
| `fz_append_string` | ✅ |
| `fz_append_data` | ✅ |
| `fz_md5_buffer` | ✅ |
| `fz_append_int16_le` | ✅ |
| `fz_append_int32_le` | ✅ |
| `fz_append_int16_be` | ✅ |
| `fz_append_int32_be` | ✅ |
| `fz_append_bits` | ✅ |
| `fz_append_bits_pad` | ✅ |
| `fz_append_pdf_string` | ✅ |
| `fz_append_buffer` | ✅ |

### Stream (`fz_stream.h`)

| Function | Status |
|----------|--------|
| `fz_open_file` | ✅ |
| `fz_open_memory` | ✅ |
| `fz_open_buffer` | ✅ |
| `fz_drop_stream` | ✅ |
| `fz_read_byte` | ✅ |
| `fz_peek_byte` | ✅ |
| `fz_read` | ✅ |
| `fz_read_all` | ✅ |
| `fz_read_line` | ✅ |
| `fz_skip` | ✅ |
| `fz_tell` | ✅ |
| `fz_seek` | ✅ |
| `fz_is_eof` | ✅ |
| `fz_read_uint16` | ✅ |
| `fz_read_uint24` | ✅ |
| `fz_read_uint32` | ✅ |
| `fz_read_int16_le` | ✅ |
| `fz_read_int32_le` | ✅ |
| `fz_read_uint16_le` | ✅ |
| `fz_read_uint32_le` | ✅ |
| `fz_read_bits` | ✅ |
| `fz_sync_bits` | ✅ |

### Colorspace (`fz_color.h`)

| Function | Status |
|----------|--------|
| `fz_device_gray` | ✅ |
| `fz_device_rgb` | ✅ |
| `fz_device_bgr` | ✅ |
| `fz_device_cmyk` | ✅ |
| `fz_device_lab` | ✅ |
| `fz_keep_colorspace` | ✅ |
| `fz_drop_colorspace` | ✅ |
| `fz_colorspace_n` | ✅ |
| `fz_colorspace_is_gray` | ✅ |
| `fz_colorspace_is_rgb` | ✅ |
| `fz_colorspace_is_cmyk` | ✅ |
| `fz_colorspace_is_lab` | ✅ |
| `fz_colorspace_is_device` | ✅ |
| `fz_colorspace_name` | ✅ |
| `fz_convert_color` | ✅ |
| `fz_colorspace_is_indexed` | ✅ |
| `fz_colorspace_is_device_n` | ✅ |
| `fz_colorspace_is_subtractive` | ✅ |
| `fz_new_indexed_colorspace` | ✅ |
| `fz_new_device_n_colorspace` | ✅ |
| `fz_new_icc_colorspace` | ✅ |
| `fz_colorspace_base` | ✅ |
| `fz_colorspace_high` | ✅ |

### Pixmap (`fz_pixmap.h`)

| Function | Status |
|----------|--------|
| `fz_new_pixmap` | ✅ |
| `fz_new_pixmap_with_bbox` | ✅ |
| `fz_keep_pixmap` | ✅ |
| `fz_drop_pixmap` | ✅ |
| `fz_pixmap_width` | ✅ |
| `fz_pixmap_height` | ✅ |
| `fz_pixmap_x` | ✅ |
| `fz_pixmap_y` | ✅ |
| `fz_pixmap_components` | ✅ |
| `fz_pixmap_colorants` | ✅ |
| `fz_pixmap_alpha` | ✅ |
| `fz_pixmap_stride` | ✅ |
| `fz_pixmap_samples` | ✅ |
| `fz_pixmap_bbox` | ✅ |
| `fz_pixmap_colorspace` | ✅ |
| `fz_clear_pixmap` | ✅ |
| `fz_clear_pixmap_with_value` | ✅ |
| `fz_get_pixmap_sample` | ✅ |
| `fz_set_pixmap_sample` | ✅ |
| `fz_invert_pixmap` | ✅ |
| `fz_gamma_pixmap` | ✅ |
| `fz_clone_pixmap` | ✅ |
| `fz_convert_pixmap` | ✅ |
| `fz_tint_pixmap` | ✅ |
| `fz_set_pixmap_resolution` | ✅ |
| `fz_pixmap_resolution` | ✅ |
| `fz_new_pixmap_from_page` | ❌ |

### Document (`fz_document.h`)

| Function | Status |
|----------|--------|
| `fz_open_document` | ✅ |
| `fz_drop_document` | ✅ |
| `fz_keep_document` | ✅ |
| `fz_count_pages` | ✅ |
| `fz_authenticate_password` | ✅ |
| `fz_has_permission` | ✅ |
| `fz_needs_password` | ✅ |
| `fz_load_page` | ✅ |
| `fz_load_chapter_page` | ✅ |
| `fz_keep_page` | ✅ |
| `fz_drop_page` | ✅ |
| `fz_bound_page` | ✅ |
| `fz_bound_page_box` | ✅ |
| `fz_load_outline` | ✅ |
| `fz_drop_outline` | ✅ |
| `fz_lookup_metadata` | ✅ |
| `fz_resolve_link` | ✅ |
| `fz_make_location_uri` | ✅ |

### PDF Object (`pdf_object.h`)

| Function | Status |
|----------|--------|
| `pdf_new_null` | ✅ |
| `pdf_new_bool` | ✅ |
| `pdf_new_int` | ✅ |
| `pdf_new_real` | ✅ |
| `pdf_new_name` | ✅ |
| `pdf_new_string` | ✅ |
| `pdf_new_text_string` | ✅ |
| `pdf_new_indirect` | ✅ |
| `pdf_new_array` | ✅ |
| `pdf_new_dict` | ✅ |
| `pdf_keep_obj` | ✅ |
| `pdf_drop_obj` | ✅ |
| `pdf_is_null` | ✅ |
| `pdf_is_bool` | ✅ |
| `pdf_is_int` | ✅ |
| `pdf_is_real` | ✅ |
| `pdf_is_number` | ✅ |
| `pdf_is_name` | ✅ |
| `pdf_is_string` | ✅ |
| `pdf_is_array` | ✅ |
| `pdf_is_dict` | ✅ |
| `pdf_is_indirect` | ✅ |
| `pdf_is_stream` | ✅ |
| `pdf_to_bool` | ✅ |
| `pdf_to_int` | ✅ |
| `pdf_to_int64` | ✅ |
| `pdf_to_real` | ✅ |
| `pdf_to_name` | ✅ |
| `pdf_to_num` | ✅ |
| `pdf_to_gen` | ✅ |
| `pdf_to_bool_default` | ✅ |
| `pdf_to_int_default` | ✅ |
| `pdf_to_real_default` | ✅ |
| `pdf_array_len` | ✅ |
| `pdf_array_push` | ✅ |
| `pdf_array_push_int` | ✅ |
| `pdf_array_push_real` | ✅ |
| `pdf_array_push_bool` | ✅ |
| `pdf_array_delete` | ✅ |
| `pdf_dict_len` | ✅ |
| `pdf_dict_puts` | ✅ |
| `pdf_dict_dels` | ✅ |
| `pdf_dict_put_int` | ✅ |
| `pdf_dict_put_real` | ✅ |
| `pdf_dict_put_bool` | ✅ |
| `pdf_obj_marked` | ✅ |
| `pdf_mark_obj` | ✅ |
| `pdf_unmark_obj` | ✅ |
| `pdf_obj_is_dirty` | ✅ |
| `pdf_dirty_obj` | ✅ |
| `pdf_clean_obj` | ✅ |
| `pdf_set_obj_parent` | ✅ |
| `pdf_obj_parent_num` | ✅ |
| `pdf_obj_refs` | ✅ |
| `pdf_objcmp` | ✅ |
| `pdf_name_eq` | ✅ |
| `pdf_new_point` | ✅ |
| `pdf_new_rect` | ✅ |
| `pdf_new_matrix` | ✅ |
| `pdf_new_date` | ✅ |
| `pdf_copy_array` | ✅ |
| `pdf_copy_dict` | ✅ |
| `pdf_deep_copy_obj` | ✅ |
| `pdf_array_get` | ✅ |
| `pdf_array_put` | ✅ |
| `pdf_array_insert` | ✅ |
| `pdf_array_push_name` | ✅ |
| `pdf_array_push_string` | ✅ |
| `pdf_dict_get` | ✅ |
| `pdf_dict_gets` | ✅ |
| `pdf_dict_put` | ✅ |
| `pdf_dict_put_name` | ✅ |
| `pdf_dict_put_string` | ✅ |
| `pdf_dict_get_key` | ✅ |
| `pdf_dict_get_val` | ✅ |
| `pdf_to_string` | ✅ |
| `pdf_to_str_buf` | ✅ |
| `pdf_to_str_len` | ✅ |

---

## Feature Support Matrix

### PDF Versions

| Version | Read | Write |
|---------|------|-------|
| PDF 1.0 | ⚠️ Partial | ❌ |
| PDF 1.1 | ⚠️ Partial | ❌ |
| PDF 1.2 | ⚠️ Partial | ❌ |
| PDF 1.3 | ⚠️ Partial | ❌ |
| PDF 1.4 | ⚠️ Partial | ❌ |
| PDF 1.5 | ⚠️ Partial | ❌ |
| PDF 1.6 | ⚠️ Partial | ❌ |
| PDF 1.7 | ⚠️ Partial | ❌ |
| PDF 2.0 | ❌ | ❌ |

### Compression Filters

| Filter | Decode | Encode |
|--------|--------|--------|
| FlateDecode | ✅ | ✅ |
| LZWDecode | ✅ | ❌ |
| ASCII85Decode | ✅ | ✅ |
| ASCIIHexDecode | ✅ | ✅ |
| RunLengthDecode | ✅ | ❌ |
| CCITTFaxDecode | ⚠️ Partial | ❌ |
| DCTDecode (JPEG) | ✅ | ❌ |
| JPXDecode (JPEG2000) | ⚠️ Optional | ❌ |
| JBIG2Decode | ❌ | ❌ |
| Crypt | ⚠️ Partial | ❌ |

### Encryption

| Algorithm | Decrypt | Encrypt |
|-----------|---------|---------|
| RC4 40-bit | ✅ | ❌ |
| RC4 128-bit | ✅ | ❌ |
| AES 128-bit | ⚠️ Partial | ❌ |
| AES 256-bit | ⚠️ Partial | ❌ |
| Public Key | ❌ | ❌ |

### Content Features

| Feature | Read | Write |
|---------|------|-------|
| Text Extraction | ⚠️ Partial | N/A |
| Images | ⚠️ Partial | ❌ |
| Vector Graphics | ⚠️ Partial | ❌ |
| Fonts (Type1) | ⚠️ Partial | ❌ |
| Fonts (TrueType) | ⚠️ Partial | ❌ |
| Fonts (CFF) | ❌ | ❌ |
| Transparency | ⚠️ Partial | ❌ |
| Patterns | ❌ | ❌ |
| Shadings | ❌ | ❌ |
| Color Management | ⚠️ Basic | ❌ |

### Interactive Features

| Feature | Read | Write |
|---------|------|-------|
| Annotations | ⚠️ Partial | ❌ |
| Form Fields | ⚠️ Partial | ❌ |
| JavaScript | ❌ | ❌ |
| Embedded Files | ❌ | ❌ |
| Digital Signatures | ❌ | ❌ |
| Bookmarks/Outlines | ⚠️ Partial | ❌ |
| Named Destinations | ⚠️ Partial | ❌ |

### Document Formats (MuPDF supports multiple)

| Format | NanoPDF Support |
|--------|-----------------|
| PDF | ⚠️ Primary Focus |
| XPS | ❌ |
| EPUB | ❌ |
| MOBI | ❌ |
| FB2 | ❌ |
| CBZ | ❌ |
| SVG | ❌ |
| Images | ❌ |

---

## Rendering Capabilities

| Capability | Status |
|------------|--------|
| Rasterization to Pixmap | ⚠️ Basic |
| Anti-aliasing | ❌ |
| Subpixel rendering | ❌ |
| Color management | ⚠️ Basic |
| Overprint simulation | ❌ |
| Display lists | ❌ |
| Text device | ❌ |
| SVG output | ❌ |
| PDF output | ❌ |

---

## Platform Support

| Platform | MuPDF | NanoPDF |
|----------|-------|---------|
| Linux x86_64 | ✅ | ✅ |
| Linux ARM64 | ✅ | ✅ |
| macOS x86_64 | ✅ | ✅ |
| macOS ARM64 | ✅ | ✅ |
| Windows x86_64 | ✅ | ✅ |
| Windows ARM64 | ✅ | ✅ |
| WebAssembly | ⚠️ Partial | ✅ |
| iOS | ✅ | ⚠️ Untested |
| Android | ✅ | ⚠️ Untested |

---

## Language Bindings

| Language | MuPDF | NanoPDF |
|----------|-------|---------|
| C | ✅ Native | ✅ FFI Headers |
| C++ | ✅ | ✅ (via C) |
| Python | ✅ PyMuPDF | ❌ Planned |
| JavaScript/Node.js | ⚠️ | ⚠️ Stub |
| Go | ❌ | ⚠️ Stub |
| Rust | ❌ | ✅ Native |
| Java | ✅ | ❌ |
| C# | ✅ | ❌ |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete / Fully Supported |
| ⚠️ | Partial / In Progress |
| ❌ | Not Implemented / Not Supported |
| N/A | Not Applicable |

---

## Roadmap to 100% Compatibility

### Phase 1: Core Infrastructure (Current)
- [x] Geometry primitives
- [x] Buffer management
- [x] Stream I/O
- [x] Context handling
- [x] Colorspace basics
- [x] Pixmap operations

### Phase 2: PDF Object Model
- [x] PDF object types
- [x] Lexer/tokenizer
- [x] Parser
- [ ] Complete xref handling
- [ ] Linearized PDF support

### Phase 3: Document Features
- [ ] Full page rendering
- [ ] Text extraction
- [ ] Image extraction
- [ ] Annotation reading

### Phase 4: Advanced Features
- [ ] Full encryption support
- [ ] Font subsetting
- [ ] ICC color profiles
- [ ] PDF writing

### Phase 5: Parity
- [ ] Display lists
- [ ] SVG output
- [ ] PDF/A validation
- [ ] JavaScript (optional)

---

## Contributing

Help us reach 100% MuPDF API compatibility! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
1. Document rendering pipeline
2. Font handling
3. Image decoding
4. PDF writing capabilities

