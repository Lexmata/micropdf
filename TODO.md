# NanoPDF - MuPDF Compatibility TODO

This document tracks remaining work needed for complete MuPDF API compatibility.

## Current Status

**Implemented: 15/15 core modules** (as documented in CHANGELOG)

| Module | Status | Notes |
|--------|--------|-------|
| fz_buffer | ✅ Complete | 36 functions |
| fz_colorspace | ✅ Complete | Device colorspaces |
| fz_context | ✅ Complete | Context management |
| fz_cookie | ✅ Complete | Progress/cancellation |
| fz_device | ✅ Complete | 26 blend modes |
| fz_display_list | ✅ Complete | 12 command types |
| fz_font | ✅ Complete | 8 font types, Base 14 |
| fz_geometry | ✅ Complete | Point, Rect, Matrix |
| fz_hash | ✅ Complete | Hash tables |
| fz_image | ✅ Complete | 8 formats |
| fz_link | ✅ Complete | Hyperlinks |
| fz_output | ✅ Complete | Output streams |
| fz_path | ✅ Complete | Vector paths |
| fz_pixmap | ✅ Complete | Pixel buffers |
| fz_text | ✅ Complete | Text handling |
| fz_archive | ✅ Complete | ZIP/TAR archives |
| fz_stream | ✅ Complete | Input streams |
| pdf_annot | ✅ Complete | 28 annotation types |
| pdf_crypt | ✅ Complete | AES/RC4 encryption |
| pdf_form | ✅ Complete | 7 widget types |
| pdf_lexer | ✅ Complete | 12 token types |
| pdf_object | ✅ Complete | PDF objects |
| pdf_xref | ✅ Complete | Cross-reference |

---

## Missing Fitz (Core) Modules

### High Priority

#### fz_shade (Gradients/Shading)
- [ ] Linear gradients
- [ ] Radial gradients
- [ ] Coons patch meshes
- [ ] Tensor-product patch meshes
- [ ] Function-based shading
- [ ] Axial shading
- [ ] Type 1-7 shading patterns

#### fz_separation (Spot Colors)
- [ ] Spot color handling
- [ ] Separation colorspaces
- [ ] DeviceN colorspace support
- [ ] ICC profile integration
- [ ] Color management for print production

#### fz_glyph (Advanced Glyph Handling)
- [ ] Glyph caching
- [ ] Subpixel positioning
- [ ] Glyph scaling and transformation
- [ ] Color font support (COLR/CPAL)
- [ ] Variable font support

#### fz_store (Resource Caching)
- [ ] Memory cache for rendered objects
- [ ] LRU eviction policy
- [ ] Cache size limits
- [ ] Per-document caching
- [ ] Thread-safe cache access

### Medium Priority

#### fz_draw_device (Rendering Device)
- [ ] Anti-aliased path rendering
- [ ] Subpixel text rendering
- [ ] Alpha compositing
- [ ] Clip path handling
- [ ] Pattern fills
- [ ] Overprint simulation

#### fz_bitmap (1-bit Images)
- [ ] 1-bit bitmap creation
- [ ] Halftoning algorithms
- [ ] Threshold conversion from pixmap
- [ ] RLE compression
- [ ] Fax encoding (CCITT Group 4)

#### fz_band_writer (Band-based Output)
- [ ] Band-by-band rendering
- [ ] Memory-efficient large document output
- [ ] Multiple output format support
- [ ] Progress callbacks

#### fz_pool (Memory Pool)
- [ ] Block memory allocation
- [ ] Pool-based object lifetimes
- [ ] Memory usage tracking
- [ ] Custom allocator support

### Lower Priority

#### fz_xml (XML Parsing)
- [ ] XML DOM parsing
- [ ] XPath queries
- [ ] XML namespace support
- [ ] Used for XPS/EPUB formats

#### fz_tree (Structured Content)
- [ ] Tree structure for text
- [ ] Reading order detection
- [ ] Logical structure tree
- [ ] Tagged PDF support

#### fz_string (Advanced String Handling)
- [ ] Unicode normalization
- [ ] BiDi text processing
- [ ] Text segmentation
- [ ] Language-aware sorting

---

## Missing PDF Modules

### High Priority

#### pdf_js (JavaScript Support)
- [ ] JavaScript interpreter integration
- [ ] Action scripting
- [ ] Form calculation scripts
- [ ] Document-level scripts
- [ ] Event handling (open, close, etc.)

#### pdf_layer (Optional Content Groups)
- [ ] OCG (Optional Content Group) parsing
- [ ] Layer visibility control
- [ ] OCMD (Optional Content Membership Dictionary)
- [ ] Default layer states
- [ ] Layer ordering

#### pdf_pattern (Pattern Support)
- [ ] Tiling patterns (Type 1)
- [ ] Shading patterns (Type 2)
- [ ] Pattern colorspaces
- [ ] Pattern transformations

### Medium Priority

#### pdf_signature (Digital Signatures)
- [ ] Signature field handling
- [ ] PKCS#7 signature creation
- [ ] Signature verification
- [ ] Certificate chain validation
- [ ] Timestamp support
- [ ] PAdES compliance

#### pdf_redact (Redaction)
- [ ] Redaction annotation creation
- [ ] Redaction application (content removal)
- [ ] Text content removal
- [ ] Image content removal
- [ ] Sanitization of metadata

#### pdf_portfolio (PDF Portfolios)
- [ ] Portfolio structure parsing
- [ ] Embedded file extraction
- [ ] Navigator support
- [ ] Schema handling

### Lower Priority

#### pdf_tagged (Tagged PDF / Accessibility)
- [ ] Structure tree parsing
- [ ] Role mapping
- [ ] Alternative text extraction
- [ ] Reading order
- [ ] PDF/UA compliance checking

#### pdf_3d (3D Content)
- [ ] 3D annotation support
- [ ] U3D format parsing
- [ ] PRC format parsing
- [ ] 3D view handling

---

## Document Format Support

### Not Implemented

#### XPS (XML Paper Specification)
- [ ] XPS parser
- [ ] FixedDocument handling
- [ ] XAML rendering
- [ ] Font embedding
- [ ] Image handling

#### EPUB (Electronic Publication)
- [ ] EPUB container parsing
- [ ] OPF manifest handling
- [ ] NCX/NAV navigation
- [ ] CSS styling
- [ ] HTML content rendering

#### SVG (Scalable Vector Graphics)
- [ ] SVG DOM parsing
- [ ] Path commands
- [ ] Transformations
- [ ] Filters and effects
- [ ] Text layout

#### CBZ/CBR (Comic Book Archives)
- [ ] Archive extraction
- [ ] Image sequence handling
- [ ] Metadata (ComicInfo.xml)

#### Office Formats (via third-party)
- [ ] DOCX basic rendering
- [ ] XLSX basic rendering
- [ ] PPTX basic rendering

---

## Performance Optimization

> Based on benchmark profiling conducted 2025-12-24

### Benchmark Summary

Current performance metrics (from `cargo bench`):

| Operation | Time | Throughput |
|-----------|------|------------|
| Buffer create (1KB) | 19.8 ns | 47.9 GiB/s |
| Buffer from_slice (1KB) | 14.1 ns | 66.8 GiB/s |
| Buffer append (1000 items) | 11.6 µs | 20.3 GiB/s |
| Base64 encode (1KB) | 283.6 ns | 3.3 GiB/s |
| Base64 decode (1KB) | 318.6 ns | 2.9 GiB/s |
| MD5 hash (1KB) | 1.16 µs | 840 MiB/s |
| Point transform | 0.59 ns | - |
| Matrix concat | 1.07 ns | - |
| Rect operations | 0.52-0.91 ns | - |
| PDF Object create | 1.77-9.8 ns | - |
| PDF Name new | 8.4 ns | - |
| PDF Dict lookup | 8.0 ns | - |
| PDF Array access | 0.18 ns | - |

### High Priority Optimizations

#### Memory Allocation Hot Paths
- [ ] **Buffer reuse pool** - Reduce allocations in tight loops
  - Profile shows `alloc::vec::Vec` and `RawVecInner` in hot paths
  - Implement buffer pooling for frequently allocated sizes
  - Add `Buffer::with_capacity()` hints in critical paths

- [ ] **String interning for PDF Names**
  - `nanopdf::pdf::object::Name::new` appears frequently in profiles
  - Implement string interning for common PDF names (Type, Length, etc.)
  - Use `Arc<str>` or cow patterns for shared name storage

- [ ] **PDF Object arena allocation**
  - PDF Objects created 17B+ samples in profiling
  - Consider bump allocator for document-lifetime objects
  - Reduce per-object allocation overhead

#### Algorithm Improvements
- [ ] **Optimize hashbrown usage**
  - `hashbrown::raw::RawTable` shows in profiles
  - Pre-size hash maps when document structure is known
  - Consider perfect hashing for known key sets

- [ ] **SIMD acceleration**
  - Matrix operations (currently scalar)
  - Color space conversions
  - Buffer operations (copy, fill)
  - Base64 encode/decode

- [ ] **Lock-free data structures**
  - Profile shows `futex::Mutex::lock_contended`
  - Consider lock-free queues for parallel processing
  - Reduce contention in HandleStore

### Medium Priority Optimizations

#### I/O Performance
- [ ] **Memory-mapped file reading**
  - Large PDF files should use mmap
  - Lazy loading of page content
  - Reduce memory copies

- [ ] **Buffered writing**
  - Batch small writes
  - Use vectored I/O where possible
  - Async write support

#### Cache Efficiency
- [ ] **Structure packing**
  - Audit struct layouts for cache alignment
  - Use `#[repr(C)]` where beneficial
  - Reduce padding in hot structs

- [ ] **Data locality**
  - Group related data in memory
  - Prefetch hints for sequential access
  - Page-aligned allocations for large buffers

### Lower Priority Optimizations

#### Compilation
- [ ] **Profile-guided optimization (PGO)**
  - Generate profiles from real workloads
  - Apply PGO in release builds

- [ ] **Link-time optimization (LTO)**
  - Enable thin-LTO for release builds
  - Cross-crate inlining

#### Micro-optimizations
- [ ] **Inline hints**
  - `#[inline(always)]` for critical small functions
  - Measure impact of inlining decisions

- [ ] **Branch prediction hints**
  - `likely`/`unlikely` macros for hot paths
  - Optimize error path ordering

### Benchmarking Infrastructure

- [x] Criterion benchmarks for Rust core modules
- [x] tinybench benchmarks for Node.js bindings
- [ ] Add benchmarks for missing modules:
  - [ ] colorspace operations
  - [ ] device rendering
  - [ ] filter encode/decode (flate, lzw, etc.)
  - [ ] font operations
  - [ ] image operations
  - [ ] path operations
  - [ ] pixmap operations
  - [ ] stream read/write
  - [ ] text layout
- [ ] Add real-world PDF benchmarks
- [ ] Memory usage profiling
- [ ] Comparison benchmarks vs MuPDF

---

## Node.js Performance Optimization

> Based on benchmark profiling conducted 2025-12-24

### Node.js Benchmark Summary

Current performance metrics (from `pnpm bench`):

#### Buffer Operations

| Operation | ops/sec | Latency (avg) | Notes |
|-----------|---------|---------------|-------|
| Buffer.create() - empty | 26.2M | 44.70 ns | Fast path |
| Buffer.create(1024) | 3.08M | 1014.3 ns | Allocation overhead |
| Buffer.fromUint8Array - 1KB | 13.6M | 187.74 ns | Zero-copy |
| Buffer.fromUint8Array - 16KB | 867K | 2833.2 ns | Memory copy overhead |
| Buffer.fromString - short | 15.2M | 79.21 ns | UTF-8 encoding |
| Buffer.toUint8Array - 1KB | 3.68M | 942.35 ns | Copy required |
| Buffer.toUint8Array - 16KB | 924K | 2843 ns | |
| Buffer.toString - 1KB | 604K | 1952.5 ns | UTF-8 decoding |
| Buffer.toBase64 - 1KB | 6.2M | 179.21 ns | Fast Node.js impl |
| Buffer.toHex - 1KB | 1.8M | 914.45 ns | |
| Buffer.slice - 1KB | 10.9M | 213.37 ns | |
| Buffer.equals - 1KB | 34.2M | 30.29 ns | Native comparison |
| Buffer.indexOf | 30.7M | 33.71 ns | Native search |
| BufferReader - readUInt32BE x 64 | 4.94M | 266.65 ns | |
| BufferWriter - write 256 bytes | 2.36M | 691.72 ns | |

#### Geometry Operations

| Operation | ops/sec | Latency (avg) | Notes |
|-----------|---------|---------------|-------|
| Point - constructor | 34.4M | 35.93 ns | |
| Point.transform | 33.5M | 45.73 ns | |
| Point.distanceTo | 33.5M | 31.22 ns | |
| Point.add | 34.4M | 57.26 ns | |
| Rect - constructor | 34.8M | 32.08 ns | |
| Rect.containsPoint | 34.8M | 29.85 ns | |
| Rect.transform | 20.4M | 91.38 ns | 4 point transforms |
| Matrix - constructor | 34.9M | 30.27 ns | |
| Matrix.concat | 31.0M | 33.68 ns | |
| Matrix.invert | 30.1M | 65.23 ns | |
| Matrix.rotate | 34.8M | 30.11 ns | Trig calculations |
| Quad.fromRect | 30.5M | 44.21 ns | |
| Quad.transform | 22.6M | 53.33 ns | |
| Quad.containsPoint | 2.75M | 411.37 ns | **SLOW** - optimize |

### Node.js High Priority Optimizations

#### Performance Bottlenecks Identified

- [ ] **Quad.containsPoint optimization**
  - Currently 411ns avg vs ~30ns for other operations
  - Cross-product calculations are expensive
  - Consider: precomputed coefficients for axis-aligned quads
  - Consider: bounding box early-exit optimization

- [ ] **Buffer.toUint8Array overhead**
  - 942ns for 1KB copy is slower than expected
  - Current implementation creates new Uint8Array
  - Consider: returning a view when safe
  - Consider: pooling common buffer sizes

- [ ] **Buffer.toString optimization**
  - 1952ns for 1KB is relatively slow
  - TextDecoder might be faster for large buffers
  - Consider: caching decoded strings for immutable buffers

- [ ] **BufferWriter efficiency**
  - 691ns for 256 bytes suggests excessive resizing
  - Consider: better initial capacity estimation
  - Consider: doubling strategy tuning

#### ESM/CJS Compatibility

- [ ] **Fix crypto module usage**
  - `require('node:crypto')` fails in ESM context
  - Update to use `import` or dynamic `import()`
  - Affects: md5Digest(), sha256Digest()

### Node.js Medium Priority Optimizations

#### Type System Optimizations

- [ ] **Reduce object allocations in hot paths**
  - Geometry operations create many temporary objects
  - Consider: object pooling for Point, Rect, Matrix
  - Consider: mutable variants for batch operations

- [ ] **TypedArray optimization**
  - Use Float64Array for bulk geometry operations
  - SIMD.js polyfill for matrix operations

#### Memory Management

- [ ] **WeakRef for large objects**
  - Consider WeakRef for document/page caches
  - Allow GC to reclaim unused resources

- [ ] **ArrayBuffer pooling**
  - Reuse ArrayBuffers for common sizes
  - Reduces GC pressure

### Benchmarking TODOs

- [x] Buffer benchmark suite
- [x] Geometry benchmark suite
- [ ] PDF parsing benchmarks
- [ ] Document operations benchmarks
- [ ] Rendering benchmarks (when implemented)
- [ ] Memory usage tracking
- [ ] Comparison with other PDF libraries (pdf-lib, pdf.js)

### Flamegraph Results

Profiling artifacts generated:
- `flamegraph_pdf_objects.svg` - PDF object operations
- `flamegraph_geometry.svg` - Geometry operations

Key findings:
1. `rayon` parallel infrastructure shows expected overhead
2. `hashbrown` hash table operations are significant
3. Allocation functions (`__rust_alloc`, `__rust_dealloc`) visible
4. `nanopdf::pdf::object::Name::new` is a hot path
5. Criterion benchmark overhead is visible (expected)

---

## Advanced Features

### Rendering Enhancements

- [ ] **GPU Acceleration**
  - [ ] OpenGL rendering path
  - [ ] Vulkan rendering path
  - [ ] Metal rendering path (macOS/iOS)
  - [ ] DirectX rendering path (Windows)

- [ ] **Multi-threaded Rendering**
  - [x] Parallel page rendering (partial - `rayon` feature)
  - [ ] Tile-based parallel rendering
  - [ ] Asynchronous I/O rendering

- [ ] **Color Management**
  - [ ] Full ICC profile support
  - [ ] Color space conversions
  - [ ] Rendering intents
  - [ ] Black point compensation

### Text Extraction Enhancements

- [ ] **OCR Integration**
  - [ ] Tesseract integration
  - [ ] Image preprocessing
  - [ ] Language detection

- [ ] **Table Detection**
  - [ ] Table structure recognition
  - [ ] Cell extraction
  - [ ] Header detection

- [ ] **Layout Analysis**
  - [ ] Column detection
  - [ ] Reading order determination
  - [ ] Figure/caption association

---

## FFI/Bindings Enhancements

### Completed

- [x] C header generation (660+ functions)
- [x] Handle-based resource management
- [x] Thread-safe stores

### Needed

- [ ] **Callback Support**
  - [ ] Progress callbacks
  - [ ] Error callbacks
  - [ ] Warning callbacks
  - [ ] Custom device callbacks

- [ ] **Memory Management**
  - [ ] Custom allocator support
  - [ ] Memory limit enforcement
  - [ ] Out-of-memory handling

- [ ] **Streaming API**
  - [ ] Page-at-a-time loading
  - [ ] Incremental updates
  - [ ] Range requests

---

## Platform Support

### Current

- [x] Linux (x86_64, aarch64)
- [x] macOS (x86_64, Apple Silicon)
- [x] Windows (x86_64, MSVC, GNU)

### Needed

- [ ] **Mobile Platforms**
  - [ ] Android (arm64-v8a, armeabi-v7a)
  - [ ] iOS (arm64)
  - [ ] iOS Simulator (x86_64, arm64)

- [ ] **WebAssembly**
  - [ ] wasm32-unknown-unknown target
  - [ ] wasm-bindgen integration
  - [ ] Browser rendering

- [ ] **Embedded Systems**
  - [ ] no_std support (partial)
  - [ ] Reduced memory footprint
  - [ ] Static linking only

---

## Testing & Quality

### Current

- [x] 789+ unit tests
- [x] 82%+ code coverage
- [x] Integration tests with PDF fixtures

### Needed

- [ ] **Fuzzing**
  - [ ] PDF parser fuzzing
  - [ ] Image decoder fuzzing
  - [ ] Filter fuzzing

- [ ] **Conformance Testing**
  - [ ] PDF/A validation
  - [ ] PDF/X validation
  - [ ] PDF 2.0 compliance

- [ ] **Performance Benchmarks**
  - [ ] Rendering speed benchmarks
  - [ ] Memory usage benchmarks
  - [ ] Comparison with MuPDF

---

## Priority Roadmap

### v0.2.0 - Rendering Focus
1. fz_shade (gradients)
2. fz_separation (spot colors)
3. pdf_pattern (patterns)
4. fz_draw_device improvements

### v0.3.0 - Security & Signatures
1. pdf_signature (digital signatures)
2. pdf_redact (redaction)
3. Enhanced encryption (AES-256)

### v0.4.0 - JavaScript & Interactivity
1. pdf_js (JavaScript)
2. pdf_layer (OCG)
3. Enhanced form support

### v0.5.0 - Additional Formats
1. XPS support
2. EPUB support
3. SVG support

### v1.0.0 - Production Ready
1. Full MuPDF API parity
2. Comprehensive documentation
3. Performance optimization
4. Mobile platform support

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to help with these items.

Priority should be given to items that:
1. Block common use cases
2. Are required for MuPDF drop-in compatibility
3. Have clear specifications to implement against

---

*Last updated: 2025-12-24*

