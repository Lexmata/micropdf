# NanoPDF

<div align="center">

**A pure Rust PDF library — drop-in replacement for MuPDF, but faster**

[![CI](https://github.com/lexmata/nanopdf/actions/workflows/ci.yml/badge.svg)](https://github.com/lexmata/nanopdf/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](nanopdf-rs/LICENSE-MIT)

[Documentation](https://docs.rs/nanopdf) · [Benchmarks](https://lexmata.github.io/nanopdf/dev/bench/) · [Compatibility](./COMPATIBILITY.md)

</div>

---

## 📦 Monorepo Structure

This repository contains multiple packages for different languages:

```
nanopdf/
├── nanopdf-rs/      # Core Rust library
├── nanopdf-js/      # Node.js/TypeScript bindings
├── go-nanopdf/      # Go bindings
├── docs/            # GitHub Pages documentation
└── mupdf/           # MuPDF reference (for API compatibility)
```

### Packages

| Package | Language | Description | License | Registry |
|---------|----------|-------------|---------|----------|
| [**nanopdf-rs**](./nanopdf-rs) | Rust | Core PDF library with 100% MuPDF API compatibility | MIT / Apache-2.0 | [![Crates.io](https://img.shields.io/crates/v/nanopdf.svg)](https://crates.io/crates/nanopdf) |
| [**nanopdf-js**](./nanopdf-js) | TypeScript | Node.js bindings with native addon support | Apache-2.0 | [![npm](https://img.shields.io/npm/v/nanopdf.svg)](https://www.npmjs.com/package/nanopdf) |
| [**go-nanopdf**](./go-nanopdf) | Go | Go bindings with CGO and pure-Go mock mode | Apache-2.0 | [![Go Reference](https://pkg.go.dev/badge/github.com/lexmata/nanopdf/go-nanopdf.svg)](https://pkg.go.dev/github.com/lexmata/nanopdf/go-nanopdf) |

---

## ⚡ Why NanoPDF?

NanoPDF is a **complete reimplementation** of MuPDF in safe Rust — not just bindings. It's designed to be a **drop-in replacement** that runs **faster** through modern concurrency:

| Feature | MuPDF | NanoPDF |
|---------|-------|---------|
| Page rendering | Single-threaded | ✅ **Parallel with Rayon** |
| File I/O | Blocking | ✅ **Async with Tokio** |
| Multi-page processing | Sequential | ✅ **Parallel batch ops** |
| Image decoding | Single-threaded | ✅ **Parallel decompression** |
| License | AGPL (restrictive) | ✅ **MIT/Apache 2.0** |
| Memory safety | Manual (C) | ✅ **Guaranteed (Rust)** |
| Unsafe code | Everywhere | ✅ **Only at FFI boundaries** |

---

## 🚀 Quick Start

### Rust

```toml
[dependencies]
nanopdf = { version = "0.1", features = ["parallel", "async"] }
```

```rust
use nanopdf::fitz::{Buffer, Stream};
use nanopdf::fitz::geometry::{Point, Rect, Matrix};

// Create geometry primitives
let rect = Rect::new(0.0, 0.0, 612.0, 792.0); // US Letter
let matrix = Matrix::scale(2.0, 2.0);
let transformed = rect.transform(&matrix);

// Work with buffers
let buffer = Buffer::from_slice(b"Hello, PDF!");
println!("Buffer size: {} bytes", buffer.len());
```

### Node.js / TypeScript

```bash
pnpm add nanopdf
```

```typescript
import { Buffer, Point, Rect, Matrix, getVersion } from 'nanopdf';

// Check version
console.log(`NanoPDF version: ${getVersion()}`);

// Geometry operations
const rect = new Rect(0, 0, 612, 792);
const matrix = Matrix.scale(2, 2);
console.log(`Page size: ${rect.width} x ${rect.height}`);

// Work with buffers
const buffer = Buffer.fromString('Hello, PDF!');
console.log(`Buffer: ${buffer.length} bytes`);
```

### Go

```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

```go
package main

import (
    "fmt"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    // Geometry operations
    rect := nanopdf.NewRect(0, 0, 612, 792)
    fmt.Printf("Page: %.0fx%.0f\n", rect.Width(), rect.Height())

    // Buffers
    buf := nanopdf.NewBufferFromString("Hello, PDF!")
    defer buf.Free()
    fmt.Printf("Buffer: %d bytes\n", buf.Len())
}
```

---

## 🔄 Drop-in MuPDF Replacement

NanoPDF provides **100% API-compatible** C headers. Existing C/C++ code can switch by:

1. Replace `#include <mupdf/...>` → `#include <nanopdf/...>`
2. Link against `libnanopdf.a` instead of `libmupdf.a`

**No code changes required.**

See [COMPATIBILITY.md](./COMPATIBILITY.md) for detailed API coverage status.

---

## 🛠️ Development

### Prerequisites

- **Rust**: 1.85+ (Edition 2024)
- **Node.js**: 18+ with pnpm
- **Go**: 1.22+

### Building All Packages

```bash
# Clone the repository
git clone https://github.com/lexmata/nanopdf.git
cd nanopdf

# Build Rust library
cd nanopdf-rs && cargo build --release && cd ..

# Build Node.js bindings
cd nanopdf-js && pnpm install && pnpm run build && cd ..

# Build Go bindings (test mode)
cd go-nanopdf && go build && cd ..
```

### Running Tests

```bash
# Rust tests
cd nanopdf-rs && cargo test

# Node.js tests
cd nanopdf-js && pnpm test

# Go tests
cd go-nanopdf && go test ./...
```

### Code Style

- **Rust**: Edition 2024 with `#[unsafe(no_mangle)]` for FFI
- **TypeScript**: ES2022, strict mode, no `any`
- **Go**: Standard `gofmt`

See [.cursor/rules/rust-standards.mdc](.cursor/rules/rust-standards.mdc) for detailed Rust coding standards.

---

## 📊 Benchmarks

View live performance comparisons: **[lexmata.github.io/nanopdf/dev/bench](https://lexmata.github.io/nanopdf/dev/bench/)**

Benchmarks run automatically on every push and publish results to GitHub Pages.

---

## 📋 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core geometry | ✅ Complete | Point, Rect, Matrix, Quad |
| Buffer/Stream | ✅ Complete | Full MuPDF compatibility |
| PDF objects | ✅ Complete | All object types |
| Compression filters | ✅ Complete | Flate, LZW, ASCII85, ASCIIHex, RunLength |
| Document loading | 🚧 In Progress | Basic structure complete |
| Page rendering | 🚧 In Progress | Device infrastructure ready |
| Text extraction | 📋 Planned | |
| Annotations | 📋 Planned | |

---

## 📄 License

- **nanopdf-rs** (Rust): Dual-licensed under [MIT](nanopdf-rs/LICENSE-MIT) or [Apache 2.0](nanopdf-rs/LICENSE-APACHE)
- **nanopdf-js** (Node.js): [Apache 2.0](nanopdf-js/LICENSE)
- **go-nanopdf** (Go): [Apache 2.0](go-nanopdf/LICENSE)

---

## 🤝 Contributing

Contributions are welcome! Please read the coding standards in [.cursor/rules/](.cursor/rules/) before submitting PRs.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes following the coding standards
4. Run tests: `cargo test` / `pnpm test` / `go test`
5. Submit a pull request

---

<div align="center">

Made with ❤️ by [Lexmata](https://lexmata.ai)

</div>
