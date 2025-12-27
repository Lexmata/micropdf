# NanoPDF - TODO

This document tracks remaining work for NanoPDF.

> **Last updated**: 2025-12-27

---

## Completed Work Summary

### MuPDF API Coverage: 100% Core ✅

**70+ FFI modules implemented** covering all major MuPDF functionality:

| Category | Modules |
|----------|---------|
| **Core** | buffer, colorspace, context, cookie, device, display_list, font, geometry, hash, image, link, output, path, pixmap, text, archive, stream |
| **Rendering** | shade, separation, glyph, store, draw_device, bitmap, band_writer |
| **Memory** | pool, buffer pooling, arena allocation |
| **Text** | stext, outline, story, bidi, hyphen |
| **Utility** | xml, tree, string_util, json, log, util, hints |
| **Filters** | filter, compress (flate/brotli/fax) |
| **Writers** | writer, write_pixmap, transition |
| **Color** | color, glyph_cache |
| **Other** | barcode, deskew, heap |
| **PDF** | annot, crypt, form, lexer, object, xref, javascript, interpret, page, parse, layer, signature, cmap, font, resource, clean, redact, image_rewriter, recolor, event, name_table, zugferd, portfolio, 3d |

### Document Formats ✅

- **XPS** - Full support (parts, pages, fonts, targets)
- **EPUB** - OPF, spine, manifest, navigation
- **SVG** - DOM, paths, transforms, styles, elements
- **CBZ/CBR** - Archives, ComicInfo.xml, manga support
- **Office** - DOCX/XLSX/PPTX/ODT/ODS/ODP

### Performance Optimizations ✅

- Buffer reuse pooling (6 size classes)
- String interning for PDF Names (100+ pre-interned)
- PDF Object arena allocation
- HashMap optimization with custom hasher
- SIMD acceleration (SSE2/AVX/NEON)
- Lock-free data structures (sharded stores, MPMC queue)
- Memory-mapped file reading
- Buffered/vectored writing
- Structure packing and data locality
- PGO and LTO build profiles
- Branch prediction hints (`likely`/`unlikely`)

### Benchmarking Infrastructure ✅

12 benchmark modules registered: geometry, buffer, pdf_objects, colorspace, filters, pixmap, stream, path, font, image, text, device, output, archive

### CI Fixes ✅

All pipeline issues resolved (Rust clippy, Go lint, Node.js tests).

---

## Remaining Work

### Rust Benchmarking

- [ ] Real-world PDF benchmarks (load, render, extract text)
- [ ] Memory usage profiling
- [ ] Comparison benchmarks vs MuPDF C library

### Node.js Optimizations

| Issue | Status |
|-------|--------|
| `Quad.containsPoint` | ✅ Fixed - bounding box early-exit + axis-aligned fast path |
| `Buffer.toUint8Array` | ✅ Fixed - added `toUint8ArrayView()` for zero-copy |
| ESM crypto module | ✅ Fixed - replaced `require()` with ESM `import` |

- [ ] Buffer.toString optimization (TextDecoder for large buffers)
- [ ] Object pooling for geometry types

### Go Optimizations

| Issue | Impact |
|-------|--------|
| `MatrixRotate` | 10.36ns (100x slower) |
| `MatrixTransformRect` | 10.96ns |
| `QuadTransform` | 9.49ns |

- [ ] Rotation matrix caching (0°, 90°, 180°, 270°)
- [ ] Trig lookup tables
- [ ] sync.Pool for buffers
- [ ] SIMD batch transforms

### Python Optimizations

| Issue | Impact |
|-------|--------|
| `Rect.transform` | 1.22µs (1400x slower than Go) |
| `Matrix chain` | 1.12µs |

- [ ] Add `__slots__` to geometry types
- [ ] NumPy-backed batch operations
- [ ] Cython extension for hot paths
- [ ] In-place mutation variants

### Advanced Features

- [ ] **GPU Acceleration** - OpenGL/Vulkan/Metal/DirectX
- [ ] **Multi-threaded Rendering** - Tile-based parallel
- [ ] **OCR Integration** - Tesseract
- [ ] **Table Detection** - Structure recognition

### Platform Support

- [ ] **Mobile** - Android (arm64-v8a), iOS (arm64)
- [ ] **WebAssembly** - wasm32 target, wasm-bindgen
- [ ] **Embedded** - no_std partial support

### Testing & Quality

- [ ] PDF parser fuzzing
- [ ] PDF/A, PDF/X conformance testing
- [ ] PDF 2.0 compliance

---

## Priority Roadmap

### v0.2.0 - Optimization
- Real-world benchmarks
- Node.js/Go/Python performance fixes
- Memory profiling

### v0.3.0 - Platform Expansion
- WebAssembly target
- Mobile platforms

### v1.0.0 - Production Ready
- Comprehensive documentation
- Full test coverage
- Performance parity with MuPDF

---

*See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.*
