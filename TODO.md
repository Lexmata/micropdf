# MicroPDF - TODO

> **Last updated**: 2025-12-28

---

## ✅ Completed Optimizations

### Rust Core

| Feature | Status |
|---------|--------|
| `ffi_safety.rs` module | ✅ SAFETY-documented FFI helpers |
| Safety macros | ✅ `cstr_safe!`, `slice_safe!`, `write_safe!` |
| SmallVec dependency | ✅ Added `smallvec = "1.13"` |
| Helper imports | ✅ `pdf_interpret.rs`, `writer.rs` |

### Go Bindings

| Feature | Status |
|---------|--------|
| Path batching | ✅ `path_batch.go` - `PathBuilder`, batch ops |
| CGO audit | ✅ 259 calls, all C.CString freed (15/15) |
| sync.Pool | ✅ Point, Rect, Matrix, Quad, ByteSlice pools |
| Resource tracking | ✅ `runtime.SetFinalizer` integration |

### Node.js Bindings

| Feature | Status |
|---------|--------|
| `typed-arrays.ts` | ✅ 28 functions for TypedArray ops |
| Object pooling | ✅ Point, Rect, Matrix, Quad pools |
| `FinalizationRegistry` | ✅ Leak detection for handles |
| `Buffer.toString` | ✅ TextDecoder for large buffers |

### Python Bindings

| Feature | Status |
|---------|--------|
| Batch operations | ✅ 9 NumPy-accelerated functions |
| `__del__` audit | ✅ All 6 call `drop()`/`close()` |
| `__slots__` | ✅ All geometry types |
| Context managers | ✅ All resource types |

---

## ⏳ Remaining Work

### Rust Core

| Task | Priority |
|------|----------|
| Replace `Cow<'_, T>` for clone() calls (220+) | Medium |
| Scoped contexts instead of `LazyLock` (234 uses) | Low |

### Platform Support

- [ ] **WebAssembly** - wasm32 target, wasm-bindgen
- [ ] **Mobile** - Android (arm64-v8a), iOS (arm64)
- [ ] **Embedded** - no_std partial support

---

## Roadmap

| Version | Focus |
|---------|-------|
| **v0.2.0** | Memory improvements, leak fixes, benchmarks |
| **v0.3.0** | WebAssembly, mobile platforms |
| **v1.0.0** | Documentation, full test coverage, performance parity |

---

## Reference: Profiling Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Point.new | ~1.5ns | Stack-only, 8 bytes |
| Rect.new | ~1.4ns | Stack-only, 16 bytes |
| Matrix.scale | ~0.7ns | No trig, fastest |
| Matrix.rotate | ~12.8ns | 18x slower (trig) |
| Matrix.concat | ~3.8ns | 6 muls + 2 adds |
| Rect.transform | ~6.2ns | 4 transforms + min/max |
| Quad.contains | ~14.5ns | Bbox + cross products |
| Buffer.create(1KB) | ~57ns | Allocation cost |
| Pixmap 72dpi | ~25μs | Scales with pixels |
| Pixmap 576dpi | ~3.2ms | 64x pixels |

---

*See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.*
