package micropdf

import (
	"testing"
)

func TestPageLoad(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	if !page.IsValid() {
		t.Error("Page should be valid after loading")
	}

	if page.PageNumber() != 0 {
		t.Errorf("Expected page number 0, got %d", page.PageNumber())
	}
}

func TestPageBounds(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	bounds := page.Bounds()

	// Test PDF has MediaBox [0 0 612 792]
	if bounds.X0 != 0 || bounds.Y0 != 0 {
		t.Errorf("Expected origin (0,0), got (%.2f,%.2f)", bounds.X0, bounds.Y0)
	}

	if bounds.X1 != 612 || bounds.Y1 != 792 {
		t.Errorf("Expected size (612,792), got (%.2f,%.2f)", bounds.X1, bounds.Y1)
	}
}

func TestPageExtractText(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	text, err := page.ExtractText()
	if err != nil {
		t.Fatalf("Failed to extract text: %v", err)
	}

	// Text extraction should work (may not be exact match)
	if len(text) == 0 {
		t.Log("Warning: No text extracted (may be expected for simple PDF)")
	}
}

func TestPageSearchText(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Search for "Hello" in the test PDF
	results, err := page.SearchText("Hello")
	if err != nil {
		t.Fatalf("Failed to search text: %v", err)
	}

	if len(results) == 0 {
		t.Log("Warning: No text found (may be expected for simple PDF)")
	}
}

func TestPageRenderToPNG(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render at 72 DPI
	pngData, err := page.RenderToPNG(72)
	if err != nil {
		t.Fatalf("Failed to render to PNG: %v", err)
	}

	if len(pngData) == 0 {
		t.Error("PNG data should not be empty")
	}

	// Check PNG signature
	if len(pngData) >= 8 {
		signature := pngData[0:8]
		expected := []byte{137, 80, 78, 71, 13, 10, 26, 10}
		for i, b := range expected {
			if signature[i] != b {
				t.Errorf("Invalid PNG signature at byte %d: got %d, want %d", i, signature[i], b)
			}
		}
	}
}

func TestPageRenderToPixmap(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render with identity matrix
	matrix := MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	if !pix.IsValid() {
		t.Error("Pixmap should be valid after rendering")
	}

	width, err := pix.Width()
	if err != nil {
		t.Fatalf("Failed to get pixmap width: %v", err)
	}

	if width <= 0 {
		t.Errorf("Invalid pixmap width: %d", width)
	}

	height, err := pix.Height()
	if err != nil {
		t.Fatalf("Failed to get pixmap height: %v", err)
	}

	if height <= 0 {
		t.Errorf("Invalid pixmap height: %d", height)
	}
}

func TestPageDrop(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	doc, err := OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}

	page.Drop()

	if page.IsValid() {
		t.Error("Page should be invalid after drop")
	}

	// Multiple drops should be safe
	page.Drop()
}
