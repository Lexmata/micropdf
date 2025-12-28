# NanoPDF - TODO

> **Last updated**: 2025-12-28

## Remaining Work

### Benchmarking

- [ ] Real-world PDF benchmarks (load, render, extract text)
- [ ] Comparison benchmarks vs MuPDF C library

### Optimizations

| Language | Task |
|----------|------|
| Node.js | Buffer.toString optimization (TextDecoder for large buffers) |
| Node.js | Object pooling for geometry types |
| Go | SIMD batch transforms (requires CGO/assembly) |
| Python | Cython extension for hot paths |

### Platform Support

- [ ] **WebAssembly** - wasm32 target, wasm-bindgen
- [ ] **Mobile** - Android (arm64-v8a), iOS (arm64)
- [ ] **Embedded** - no_std partial support

### Future

- [ ] GPU acceleration (OpenGL/Vulkan/Metal/DirectX)

---

## Roadmap

| Version | Focus |
|---------|-------|
| **v0.2.0** | Real-world benchmarks, remaining optimizations |
| **v0.3.0** | WebAssembly, mobile platforms |
| **v1.0.0** | Documentation, full test coverage, performance parity |

---

*See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.*
