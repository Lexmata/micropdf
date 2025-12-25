# NanoPDF Go Examples

This directory contains practical examples demonstrating various features of the NanoPDF Go library.

---

## Running Examples

### Prerequisites

```bash
# Install dependencies (if not already)
go get github.com/lexmata/nanopdf/go-nanopdf

# Ensure the native library is built
cd ../nanopdf-rs
cargo build --release
sudo make install  # Or copy to go-nanopdf/lib/
```

### Run an Example

```bash
# Run directly
go run -tags example examples/01_basic_reading.go

# Or build first
go build -tags example -o basic_reading examples/01_basic_reading.go
./basic_reading
```

**Note**: The `-tags example` flag is required to build the examples.

---

## Available Examples

### 1. Basic PDF Reading (`01_basic_reading.go`)

**What it demonstrates:**
- Creating a rendering context
- Opening PDF documents
- Reading basic properties (page count)
- Accessing document metadata
- Loading and inspecting pages
- Getting page dimensions

**Usage:**
```bash
go run -tags example examples/01_basic_reading.go
```

**Output:**
```
=== Basic PDF Information ===
File: ../../test-pdfs/simple/hello-world.pdf
Pages: 1
Needs Password: false

=== Metadata ===
Title: Hello World
Author: Example Author

=== First Page ===
Page Number: 0
Bounds: [0.00, 0.00, 612.00, 792.00]
Width: 612.00 points
Height: 792.00 points
Size: 8.50" × 11.00"

✅ Done!
```

---

### 2. Text Extraction (`02_text_extraction.go`)

**What it demonstrates:**
- Extracting text from all pages
- Searching for specific text
- Getting text location with bounding boxes
- Saving extracted text to file

**Usage:**
```bash
go run -tags example examples/02_text_extraction.go
```

**Functions:**
- Extract and print all text from each page
- Search for keywords across the document
- Save combined text to file

**Output:**
- `extracted-text.txt` - All extracted text
- Console output showing search results with bounding boxes

---

### 3. Page Rendering (`03_rendering.go`)

**What it demonstrates:**
- Rendering pages to images at different DPIs
- Using pixmaps for custom rendering
- Applying transformations (scaling)
- Saving as PNG files

**Usage:**
```bash
go run -tags example examples/03_rendering.go
```

**Output:**
- `output-Thumbnail.png` - 72 DPI thumbnail
- `output-Screen.png` - 150 DPI screen quality
- `output-Print.png` - 300 DPI print quality
- `output-2x.png` - 2x scaled rendering

---

### 4. Batch Processing (`04_batch_processing.go`)

**What it demonstrates:**
- Processing multiple PDF files in a directory
- Extracting metadata from all files
- Generating reports (Markdown format)
- Searching across multiple PDFs
- Error handling for corrupted/invalid files

**Usage:**
```bash
go run -tags example examples/04_batch_processing.go
```

**Functions:**
- `processPDFDirectory()` - Scan directory and collect info
- `generateReport()` - Create formatted Markdown report
- `searchInMultiplePDFs()` - Search term across files

**Output:**
- `pdf-report.md` - Markdown report with statistics
- Console output with processing status and search results

---

## Common Patterns

### Pattern 1: Safe Resource Management

Always use `defer` to ensure resources are cleaned up:

```go
ctx := nanopdf.NewContext()
if ctx == nil {
    log.Fatal("Failed to create context")
}
defer ctx.Drop() // IMPORTANT!

doc, err := nanopdf.OpenDocument(ctx, "file.pdf")
if err != nil {
    log.Fatal(err)
}
defer doc.Drop() // IMPORTANT!

page, err := doc.LoadPage(0)
if err != nil {
    log.Fatal(err)
}
defer page.Drop() // IMPORTANT!

// Work with page...
```

### Pattern 2: Processing All Pages

```go
pageCount, _ := doc.PageCount()

for i := int32(0); i < pageCount; i++ {
    page, err := doc.LoadPage(i)
    if err != nil {
        log.Printf("Error loading page %d: %v", i, err)
        continue
    }

    // Process page...
    text, _ := page.ExtractText()
    fmt.Printf("Page %d: %d bytes of text\n", i+1, len(text))

    page.Drop() // Clean up immediately
}
```

### Pattern 3: Error Handling

```go
doc, err := nanopdf.OpenDocument(ctx, "file.pdf")
if err != nil {
    if errors.Is(err, nanopdf.ErrNotFound) {
        log.Fatal("File not found")
    } else if errors.Is(err, nanopdf.ErrInvalidArgument) {
        log.Fatal("Invalid file")
    } else {
        log.Fatalf("Unknown error: %v", err)
    }
}
defer doc.Drop()

// Check password
needsPassword, _ := doc.NeedsPassword()
if needsPassword {
    success, _ := doc.Authenticate("password")
    if !success {
        log.Fatal("Invalid password")
    }
}
```

### Pattern 4: Custom Rendering

```go
// Create transformation matrix
scale := nanopdf.MatrixScale(2.0, 2.0)    // 2x scale
rotate := nanopdf.MatrixRotate(45)        // 45 degrees
transform := scale.Concat(rotate)         // Combine

// Render with transformation
pix, err := page.RenderToPixmap(transform, true) // true = include alpha
if err != nil {
    log.Fatal(err)
}
defer pix.Drop()

// Get pixel data
width, _ := pix.Width()
height, _ := pix.Height()
samples, _ := pix.Samples()

fmt.Printf("Rendered: %dx%d pixels, %d bytes\n",
    width, height, len(samples))

// Save as PNG
pngData, _ := pix.WritePNG()
os.WriteFile("output.png", pngData, 0644)
```

---

## Tips and Best Practices

### Memory Management

1. **Always call `Drop()`**:
   ```go
   ctx := nanopdf.NewContext()
   defer ctx.Drop() // IMPORTANT!
   ```

2. **Use `defer` immediately after resource creation**:
   ```go
   doc, _ := nanopdf.OpenDocument(ctx, "file.pdf")
   defer doc.Drop() // Right after creation
   ```

3. **Process pages one at a time** for large documents:
   ```go
   // Good: Memory efficient
   for i := int32(0); i < pageCount; i++ {
       page, _ := doc.LoadPage(i)
       // Process...
       page.Drop() // Free immediately
   }

   // Bad: Uses too much memory
   var pages []*Page
   for i := int32(0); i < pageCount; i++ {
       pages = append(pages, doc.LoadPage(i))
   }
   // ... all pages in memory!
   ```

### Performance

1. **Reuse Context objects**:
   ```go
   ctx := nanopdf.NewContext()
   defer ctx.Drop()

   // Process multiple documents with same context
   for _, file := range files {
       doc, _ := nanopdf.OpenDocument(ctx, file)
       // Process...
       doc.Drop()
   }
   ```

2. **Use appropriate DPI**:
   - Thumbnails: 72 DPI
   - Screen display: 96-150 DPI
   - Print quality: 300+ DPI

3. **Check for errors early**:
   ```go
   if !page.IsValid() {
       return // Page invalid, skip processing
   }
   ```

### Error Handling

```go
// Check if file exists
if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
    log.Fatalf("File not found: %s", pdfPath)
}

// Check context validity
if ctx == nil || !ctx.IsValid() {
    log.Fatal("Invalid context")
}

// Validate page numbers
pageCount, _ := doc.PageCount()
if pageNum < 0 || pageNum >= pageCount {
    log.Fatalf("Page %d out of range [0, %d)", pageNum, pageCount)
}
```

---

## Advanced Examples

### Concurrent Processing

```go
func processPagesConcurrently(doc *nanopdf.Document) {
    pageCount, _ := doc.PageCount()

    var wg sync.WaitGroup
    results := make(chan string, pageCount)

    for i := int32(0); i < pageCount; i++ {
        wg.Add(1)
        go func(pageNum int32) {
            defer wg.Done()

            page, err := doc.LoadPage(pageNum)
            if err != nil {
                results <- fmt.Sprintf("Page %d: ERROR", pageNum)
                return
            }
            defer page.Drop()

            text, _ := page.ExtractText()
            results <- fmt.Sprintf("Page %d: %d bytes", pageNum, len(text))
        }(i)
    }

    wg.Wait()
    close(results)

    for result := range results {
        fmt.Println(result)
    }
}
```

### Custom Page Processor

```go
type PageProcessor interface {
    Process(page *nanopdf.Page) error
}

type TextExtractor struct {
    texts []string
}

func (te *TextExtractor) Process(page *nanopdf.Page) error {
    text, err := page.ExtractText()
    if err != nil {
        return err
    }
    te.texts = append(te.texts, text)
    return nil
}

func processDocument(doc *nanopdf.Document, processor PageProcessor) error {
    pageCount, _ := doc.PageCount()

    for i := int32(0); i < pageCount; i++ {
        page, err := doc.LoadPage(i)
        if err != nil {
            return err
        }

        err = processor.Process(page)
        page.Drop()

        if err != nil {
            return err
        }
    }

    return nil
}

// Usage
extractor := &TextExtractor{}
processDocument(doc, extractor)
fmt.Println("Extracted texts:", len(extractor.texts))
```

---

## Troubleshooting

### Examples Don't Build

**Error**: `package github.com/lexmata/nanopdf/go-nanopdf is not in GOROOT`

**Solution**:
```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

### Native Library Not Found

**Error**: `undefined reference to 'fz_xxx'`

**Solution**:
```bash
cd nanopdf-rs
cargo build --release
sudo make install
```

### Test PDFs Not Found

**Error**: `Failed to open PDF: no such file or directory`

**Solution**:
```bash
# Install Git LFS and pull files
git lfs install
git lfs pull

# Or run from examples directory
cd examples
go run -tags example 01_basic_reading.go
```

### Out of Memory

**Error**: `fatal error: runtime: out of memory`

**Solution**:
- Process fewer pages at once
- Call `Drop()` more frequently
- Use smaller DPI for rendering

---

## Contributing

Have a useful example? Please contribute!

1. Create a new example file: `05_your_example.go`
2. Add `//go:build example` at the top
3. Follow the existing format
4. Add entry to this README
5. Submit a pull request

---

## Additional Resources

- [Main README](../README.md)
- [API Documentation](https://pkg.go.dev/github.com/lexmata/nanopdf/go-nanopdf)
- [Contributing Guide](../CONTRIBUTING.md)

---

<div align="center">

**Happy Coding! 🚀**

</div>

