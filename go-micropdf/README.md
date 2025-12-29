# MicroPDF for Go

<div align="center">

**High-performance PDF manipulation library for Go**

[![Go Reference](https://pkg.go.dev/badge/github.com/lexmata/micropdf/go-micropdf.svg)](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf)
[![Go Report Card](https://goreportcard.com/badge/github.com/lexmata/micropdf/go-micropdf)](https://goreportcard.com/report/github.com/lexmata/micropdf/go-micropdf)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-%3E%3D1.19-blue.svg)](https://golang.org/dl/)

[Features](#features) • [Installation](#installation) • [Easy API](#easy-api) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples) • [API Reference](#api-reference)

</div>

---

## Overview

MicroPDF is a powerful PDF manipulation library for Go, built on top of MuPDF with native CGO bindings for optimal performance. It provides a clean, idiomatic Go API for reading, rendering, and manipulating PDF documents.

### Key Features

- 🚀 **High Performance** - Native C/Rust bindings via CGO for fast PDF operations
- 📄 **Complete PDF Support** - Read, render, and manipulate PDF documents
- 🎨 **Page Rendering** - Render pages to images with custom resolution
- 📝 **Text Extraction** - Extract text with layout information and search capabilities
- 🔒 **Security** - Password protection and permission checking
- 🎯 **Type-Safe** - Strong typing with comprehensive error handling
- 🧩 **Pure Go Fallback** - Mock implementation for CGO-disabled environments
- 🔧 **Cross-Platform** - Works on Linux, macOS, and Windows
- ✅ **Well-Tested** - 90.5% test coverage with unit and integration tests

### What You Can Do

- ✅ Open and read PDF documents from files or bytes
- ✅ Render pages to images (PNG, pixmaps)
- ✅ Extract text content with layout information
- ✅ Search text within pages
- ✅ Read document metadata (title, author, keywords, etc.)
- ✅ Check and authenticate password-protected PDFs
- ✅ Work with geometry (points, rectangles, matrices)
- ✅ Access page dimensions and bounds
- ✅ Save and write modified PDFs
- ✅ Resolve named destinations

---

## Easy API

MicroPDF provides a simplified, ergonomic API for common PDF tasks:

```go
import "github.com/lexmata/micropdf/go-micropdf/easy"

// Extract text (single line!)
text, _ := easy.ExtractText("document.pdf")

// Render to PNG
easy.RenderToPNG("document.pdf", "output.png", 0, 300)

// Get info
info, _ := easy.GetInfo("document.pdf")
fmt.Printf("%d pages\n", info.PageCount)

// Fluent API with automatic cleanup
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

pageCount := pdf.PageCount()
text, _ := pdf.ExtractAllText()
pdf.RenderToFile(0, "page.png", easy.RenderOptions{DPI: 300})
```

**See [EASY_API.md](EASY_API.md) for complete documentation and examples.**

---

## Installation

### From Go Modules

```bash
go get github.com/lexmata/micropdf/go-micropdf
```

### Requirements

- **Go** >= 1.19
- **CGO** (optional, for native performance)
- **For building from source**: Rust toolchain (install from [rustup.rs](https://rustup.rs))

### With Native Library (CGO)

For full native performance, you need the compiled MicroPDF library:

1. **Build the Rust library**:
   ```bash
   cd micropdf-rs
   cargo build --release
   ```

2. **Install the library** (one of these methods):

   **Option A: System-wide installation**
   ```bash
   cd micropdf-rs
   sudo make install
   ```

   **Option B: Copy to Go project**
   ```bash
   # Linux (amd64)
   mkdir -p go-micropdf/lib/linux_amd64
   cp micropdf-rs/target/release/libmicropdf.a go-micropdf/lib/linux_amd64/

   # macOS (arm64)
   mkdir -p go-micropdf/lib/darwin_arm64
   cp micropdf-rs/target/release/libmicropdf.a go-micropdf/lib/darwin_arm64/

   # Windows (amd64)
   mkdir -p go-micropdf/lib/windows_amd64
   cp micropdf-rs/target/release/micropdf.lib go-micropdf/lib/windows_amd64/
   ```

### Without CGO (Pure Go Mock)

The library includes a pure Go mock implementation for environments where CGO is not available:

```bash
# Build without CGO
CGO_ENABLED=0 go build

# Or use build tag
go build -tags mock
```

**Note**: Mock mode provides API compatibility but does not perform actual PDF operations.

### Supported Platforms

| Platform | Architecture | CGO | Mock |
|----------|-------------|-----|------|
| Linux | x64 | ✅ | ✅ |
| Linux | ARM64 | ✅ | ✅ |
| macOS | x64 | ✅ | ✅ |
| macOS | ARM64 (M1/M2) | ✅ | ✅ |
| Windows | x64 | ✅ | ✅ |

---

## Quick Start

### Opening and Reading a PDF

```go
package main

import (
    "fmt"
    "log"
    micropdf "github.com/lexmata/micropdf/go-micropdf"
)

func main() {
    // Create context (required for all PDF operations)
    ctx := micropdf.NewContext()
    if ctx == nil {
        log.Fatal("Failed to create context")
    }
    defer ctx.Drop()

    // Open PDF document
    doc, err := micropdf.OpenDocument(ctx, "document.pdf")
    if err != nil {
        log.Fatalf("Failed to open PDF: %v", err)
    }
    defer doc.Drop()

    // Get page count
    pageCount, err := doc.PageCount()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Pages: %d\n", pageCount)

    // Get metadata
    title, _ := doc.GetMetadata("Title")
    author, _ := doc.GetMetadata("Author")
    fmt.Printf("Title: %s\nAuthor: %s\n", title, author)

    // Load and inspect first page
    page, err := doc.LoadPage(0)
    if err != nil {
        log.Fatal(err)
    }
    defer page.Drop()

    bounds := page.Bounds()
    fmt.Printf("Page size: %.2f x %.2f points\n",
        bounds.Width(), bounds.Height())
}
```

### Extracting Text

```go
page, err := doc.LoadPage(0)
if err != nil {
    log.Fatal(err)
}
defer page.Drop()

// Extract all text
text, err := page.ExtractText()
if err != nil {
    log.Fatal(err)
}
fmt.Println(text)

// Search for text
results, err := page.SearchText("keyword")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Found %d occurrences\n", len(results))
```

### Rendering a Page

```go
page, err := doc.LoadPage(0)
if err != nil {
    log.Fatal(err)
}
defer page.Drop()

// Render at 150 DPI
pngData, err := page.RenderToPNG(150)
if err != nil {
    log.Fatal(err)
}

// Save to file
err = os.WriteFile("output.png", pngData, 0644)
if err != nil {
    log.Fatal(err)
}
```

### Password-Protected PDFs

```go
doc, err := micropdf.OpenDocument(ctx, "protected.pdf")
if err != nil {
    log.Fatal(err)
}
defer doc.Drop()

// Check if password is needed
needsPassword, _ := doc.NeedsPassword()
if needsPassword {
    success, _ := doc.Authenticate("password123")
    if !success {
        log.Fatal("Invalid password")
    }
}

// Check permissions
canPrint, _ := doc.HasPermission(4) // FZ_PERMISSION_PRINT
fmt.Printf("Can print: %v\n", canPrint)
```

---

## Documentation

### Package Documentation

Complete API documentation is available on [pkg.go.dev](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf).

All types and functions include detailed documentation with examples.

### Architecture

```
┌──────────────────────────────────────┐
│   Go API (micropdf package)          │
│   - Context, Document, Page, etc.   │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   CGO Bindings (native_cgo.go)      │
│   - C function calls                 │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   Rust FFI (libmicropdf.a)           │
│   - 660+ C-compatible functions      │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   MuPDF Library                      │
│   - Core PDF processing              │
└──────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

### Test Coverage

| Module | Coverage | Tests |
|--------|----------|-------|
| **buffer** | 95.2% | 15 tests |
| **context** | 100.0% | 4 tests |
| **document** | 95.0% | 15 tests |
| **page** | 88.9% | 12 tests |
| **pixmap** | 90.9% | 8 tests |
| **geometry** | 98.5% | 18 tests |
| **errors** | 100.0% | 11 tests |
| **Overall** | **90.5%** | **83 unit tests + 60 integration tests** |

---

## Examples

### Example 1: Process All Pages

```go
ctx := micropdf.NewContext()
defer ctx.Drop()

doc, err := micropdf.OpenDocument(ctx, "document.pdf")
if err != nil {
    log.Fatal(err)
}
defer doc.Drop()

pageCount, _ := doc.PageCount()

for i := int32(0); i < pageCount; i++ {
    page, err := doc.LoadPage(i)
    if err != nil {
        log.Printf("Error loading page %d: %v", i, err)
        continue
    }

    // Extract text
    text, _ := page.ExtractText()
    fmt.Printf("=== Page %d ===\n%s\n\n", i+1, text)

    page.Drop()
}
```

### Example 2: Create Thumbnails

```go
ctx := micropdf.NewContext()
defer ctx.Drop()

doc, err := micropdf.OpenDocument(ctx, "document.pdf")
if err != nil {
    log.Fatal(err)
}
defer doc.Drop()

pageCount, _ := doc.PageCount()

for i := int32(0); i < pageCount; i++ {
    page, err := doc.LoadPage(i)
    if err != nil {
        continue
    }

    // Render at low resolution for thumbnail (72 DPI)
    pngData, err := page.RenderToPNG(72)
    if err != nil {
        page.Drop()
        continue
    }

    // Save thumbnail
    filename := fmt.Sprintf("thumb_%d.png", i+1)
    os.WriteFile(filename, pngData, 0644)

    page.Drop()
}
```

### Example 3: Search Across Document

```go
ctx := micropdf.NewContext()
defer ctx.Drop()

doc, err := micropdf.OpenDocument(ctx, "document.pdf")
if err != nil {
    log.Fatal(err)
}
defer doc.Drop()

searchTerm := "important"
totalHits := 0

pageCount, _ := doc.PageCount()

for i := int32(0); i < pageCount; i++ {
    page, err := doc.LoadPage(i)
    if err != nil {
        continue
    }

    results, err := page.SearchText(searchTerm)
    if err != nil {
        page.Drop()
        continue
    }

    if len(results) > 0 {
        fmt.Printf("Page %d: %d occurrences\n", i+1, len(results))
        totalHits += len(results)
    }

    page.Drop()
}

fmt.Printf("\nTotal: %d occurrences found\n", totalHits)
```

### Example 4: Custom Rendering

```go
page, err := doc.LoadPage(0)
if err != nil {
    log.Fatal(err)
}
defer page.Drop()

// Create custom transform (2x scale + rotation)
scale := micropdf.MatrixScale(2.0, 2.0)
rotate := micropdf.MatrixRotate(45)
transform := scale.Concat(rotate)

// Render with transform
pix, err := page.RenderToPixmap(transform, true) // true = include alpha
if err != nil {
    log.Fatal(err)
}
defer pix.Drop()

// Get pixel data
width, _ := pix.Width()
height, _ := pix.Height()
samples, _ := pix.Samples()

fmt.Printf("Rendered: %dx%d pixels (%d bytes)\n",
    width, height, len(samples))

// Write as PNG
pngData, _ := pix.WritePNG()
os.WriteFile("custom.png", pngData, 0644)
```

See the [examples/](examples/) directory for complete working examples.

---

## Documentation

Complete documentation is available in multiple formats:

### 📖 Official Documentation

- **[pkg.go.dev/github.com/lexmata/micropdf/go-micropdf](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf)** - Complete godoc API reference with examples
- **[Easy API Guide](EASY_API.md)** - Simplified, fluent API for common tasks (16 examples)
- **[Architecture Guide](ARCHITECTURE.md)** - System design, CGO integration, memory management
- **[Contributing Guide](CONTRIBUTING.md)** - Development setup, coding standards, PR process

### 📚 Examples

- **[examples/](examples/)** - 16 runnable examples covering all major features:
  - Basic document operations
  - Page rendering and image export
  - Text extraction and search
  - Batch processing
  - Easy API usage patterns

### 🔗 Module Documentation

Each FFI module has complete godoc documentation:

- **[micropdf](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf)** - Core package
- **[easy](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf/easy)** - Simplified API
- **[example](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf/example)** - Example programs
- **[examples](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf/examples)** - Additional examples

### 🔧 Related Documentation

- **[Rust Core Library](../micropdf-rs/README.md)** - Core PDF engine documentation
- **[Node.js Bindings](../micropdf-js/README.md)** - Alternative language bindings
- **[Main Project](../README.md)** - Overall project documentation

---

## API Reference

### Context

```go
// Create and manage rendering context
ctx := micropdf.NewContext()      // Create new context
defer ctx.Drop()                  // Free resources (IMPORTANT!)

cloned := ctx.Clone()             // Clone context
ctx.IsValid()                     // Check if valid
handle := ctx.Handle()            // Get internal handle
```

### Document

```go
// Open documents
doc, err := micropdf.OpenDocument(ctx, "file.pdf")
doc, err := micropdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
defer doc.Drop() // IMPORTANT!

// Properties
pageCount, err := doc.PageCount()        // Number of pages
needsPw, err := doc.NeedsPassword()      // Check if encrypted
ok, err := doc.Authenticate("password")  // Authenticate

// Metadata
title, err := doc.GetMetadata("Title")   // Get metadata
// Keys: "Title", "Author", "Subject", "Keywords", "Creator", "Producer"

// Permissions
hasPerm, err := doc.HasPermission(perm)  // Check permission
// Permissions: FZ_PERMISSION_PRINT (4), FZ_PERMISSION_COPY (16), etc.

// Operations
page, err := doc.LoadPage(pageNum)       // Load page (0-based)
err := doc.Save("output.pdf")            // Save document
pageNum, err := doc.ResolveLink("dest")  // Resolve named destination

// Status
doc.IsValid()                            // Check if valid
```

### Page

```go
page, err := doc.LoadPage(0)
defer page.Drop() // IMPORTANT!

// Properties
pageNum := page.PageNumber()             // Page number (0-based)
bounds := page.Bounds()                  // Page bounds (Rect)

// Rendering
pix, err := page.RenderToPixmap(matrix, alpha)  // Render to pixmap
pngData, err := page.RenderToPNG(dpi)   // Render to PNG (convenience)

// Text operations
text, err := page.ExtractText()          // Extract all text
blocks, err := page.ExtractTextBlocks()  // Structured text with layout
results, err := page.SearchText("text")  // Search (returns []Rect)

// Status
page.IsValid()                           // Check if valid
```

### Pixmap

```go
pix, err := page.RenderToPixmap(matrix, alpha)
defer pix.Drop() // IMPORTANT!

// Properties
width, err := pix.Width()                // Width in pixels
height, err := pix.Height()              // Height in pixels
n, err := pix.N()                        // Components per pixel
hasAlpha, err := pix.Alpha()             // Has alpha channel?

// Data access
samples, err := pix.Samples()            // Raw pixel data ([]byte)
pngData, err := pix.WritePNG()           // Export as PNG

// Status
pix.IsValid()                            // Check if valid
```

### Buffer

```go
// Create buffers
buf := micropdf.NewBuffer(1024)           // With capacity
buf := micropdf.NewBufferFromBytes(data)  // From bytes
buf := micropdf.NewBufferFromString(str)  // From string
defer buf.Free() // IMPORTANT!

// Properties
length := buf.Len()                      // Number of bytes
isEmpty := buf.IsEmpty()                 // Check if empty

// Data access
data := buf.Bytes()                      // Get as []byte
str := buf.String()                      // Get as string

// Modification
buf.Append(data)                         // Append bytes
buf.AppendString(str)                    // Append string
buf.AppendByte(b)                        // Append single byte
buf.Clear()                              // Remove all data

// Operations
cloned := buf.Clone()                    // Create copy
```

### Geometry

```go
// Point
p := micropdf.NewPoint(x, y)
p.Transform(matrix)                      // Transform by matrix
distance := p.Distance(other)            // Calculate distance
sum := p.Add(other)                      // Add points
diff := p.Sub(other)                     // Subtract points
scaled := p.Scale(factor)                // Scale
equal := p.Equals(other)                 // Check equality

// Rect
r := micropdf.NewRect(x0, y0, x1, y1)
r := micropdf.NewRectFromXYWH(x, y, w, h) // From position and size
width := r.Width()                       // Width
height := r.Height()                     // Height
isEmpty := r.IsEmpty()                   // Check if empty
contains := r.Contains(point)            // Check if point inside
union := r.Union(other)                  // Union
intersection := r.Intersect(other)       // Intersection

// Matrix
m := micropdf.Identity                    // Identity matrix
m := micropdf.MatrixTranslate(tx, ty)     // Translation
m := micropdf.MatrixScale(sx, sy)         // Scaling
m := micropdf.MatrixRotate(degrees)       // Rotation
combined := m1.Concat(m2)                // Concatenate
transformed := m.TransformPoint(p)       // Transform point
transformedRect := m.TransformRect(r)    // Transform rectangle
```

---

## Building from Source

### Prerequisites

1. **Go** >= 1.19
2. **Rust toolchain** (install from [rustup.rs](https://rustup.rs))
3. **Build tools**:
   - Linux: `build-essential`, `pkg-config`
   - macOS: Xcode Command Line Tools
   - Windows: Visual Studio Build Tools

### Build Steps

```bash
# 1. Build Rust library
cd micropdf-rs
cargo build --release

# 2. Install system-wide (recommended)
sudo make install

# OR copy to Go project directory
mkdir -p ../go-micropdf/lib/linux_amd64
cp target/release/libmicropdf.a ../go-micropdf/lib/linux_amd64/

# 3. Build and test Go bindings
cd ../go-micropdf
go build
go test ./...
```

---

## Development

### Running Tests

```bash
# Run all tests with CGO
go test ./...

# Run tests without CGO (mock mode)
CGO_ENABLED=0 go test ./...

# Run with coverage
go test -cover ./...

# Run integration tests only
go test -run Integration ./...

# Run in Docker
cd docker
./build-test.sh
```

### Docker Testing

```bash
cd docker

# Run all tests
./build-test.sh

# Run unit tests only
./build-test.sh --unit

# Run integration tests only
./build-test.sh --integration

# Interactive shell
./build-test.sh --shell
```

### Linting and Formatting

```bash
# Format code
go fmt ./...

# Run golangci-lint
golangci-lint run

# Run go vet
go vet ./...
```

---

## Troubleshooting

### CGO Build Errors

If you encounter CGO-related errors:

**Problem**: `undefined reference to 'fz_xxx'`

**Solution**: Ensure the Rust library is built and installed:
```bash
cd micropdf-rs
cargo build --release
sudo make install
```

**Problem**: `cannot find -lmicropdf`

**Solution**: Set CGO flags manually:
```bash
export CGO_LDFLAGS="-L/path/to/libmicropdf.a"
export CGO_CFLAGS="-I/path/to/include"
go build
```

### Runtime Errors

**Problem**: `Failed to create context`

**Solution**: Ensure you're not in mock mode or CGO is enabled:
```bash
CGO_ENABLED=1 go build
```

**Problem**: Memory leaks

**Solution**: Always call `Drop()` on objects:
```go
ctx := micropdf.NewContext()
defer ctx.Drop() // IMPORTANT!

doc, _ := micropdf.OpenDocument(ctx, "file.pdf")
defer doc.Drop() // IMPORTANT!
```

---

## Performance Tips

1. **Always clean up resources**:
   ```go
   defer ctx.Drop()
   defer doc.Drop()
   defer page.Drop()
   ```

2. **Reuse Context objects**:
   ```go
   ctx := micropdf.NewContext()
   defer ctx.Drop()

   // Process multiple documents with same context
   for _, file := range files {
       doc, _ := micropdf.OpenDocument(ctx, file)
       // ... process ...
       doc.Drop()
   }
   ```

3. **Use appropriate DPI**:
   - Thumbnails: 72 DPI
   - Screen display: 96-150 DPI
   - Print quality: 300+ DPI

4. **Process pages one at a time**:
   ```go
   // Good: Memory efficient
   for i := 0; i < pageCount; i++ {
       page, _ := doc.LoadPage(i)
       // ... process ...
       page.Drop() // Free immediately
   }

   // Bad: Uses too much memory
   var pages []*Page
   for i := 0; i < pageCount; i++ {
       pages = append(pages, doc.LoadPage(i))
   }
   // ... all pages in memory!
   ```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `go test ./...`
5. Run linters: `go fmt ./... && go vet ./...`
6. Commit: `git commit -m "feat: add my feature"`
7. Push: `git push origin feature/my-feature`
8. Create a Pull Request

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built on top of [MuPDF](https://mupdf.com/) - a lightweight PDF and XPS viewer
- Rust FFI layer provides high-performance C bindings

---

## Support

- 📚 **Documentation**: [pkg.go.dev](https://pkg.go.dev/github.com/lexmata/micropdf/go-micropdf)
- 🐛 **Issues**: [GitHub Issues](https://github.com/lexmata/micropdf/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/lexmata/micropdf/discussions)

---

## Roadmap

### Current Status (v0.1.0)

- ✅ PDF reading and basic operations
- ✅ Page rendering to images
- ✅ Text extraction
- ✅ Password/security support
- ✅ Geometry operations
- ✅ 90.5% test coverage

### Planned Features

- ⏳ **v0.2.0**: Advanced text operations (structured text, fonts)
- ⏳ **v0.3.0**: PDF forms support
- ⏳ **v0.4.0**: Annotations support
- ⏳ **v0.5.0**: PDF creation and modification
- ⏳ **v1.0.0**: Complete API parity with MuPDF

---

<div align="center">

**Made with ❤️ by the MicroPDF Team**

⭐ Star us on GitHub if you find this helpful!

</div>
