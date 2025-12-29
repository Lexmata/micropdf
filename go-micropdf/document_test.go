package micropdf

import (
	"os"
	"path/filepath"
	"testing"
)

// Helper to create a test PDF file
func createTestPDF(t *testing.T) string {
	t.Helper()

	// Create a minimal PDF
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
	pdfPath := filepath.Join(tmpDir, "test.pdf")

	err := os.WriteFile(pdfPath, []byte(pdfContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test PDF: %v", err)
	}

	return pdfPath
}

func TestOpenDocument(t *testing.T) {
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

	if !doc.IsValid() {
		t.Error("Document should be valid after opening")
	}
}

func TestOpenDocumentFromBytes(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := createTestPDF(t)
	data, err := os.ReadFile(pdfPath)
	if err != nil {
		t.Fatalf("Failed to read test PDF: %v", err)
	}

	doc, err := OpenDocumentFromBytes(ctx, data, "application/pdf")
	if err != nil {
		t.Fatalf("Failed to open document from bytes: %v", err)
	}
	defer doc.Drop()

	if !doc.IsValid() {
		t.Error("Document should be valid after opening")
	}
}

func TestDocumentPageCount(t *testing.T) {
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

	count, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 page, got %d", count)
	}
}

func TestDocumentMetadata(t *testing.T) {
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

	// Try to get metadata (may be empty for our test PDF)
	_, err = doc.GetMetadata("Title")
	if err != nil {
		t.Errorf("Failed to get metadata: %v", err)
	}
}

func TestDocumentNeedsPassword(t *testing.T) {
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

	needsPassword, err := doc.NeedsPassword()
	if err != nil {
		t.Fatalf("Failed to check password: %v", err)
	}

	if needsPassword {
		t.Error("Test PDF should not require password")
	}
}

func TestDocumentDrop(t *testing.T) {
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

	doc.Drop()

	if doc.IsValid() {
		t.Error("Document should be invalid after drop")
	}

	// Multiple drops should be safe
	doc.Drop()
}

func TestDocumentAuthenticate(t *testing.T) {
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

	// Test with non-encrypted PDF
	authenticated, err := doc.Authenticate("")
	if err != nil {
		t.Errorf("Authenticate should not error: %v", err)
	}

	// For non-encrypted PDFs, authentication may succeed with empty password
	t.Logf("Authenticated: %v", authenticated)

	// Test with wrong password (should not panic)
	_, err = doc.Authenticate("wrongpassword")
	if err != nil {
		t.Logf("Expected behavior: wrong password returns error or false")
	}
}

func TestDocumentHasPermission(t *testing.T) {
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

	// Test various permissions
	permissions := []struct {
		perm int
		name string
	}{
		{2, "PRINT"},
		{4, "COPY"},
		{8, "EDIT"},
		{16, "ANNOTATE"},
	}

	for _, p := range permissions {
		hasPermission, err := doc.HasPermission(p.perm)
		if err != nil {
			t.Errorf("HasPermission(%s) error: %v", p.name, err)
		} else {
			t.Logf("Permission %s: %v", p.name, hasPermission)
		}
	}
}

func TestDocumentSave(t *testing.T) {
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

	// Save to a new file
	outputPath := filepath.Join(t.TempDir(), "output.pdf")
	err = doc.Save(outputPath)
	if err != nil {
		t.Errorf("Save failed: %v", err)
	}

	// In mock mode, Save may not actually create a file
	// In real mode, file should be created
	if !IsMock() {
		if _, err := os.Stat(outputPath); os.IsNotExist(err) {
			t.Error("Output file was not created")
		} else {
			t.Logf("Saved to: %s", outputPath)
		}
	} else {
		t.Log("Mock mode: Save called but file not created")
	}
}

func TestDocumentResolveLink(t *testing.T) {
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

	// Test resolving a link (may fail if no links in test PDF)
	pageNum, err := doc.ResolveLink("SomeLink")
	if err != nil {
		t.Logf("Expected: no links in test PDF - %v", err)
	} else {
		t.Logf("Resolved link to page: %d", pageNum)
	}
}
