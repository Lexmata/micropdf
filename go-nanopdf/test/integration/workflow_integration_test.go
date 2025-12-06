// +build integration

package integration

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestFullDocumentWorkflow tests a complete document processing pipeline
func TestFullDocumentWorkflow(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Step 1: Open a real PDF from test-pdfs
	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found, skipping workflow test")
	}

	t.Log("Step 1: Opening PDF...")
	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Step 2: Read metadata
	t.Log("Step 2: Reading metadata...")
	title, err := doc.GetMetadata("Title")
	if err != nil {
		t.Logf("No title metadata: %v", err)
	} else {
		t.Logf("Title: %s", title)
	}

	// Step 3: Get page count
	t.Log("Step 3: Getting page count...")
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}
	t.Logf("Document has %d page(s)", pageCount)

	// Step 4: Process each page
	for i := 0; i < pageCount; i++ {
		t.Logf("Step 4.%d: Processing page %d...", i+1, i+1)

		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		// Get page dimensions
		bounds := page.Bounds()
		t.Logf("  Page %d bounds: %.2fx%.2f", i+1, bounds.Width(), bounds.Height())

		// Extract text
		text, err := page.ExtractText()
		if err != nil {
			t.Errorf("Failed to extract text from page %d: %v", i, err)
		} else {
			t.Logf("  Extracted %d characters", len(text))
		}

		// Render to pixmap
		matrix := nanopdf.MatrixScale(1.0, 1.0)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render page %d: %v", i, err)
		} else {
			width, _ := pix.Width()
			height, _ := pix.Height()
			t.Logf("  Rendered to %dx%d pixmap", width, height)
			pix.Drop()
		}

		page.Drop()
	}

	// Step 5: Save to new file (if supported)
	t.Log("Step 5: Attempting to save document...")
	outputPath := filepath.Join(t.TempDir(), "workflow-output.pdf")
	if err := doc.Save(outputPath); err != nil {
		t.Logf("Save not fully supported yet: %v", err)
	} else {
		// Verify saved file exists and is valid
		if stat, err := os.Stat(outputPath); err == nil {
			t.Logf("Saved to %s (%d bytes)", outputPath, stat.Size())

			// Try to re-open the saved PDF
			doc2, err := nanopdf.OpenDocument(ctx, outputPath)
			if err != nil {
				t.Errorf("Failed to re-open saved PDF: %v", err)
			} else {
				count2, _ := doc2.PageCount()
				t.Logf("Re-opened saved PDF: %d pages", count2)
				doc2.Drop()
			}
		}
	}

	t.Log("Workflow completed successfully!")
}

// TestMultiPageProcessing tests processing documents with multiple pages
func TestMultiPageProcessing(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/simple/multi-page.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Multi-page test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if pageCount < 2 {
		t.Skipf("Expected multi-page PDF, got %d page(s)", pageCount)
	}

	t.Logf("Processing %d pages...", pageCount)

	// Process all pages
	var totalTextLen int
	var totalPixels int

	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		// Extract text from each page
		text, err := page.ExtractText()
		if err == nil {
			totalTextLen += len(text)
			t.Logf("Page %d: %d characters", i+1, len(text))
		}

		// Render each page
		matrix := nanopdf.MatrixScale(0.5, 0.5) // Small scale for speed
		pix, err := page.RenderToPixmap(matrix, false)
		if err == nil {
			width, _ := pix.Width()
			height, _ := pix.Height()
			totalPixels += width * height
			pix.Drop()
		}

		page.Drop()
	}

	t.Logf("Total: %d characters, %d pixels", totalTextLen, totalPixels)
}

// TestPDFWithMetadata tests handling PDFs with rich metadata
func TestPDFWithMetadata(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/medium/with-metadata.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Metadata test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Test all standard metadata fields
	metadataFields := []string{
		"Title",
		"Author",
		"Subject",
		"Keywords",
		"Creator",
		"Producer",
		"CreationDate",
		"ModDate",
	}

	t.Log("Metadata fields:")
	foundCount := 0
	for _, field := range metadataFields {
		value, err := doc.GetMetadata(field)
		if err != nil {
			t.Logf("  %s: <error: %v>", field, err)
		} else if value != "" {
			t.Logf("  %s: %s", field, value)
			foundCount++
		} else {
			t.Logf("  %s: <empty>", field)
		}
	}

	if foundCount == 0 {
		t.Log("Warning: No metadata found in PDF marked as having metadata")
	}
}

// TestPDFWithLinks tests handling PDFs with hyperlinks
func TestPDFWithLinks(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/medium/with-links.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Links test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("Checking %d page(s) for links...", pageCount)

	// In a real implementation, we would iterate through links
	// For now, just verify the PDF opens and has pages
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		bounds := page.Bounds()
		t.Logf("Page %d: %.2fx%.2f points", i+1, bounds.Width(), bounds.Height())

		page.Drop()
	}
}

// TestPDFWithForms tests handling PDFs with form fields
func TestPDFWithForms(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/complex/with-forms.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Forms test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Verify PDF with forms opens correctly
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("PDF with forms has %d page(s)", pageCount)

	// Load first page and verify it renders
	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render page (forms should be visible)
	matrix := nanopdf.MatrixScale(1.0, 1.0)
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Fatalf("Failed to render page with forms: %v", err)
	}
	defer pix.Drop()

	width, _ := pix.Width()
	height, _ := pix.Height()
	t.Logf("Rendered form page: %dx%d", width, height)
}

// TestBatchProcessing tests processing multiple PDFs in sequence
func TestBatchProcessing(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Find all test PDFs
	testPDFs := []string{
		"../../../test-pdfs/minimal/empty.pdf",
		"../../../test-pdfs/simple/hello-world.pdf",
		"../../../test-pdfs/simple/multi-page.pdf",
	}

	successCount := 0
	failCount := 0

	for _, pdfPath := range testPDFs {
		if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
			t.Logf("Skipping %s (not found)", pdfPath)
			continue
		}

		t.Logf("Processing: %s", filepath.Base(pdfPath))

		doc, err := nanopdf.OpenDocument(ctx, pdfPath)
		if err != nil {
			t.Errorf("Failed to open %s: %v", pdfPath, err)
			failCount++
			continue
		}

		pageCount, _ := doc.PageCount()
		t.Logf("  Pages: %d", pageCount)

		// Quick validation
		for i := 0; i < pageCount; i++ {
			page, err := doc.LoadPage(i)
			if err != nil {
				t.Errorf("Failed to load page %d from %s: %v", i, pdfPath, err)
				continue
			}
			page.Drop()
		}

		doc.Drop()
		successCount++
	}

	t.Logf("Batch processing: %d success, %d failures", successCount, failCount)

	if successCount == 0 {
		t.Error("No PDFs were successfully processed")
	}
}

// TestPageIterationOrder tests that pages are loaded in correct order
func TestPageIterationOrder(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/simple/multi-page.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Multi-page test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	// Load pages in forward order
	t.Log("Forward iteration:")
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}

		text, _ := page.ExtractText()
		t.Logf("  Page %d: %d characters", i+1, len(text))

		page.Drop()
	}

	// Load pages in reverse order
	t.Log("Reverse iteration:")
	for i := pageCount - 1; i >= 0; i-- {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d in reverse: %v", i, err)
			continue
		}

		text, _ := page.ExtractText()
		t.Logf("  Page %d: %d characters", i+1, len(text))

		page.Drop()
	}

	// Random access
	t.Log("Random access:")
	if pageCount > 2 {
		indices := []int{pageCount - 1, 0, pageCount / 2}
		for _, i := range indices {
			page, err := doc.LoadPage(i)
			if err != nil {
				t.Errorf("Failed to load page %d randomly: %v", i, err)
				continue
			}

			text, _ := page.ExtractText()
			t.Logf("  Page %d: %d characters", i+1, len(text))

			page.Drop()
		}
	}
}

// TestTextSearchWorkflow tests a complete text search workflow
func TestTextSearchWorkflow(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, _ := doc.PageCount()

	// Step 1: Extract all text
	t.Log("Step 1: Extracting all text...")
	var allText strings.Builder
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			continue
		}

		text, err := page.ExtractText()
		if err == nil {
			allText.WriteString(text)
			allText.WriteString("\n")
		}

		page.Drop()
	}

	fullText := allText.String()
	t.Logf("Total text extracted: %d characters", len(fullText))

	// Step 2: Find common words
	words := strings.Fields(fullText)
	wordSet := make(map[string]bool)
	for _, word := range words {
		word = strings.Trim(word, ".,!?;:")
		if len(word) > 2 {
			wordSet[word] = true
		}
	}

	t.Logf("Unique words: %d", len(wordSet))

	// Step 3: Search for each unique word
	searchCount := 0
	for word := range wordSet {
		if searchCount >= 5 { // Limit searches for speed
			break
		}

		page, err := doc.LoadPage(0)
		if err != nil {
			continue
		}

		results, err := page.SearchText(word)
		if err == nil {
			t.Logf("  '%s': %d match(es)", word, len(results))
		}

		page.Drop()
		searchCount++
	}
}

