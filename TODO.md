# NanoPDF - MuPDF Compatibility TODO

This document tracks remaining work needed for complete MuPDF API compatibility.

> **Source**: Analysis based on MuPDF source headers (cloned 2025-12-26)

## Current Status

**Implemented: 70/70+ modules** (100% core coverage)

| Module | Functions | Notes |
|--------|-----------|-------|
| fz_buffer | 36 | Buffer operations |
| fz_colorspace | - | Device colorspaces |
| fz_context | - | Context management |
| fz_cookie | - | Progress/cancellation |
| fz_device | 26 | Blend modes |
| fz_display_list | 12 | Command types |
| fz_font | 8 | Font types, Base 14 |
| fz_geometry | - | Point, Rect, Matrix, Quad |
| fz_hash | - | Hash tables |
| fz_image | 8 | Image formats |
| fz_link | - | Hyperlinks |
| fz_output | - | Output streams |
| fz_path | - | Vector paths |
| fz_pixmap | - | Pixel buffers |
| fz_text | - | Text handling |
| fz_archive | - | ZIP/TAR archives |
| fz_stream | - | Input streams |
| fz_shade | 22 | Gradients/shading |
| fz_separation | 23 | Spot colors |
| fz_glyph | 36 | Glyph handling |
| fz_store | 32 | Resource caching |
| fz_draw_device | - | Rendering device |
| fz_bitmap | - | 1-bit images |
| fz_band_writer | - | Band-based output |
| fz_pool | - | Memory pool |
| fz_xml | - | XML parsing |
| fz_tree | - | Structured content |
| fz_string | - | String handling |
| pdf_annot | 28 | Annotation types |
| pdf_crypt | - | AES/RC4 encryption |
| pdf_form | 7 | Widget types |
| pdf_lexer | 12 | Token types |
| pdf_object | - | PDF objects |
| pdf_xref | - | Cross-reference |
| fz_outline | 30+ | Document TOC/outlines |
| fz_stext | 50+ | Structured text extraction |
| fz_filter | 18+ | Stream filters |
| fz_writer | 50+ | Document writers |
| fz_story | 13+ | HTML story layout |
| fz_transition | 19+ | Page transitions |
| fz_color | 25+ | Color management |
| fz_compress | 30+ | Deflate/Brotli/Fax compression |
| fz_glyph_cache | 25+ | Cache statistics, eviction policies |
| fz_bidi | 18+ | Bidirectional text, reordering, mirroring |
| fz_barcode | 12+ | QR/Code128/EAN/UPC generation |
| fz_deskew | 10+ | Skew detection, deskew, rotation |
| fz_heap | 22+ | Priority queue, heap sort |
| fz_hyphen | 16+ | Text hyphenation, Liang's algorithm |
| fz_json | 28+ | JSON parsing, serialization, DOM |
| fz_log | 26+ | Logging, levels, callbacks, filtering |
| fz_write_pixmap | 30+ | PNG/JPEG/PNM/PAM/PBM/PKM/PSD/PS output |
| fz_util | 36+ | String, path, URI, UTF-8, numeric utilities |
| pdf_javascript | 24+ | JS enable/disable, event handling, execution |
| pdf_interpret | 70+ | Content stream processor, all PDF operators |
| pdf_page | 50+ | Page loading, bounds, transform, rendering |
| pdf_parse | 35+ | Lexer, tokenizer, object/dict/array parsing |
| pdf_layer | 28+ | OCG layers, configs, UI, enable/disable |
| pdf_signature | 40+ | PKCS#7 signing/verification, DN, certificates |
| pdf_cmap | 30+ | CID/Unicode mapping, vertical writing mode |
| pdf_font | 45+ | Font descriptor, metrics, CID/GID/Unicode mapping |
| pdf_resource | 50+ | Resource lookup, patterns, functions, XObjects |
| pdf_clean | 35+ | Optimization, linearization, garbage collection |
| pdf_redact | 30+ | Redaction, metadata sanitization, content removal |
| pdf_image_rewriter | 20+ | Image optimization, subsampling, recompression |
| pdf_recolor | 20+ | Page/shade recoloring, color conversion, output intents |
| pdf_event | 30+ | Alerts, print, launch URL, mail, menu item events |
| pdf_name_table | 20+ | Name interning, 150+ standard names, cache statistics |
| pdf_zugferd | 20+ | ZUGFeRD/Factur-X invoices, XML extraction/embedding, validation |
| pdf_portfolio | 25+ | Embedded files, collection schema, views, AF relationships |
| pdf_3d | 30+ | U3D/PRC formats, 3D views, camera, render modes, lighting |
| pdf_xref | 30+ | Cross-reference table, object management, streams, trailer |
| fz_xps | 30+ | XPS document format, parts, pages, fonts, targets |
| fz_epub | 45+ | EPUB e-book format, OPF, spine, manifest, navigation |
| fz_svg | 50+ | SVG DOM, paths, transforms, styles, elements, colors |
| fz_cbz | 40+ | CBZ/CBR archives, ComicInfo.xml, natural sort, manga |
| fz_office | 45+ | DOCX/XLSX/PPTX/ODT/ODS/ODP, cells, slides, metadata |

---

## Document Format Support

### Implemented

#### XPS (XML Paper Specification) ✅
- [x] XPS document structure (FixedDocumentSequence, FixedDocument, FixedPage)
- [x] Part management (add, get, has_part)
- [x] Page access (count, size, name)
- [x] Font cache
- [x] Link targets
- [x] URL resolution
- [x] Content type handling

#### EPUB (Electronic Publication) ✅
- [x] EPUB container structure (version 2 and 3)
- [x] OPF manifest handling (items, media types)
- [x] Spine (reading order, linear/non-linear)
- [x] NCX/NAV navigation (table of contents)
- [x] Metadata (title, creators, language, identifier)
- [x] File access within package
- [x] Reading direction (LTR/RTL)

#### SVG (Scalable Vector Graphics) ✅
- [x] SVG DOM parsing (document, elements)
- [x] Path commands (M, L, C, Q, A, Z, etc.)
- [x] Transformations (matrix, translate, scale, rotate, skew)
- [x] Style properties (fill, stroke, opacity)
- [x] Element types (22 types: rect, circle, path, text, etc.)
- [x] Color parsing (hex and named colors)
- [x] ViewBox support
- [x] Output device for SVG generation

#### CBZ/CBR (Comic Book Archives) ✅
- [x] Archive extraction (CBZ/CBR/CB7/CBT)
- [x] Image sequence handling (natural sort order)
- [x] Metadata (ComicInfo.xml) - title, series, number, writer, etc.
- [x] Manga reading direction support
- [x] Double-page spread detection
- [x] 20+ supported image formats

#### Office Formats (OOXML/ODF) ✅
- [x] DOCX - paragraphs, headings, text styles
- [x] XLSX - sheets, cells (string/number), references
- [x] PPTX - slides, titles, content
- [x] ODT/ODS/ODP support
- [x] Metadata (title, creator, subject, etc.)
- [x] Page/slide dimensions

### Not Implemented

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
- [x] **Buffer reuse pool** - Reduce allocations in tight loops ✅
  - Implemented buffer pooling with 6 size classes: 64B, 256B, 1KB, 4KB, 16KB, 64KB
  - Pool max 32 buffers per size class
  - FFI functions: `fz_buffer_pool_stats`, `fz_buffer_pool_clear`, `fz_buffer_pool_count`
  - New buffer functions: `fz_new_buffer_with_capacity`, `fz_new_buffer_unpooled`
  - Added `fz_buffer_reserve`, `fz_buffer_shrink_to_fit`, `fz_buffer_is_pooled`

- [x] **String interning for PDF Names** ✅
  - Implemented `Arc<str>` based Name struct with 100+ pre-interned common names
  - Fast pointer equality for interned names (no string comparison)
  - `Name::new()` automatically uses interned storage for common names
  - Methods: `as_str()`, `arc()`, `is_interned()`, `from_string()`
  - From/Into traits for ergonomic conversion

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

- [ ] Add benchmarks for more modules:
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

- [ ] PDF parsing benchmarks
- [ ] Document operations benchmarks
- [ ] Rendering benchmarks
- [ ] Memory usage tracking
- [ ] Comparison with other PDF libraries (pdf-lib, pdf.js)

---

## Go Performance Optimization

> Based on benchmark profiling conducted 2025-12-24

### Go Benchmark Summary

Current performance metrics (from `go test -bench=.`):

#### Buffer Operations

| Operation | ns/op | B/op | allocs/op | Notes |
|-----------|-------|------|-----------|-------|
| BufferNew | 58.88 | 24 | 1 | Fast empty buffer |
| BufferNewWithCapacity | 190.9 | 1048 | 2 | Pre-allocation |
| BufferFromBytes1KB | 195.2 | 1056 | 3 | Data copy |
| BufferFromBytes16KB | 1950 | 16416 | 3 | Scales linearly |
| BufferFromString | 70.88 | 48 | 3 | String conversion |
| BufferBytes1KB | 150.2 | 1024 | 1 | Data extraction |
| BufferString1KB | 284.4 | 2048 | 2 | UTF-8 conversion |
| BufferLen | 9.156 | 0 | 0 | O(1) access |
| BufferAppend (100x10B) | 2107 | 1048 | 2 | Batch append |
| BufferClone1KB | 369.0 | 2080 | 4 | Full copy |

#### Geometry Operations (Zero Allocations!)

| Operation | ns/op | Notes |
|-----------|-------|-------|
| PointNew | 0.10 | Struct literal |
| PointTransform | 0.11 | Matrix multiply |
| PointTransformComplex | 0.10 | Same perf! |
| PointDistance | 0.10 | sqrt calculation |
| PointAdd | 0.09 | Vector add |
| PointSub | 0.10 | Vector sub |
| PointScale | 0.10 | Scalar multiply |
| PointEquals | 0.12 | Comparison |
| RectNew | 0.10 | Struct literal |
| RectFromXYWH | 0.10 | With calculation |
| RectContains | 0.11 | Bounds check |
| RectContainsXY | 0.11 | Direct coords |
| RectUnion | 0.10 | 4x min/max |
| RectIntersect | 0.11 | 4x min/max |
| RectIncludePoint | 0.12 | Bounds expand |
| RectTranslate | 0.10 | 4 adds |
| RectScale | 0.11 | 4 multiplies |
| RectToIRect | 0.45 | math.Floor/Ceil |
| RectWidth | 0.09 | Subtraction |
| RectHeight | 0.10 | Subtraction |
| IRectNew | 0.11 | Struct literal |
| MatrixNew | 0.10 | Struct literal |
| MatrixIdentity | 0.10 | Return copy |
| MatrixTranslate | 0.11 | Struct literal |
| MatrixScale | 0.10 | Struct literal |
| MatrixRotate | 10.36 | **Trig functions** |
| MatrixShear | 0.11 | Struct literal |
| MatrixConcat | 0.12 | 12 multiply-adds |
| MatrixConcatChain (3x) | 17.31 | Includes rotate |
| MatrixPreTranslate | 12.68 | Create + concat |
| MatrixPostTranslate | 12.77 | Concat + create |
| MatrixTransformPoint | 0.10 | 6 multiply-adds |
| MatrixTransformRect | 10.96 | 4 point transforms |
| QuadNew | 0.11 | Struct literal |
| QuadFromRect | 0.11 | 4 point creates |
| QuadTransform | 9.49 | 4 transforms |
| QuadBounds | 3.39 | 4x IncludePoint |

### Go Performance Analysis

#### Excellent Performance Areas ✅

The Go implementation achieves **sub-nanosecond** performance for most geometry operations:
- All struct creation: ~0.1 ns (CPU register operations)
- Point/Rect operations: ~0.1 ns (zero allocations)
- Matrix operations without trig: ~0.1 ns

#### Performance Bottlenecks Identified

- [ ] **MatrixRotate** - 10.36 ns (100x slower than other matrix ops)
  - Uses `math.Sin` and `math.Cos` which are expensive
  - Consider: lookup tables for common angles (0, 90, 180, 270)
  - Consider: CORDIC algorithm for faster trig
  - Consider: caching rotation matrices

- [ ] **MatrixTransformRect** - 10.96 ns
  - Transforms 4 corners (calls Transform 4 times)
  - For axis-aligned transforms, could optimize to direct calculation
  - Consider: special case for scale/translate-only matrices

- [ ] **QuadTransform** - 9.49 ns
  - Similar issue - 4 point transforms
  - Consider: SIMD for parallel transform of 4 points

- [ ] **QuadBounds** - 3.39 ns
  - Calls IncludePoint 4 times
  - Consider: inline the min/max calculations

- [ ] **RectToIRect** - 0.45 ns (4.5x slower than other rect ops)
  - Uses math.Floor and math.Ceil
  - Consider: int conversion with manual rounding

### Go High Priority Optimizations

#### Trigonometry Optimization
- [ ] **Rotation matrix caching**
  - Cache commonly used rotation matrices (0°, 90°, 180°, 270°)
  - Use sync.Pool for frequently rotated angles

- [ ] **Trig lookup tables**
  - For applications with limited angle precision needs
  - 1° resolution table: 360 entries × 8 bytes = 2.8KB

#### SIMD Acceleration
- [ ] **Use SIMD for batch transforms**
  - Go 1.21+ has better compiler SIMD support
  - Consider: assembly for critical paths (arm64, amd64)
  - Package: `golang.org/x/sys/cpu` for feature detection

#### Allocation Reduction (Buffer Operations)
- [ ] **sync.Pool for Buffers**
  - Pool commonly sized buffers (1KB, 4KB, 16KB, 64KB)
  - Reduces GC pressure in high-throughput scenarios

- [ ] **Reduce string allocations**
  - BufferString1KB does 2 allocations (284.4 ns)
  - Consider: unsafe.String for zero-copy when safe

### Go Medium Priority Optimizations

#### Interface Optimizations
- [ ] **Avoid interface{} in hot paths**
  - Type assertions add overhead
  - Use generics (Go 1.18+) where appropriate

#### Memory Layout
- [ ] **Struct field ordering**
  - Ensure optimal alignment
  - Group frequently accessed fields together

#### CGO Considerations (for native backend)
- [ ] **Minimize CGO boundary crossings**
  - CGO calls have ~100ns overhead
  - Batch operations where possible
  - Consider: keep data on Go side when possible

### Benchmarking TODOs

- [ ] Document loading benchmarks
- [ ] Page rendering benchmarks
- [ ] PDF parsing benchmarks
- [ ] Memory allocation profiling
- [ ] Comparison with other Go PDF libraries (pdfcpu, unipdf)
- [ ] CGO overhead analysis

---

## Python Performance Optimization

> Based on benchmark profiling conducted 2025-12-24

### Python Benchmark Summary

Current performance metrics (from `python benchmarks/benchmark.py`):

#### Point Operations

| Operation | Mean | ops/sec | Notes |
|-----------|------|---------|-------|
| Point constructor | 112.51 ns | 8.89M | Object allocation |
| Point.transform | 155.75 ns | 6.42M | Matrix multiply |
| Point.distance | 101.90 ns | 9.81M | sqrt calculation |
| Point.__eq__ | 68.70 ns | 14.56M | Comparison |

#### Rect Operations

| Operation | Mean | ops/sec | Notes |
|-----------|------|---------|-------|
| Rect constructor | 135.59 ns | 7.38M | 4 floats |
| Rect.width | 71.02 ns | 14.08M | Subtraction |
| Rect.height | 71.76 ns | 13.94M | Subtraction |
| Rect.contains | 95.28 ns | 10.50M | 4 comparisons |
| Rect.union | 202.08 ns | 4.95M | 4x min/max |
| Rect.intersect | 199.82 ns | 5.00M | 4x min/max |
| **Rect.transform** | **1.22 µs** | **818K** | **SLOW** |

#### IRect Operations

| Operation | Mean | ops/sec | Notes |
|-----------|------|---------|-------|
| IRect constructor | 118.38 ns | 8.45M | 4 ints |
| IRect.width | 60.32 ns | 16.58M | Fastest |
| IRect.height | 60.41 ns | 16.55M | |

#### Matrix Operations

| Operation | Mean | ops/sec | Notes |
|-----------|------|---------|-------|
| Matrix constructor | 167.08 ns | 5.99M | 6 floats |
| Matrix.identity | 188.69 ns | 5.30M | Static factory |
| Matrix.scale | 197.03 ns | 5.08M | |
| Matrix.translate | 195.60 ns | 5.11M | |
| Matrix.rotate | 236.40 ns | 4.23M | Trig functions |
| Matrix.concat | 275.53 ns | 3.63M | 12 multiply-adds |
| **Matrix chain (3x)** | **1.12 µs** | **896K** | **SLOW** |

#### Quad Operations

| Operation | Mean | ops/sec | Notes |
|-----------|------|---------|-------|
| Quad.from_rect | 390.28 ns | 2.56M | 4 Point objects |
| Quad.to_rect | 382.20 ns | 2.62M | min/max of 4 |
| Quad.transform | 617.94 ns | 1.62M | 4 transforms |

### Python Performance Analysis

#### Comparison with Other Languages

| Language | Point.transform | Rect.transform | Matrix.concat |
|----------|-----------------|----------------|---------------|
| **Python** | 155.75 ns | 1.22 µs | 275.53 ns |
| **Go** | 0.11 ns | 10.96 ns | 0.12 ns |
| **Node.js** | 45.73 ns | 91.38 ns | 33.68 ns |
| **Rust** | 0.59 ns | ~1 ns | 1.07 ns |

Python is **~1400x slower than Go** for simple geometry operations due to:
- Dynamic typing overhead
- Object allocation for every operation
- Interpreter dispatch
- No SIMD vectorization

#### Performance Bottlenecks Identified

- [ ] **Rect.transform** - 1.22 µs (slowest single operation)
  - Creates 4 Point objects for corners
  - Transforms each point (4 transforms)
  - Creates lists for min/max calculation
  - Consider: NumPy vectorization or Cython

- [ ] **Matrix concat chain** - 1.12 µs
  - Creates 3 intermediate Matrix objects
  - 3x concat operations
  - Consider: fused multiply-add operation

- [ ] **Quad operations** - 390-618 ns
  - Heavy object allocation (4 Points per Quad)
  - Consider: __slots__ to reduce memory overhead
  - Consider: storing as flat tuple internally

- [ ] **Object allocation overhead**
  - Every operation creates new objects
  - Consider: mutable in-place variants
  - Consider: object pooling for hot paths

### Python High Priority Optimizations

#### Use __slots__ for Memory Efficiency
- [ ] Add `__slots__` to Point, Rect, Matrix, Quad
  - Reduces memory by ~40%
  - Faster attribute access
  - Example: `__slots__ = ('x', 'y')`

#### NumPy Acceleration
- [ ] **NumPy-backed geometry types**
  - Use `numpy.ndarray` for internal storage
  - Vectorized operations for batches
  - SIMD acceleration for matrix ops

- [ ] **Batch transform API**
  - `transform_points(points: np.ndarray, matrix: Matrix)`
  - Process thousands of points in one call
  - 100-1000x faster for bulk operations

#### Cython Optimization
- [ ] **Cython extension for geometry**
  - Compile critical paths to C
  - Type declarations for speedup
  - Estimated 10-50x improvement

- [ ] **Critical functions to optimize**:
  - `Point.transform()`
  - `Matrix.concat()`
  - `Rect.transform()`

### Python Medium Priority Optimizations

#### Reduce Object Allocation
- [ ] **In-place operations**
  - `point.transform_inplace(matrix)` - modifies self
  - `matrix.concat_inplace(other)` - modifies self
  - Avoid creating temporary objects

- [ ] **Object pooling**
  - Reuse Point/Matrix objects in hot loops
  - Thread-local pools to avoid locking

#### Cache Common Values
- [ ] **Cache identity matrix**
  - `Matrix._IDENTITY = Matrix(1, 0, 0, 1, 0, 0)`
  - Return same instance for `Matrix.identity()`

- [ ] **Cache common rotations**
  - Pre-compute 0°, 90°, 180°, 270° matrices
  - Avoid trig for common angles

### Python Lower Priority Optimizations

#### PyPy Compatibility
- [ ] Ensure code runs on PyPy
  - PyPy JIT can give 10-50x speedup
  - Avoid C extensions that break PyPy

#### Lazy Evaluation
- [ ] **Lazy transform chains**
  - Don't compute until result needed
  - Fuse multiple transforms into one

### Benchmarking TODOs

- [ ] Buffer benchmark suite (requires native library)
- [ ] Document operations benchmarks
- [ ] PDF parsing benchmarks
- [ ] Memory usage profiling
- [ ] Comparison with PyMuPDF, pikepdf, PyPDF2
- [ ] NumPy-accelerated benchmarks

---

## Advanced Features

### Rendering Enhancements

- [ ] **GPU Acceleration**
  - [ ] OpenGL rendering path
  - [ ] Vulkan rendering path
  - [ ] Metal rendering path (macOS/iOS)
  - [ ] DirectX rendering path (Windows)

- [ ] **Multi-threaded Rendering**
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

### v0.2.0 - Text Extraction & Outlines
1. ~~fz_stext (structured text extraction)~~ ✅
2. ~~fz_outline (document outlines/TOC)~~ ✅
3. ~~fz_filter (stream filters - decode)~~ ✅
4. ~~pdf_page (page handling)~~ ✅

### v0.3.0 - Document Writing
1. ~~fz_writer (document writers)~~ ✅
2. ~~fz_write_pixmap (image output)~~ ✅
3. pdf_clean (optimization)
4. ~~pdf_parse (parsing)~~ ✅

### v0.4.0 - Content Processing
1. ~~pdf_interpret (content stream processor)~~ ✅
2. ~~pdf_layer (optional content groups)~~ ✅
3. ~~pdf_cmap (character maps)~~ ✅
4. ~~fz_story (HTML layout)~~ ✅

### v0.5.0 - Security & Signatures
1. ~~pdf_signature (digital signatures)~~ ✅
2. pdf_redact (redaction)
3. ~~pdf_javascript (JavaScript)~~ ✅
4. Enhanced encryption

### v0.6.0 - Additional Formats
1. XPS support
2. EPUB support
3. SVG support
4. fz_barcode (barcodes)

### v1.0.0 - Production Ready
1. Full MuPDF API parity (~70+ modules)
2. Comprehensive documentation
3. Performance optimization
4. Mobile platform support
5. WebAssembly target

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to help with these items.

Priority should be given to items that:
1. Block common use cases
2. Are required for MuPDF drop-in compatibility
3. Have clear specifications to implement against

---

*Last updated: 2025-12-26 (MuPDF header analysis)*

