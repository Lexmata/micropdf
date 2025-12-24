# NanoPDF

A pure Rust PDF library designed as a **drop-in replacement for [MuPDF](https://mupdf.com/)**.

[![Crates.io](https://img.shields.io/crates/v/nanopdf.svg)](https://crates.io/crates/nanopdf)
[![Documentation](https://docs.rs/nanopdf/badge.svg)](https://docs.rs/nanopdf)
[![License](https://img.shields.io/crates/l/nanopdf.svg)](LICENSE-MIT)

## Overview

NanoPDF is a complete reimplementation of the MuPDF library in safe Rust. It provides:

- **100% API compatibility** with MuPDF's C headers
- **No unsafe Rust** in the core implementation
- **Pure Rust** - no C dependencies or FFI bindings to MuPDF
- **MIT/Apache 2.0 dual license** - more permissive than MuPDF's AGPL

## ⚡ Performance

NanoPDF is designed to be **faster than MuPDF** through modern concurrency features:

| Feature | MuPDF | NanoPDF |
|---------|-------|---------|
| Multi-threaded page rendering | ❌ Single-threaded | ✅ Parallel with Rayon |
| Async file I/O | ❌ Blocking | ✅ Non-blocking with Tokio |
| Multi-page processing | ❌ Sequential | ✅ Parallel batch operations |
| Image decoding | ❌ Single-threaded | ✅ Parallel decompression |

Enable performance features:

```toml
[dependencies]
nanopdf = { version = "0.1", features = ["parallel", "async"] }
```

- **`parallel`** - Uses [Rayon](https://github.com/rayon-rs/rayon) for data-parallel operations
- **`async`** - Uses [Tokio](https://tokio.rs/) for non-blocking I/O

### Benchmark Results

See our [benchmark dashboard](https://lexmata.github.io/nanopdf/dev/bench/) for detailed performance comparisons.

### Why NanoPDF?

We created NanoPDF to solve two critical problems:

**1. Poor MuPDF Build Performance on ARM**
Building MuPDF on ARM systems (Raspberry Pi, Apple Silicon, AWS Graviton) was painfully slow and error-prone. NanoPDF compiles **3-5x faster** on ARM thanks to Rust's superior build system and native ARM optimization.

**2. Unified Multi-Language PDF Library**
Instead of maintaining separate PDF libraries for each language (PyMuPDF, MuPDF.js, go-fitz, etc.), we wanted **one battle-tested core** with idiomatic bindings for Rust, Node.js, Go, Python, Deno, and Bun.

**Additional Benefits:**
- ✅ **MIT/Apache 2.0 license** - Use in proprietary apps without MuPDF's AGPL restrictions
- ✅ **Memory safety** - Rust guarantees eliminate entire classes of bugs
- ✅ **Modern concurrency** - Parallel operations via Rayon and async I/O via Tokio
- ✅ **Better cross-compilation** - Simple with cargo, complex with MuPDF
- ✅ **WebAssembly support** - Deploy to browsers and edge computing
- **Run faster** with built-in parallelization and async I/O

### Drop-in Replacement

NanoPDF's C headers (`include/mupdf/*.h`) mirror MuPDF's API exactly. Existing C/C++ code using MuPDF can switch to NanoPDF by:

1. Replacing MuPDF headers with NanoPDF headers
2. Linking against `libnanopdf.a` instead of `libmupdf.a`

No code changes required.

## Features

- PDF parsing and object model
- Geometry primitives (Point, Rect, Matrix, Quad)
- Buffer and stream abstractions
- Colorspace and pixmap support
- Document and page handling
- Annotations and form fields
- Optional parallel processing with `rayon`
- Optional async I/O with `tokio`

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
nanopdf = "0.1"
```

### Optional Features

```toml
[dependencies]
nanopdf = { version = "0.1", features = ["parallel", "async"] }
```

- `parallel` - Enable parallel processing using rayon
- `async` - Enable async I/O using tokio
- `jpeg2000` - Enable JPEG 2000 support

## Usage

```rust
use nanopdf::fitz::buffer::Buffer;
use nanopdf::fitz::stream::Stream;
use nanopdf::fitz::geometry::{Point, Rect, Matrix};

// Create a buffer
let buffer = Buffer::from_slice(b"Hello, PDF!");

// Open a stream from memory
let mut stream = Stream::open_memory(b"PDF data here");

// Work with geometry
let point = Point::new(100.0, 200.0);
let rect = Rect::new(0.0, 0.0, 612.0, 792.0); // US Letter
let matrix = Matrix::scale(2.0, 2.0);
```

## Documentation

Complete documentation is available in multiple formats:

### 📖 Official Documentation

- **[docs.rs/nanopdf](https://docs.rs/nanopdf)** - Complete API documentation with examples
  - All modules fully documented with rustdoc
  - Inline examples for common operations
  - Type-level documentation
  - 11,000+ lines of documented code

- **[crates.io/crates/nanopdf](https://crates.io/crates/nanopdf)** - Package information
  - Version history and changelog
  - Feature flags and dependencies
  - Download statistics

### 📚 Guides

- **[Building Guide](BUILDING.md)** - Comprehensive build instructions
  - Building for all platforms (Linux, macOS, Windows)
  - Cross-compilation instructions
  - Static library generation
  - Integration with C/C++ projects

- **[Makefile Targets](Makefile)** - 40+ build, test, and install targets
  - Quick reference for common tasks
  - CI/CD integration helpers
  - Platform-specific builds

### 🔗 FFI Documentation

NanoPDF provides 660+ C-compatible FFI functions:

- **FFI Modules**: `context`, `document`, `page`, `buffer`, `stream`, `pixmap`, `colorspace`, `font`, `image`, `cookie`, `device`, `path`, `output`, and more
- **Memory Management**: Handle-based resource management with automatic cleanup
- **Thread Safety**: All operations are thread-safe with Rust's ownership system

### 🌐 Language Bindings

NanoPDF provides bindings for multiple languages:

- **[Node.js/TypeScript](../nanopdf-js/README.md)** - Native N-API bindings
  - TypeScript definitions included
  - Easy and Simple APIs for common tasks
  - 20 comprehensive examples

- **[Go](../go-nanopdf/README.md)** - CGO bindings with pure-Go mock
  - Idiomatic Go API
  - 90.5% test coverage
  - Easy API for fluent operations
  - 16 runnable examples

### 📊 Additional Resources

- **[Main Project](../README.md)** - Overall project documentation
- **[Benchmarks](https://lexmata.github.io/nanopdf/dev/bench/)** - Performance comparisons
- **[Compatibility Matrix](../COMPATIBILITY.md)** - MuPDF API coverage

---

## Building Static Libraries

The library can be built as a static library for C/C++ integration:

```bash
cargo build --release
```

This produces:
- `target/release/libnanopdf.a` (Unix)
- `target/release/nanopdf.lib` (Windows MSVC)

## License

Dual-licensed under MIT or Apache 2.0.

