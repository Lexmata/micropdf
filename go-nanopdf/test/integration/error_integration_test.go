//go:build integration
// +build integration

package integration

import (
	"os"
	"path/filepath"
	"testing"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestErrorInvalidPDFPath tests opening non-existent files
func TestErrorInvalidPDFPath(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	invalidPaths := []string{
		"/nonexistent/path/to/file.pdf",
		"",
		"/dev/null",
		"/tmp/does-not-exist-" + filepath.Base(t.TempDir()) + ".pdf",
	}

	for _, path := range invalidPaths {
		t.Logf("Testing invalid path: %q", path)

		doc, err := nanopdf.OpenDocument(ctx, path)
		if err == nil {
			doc.Drop()
			t.Errorf("Expected error opening %q, but got none", path)
		} else {
			t.Logf("  Got expected error: %v", err)
		}
	}
}

// TestErrorCorruptedPDF tests handling malformed PDF data
func TestErrorCorruptedPDF(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	corruptedData := []struct {
		name string
		data []byte
	}{
		{"Empty file", []byte{}},
		{"Not a PDF", []byte("This is not a PDF file")},
		{"Invalid PDF header", []byte("%PDF-9.9\ngarbage")},
		{"Truncated PDF", []byte("%PDF-1.4\n1 0 obj")},
		{"Binary garbage", []byte{0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA}},
	}

	for _, tc := range corruptedData {
		t.Run(tc.name, func(t *testing.T) {
			// Write corrupted data to temp file
			tmpFile := filepath.Join(t.TempDir(), "corrupted.pdf")
			if err := os.WriteFile(tmpFile, tc.data, 0644); err != nil {
				t.Fatalf("Failed to write test file: %v", err)
			}

			// Try to open
			doc, err := nanopdf.OpenDocument(ctx, tmpFile)
			if err == nil {
				doc.Drop()
				t.Error("Expected error opening corrupted PDF, but got none")
			} else {
				t.Logf("Got expected error: %v", err)
			}
		})
	}
}

// TestErrorCorruptedPDFFromBytes tests opening corrupted data from memory
func TestErrorCorruptedPDFFromBytes(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	corruptedData := [][]byte{
		{},
		[]byte("not a pdf"),
		[]byte("%PDF-1.4\n%corrupted"),
		make([]byte, 10), // all zeros
	}

	for i, data := range corruptedData {
		t.Logf("Test case %d: %d bytes", i+1, len(data))

		doc, err := nanopdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
		if err == nil {
			doc.Drop()
			t.Errorf("Case %d: Expected error, but got none", i+1)
		} else {
			t.Logf("  Got expected error: %v", err)
		}
	}
}

// TestErrorInvalidPageIndex tests loading pages with invalid indices
func TestErrorInvalidPageIndex(t *testing.T) {
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

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	invalidIndices := []int{
		-1,
		-10,
		pageCount,
		pageCount + 1,
		pageCount + 100,
		999,
	}

	for _, index := range invalidIndices {
		t.Logf("Testing invalid page index: %d", index)

		page, err := doc.LoadPage(index)
		if err == nil {
			page.Drop()
			t.Errorf("Expected error for page index %d, but got none", index)
		} else {
			t.Logf("  Got expected error: %v", err)
		}
	}
}

// TestErrorNilContext tests operations with nil context
func TestErrorNilContext(t *testing.T) {
	// Context creation failure should be rare, but we can test nil handling

	// These operations should fail gracefully with nil context
	// In practice, NewContext rarely returns nil unless out of memory

	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Skip("Cannot create context to test nil handling")
	}
	defer ctx.Drop()

	// Test with a valid context to ensure error paths work
	pdfPath := "/nonexistent/file.pdf"
	_, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err == nil {
		t.Error("Expected error opening non-existent file")
	}
}

// TestErrorDoubleDropProtection tests that double-drop doesn't crash
func TestErrorDoubleDropProtection(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}

	// Drop once (normal)
	ctx.Drop()

	// Drop again (should be safe, though not recommended)
	// This shouldn't crash or cause issues
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Double drop caused panic: %v", r)
		}
	}()
	ctx.Drop()

	t.Log("Double drop handled safely")
}

// TestErrorResourceLeakRecovery tests recovery from resource errors
func TestErrorResourceLeakRecovery(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	// Open and close document many times to test resource management
	for i := 0; i < 50; i++ {
		doc, err := nanopdf.OpenDocument(ctx, pdfPath)
		if err != nil {
			t.Fatalf("Iteration %d: Failed to open document: %v", i, err)
		}

		// Intentionally don't load pages or do anything
		// Just open and close to test resource management

		doc.Drop()
	}

	t.Log("Successfully opened and closed document 50 times")
}

// TestErrorEmptyPDF tests handling of minimal/empty PDFs
func TestErrorEmptyPDF(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/minimal/empty.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Empty test PDF not found")
	}

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open empty PDF: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	t.Logf("Empty PDF has %d page(s)", pageCount)

	// Try to load first page (may or may not exist)
	if pageCount > 0 {
		page, err := doc.LoadPage(0)
		if err != nil {
			t.Logf("Failed to load page from empty PDF (may be expected): %v", err)
		} else {
			bounds := page.Bounds()
			t.Logf("Empty PDF page bounds: %v", bounds)
			page.Drop()
		}
	}
}

// TestErrorInvalidBufferOperations tests buffer error conditions
func TestErrorInvalidBufferOperations(t *testing.T) {
	// Test buffer with zero capacity
	buf := nanopdf.NewBuffer(0)
	if buf == nil {
		t.Error("Buffer with zero capacity should still be created")
	} else {
		defer buf.Free()

		// Try to append data
		if err := buf.Append([]byte("test")); err != nil {
			t.Logf("Append to zero-capacity buffer failed (expected): %v", err)
		}
	}

	// Test appending empty data
	buf2 := nanopdf.NewBuffer(1024)
	if buf2 == nil {
		t.Fatal("Failed to create buffer")
	}
	defer buf2.Free()

	if err := buf2.Append([]byte{}); err != nil {
		t.Errorf("Appending empty data should succeed: %v", err)
	}

	if err := buf2.Append(nil); err != nil {
		t.Logf("Appending nil data failed (may be expected): %v", err)
	}
}

// TestErrorInvalidMatrixOperations tests matrix edge cases
func TestErrorInvalidMatrixOperations(t *testing.T) {
	// Test with zero scale
	m := nanopdf.MatrixScale(0, 0)
	t.Logf("Zero scale matrix: %+v", m)

	// Test with negative scale
	m = nanopdf.MatrixScale(-1, -1)
	t.Logf("Negative scale matrix: %+v", m)

	// Test with very large values
	m = nanopdf.MatrixScale(1e10, 1e10)
	t.Logf("Large scale matrix: %+v", m)

	// Test with NaN (if possible)
	// m = nanopdf.MatrixScale(float32(math.NaN()), float32(math.NaN()))
	// t.Logf("NaN matrix: %+v", m)

	// Test point transformation with identity
	p := nanopdf.Point{X: 100, Y: 100}
	m = nanopdf.MatrixIdentity()
	p2 := m.TransformPoint(p)
	if p2.X != p.X || p2.Y != p.Y {
		t.Errorf("Identity transform changed point: %v -> %v", p, p2)
	}
}

// TestErrorInvalidRectOperations tests rect edge cases
func TestErrorInvalidRectOperations(t *testing.T) {
	// Test empty rect
	r := nanopdf.Rect{X0: 0, Y0: 0, X1: 0, Y1: 0}
	if !r.IsEmpty() {
		t.Error("Zero-size rect should be empty")
	}

	// Test inverted rect (x1 < x0 or y1 < y0)
	r = nanopdf.Rect{X0: 100, Y0: 100, X1: 0, Y1: 0}
	t.Logf("Inverted rect: %v, Width: %.2f, Height: %.2f", r, r.Width(), r.Height())

	// Test rect with negative coordinates
	r = nanopdf.Rect{X0: -100, Y0: -100, X1: -50, Y1: -50}
	t.Logf("Negative rect: %v, Width: %.2f, Height: %.2f", r, r.Width(), r.Height())

	// Test union of empty rects
	r1 := nanopdf.Rect{X0: 0, Y0: 0, X1: 0, Y1: 0}
	r2 := nanopdf.Rect{X0: 0, Y0: 0, X1: 0, Y1: 0}
	union := r1.Union(r2)
	t.Logf("Union of empty rects: %v", union)

	// Test intersection of non-overlapping rects
	r1 = nanopdf.Rect{X0: 0, Y0: 0, X1: 10, Y1: 10}
	r2 = nanopdf.Rect{X0: 20, Y0: 20, X1: 30, Y1: 30}
	intersect := r1.Intersect(r2)
	t.Logf("Intersection of non-overlapping rects: %v", intersect)
	if !intersect.IsEmpty() {
		t.Error("Intersection of non-overlapping rects should be empty")
	}
}

// TestErrorTextSearchEmpty tests searching for empty string
func TestErrorTextSearchEmpty(t *testing.T) {
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

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Search for empty string
	results, err := page.SearchText("")
	if err != nil {
		t.Logf("Searching for empty string failed (may be expected): %v", err)
	} else {
		t.Logf("Searching for empty string returned %d results", len(results))
	}

	// Search for very long string
	longString := make([]byte, 10000)
	for i := range longString {
		longString[i] = 'A'
	}

	results, err = page.SearchText(string(longString))
	if err != nil {
		t.Logf("Searching for very long string failed (expected): %v", err)
	} else {
		t.Logf("Searching for long string returned %d results", len(results))
	}
}

// TestErrorRenderingInvalidScale tests rendering with invalid scales
func TestErrorRenderingInvalidScale(t *testing.T) {
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

	page, err := doc.LoadPage(0)
	if err != nil {
		t.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Test with zero scale
	matrix := nanopdf.MatrixScale(0, 0)
	pix, err := page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Logf("Rendering with zero scale failed (expected): %v", err)
	} else {
		width, _ := pix.Width()
		height, _ := pix.Height()
		t.Logf("Rendered with zero scale: %dx%d", width, height)
		pix.Drop()
	}

	// Test with negative scale
	matrix = nanopdf.MatrixScale(-1, -1)
	pix, err = page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Logf("Rendering with negative scale failed (expected): %v", err)
	} else {
		width, _ := pix.Width()
		height, _ := pix.Height()
		t.Logf("Rendered with negative scale: %dx%d", width, height)
		pix.Drop()
	}

	// Test with very large scale (may fail due to memory)
	matrix = nanopdf.MatrixScale(100, 100)
	pix, err = page.RenderToPixmap(matrix, false)
	if err != nil {
		t.Logf("Rendering with large scale failed (expected): %v", err)
	} else {
		width, _ := pix.Width()
		height, _ := pix.Height()
		t.Logf("Rendered with large scale: %dx%d", width, height)
		pix.Drop()
	}
}

// TestErrorMetadataInvalidKeys tests metadata with invalid keys
func TestErrorMetadataInvalidKeys(t *testing.T) {
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

	invalidKeys := []string{
		"",
		"NonExistentKey",
		"Invalid/Key",
		"Key\x00WithNull",
		"VeryLongKeyNameThatDoesNotExistInTheDocumentMetadata",
	}

	for _, key := range invalidKeys {
		t.Logf("Testing invalid metadata key: %q", key)

		value, err := doc.GetMetadata(key)
		if err != nil {
			t.Logf("  Got error (may be expected): %v", err)
		} else {
			t.Logf("  Got value: %q", value)
		}
	}
}

