# NanoPDF - TODO

> **Last updated**: 2025-12-28

---

## Memory & Performance Improvements

### Rust Core (High Priority)

| Issue | Count | Improvement |
|-------|-------|-------------|
| Unsafe blocks | 906 | Audit all unsafe blocks for soundness, add SAFETY comments |
| Raw pointer manipulation | 26 files | Review `Box::from_raw`/`into_raw`/`forget` for leak potential |
| Global state | 234 uses | Consider scoped contexts instead of `LazyLock` where possible |
| Clone calls | 220+ | Replace with `Cow<'_, T>` or references where applicable |
| Vec allocations | 229 | Use `SmallVec` or buffer pooling for small collections |
| String allocations | 410 | Expand string interning beyond PDF names |

**Specific tasks:**
- [x] Add `#[must_use]` to handle-returning functions - `HandleStore::insert()`, `HandleStore::keep()`
- [x] Implement `Drop` audit across all HandleStore types - leak detection in debug builds
- [x] Add allocation tracking to buffer pool for stats - `PoolStats` now tracks bytes/allocations
- [ ] Profile hot paths with `perf` or `flamegraph`
- [x] Audit `forget()` calls - ensure paired with manual cleanup - 3 uses documented with SAFETY comments

### Go Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| CGO/unsafe calls | 276 | Batch CGO calls where possible to reduce overhead |
| defer patterns | 91 | Audit for missing `defer Close()` on resources |

**Specific tasks:**
- [x] Add `runtime.SetFinalizer` for leak detection in debug builds - `resource_tracking.go`
- [x] Implement handle tracking similar to Rust profiler - `HandleTracker` type
- [x] Review all CGO string conversions (C.CString leaks) - All 15 uses properly freed with defer
- [x] Add sync.Pool for frequently allocated CGO types - Point/Rect/Matrix/Quad/ByteSlice pools

### Node.js Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| Object allocations | 398 | Pool geometry types, use TypedArrays |
| Array.from/slice/map | ~200 | Use in-place operations where possible |

**Specific tasks:**
- [x] Add FinalizationRegistry tracking for all handle types - `resource-tracking.ts`
- [x] Pool Point, Rect, Matrix, Quad instances - MutablePoint/Rect/Matrix/Quad pools
- [x] Replace `Array.from` with reusable buffers in hot paths - `byteArrayPool`, `numberArrayPool`
- [x] Add WeakRef-based leak detection warnings - `handleRegistry` with WeakRef tracking
- [x] Buffer.toString - use TextDecoder for buffers > 1KB - threshold optimization added

### Python Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| FFI calls | 78 | Cache FFI results, batch operations |
| `__del__` implementations | 6 | Ensure all have explicit `close()` methods |

**Specific tasks:**
- [x] Add `weakref.ref` tracking for debug leak detection - `resource_tracking.py` with `ResourceTracker`
- [x] Implement context managers for all resource types - `ResourceScope` + existing `__enter__`/`__exit__`
- [x] Cache frequently-called FFI functions with `functools.lru_cache` - `cached_ffi_call` decorator + `get_cached_ffi_func`
- [x] Add `__sizeof__` to all types for memory debugging - Added to Point, Rect, IRect, Matrix, Quad, Context, Buffer, Document, Page, Pixmap

---

## Benchmarking

- [x] Real-world PDF benchmarks (load, render, extract text) - `benches/pdf_realworld.rs`
- [x] Comparison benchmarks vs MuPDF C library - baseline implemented, C stubs ready
- [ ] Memory allocation profiling per operation
- [ ] Cross-language overhead measurement (Rust → Go/Node/Python)

---

## Additional Optimizations

| Language | Task |
|----------|------|
| Node.js | Buffer.toString optimization (TextDecoder for large buffers) |
| Node.js | Object pooling for geometry types |
| Go | SIMD batch transforms (requires CGO/assembly) |
| Python | Cython extension for hot paths |

---

## Platform Support

- [ ] **WebAssembly** - wasm32 target, wasm-bindgen
- [ ] **Mobile** - Android (arm64-v8a), iOS (arm64)
- [ ] **Embedded** - no_std partial support

---

## Future

- [x] GPU acceleration (OpenGL/Vulkan/Metal/DirectX) - `ffi/gpu/` module with backend abstraction

---

## Roadmap

| Version | Focus |
|---------|-------|
| **v0.2.0** | Memory improvements, leak fixes, benchmarks |
| **v0.3.0** | WebAssembly, mobile platforms |
| **v1.0.0** | Documentation, full test coverage, performance parity |

---

*See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.*
