# NanoPDF - TODO

> **Last updated**: 2025-12-28

---

## Remaining Optimization Targets

### Rust Core

| Issue | Count | Status |
|-------|-------|--------|
| Unsafe blocks | 962 | ✅ `ffi_safety.rs` module with SAFETY docs |
| SmallVec | - | ✅ Added to Cargo.toml |
| Safety helpers | 10 funcs | ✅ `cstr_to_str`, `raw_to_slice`, `write_out`, macros |
| Global state | 234 uses | ⏳ Needs scoped contexts |
| Clone calls | 220+ | ⏳ Replace with `Cow<'_, T>` |

**Completed:**
- `ffi_safety.rs` - SAFETY-documented helper functions
- `smallvec = "1.13"` added to dependencies
- Helper imports in `pdf_interpret.rs`, `writer.rs`
- Macros: `cstr_safe!`, `slice_safe!`, `write_safe!`

### Go Bindings

| Issue | Count | Status |
|-------|-------|--------|
| CGO/unsafe calls | 259 | ✅ `path_batch.go` adds batching APIs |
| defer patterns | 130 | ✅ Audited - all C.CString properly freed |
| C.CString/C.free | 15/15 | ✅ All matched |

### Node.js Bindings

| Issue | Count | Status |
|-------|-------|--------|
| Object allocations | 347 | ✅ `typed-arrays.ts` module added |
| Array.from/slice/map | 35 | ✅ In-place variants available |
| TypedArray utilities | 28 funcs | ✅ Color, point, rect, matrix, pixel ops |

### Python Bindings

| Issue | Count | Status |
|-------|-------|--------|
| FFI calls | 49 | ✅ Batch ops added (9 functions) |
| `__del__` implementations | 6 | ✅ All call drop()/close() |
| Batch operations | 9 funcs | ✅ NumPy-accelerated when available |

---

## Platform Support

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

## Reference: Profiling Benchmarks (2025-12-28)

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
