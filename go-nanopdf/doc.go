// Package nanopdf provides Go bindings for the NanoPDF PDF manipulation library.
//
// NanoPDF is a high-performance PDF processing library built on top of MuPDF,
// offering a clean, idiomatic Go API for reading, rendering, and manipulating
// PDF documents.
//
// # Features
//
//   - Fast PDF parsing and rendering
//   - Text extraction with layout information
//   - Page rendering to images (PNG, pixmaps)
//   - Password protection and security
//   - Document metadata access
//   - Geometry operations (points, rectangles, matrices)
//   - Cross-platform support (Linux, macOS, Windows)
//   - Pure Go mock implementation (no CGO required)
//
// # Quick Start
//
// Opening and reading a PDF:
//
//	ctx := nanopdf.NewContext()
//	defer ctx.Drop()
//
//	doc, err := nanopdf.OpenDocument(ctx, "document.pdf")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	defer doc.Drop()
//
//	pageCount, _ := doc.PageCount()
//	fmt.Printf("Pages: %d\n", pageCount)
//
// Extracting text:
//
//	page, err := doc.LoadPage(0)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	defer page.Drop()
//
//	text, err := page.ExtractText()
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(text)
//
// Rendering a page:
//
//	pngData, err := page.RenderToPNG(150) // 150 DPI
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	err = os.WriteFile("output.png", pngData, 0644)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
// # Memory Management
//
// NanoPDF uses manual memory management for C resources. Always call Drop()
// on objects when done:
//
//	ctx := nanopdf.NewContext()
//	defer ctx.Drop() // Important!
//
//	doc, _ := nanopdf.OpenDocument(ctx, "file.pdf")
//	defer doc.Drop() // Important!
//
//	page, _ := doc.LoadPage(0)
//	defer page.Drop() // Important!
//
// # CGO vs Mock Mode
//
// By default, NanoPDF uses CGO to call native C/Rust functions for maximum
// performance. For environments where CGO is not available, a pure Go mock
// implementation is provided:
//
//	// Build with mock (no CGO)
//	CGO_ENABLED=0 go build
//
//	// Or use build tag
//	go build -tags mock
//
// Check at runtime:
//
//	if nanopdf.IsMock() {
//	    log.Println("Running in mock mode")
//	}
//
// # Error Handling
//
// Most functions return an error as the last return value:
//
//	page, err := doc.LoadPage(0)
//	if err != nil {
//	    if errors.Is(err, nanopdf.ErrInvalidArgument) {
//	        // Handle invalid argument
//	    } else if errors.Is(err, nanopdf.ErrNotFound) {
//	        // Handle not found
//	    } else {
//	        // Handle other errors
//	    }
//	}
//
// # Performance Tips
//
//  1. Always drop resources when done to avoid memory leaks
//  2. Reuse Context objects when processing multiple documents
//  3. Use appropriate DPI for rendering (72-300 depending on use case)
//  4. Process pages one at a time for large documents
//
// # Examples
//
// See the examples/ directory for complete working examples covering:
//   - Basic PDF reading
//   - Text extraction and search
//   - Page rendering
//   - Batch processing
//
// # API Overview
//
// Core types:
//   - Context: Rendering context (required for all operations)
//   - Document: PDF document handle
//   - Page: Individual page within a document
//   - Pixmap: Raster image (rendered page)
//   - Buffer: Binary data buffer
//
// Geometry types:
//   - Point: 2D point (x, y)
//   - Rect: Rectangle (x0, y0, x1, y1)
//   - IRect: Integer rectangle
//   - Matrix: 2D affine transformation matrix
//   - Quad: Quadrilateral (four corners)
//
// For detailed API documentation, see: https://pkg.go.dev/github.com/lexmata/nanopdf/go-nanopdf
package nanopdf

