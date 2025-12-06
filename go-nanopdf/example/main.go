// Example usage of go-nanopdf
//
// This example demonstrates the core functionality of the Go bindings.
// To run with mock implementation:
//   go run -tags=mock main.go
package main

import (
	"fmt"
	"log"
	"os"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
	fmt.Printf("NanoPDF Go Bindings Example\n")
	fmt.Printf("Version: %s\n", nanopdf.Version())
	fmt.Printf("Mock mode: %v\n\n", nanopdf.IsMock())

	// Example 1: Buffer operations
	fmt.Println("=== Buffer Operations ===")
	exampleBuffers()

	// Example 2: Geometry operations
	fmt.Println("\n=== Geometry Operations ===")
	exampleGeometry()

	// Example 3: Document operations (requires PDF file or uses mock)
	fmt.Println("\n=== Document Operations ===")
	exampleDocument()
}

func exampleBuffers() {
	// Create buffer from string
	buf := nanopdf.NewBufferFromString("Hello, PDF!")
	defer buf.Free()

	fmt.Printf("Buffer length: %d\n", buf.Len())
	fmt.Printf("Buffer content: %s\n", buf.String())

	// Append data
	buf.AppendString(" More data.")
	fmt.Printf("After append: %s\n", buf.String())

	// Clone buffer
	cloned := buf.Clone()
	defer cloned.Free()
	fmt.Printf("Cloned buffer: %s\n", cloned.String())
}

func exampleGeometry() {
	// Point operations
	p1 := nanopdf.NewPoint(100, 200)
	p2 := nanopdf.NewPoint(50, 50)

	distance := p1.Distance(p2)
	fmt.Printf("Distance between points: %.2f\n", distance)

	// Rectangle operations
	rect := nanopdf.NewRect(0, 0, 612, 792) // US Letter size
	fmt.Printf("Page size: %.2f x %.2f\n", rect.Width(), rect.Height())
	fmt.Printf("Contains (300, 400): %v\n", rect.ContainsXY(300, 400))

	// Matrix transformations
	fmt.Println("\nMatrix transformations:")
	point := nanopdf.NewPoint(10, 20)
	fmt.Printf("Original point: (%.2f, %.2f)\n", point.X, point.Y)

	// Translate
	translated := point.Transform(nanopdf.MatrixTranslate(5, 5))
	fmt.Printf("After translate(5,5): (%.2f, %.2f)\n", translated.X, translated.Y)

	// Scale
	scaled := point.Transform(nanopdf.MatrixScale(2, 2))
	fmt.Printf("After scale(2,2): (%.2f, %.2f)\n", scaled.X, scaled.Y)

	// Rotate
	rotated := point.Transform(nanopdf.MatrixRotate(90))
	fmt.Printf("After rotate(90°): (%.2f, %.2f)\n", rotated.X, rotated.Y)

	// Combined transformation
	combined := nanopdf.MatrixScale(2, 2).Concat(nanopdf.MatrixRotate(45))
	transformed := point.Transform(combined)
	fmt.Printf("After scale + rotate: (%.2f, %.2f)\n", transformed.X, transformed.Y)
}

func exampleDocument() {
	// Create context (required for all document operations)
	ctx := nanopdf.NewContext()
	if ctx == nil {
		log.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	fmt.Println("Context created successfully")

	// Try to open a document
	// In mock mode, this will succeed with a mock document
	// With real FFI, you'd need an actual PDF file
	var doc *nanopdf.Document
	var err error

	// Check if we're in mock mode or if test.pdf exists
	if nanopdf.IsMock() {
		fmt.Println("Running in mock mode - using mock document")
		doc, err = nanopdf.OpenDocument(ctx, "mock.pdf")
	} else {
		// Try to open a real PDF if it exists
		if _, err := os.Stat("test.pdf"); err == nil {
			doc, err = nanopdf.OpenDocument(ctx, "test.pdf")
		} else {
			fmt.Println("No test.pdf found, creating minimal PDF")
			// Create a minimal PDF for testing
			pdfData := createMinimalPDF()
			doc, err = nanopdf.OpenDocumentFromBytes(ctx, pdfData, "application/pdf")
		}
	}

	if err != nil {
		log.Printf("Failed to open document: %v", err)
		return
	}
	defer doc.Drop()

	// Document operations
	pageCount, err := doc.PageCount()
	if err != nil {
		log.Printf("Failed to get page count: %v", err)
		return
	}
	fmt.Printf("Document has %d page(s)\n", pageCount)

	// Check security
	needsPassword, err := doc.NeedsPassword()
	if err != nil {
		log.Printf("Failed to check password: %v", err)
		return
	}
	fmt.Printf("Needs password: %v\n", needsPassword)

	// Get metadata
	title, _ := doc.GetMetadata("Title")
	if title != "" {
		fmt.Printf("Document title: %s\n", title)
	}

	// Load first page
	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			log.Printf("Failed to load page: %v", err)
			return
		}
		defer page.Drop()

		fmt.Printf("Loaded page %d\n", page.PageNumber())

		// Get page bounds
		bounds := page.Bounds()
		fmt.Printf("Page bounds: %.2f x %.2f\n", bounds.Width(), bounds.Height())

		// Extract text
		text, err := page.ExtractText()
		if err != nil {
			log.Printf("Failed to extract text: %v", err)
		} else if text != "" {
			fmt.Printf("Extracted text: %s\n", text)
		}

		// Search for text
		results, err := page.SearchText("Hello")
		if err != nil {
			log.Printf("Failed to search text: %v", err)
		} else {
			fmt.Printf("Found %d match(es) for 'Hello'\n", len(results))
		}

		// Render to pixmap
		matrix := nanopdf.MatrixIdentity()
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			log.Printf("Failed to render pixmap: %v", err)
		} else {
			defer pix.Drop()

			width, _ := pix.Width()
			height, _ := pix.Height()
			fmt.Printf("Rendered pixmap: %d x %d pixels\n", width, height)

			samples, _ := pix.Samples()
			fmt.Printf("Pixel data size: %d bytes\n", len(samples))
		}

		// Render to PNG
		pngData, err := page.RenderToPNG(72)
		if err != nil {
			log.Printf("Failed to render PNG: %v", err)
		} else {
			fmt.Printf("Rendered PNG: %d bytes\n", len(pngData))

			// Optionally save PNG
			if !nanopdf.IsMock() {
				err = os.WriteFile("output.png", pngData, 0644)
				if err == nil {
					fmt.Println("Saved output.png")
				}
			}
		}
	}
}

// createMinimalPDF creates a minimal valid PDF for testing
func createMinimalPDF() []byte {
	pdf := `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000325 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
418
%%EOF`
	return []byte(pdf)
}

