# NanoPDF Go Bindings

Go bindings for the NanoPDF PDF library.

## Installation

```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

## Requirements

### With Native Library (CGO)

For full native performance, you need the compiled NanoPDF library:

1. Build the Rust library:
   ```bash
   cd nanopdf-rs
   cargo build --release
   ```

2. Copy the static library to the appropriate directory:
   ```bash
   # Linux (amd64)
   mkdir -p go-nanopdf/lib/linux_amd64
   cp nanopdf-rs/target/release/libnanopdf.a go-nanopdf/lib/linux_amd64/

   # macOS (arm64)
   mkdir -p go-nanopdf/lib/darwin_arm64
   cp nanopdf-rs/target/release/libnanopdf.a go-nanopdf/lib/darwin_arm64/

   # Windows (amd64)
   mkdir -p go-nanopdf/lib/windows_amd64
   cp nanopdf-rs/target/release/nanopdf.lib go-nanopdf/lib/windows_amd64/
   ```

### Without CGO (Mock Mode)

The library includes a pure Go mock implementation for environments where CGO is not available. Build with:

```bash
CGO_ENABLED=0 go build
# or
go build -tags mock
```

## Usage

### Basic Usage

```go
package main

import (
    "fmt"
    "log"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    // Check version and mode
    fmt.Printf("NanoPDF version: %s\n", nanopdf.Version())
    fmt.Printf("Mock mode: %v\n", nanopdf.IsMock())

    // Work with buffers
    buf := nanopdf.NewBufferFromString("Hello, PDF!")
    defer buf.Free()
    fmt.Printf("Buffer length: %d\n", buf.Len())

    // Geometry operations
    p := nanopdf.NewPoint(100, 200)
    m := nanopdf.MatrixTranslate(50, 50)
    transformed := p.Transform(m)
    fmt.Printf("Transformed point: (%f, %f)\n", transformed.X, transformed.Y)
}
```

### Opening and Rendering PDFs

```go
package main

import (
    "fmt"
    "log"
    "os"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    // Create a context (required for all PDF operations)
    ctx := nanopdf.NewContext()
    if ctx == nil {
        log.Fatal("Failed to create context")
    }
    defer ctx.Drop()

    // Open a PDF file
    doc, err := nanopdf.OpenDocument(ctx, "input.pdf")
    if err != nil {
        log.Fatalf("Failed to open PDF: %v", err)
    }
    defer doc.Drop()

    // Get page count
    pageCount, err := doc.PageCount()
    if err != nil {
        log.Fatalf("Failed to get page count: %v", err)
    }
    fmt.Printf("Document has %d pages\n", pageCount)

    // Load first page
    page, err := doc.LoadPage(0)
    if err != nil {
        log.Fatalf("Failed to load page: %v", err)
    }
    defer page.Drop()

    // Get page bounds
    bounds := page.Bounds()
    fmt.Printf("Page size: %.2f x %.2f\n", bounds.Width(), bounds.Height())

    // Extract text from page
    text, err := page.ExtractText()
    if err != nil {
        log.Fatalf("Failed to extract text: %v", err)
    }
    fmt.Printf("Extracted text: %s\n", text)

    // Search for text
    results, err := page.SearchText("search term")
    if err != nil {
        log.Fatalf("Failed to search: %v", err)
    }
    fmt.Printf("Found %d matches\n", len(results))

    // Render page to PNG at 150 DPI
    pngData, err := page.RenderToPNG(150)
    if err != nil {
        log.Fatalf("Failed to render: %v", err)
    }

    // Save PNG
    err = os.WriteFile("output.png", pngData, 0644)
    if err != nil {
        log.Fatalf("Failed to save PNG: %v", err)
    }
}
```

### Working with Metadata and Security

```go
package main

import (
    "fmt"
    "log"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    ctx := nanopdf.NewContext()
    defer ctx.Drop()

    doc, err := nanopdf.OpenDocument(ctx, "input.pdf")
    if err != nil {
        log.Fatal(err)
    }
    defer doc.Drop()

    // Check if password is needed
    needsPassword, _ := doc.NeedsPassword()
    if needsPassword {
        success, _ := doc.Authenticate("password")
        if !success {
            log.Fatal("Invalid password")
        }
    }

    // Get metadata
    title, _ := doc.GetMetadata("Title")
    author, _ := doc.GetMetadata("Author")
    fmt.Printf("Title: %s\nAuthor: %s\n", title, author)

    // Check permissions
    canPrint, _ := doc.HasPermission(4) // FZ_PERMISSION_PRINT
    fmt.Printf("Can print: %v\n", canPrint)
}
```

### Advanced Rendering with Pixmaps

```go
package main

import (
    "log"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    ctx := nanopdf.NewContext()
    defer ctx.Drop()

    doc, _ := nanopdf.OpenDocument(ctx, "input.pdf")
    defer doc.Drop()

    page, _ := doc.LoadPage(0)
    defer page.Drop()

    // Create a custom transform (2x scale + rotation)
    scale := nanopdf.MatrixScale(2.0, 2.0)
    rotate := nanopdf.MatrixRotate(45)
    transform := scale.Concat(rotate)

    // Render to pixmap with custom transform
    pix, err := page.RenderToPixmap(transform, true) // true = include alpha
    if err != nil {
        log.Fatal(err)
    }
    defer pix.Drop()

    // Get pixmap dimensions
    width, _ := pix.Width()
    height, _ := pix.Height()

    // Get raw pixel data
    samples, _ := pix.Samples()

    // Process pixel data...
    _ = samples
}
```

## API Reference

### Context

```go
// Create and manage rendering context
ctx := nanopdf.NewContext()      // Create new context
defer ctx.Drop()                  // Free resources

ctx.Clone()                       // Clone context
ctx.IsValid()                     // Check if valid
ctx.Handle()                      // Get internal handle
```

### Document

```go
// Open documents
doc, err := nanopdf.OpenDocument(ctx, "file.pdf")
doc, err := nanopdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
defer doc.Drop()

// Document operations
count, err := doc.PageCount()            // Get number of pages
page, err := doc.LoadPage(0)             // Load a page (0-based)

// Security
needsPw, err := doc.NeedsPassword()      // Check if encrypted
ok, err := doc.Authenticate("password")  // Authenticate
hasPerm, err := doc.HasPermission(perm)  // Check permission

// Metadata
value, err := doc.GetMetadata("Title")   // Get metadata
// Keys: "Title", "Author", "Subject", "Keywords", "Creator", "Producer"

// Save
err := doc.Save("output.pdf")            // Save document

// Named destinations
pageNum, err := doc.ResolveLink("name")  // Resolve named destination

doc.IsValid()                            // Check if valid
```

### Page

```go
page, err := doc.LoadPage(0)
defer page.Drop()

// Page properties
page.PageNumber()                        // Get page number (0-based)
bounds := page.Bounds()                  // Get page bounds (Rect)

// Rendering
pix, err := page.RenderToPixmap(matrix, alpha)  // Render to pixmap
pngData, err := page.RenderToPNG(dpi)   // Render directly to PNG

// Text operations
text, err := page.ExtractText()          // Extract all text
results, err := page.SearchText("text")  // Search for text (returns []Rect)

page.IsValid()                           // Check if valid
```

### Pixmap

```go
pix, err := page.RenderToPixmap(matrix, alpha)
defer pix.Drop()

// Pixmap properties
width, err := pix.Width()                // Get width in pixels
height, err := pix.Height()              // Get height in pixels
samples, err := pix.Samples()            // Get raw pixel data ([]byte)

pix.IsValid()                            // Check if valid
```

### Buffer

```go
// Create buffers
buf := nanopdf.NewBuffer(1024)           // With capacity
buf := nanopdf.NewBufferFromBytes(data)  // From bytes
buf := nanopdf.NewBufferFromString(s)    // From string

// Properties and methods
buf.Len()            // Number of bytes
buf.IsEmpty()        // Check if empty
buf.Bytes()          // Get data as []byte
buf.String()         // Get data as string
buf.Append(data)     // Append bytes
buf.AppendString(s)  // Append string
buf.AppendByte(b)    // Append single byte
buf.Clear()          // Remove all data
buf.Clone()          // Create a copy
buf.Free()           // Release resources (call in defer)
```

### Point

```go
p := nanopdf.NewPoint(x, y)
p.Transform(matrix)   // Transform by matrix
p.Distance(other)     // Calculate distance
p.Add(other)          // Add points
p.Sub(other)          // Subtract points
p.Scale(factor)       // Scale
p.Equals(other)       // Check equality
```

### Rect

```go
r := nanopdf.NewRect(x0, y0, x1, y1)
r := nanopdf.NewRectFromXYWH(x, y, w, h)  // From position and size
r.Width()             // Width
r.Height()            // Height
r.IsEmpty()           // Check if empty
r.IsInfinite()        // Check if infinite
r.Contains(point)     // Check if point inside
r.ContainsXY(x, y)    // Check coordinates
r.Union(other)        // Union with another rect
r.Intersect(other)    // Intersection
r.IncludePoint(p)     // Expand to include point
r.Translate(dx, dy)   // Move by offset
r.Scale(sx, sy)       // Scale
r.ToIRect()           // Convert to integer rect
```

### Matrix

```go
nanopdf.Identity                          // Identity matrix
nanopdf.MatrixTranslate(tx, ty)           // Translation
nanopdf.MatrixScale(sx, sy)               // Scaling
nanopdf.MatrixRotate(degrees)             // Rotation
nanopdf.MatrixShear(sx, sy)               // Shearing

m.Concat(other)                           // Concatenate
m.PreTranslate(tx, ty)                    // Pre-multiply translate
m.PostTranslate(tx, ty)                   // Post-multiply translate
m.PreScale(sx, sy)                        // Pre-multiply scale
m.PostScale(sx, sy)                       // Post-multiply scale
m.PreRotate(degrees)                      // Pre-multiply rotate
m.PostRotate(degrees)                     // Post-multiply rotate
m.TransformPoint(p)                       // Transform a point
m.TransformRect(r)                        // Transform a rectangle
```

### Quad

```go
q := nanopdf.NewQuad(ul, ur, ll, lr)      // From four corners
q := nanopdf.QuadFromRect(r)              // From rectangle
q.Transform(matrix)                        // Transform all corners
q.Bounds()                                 // Get bounding rectangle
```

## Testing

```bash
# Run tests with mock implementation
CGO_ENABLED=0 go test ./...

# Run tests with native library (requires libnanopdf.a)
go test ./...
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

