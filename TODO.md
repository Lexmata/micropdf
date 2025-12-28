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
- [ ] Add `#[must_use]` to handle-returning functions
- [ ] Implement `Drop` audit across all HandleStore types
- [ ] Add allocation tracking to buffer pool for stats
- [ ] Profile hot paths with `perf` or `flamegraph`
- [ ] Audit `forget()` calls - ensure paired with manual cleanup

### Go Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| CGO/unsafe calls | 276 | Batch CGO calls where possible to reduce overhead |
| defer patterns | 91 | Audit for missing `defer Close()` on resources |

**Specific tasks:**
- [ ] Add `runtime.SetFinalizer` for leak detection in debug builds
- [ ] Implement handle tracking similar to Rust profiler
- [ ] Review all CGO string conversions (C.CString leaks)
- [ ] Add sync.Pool for frequently allocated CGO types

### Node.js Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| Object allocations | 398 | Pool geometry types, use TypedArrays |
| Array.from/slice/map | ~200 | Use in-place operations where possible |

**Specific tasks:**
- [ ] Add FinalizationRegistry tracking for all handle types
- [ ] Pool Point, Rect, Matrix, Quad instances
- [ ] Replace `Array.from` with reusable buffers in hot paths
- [ ] Add WeakRef-based leak detection warnings
- [ ] Buffer.toString - use TextDecoder for buffers > 1KB

### Python Bindings

| Issue | Count | Improvement |
|-------|-------|-------------|
| FFI calls | 78 | Cache FFI results, batch operations |
| `__del__` implementations | 6 | Ensure all have explicit `close()` methods |

**Specific tasks:**
- [ ] Add `weakref.ref` tracking for debug leak detection
- [ ] Implement context managers for all resource types
- [ ] Cache frequently-called FFI functions with `functools.lru_cache`
- [ ] Add `__sizeof__` to all types for memory debugging

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

- [ ] GPU acceleration (OpenGL/Vulkan/Metal/DirectX)

---

## Roadmap

| Version | Focus |
|---------|-------|
| **v0.2.0** | Memory improvements, leak fixes, benchmarks |
| **v0.3.0** | WebAssembly, mobile platforms |
| **v1.0.0** | Documentation, full test coverage, performance parity |

---

*See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.*
