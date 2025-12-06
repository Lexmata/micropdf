//go:build integration
// +build integration

package integration

import (
	"os"
	"testing"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestEncryptedPDF tests opening and authenticating password-protected PDFs
func TestEncryptedPDF(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/complex/encrypted.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Encrypted test PDF not found")
	}

	t.Log("Testing encrypted PDF...")

	// Open encrypted document
	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open encrypted document: %v", err)
	}
	defer doc.Drop()

	// Check if password is needed
	needsPassword, err := doc.NeedsPassword()
	if err != nil {
		t.Fatalf("Failed to check password requirement: %v", err)
	}

	if !needsPassword {
		t.Error("Expected encrypted PDF to require password")
	}

	t.Log("PDF correctly identified as password-protected")

	// Try with wrong password
	authenticated, err := doc.Authenticate("wrongpassword")
	if err != nil {
		t.Logf("Wrong password authentication returned error (may be expected): %v", err)
	}

	if authenticated {
		t.Error("Should not authenticate with wrong password")
	}

	// Authenticate with correct password
	authenticated, err = doc.Authenticate("test123")
	if err != nil {
		t.Fatalf("Failed to authenticate with correct password: %v", err)
	}

	if !authenticated {
		t.Error("Failed to authenticate with correct password 'test123'")
	}

	t.Log("Successfully authenticated with correct password")

	// After authentication, should be able to access content
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Errorf("Failed to get page count after authentication: %v", err)
	} else {
		t.Logf("Encrypted PDF has %d page(s)", pageCount)
	}

	// Check permissions
	canPrint, err := doc.HasPermission(4) // FZ_PERMISSION_PRINT
	if err != nil {
		t.Logf("Failed to check print permission: %v", err)
	} else {
		t.Logf("Print permission: %v", canPrint)
	}

	// Try to load and render a page
	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Errorf("Failed to load page from encrypted PDF: %v", err)
		} else {
			defer page.Drop()

			bounds := page.Bounds()
			t.Logf("Page bounds: %.2fx%.2f", bounds.Width(), bounds.Height())

			// Try to extract text
			text, err := page.ExtractText()
			if err != nil {
				t.Logf("Text extraction from encrypted PDF failed (may be expected): %v", err)
			} else {
				t.Logf("Extracted text length: %d characters", len(text))
			}
		}
	}
}

// TestLinearizedPDF tests detection and handling of linearized PDFs
func TestLinearizedPDF(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/complex/linearized.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Linearized test PDF not found")
	}

	t.Log("Testing linearized (web-optimized) PDF...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open linearized document: %v", err)
	}
	defer doc.Drop()

	// Verify basic operations work
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("Linearized PDF has %d page(s)", pageCount)

	// In a real implementation, we might check for linearization hints
	// For now, just verify it opens and works like a normal PDF
	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Errorf("Failed to load page: %v", err)
		} else {
			defer page.Drop()

			bounds := page.Bounds()
			t.Logf("Page bounds: %.2fx%.2f", bounds.Width(), bounds.Height())

			// Linearized PDFs should still support normal operations
			text, err := page.ExtractText()
			if err != nil {
				t.Logf("Text extraction failed (may be expected): %v", err)
			} else {
				t.Logf("Extracted text: %d characters", len(text))
			}
		}
	}

	t.Log("Linearized PDF handled successfully")
}

// TestPDFWithImages tests image extraction and handling
func TestPDFWithImages(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/complex/with-images.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Images test PDF not found")
	}

	t.Log("Testing PDF with embedded images...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("PDF has %d page(s)", pageCount)

	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Fatalf("Failed to load page: %v", err)
		}
		defer page.Drop()

		// Render the page (images should be rendered)
		matrix := nanopdf.MatrixScale(1.0, 1.0)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render page with images: %v", err)
		} else {
			defer pix.Drop()

			width, _ := pix.Width()
			height, _ := pix.Height()
			samples, _ := pix.Samples()

			t.Logf("Rendered page with images: %dx%d (%d bytes)", width, height, len(samples))

			if width <= 0 || height <= 0 {
				t.Error("Invalid pixmap dimensions")
			}

			if len(samples) == 0 {
				t.Error("No pixel data in rendered image")
			}
		}

		// In a full implementation, we would extract individual images
		// For now, verify rendering works
		t.Log("Successfully rendered page with embedded images")
	}
}

// TestPDFWithAnnotations tests annotation extraction and handling
func TestPDFWithAnnotations(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/complex/with-annotations.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Annotations test PDF not found")
	}

	t.Log("Testing PDF with annotations...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("PDF has %d page(s)", pageCount)

	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Fatalf("Failed to load page: %v", err)
		}
		defer page.Drop()

		// Render the page (annotations should be visible)
		matrix := nanopdf.MatrixScale(1.0, 1.0)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render page with annotations: %v", err)
		} else {
			defer pix.Drop()

			width, _ := pix.Width()
			height, _ := pix.Height()

			t.Logf("Rendered page with annotations: %dx%d", width, height)

			// Annotations should be rendered as part of the page
			// In a full implementation, we would:
			// - Enumerate annotations
			// - Get annotation types
			// - Extract annotation properties (color, author, etc.)
		}

		// Extract text (annotations might have text content)
		text, err := page.ExtractText()
		if err != nil {
			t.Logf("Text extraction failed (may be expected): %v", err)
		} else {
			t.Logf("Extracted text: %d characters", len(text))
		}

		t.Log("Successfully processed page with annotations")
	}
}

// TestPDFWithOutline tests document outline/bookmark extraction
func TestPDFWithOutline(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/medium/with-outline.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Outline test PDF not found")
	}

	t.Log("Testing PDF with document outline/bookmarks...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("PDF has %d page(s) with outline structure", pageCount)

	// In a full implementation, we would:
	// - Load the document outline
	// - Traverse the outline hierarchy
	// - Get outline item titles
	// - Resolve outline destinations
	// - Navigate to bookmarked pages

	// For now, verify basic operations work
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		bounds := page.Bounds()
		t.Logf("Page %d bounds: %.2fx%.2f", i+1, bounds.Width(), bounds.Height())

		page.Drop()
	}

	t.Log("Successfully processed PDF with outline structure")
}

// TestPDFWithAttachments tests file attachment extraction
func TestPDFWithAttachments(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/medium/with-attachments.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Attachments test PDF not found")
	}

	t.Log("Testing PDF with file attachments...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("PDF has %d page(s) with attachments", pageCount)

	// In a full implementation, we would:
	// - Enumerate embedded files
	// - Get attachment metadata (filename, size, MIME type)
	// - Extract attachment data
	// - Save attachments to disk

	// For now, verify the PDF opens and processes normally
	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Fatalf("Failed to load page: %v", err)
		}
		defer page.Drop()

		bounds := page.Bounds()
		t.Logf("Page bounds: %.2fx%.2f", bounds.Width(), bounds.Height())
	}

	t.Log("Successfully opened PDF with attachments")
}

// TestHighResolutionImages tests handling of large images
func TestHighResolutionImages(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/large/high-resolution-images.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("High-resolution images test PDF not found")
	}

	t.Log("Testing PDF with high-resolution images...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Fatalf("Failed to load page: %v", err)
		}
		defer page.Drop()

		// Test rendering at different scales
		scales := []struct {
			name  string
			scale float32
		}{
			{"Thumbnail", 0.1},
			{"Small", 0.25},
			{"Medium", 0.5},
			{"Normal", 1.0},
		}

		for _, s := range scales {
			matrix := nanopdf.MatrixScale(s.scale, s.scale)
			pix, err := page.RenderToPixmap(matrix, false)
			if err != nil {
				t.Errorf("Failed to render at %s scale (%.2f): %v", s.name, s.scale, err)
				continue
			}

			width, _ := pix.Width()
			height, _ := pix.Height()
			samples, _ := pix.Samples()

			t.Logf("%s (%.2fx): %dx%d (%d bytes)",
				s.name, s.scale, width, height, len(samples))

			pix.Drop()
		}

		t.Log("Successfully rendered high-resolution images at multiple scales")
	}
}

// Test100PageDocument tests handling of documents with many pages
func Test100PageDocument(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping 100-page test in short mode")
	}

	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/large/multi-page-100.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("100-page test PDF not found")
	}

	t.Log("Testing 100-page document...")

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if pageCount != 100 {
		t.Errorf("Expected 100 pages, got %d", pageCount)
	}

	t.Logf("Document has %d pages", pageCount)

	// Load and render every 10th page
	for i := 0; i < pageCount; i += 10 {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		matrix := nanopdf.MatrixScale(0.5, 0.5)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render page %d: %v", i, err)
		} else {
			pix.Drop()
			t.Logf("Rendered page %d/%d", i+1, pageCount)
		}

		page.Drop()
	}

	t.Log("Successfully processed 100-page document")
}

// TestCorruptedPDFAdvanced tests more advanced error handling scenarios
func TestCorruptedPDFAdvanced(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/minimal/corrupted.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Corrupted test PDF not found")
	}

	t.Log("Testing advanced error handling with corrupted PDF...")

	// Try to open corrupted PDF
	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Logf("Expected error opening corrupted PDF: %v", err)
		// This is the expected behavior
		return
	}

	// If it somehow opened, try various operations that should fail gracefully
	defer doc.Drop()

	t.Log("Corrupted PDF opened (surprising), testing graceful degradation...")

	// Try to get page count
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Logf("Expected error getting page count: %v", err)
	} else {
		t.Logf("Reported page count: %d (may be invalid)", pageCount)
	}

	// Try to load pages
	for i := 0; i < 3; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Logf("Expected error loading page %d: %v", i, err)
			continue
		}

		// If page loaded, try operations
		bounds := page.Bounds()
		t.Logf("Page %d bounds: %v", i, bounds)

		// Try to render
		matrix := nanopdf.MatrixScale(0.5, 0.5)
		_, err = page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Logf("Expected error rendering corrupted page: %v", err)
		}

		page.Drop()
	}

	t.Log("Completed graceful degradation test")
}

// TestMixedFeatures tests a workflow using multiple advanced features
func TestMixedFeatures(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	testPDFs := []struct {
		path     string
		features string
	}{
		{"../../../test-pdfs/complex/with-images.pdf", "images"},
		{"../../../test-pdfs/complex/with-annotations.pdf", "annotations"},
		{"../../../test-pdfs/medium/with-outline.pdf", "outline"},
		{"../../../test-pdfs/medium/with-attachments.pdf", "attachments"},
	}

	for _, tc := range testPDFs {
		if _, err := os.Stat(tc.path); os.IsNotExist(err) {
			t.Logf("Skipping %s (not found)", tc.features)
			continue
		}

		t.Logf("Testing %s...", tc.features)

		doc, err := nanopdf.OpenDocument(ctx, tc.path)
		if err != nil {
			t.Errorf("Failed to open %s PDF: %v", tc.features, err)
			continue
		}

		pageCount, _ := doc.PageCount()
		t.Logf("  %s PDF: %d page(s)", tc.features, pageCount)

		if pageCount > 0 {
			page, err := doc.LoadPage(0)
			if err != nil {
				t.Errorf("Failed to load page from %s PDF: %v", tc.features, err)
			} else {
				// Quick render test
				matrix := nanopdf.MatrixScale(0.5, 0.5)
				pix, err := page.RenderToPixmap(matrix, false)
				if err != nil {
					t.Logf("  Render failed (may be expected): %v", err)
				} else {
					width, _ := pix.Width()
					height, _ := pix.Height()
					t.Logf("  Rendered: %dx%d", width, height)
					pix.Drop()
				}

				page.Drop()
			}
		}

		doc.Drop()
	}

	t.Log("Mixed features test completed")
}
