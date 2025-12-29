//go:build integration
// +build integration

package integration

import (
	"os"
	"path/filepath"
	"testing"

	micropdf "github.com/lexmata/micropdf/go-micropdf"
)

// TestDocumentOpenAndRead tests opening and reading a real PDF
func TestDocumentOpenAndRead(t *testing.T) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Create a test PDF
	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	// Open the document
	doc, err := micropdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Verify page count
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if pageCount != 1 {
		t.Errorf("Expected 1 page, got %d", pageCount)
	}

	// Load the page
	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Get page bounds
	bounds := page.Bounds()
	if bounds.Width() <= 0 || bounds.Height() <= 0 {
		t.Errorf("Invalid page bounds: %v", bounds)
	}

	t.Logf("Successfully opened PDF with %d page(s), size: %.2fx%.2f",
		pageCount, bounds.Width(), bounds.Height())
}

// TestDocumentFromBytes tests opening a PDF from memory
func TestDocumentFromBytes(t *testing.T) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Create a test PDF and read it into memory
	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	data, err := os.ReadFile(pdfPath)
	if err != nil {
		t.Fatalf("Failed to read PDF file: %v", err)
	}

	// Open from bytes
	doc, err := micropdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
	if err != nil {
		t.Fatalf("Failed to open document from bytes: %v", err)
	}
	defer doc.Drop()

	// Verify it works
	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if pageCount != 1 {
		t.Errorf("Expected 1 page, got %d", pageCount)
	}

	t.Logf("Successfully opened PDF from %d bytes", len(data))
}

// TestDocumentMetadata tests reading PDF metadata
func TestDocumentMetadata(t *testing.T) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := micropdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Try to get metadata (may be empty for our test PDF)
	title, err := doc.GetMetadata("Title")
	if err != nil {
		t.Errorf("Failed to get Title metadata: %v", err)
	}

	author, err := doc.GetMetadata("Author")
	if err != nil {
		t.Errorf("Failed to get Author metadata: %v", err)
	}

	t.Logf("Metadata - Title: '%s', Author: '%s'", title, author)
}

// TestDocumentSecurity tests password-protected PDFs
func TestDocumentSecurity(t *testing.T) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	defer os.Remove(pdfPath)

	doc, err := micropdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	// Check if password is needed (should be false for our test PDF)
	needsPassword, err := doc.NeedsPassword()
	if err != nil {
		t.Fatalf("Failed to check password: %v", err)
	}

	if needsPassword {
		t.Error("Test PDF should not require password")
	}

	// Check permissions
	canPrint, err := doc.HasPermission(4) // FZ_PERMISSION_PRINT
	if err != nil {
		t.Errorf("Failed to check print permission: %v", err)
	}

	t.Logf("Security - Needs password: %v, Can print: %v", needsPassword, canPrint)
}

// Helper function to create a minimal test PDF
func createTestPDF(t *testing.T) string {
	t.Helper()

	pdfContent := `%PDF-1.4
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

	tmpDir := t.TempDir()
	pdfPath := filepath.Join(tmpDir, "test-integration.pdf")

	err := os.WriteFile(pdfPath, []byte(pdfContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test PDF: %v", err)
	}

	return pdfPath
}
