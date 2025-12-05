// +build integration

package integration

import (
	"os"
	"path/filepath"
	"testing"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestPageRendering tests rendering a page to pixmap
func TestPageRendering(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render at identity scale
	matrix := nanopdf.MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	// Check pixmap dimensions
	width, err := pix.Width()
	if err != nil {
		t.Fatalf("Failed to get width: %v", err)
	}

	height, err := pix.Height()
	if err != nil {
		t.Fatalf("Failed to get height: %v", err)
	}

	if width <= 0 || height <= 0 {
		t.Errorf("Invalid pixmap dimensions: %dx%d", width, height)
	}

	// Get pixel data
	samples, err := pix.Samples()
	if err != nil {
		t.Fatalf("Failed to get samples: %v", err)
	}

	expectedSize := width * height * 3 // RGB
	if len(samples) != expectedSize {
		t.Errorf("Expected %d bytes of pixel data, got %d", expectedSize, len(samples))
	}

	t.Logf("Rendered page to %dx%d pixmap (%d bytes)", width, height, len(samples))
}

// TestPageRenderingScaled tests rendering at different scales
func TestPageRenderingScaled(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	scales := []float32{0.5, 1.0, 2.0}

	for _, scale := range scales {
		matrix := nanopdf.MatrixScale(scale, scale)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render at scale %.1f: %v", scale, err)
			continue
		}

		width, _ := pix.Width()
		height, _ := pix.Height()

		t.Logf("Scale %.1f: %dx%d pixels", scale, width, height)

		pix.Drop()
	}
}

// TestPageRenderToPNG tests rendering directly to PNG
func TestPageRenderToPNG(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render to PNG at 150 DPI
	pngData, err := page.RenderToPNG(150)
	if err != nil {
		t.Fatalf("Failed to render to PNG: %v", err)
	}

	if len(pngData) == 0 {
		t.Error("PNG data is empty")
	}

	// Verify PNG signature
	if len(pngData) >= 8 {
		signature := pngData[0:8]
		expected := []byte{137, 80, 78, 71, 13, 10, 26, 10}
		for i, b := range expected {
			if signature[i] != b {
				t.Errorf("Invalid PNG signature at byte %d: got %d, want %d", i, signature[i], b)
			}
		}
	}

	// Optionally save to file for visual inspection
	if os.Getenv("SAVE_TEST_OUTPUT") == "1" {
		outputPath := filepath.Join(t.TempDir(), "test-output.png")
		if err := os.WriteFile(outputPath, pngData, 0644); err == nil {
			t.Logf("Saved PNG to: %s", outputPath)
		}
	}

	t.Logf("Rendered to PNG: %d bytes", len(pngData))
}

// TestPageRenderingWithAlpha tests rendering with alpha channel
func TestPageRenderingWithAlpha(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render with alpha channel
	matrix := nanopdf.MatrixIdentity()
	pix, err := page.RenderToPixmap(matrix, true)
	if err != nil {
		t.Fatalf("Failed to render with alpha: %v", err)
	}
	defer pix.Drop()

	width, _ := pix.Width()
	height, _ := pix.Height()
	samples, _ := pix.Samples()

	// With alpha, should be 4 bytes per pixel (RGBA)
	expectedSize := width * height * 4
	if len(samples) != expectedSize {
		t.Errorf("Expected %d bytes with alpha, got %d", expectedSize, len(samples))
	}

	t.Logf("Rendered with alpha: %dx%d (%d bytes)", width, height, len(samples))
}

