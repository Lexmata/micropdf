# NanoPDF

A native Rust PDF library inspired by MuPDF.

## Features

- PDF parsing and object model
- Geometry primitives (Point, Rect, Matrix, Quad)
- Buffer and stream abstractions
- Colorspace and pixmap support
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

