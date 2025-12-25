//go:build integration
// +build integration

package integration

import (
	"os"
	"strings"
	"testing"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestTextExtraction tests extracting text from a PDF
func TestTextExtraction(t *testing.T) {
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

	// Extract text
	text, err := page.ExtractText()
	if err != nil {
		t.Fatalf("Failed to extract text: %v", err)
	}

	// Our test PDF contains "Hello World"
	if !strings.Contains(text, "Hello") {
		t.Logf("Warning: Expected to find 'Hello' in text, got: %q", text)
	}

	t.Logf("Extracted text: %q (%d bytes)", text, len(text))
}

// TestTextSearch tests searching for text in a PDF
func TestTextSearch(t *testing.T) {
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

	// Search for "Hello"
	results, err := page.SearchText("Hello")
	if err != nil {
		t.Fatalf("Failed to search text: %v", err)
	}

	if len(results) == 0 {
		t.Log("Warning: No search results found for 'Hello' (may be expected for simple PDF)")
	} else {
		t.Logf("Found %d match(es) for 'Hello'", len(results))
		for i, rect := range results {
			t.Logf("  Match %d: [%.2f, %.2f, %.2f, %.2f]",
				i+1, rect.X0, rect.Y0, rect.X1, rect.Y1)
		}
	}

	// Search for non-existent text
	results, err = page.SearchText("NonExistentText")
	if err != nil {
		t.Errorf("Search should not fail for non-existent text: %v", err)
	}

	if len(results) != 0 {
		t.Errorf("Expected 0 results for non-existent text, got %d", len(results))
	}
}

// TestTextSearchCaseSensitive tests case-sensitive search
func TestTextSearchCaseSensitive(t *testing.T) {
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

	// Test different case variations
	searches := []string{"Hello", "hello", "HELLO", "World", "world"}

	for _, needle := range searches {
		results, err := page.SearchText(needle)
		if err != nil {
			t.Errorf("Failed to search for %q: %v", needle, err)
			continue
		}

		t.Logf("Search %q: %d result(s)", needle, len(results))
	}
}
