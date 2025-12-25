# NanoPDF Easy API (Go)

The Easy API provides a simplified, ergonomic interface for common PDF operations with automatic resource management and intuitive method chaining.

## Overview

NanoPDF Go offers two API levels:

1. **Easy API** - Simplified functions and fluent builder (recommended for most users)
2. **Core API** - Full control (advanced users, maximum flexibility)

## Installation

```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

## Quick Start

### Simple Functions

The simplest way to work with PDFs:

```go
import "github.com/lexmata/nanopdf/go-nanopdf/easy"

// Extract text
text, err := easy.ExtractText("document.pdf")
if err != nil {
    log.Fatal(err)
}
fmt.Println(text)

// Render to PNG
err = easy.RenderToPNG("document.pdf", "output.png", 0, 300)
if err != nil {
    log.Fatal(err)
}

// Get page count
pages, _ := easy.GetPageCount("document.pdf")
fmt.Printf("Document has %d pages\n", pages)

// Search for text
results, _ := easy.Search("document.pdf", "important")
fmt.Printf("Found on pages: %v\n", results)
```

### Fluent Builder API

More powerful with automatic cleanup:

```go
import "github.com/lexmata/nanopdf/go-nanopdf/easy"

// Automatic resource management
pdf, err := easy.Open("document.pdf")
if err != nil {
    log.Fatal(err)
}
defer pdf.Close()

pageCount := pdf.PageCount()
text, _ := pdf.ExtractAllText()
metadata := pdf.GetMetadata()

fmt.Printf("%d pages, %d characters\n", pageCount, len(text))
fmt.Printf("Title: %s\n", metadata.Title)

// Manual resource management
pdf := easy.Open("document.pdf").KeepOpen()
defer pdf.Close()

// Do work...
```

## Common Tasks

### Text Extraction

```go
// Extract all text
text, err := easy.ExtractText("document.pdf")

// Extract from specific page
pageText, err := easy.ExtractPageText("document.pdf", 0)

// Save to file
err = easy.SaveTextToFile("document.pdf", "output.txt")

// Using fluent API
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

text, _ := pdf.ExtractAllText()
pageText, _ := pdf.ExtractPageText(0)
```

### Rendering Pages

```go
// Render single page
err := easy.RenderToPNG("document.pdf", "output.png", 0, 300)

// Render all pages
err = easy.RenderAllToPNG("document.pdf", "page-{page}.png", 150)

// Advanced rendering options
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

// High DPI
pdf.RenderToFile(0, "high-res.png", easy.RenderOptions{
    DPI:    300,
    Format: "png",
})

// Specific dimensions
pdf.RenderToFile(0, "thumbnail.png", easy.RenderOptions{
    Width:  200,
    Height: 300,
    Format: "png",
})

// Grayscale
pdf.RenderToFile(0, "gray.png", easy.RenderOptions{
    DPI:        150,
    Colorspace: "gray",
    Format:     "png",
})

// With transparency
pdf.RenderToFile(0, "alpha.png", easy.RenderOptions{
    DPI:    150,
    Alpha:  true,
    Format: "png",
})
```

### Document Information

```go
// Page count
pages, _ := easy.GetPageCount("document.pdf")

// Metadata
metadata, _ := easy.GetMetadata("document.pdf")
fmt.Println(metadata.Title)
fmt.Println(metadata.Author)

// Complete info
info, _ := easy.GetInfo("document.pdf")
fmt.Printf("%d pages\n", info.PageCount)
for _, page := range info.Pages {
    fmt.Printf("Page %d: %.0fx%.0f\n", page.PageNumber, page.Width, page.Height)
}

// Quick summary
summary, _ := easy.QuickSummary("document.pdf")
fmt.Println(summary)
```

### Searching

```go
// Simple search (returns page numbers)
pages, _ := easy.Search("document.pdf", "important")
fmt.Printf("Found on pages: %v\n", pages)

// Detailed search (with bounding boxes)
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

results, _ := pdf.Search("important", -1) // -1 searches all pages
for _, result := range results {
    fmt.Printf("Page %d: Position (%.2f, %.2f)\n",
        result.PageNumber, result.BBox.X0, result.BBox.Y0)
}
```

### Working with Encrypted PDFs

```go
// Check if encrypted
encrypted, _ := easy.IsEncrypted("document.pdf")
if encrypted {
    fmt.Println("PDF is password protected")
}

// Open with password
pdf, err := easy.OpenWithPassword("encrypted.pdf", "password123")
if err != nil {
    log.Fatal(err)
}
defer pdf.Close()

// All functions support password
text, _ := easy.ExtractText("encrypted.pdf") // Will fail if encrypted
pdf, _ := easy.OpenWithPassword("encrypted.pdf", "password123")
```

### Batch Processing

```go
files := []string{"doc1.pdf", "doc2.pdf", "doc3.pdf"}

for _, file := range files {
    // Extract text
    easy.SaveTextToFile(file, file+".txt")

    // Render first page
    easy.RenderToPNG(file, file+".png", 0, 150)

    // Get summary
    summary, _ := easy.QuickSummary(file)
    fmt.Println(summary)
}
```

### Converting PDF to Images

```go
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

// Render all pages
err := pdf.RenderAllToFiles("output/page-{page}.png", easy.RenderOptions{
    DPI:    300,
    Format: "png",
})

// Or render to memory
images, _ := pdf.RenderAll(easy.RenderOptions{
    DPI:    150,
    Format: "png",
})

fmt.Printf("Rendered %d pages\n", len(images))
```

## API Reference

### Simple Functions

All functions in the `easy` package:

| Function | Description |
|----------|-------------|
| `ExtractText(path)` | Extract all text from PDF |
| `ExtractPageText(path, page)` | Extract text from specific page |
| `GetPageCount(path)` | Get number of pages |
| `GetMetadata(path)` | Get PDF metadata |
| `GetInfo(path)` | Get complete document info |
| `RenderToPNG(path, output, page, dpi)` | Render page to PNG |
| `RenderAllToPNG(path, pattern, dpi)` | Render all pages to PNG |
| `Search(path, query)` | Search for text |
| `IsEncrypted(path)` | Check if PDF is encrypted |
| `SaveTextToFile(path, output)` | Save extracted text to file |
| `QuickSummary(path)` | Get human-readable summary |

### PDF Type Methods

The `PDF` type methods:

| Method | Description |
|--------|-------------|
| `Open(path)` | Open a PDF |
| `OpenWithPassword(path, password)` | Open password-protected PDF |
| `FromBytes(data)` | Open from byte data |
| `PageCount()` | Get page count |
| `IsEncrypted()` | Check if encrypted |
| `GetMetadata()` | Get metadata object |
| `GetInfo()` | Get complete document info |
| `ExtractPageText(page)` | Extract text from page |
| `ExtractAllText()` | Extract all text |
| `ExtractAllTextWithSeparator(sep)` | Extract with custom separator |
| `Search(query, page)` | Search for text (use -1 for all pages) |
| `RenderToBytes(page, opts)` | Render to byte buffer |
| `RenderToFile(page, output, opts)` | Render to file |
| `RenderAll(opts)` | Render all pages to buffers |
| `RenderAllToFiles(pattern, opts)` | Render all to files |
| `KeepOpen()` | Disable auto-close |
| `Close()` | Close and free resources |
| `Use(callback)` | Execute callback with auto-close |

### Render Options

```go
type RenderOptions struct {
    DPI        float32  // DPI (default: 72)
    Width      int      // Width in pixels
    Height     int      // Height in pixels
    Colorspace string   // "gray", "rgb", "cmyk"
    Alpha      bool     // Include alpha channel
    Format     string   // "png", "pnm", "pam", "pbm"
}
```

### Metadata Type

```go
type Metadata struct {
    Title        string
    Author       string
    Subject      string
    Keywords     string
    Creator      string
    Producer     string
    CreationDate *time.Time
    ModDate      *time.Time
}
```

### DocumentInfo Type

```go
type DocumentInfo struct {
    PageCount   int
    Metadata    Metadata
    IsEncrypted bool
    Pages       []PageInfo
}

type PageInfo struct {
    PageNumber int
    Width      float32
    Height     float32
    Rotation   int
}
```

## Examples

See [examples/easy_api_examples.go](./examples/easy_api_examples.go) for comprehensive examples covering:

- Text extraction
- Page rendering
- Document information
- Searching
- Batch processing
- Error handling
- And more!

## Error Handling

```go
// Simple error handling
text, err := easy.ExtractText("document.pdf")
if err != nil {
    if strings.Contains(err.Error(), "password") {
        // Try with password
        pdf, err := easy.OpenWithPassword("document.pdf", "password123")
        if err != nil {
            log.Fatal(err)
        }
        defer pdf.Close()
    } else {
        log.Fatal(err)
    }
}

// Using defer for cleanup
pdf, err := easy.Open("document.pdf")
if err != nil {
    return err
}
defer pdf.Close() // Always cleanup

// Use callback pattern
err := func() error {
    pdf, err := easy.Open("document.pdf")
    if err != nil {
        return err
    }

    return pdf.Use(func(p *easy.PDF) error {
        text, err := p.ExtractAllText()
        if err != nil {
            return err
        }
        fmt.Println(text)
        return nil
    })
}()
```

## Performance Tips

1. **Reuse document handles** for multiple operations:
   ```go
   // Good: One open/close
   pdf, _ := easy.Open("doc.pdf")
   defer pdf.Close()

   text, _ := pdf.ExtractAllText()
   info := pdf.GetInfo()
   pdf.RenderToFile(0, "page.png", easy.RenderOptions{DPI: 150})

   // Less efficient: Multiple opens
   text, _ := easy.ExtractText("doc.pdf")
   info, _ := easy.GetInfo("doc.pdf")
   easy.RenderToPNG("doc.pdf", "page.png", 0, 150)
   ```

2. **Use appropriate DPI** for your needs:
   - 72 DPI: Screen viewing
   - 150 DPI: Web images
   - 300 DPI: Print quality
   - 600+ DPI: High-quality archival

3. **Process pages in batches** when possible

## Migration from Core API

If you're using the core API, upgrading is simple:

```go
// Before (Core API)
doc, _ := nanopdf.OpenDocument("document.pdf", "")
defer doc.Close()

page, _ := doc.LoadPage(0)
defer page.Drop()

text := page.ExtractText()
fmt.Println(text)

// After (Easy API)
text, _ := easy.ExtractPageText("document.pdf", 0)
fmt.Println(text)

// Or with fluent API
pdf, _ := easy.Open("document.pdf")
defer pdf.Close()

text, _ := pdf.ExtractPageText(0)
fmt.Println(text)
```

## Type Safety

All APIs are fully typed with comprehensive Go type definitions and documentation.

## License

Apache License 2.0 - see LICENSE file for details.

