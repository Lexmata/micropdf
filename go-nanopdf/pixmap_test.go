package nanopdf

import (
	"testing"
)

func TestPixmapFromPage(t *testing.T) {
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

	matrix := MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	if !pix.IsValid() {
		t.Error("Pixmap should be valid after rendering")
	}
}

func TestPixmapDimensions(t *testing.T) {
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

	// Render at 2x scale
	matrix := MatrixScale(2.0, 2.0)
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	width, err := pix.Width()
	if err != nil {
		t.Fatalf("Failed to get width: %v", err)
	}

	height, err := pix.Height()
	if err != nil {
		t.Fatalf("Failed to get height: %v", err)
	}

	// Original page is 612x792, scaled 2x should be ~1224x1584
	if width < 1200 || width > 1300 {
		t.Errorf("Unexpected width: %d (expected ~1224)", width)
	}

	if height < 1500 || height > 1600 {
		t.Errorf("Unexpected height: %d (expected ~1584)", height)
	}
}

func TestPixmapSamples(t *testing.T) {
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

	matrix := MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	samples, err := pix.Samples()
	if err != nil {
		t.Fatalf("Failed to get samples: %v", err)
	}

	if len(samples) == 0 {
		t.Error("Samples should not be empty")
	}

	width, _ := pix.Width()
	height, _ := pix.Height()

	// RGB without alpha = 3 components
	expectedSize := width * height * 3
	if len(samples) != expectedSize {
		t.Errorf("Unexpected sample size: got %d, expected %d", len(samples), expectedSize)
	}
}

func TestPixmapWithAlpha(t *testing.T) {
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

	matrix := MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, true)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	samples, err := pix.Samples()
	if err != nil {
		t.Fatalf("Failed to get samples: %v", err)
	}

	if len(samples) == 0 {
		t.Error("Samples should not be empty")
	}
}

func TestPixmapDrop(t *testing.T) {
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

	matrix := MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}

	pix.Drop()

	if pix.IsValid() {
		t.Error("Pixmap should be invalid after drop")
	}

	// Multiple drops should be safe
	pix.Drop()
}
