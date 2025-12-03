# NanoPDF

<div align="center">

**A pure Rust PDF library — faster than MuPDF**

[![Crates.io](https://img.shields.io/crates/v/nanopdf.svg)](https://crates.io/crates/nanopdf)
[![Documentation](https://docs.rs/nanopdf/badge.svg)](https://docs.rs/nanopdf)
[![CI](https://github.com/lexmata/nanopdf/actions/workflows/ci.yml/badge.svg)](https://github.com/lexmata/nanopdf/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](LICENSE-MIT)

[Documentation](https://docs.rs/nanopdf) · [Crates.io](https://crates.io/crates/nanopdf) · [Benchmarks](https://lexmata.github.io/nanopdf/dev/bench/)

</div>

---

## ⚡ Why NanoPDF?

NanoPDF is a **drop-in replacement for MuPDF** that runs **faster** through modern concurrency:

| Feature | MuPDF | NanoPDF |
|---------|-------|---------|
| Page rendering | Single-threaded | ✅ **Parallel with Rayon** |
| File I/O | Blocking | ✅ **Async with Tokio** |
| Multi-page processing | Sequential | ✅ **Parallel batch ops** |
| Image decoding | Single-threaded | ✅ **Parallel decompression** |
| License | AGPL (restrictive) | ✅ **MIT/Apache 2.0** |
| Memory safety | Manual (C) | ✅ **Guaranteed (Rust)** |

## 📦 Packages

This monorepo contains:

| Package | Description | License | Status |
|---------|-------------|---------|--------|
| [`nanopdf-rs`](./nanopdf-rs) | Core Rust library | MIT/Apache-2.0 | [![Crates.io](https://img.shields.io/crates/v/nanopdf.svg)](https://crates.io/crates/nanopdf) |
| [`nanopdf-js`](./nanopdf-js) | Node.js bindings | Apache-2.0 | [![npm](https://img.shields.io/npm/v/nanopdf.svg)](https://www.npmjs.com/package/nanopdf) |
| [`go-nanopdf`](./go-nanopdf) | Go bindings | Apache-2.0 | [![Go Reference](https://pkg.go.dev/badge/github.com/lexmata/nanopdf/go-nanopdf.svg)](https://pkg.go.dev/github.com/lexmata/nanopdf/go-nanopdf) |

## 🚀 Quick Start

### Rust

```toml
[dependencies]
nanopdf = { version = "0.1", features = ["parallel", "async"] }
```

```rust
use nanopdf::fitz::{Buffer, Stream};
use nanopdf::fitz::geometry::{Point, Rect, Matrix};

// Work with PDF geometry
let rect = Rect::new(0.0, 0.0, 612.0, 792.0); // US Letter
let matrix = Matrix::scale(2.0, 2.0);
```

### Node.js

```bash
pnpm add nanopdf
```

```typescript
import { NanoPDF } from 'nanopdf';

const pdf = new NanoPDF();
const pageCount = pdf.getPageCount('document.pdf');
```

### Go

```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

```go
import "github.com/lexmata/nanopdf/go-nanopdf"

pdf := nanopdf.New()
pageCount := pdf.GetPageCount("document.pdf")
```

## 🔄 Drop-in MuPDF Replacement

NanoPDF provides **100% API compatible** C headers. Existing C/C++ code can switch by:

1. Replace `#include <mupdf/...>` with NanoPDF headers
2. Link against `libnanopdf.a` instead of `libmupdf.a`

**No code changes required.**

## 📊 Benchmarks

View live performance data: **[lexmata.github.io/nanopdf/dev/bench](https://lexmata.github.io/nanopdf/dev/bench/)**

## 📋 Compatibility

See [COMPATIBILITY.md](./COMPATIBILITY.md) for detailed MuPDF API coverage.

## 📄 License

- **nanopdf-rs** (Rust): Dual-licensed under [MIT](nanopdf-rs/LICENSE-MIT) or [Apache 2.0](nanopdf-rs/LICENSE-APACHE)
- **nanopdf-js** (Node.js): [Apache 2.0](nanopdf-js/LICENSE)
- **go-nanopdf** (Go): [Apache 2.0](go-nanopdf/LICENSE)

---

<div align="center">
Made with ❤️ by <a href="https://lexmata.com">Lexmata</a>
</div>

