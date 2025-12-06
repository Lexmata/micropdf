// +build integration

package integration

import (
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestConcurrentDocumentOpen tests opening multiple documents concurrently
func TestConcurrentDocumentOpen(t *testing.T) {
	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	numGoroutines := 10
	var wg sync.WaitGroup
	var successCount int32
	var failCount int32

	t.Logf("Opening document %d times concurrently...", numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			ctx := nanopdf.NewContext()
			if ctx == nil {
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer ctx.Drop()

			doc, err := nanopdf.OpenDocument(ctx, pdfPath)
			if err != nil {
				t.Errorf("Goroutine %d: Failed to open document: %v", id, err)
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer doc.Drop()

			// Perform some operations
			pageCount, err := doc.PageCount()
			if err != nil {
				t.Errorf("Goroutine %d: Failed to get page count: %v", id, err)
				atomic.AddInt32(&failCount, 1)
				return
			}

			if pageCount != 1 {
				t.Errorf("Goroutine %d: Expected 1 page, got %d", id, pageCount)
				atomic.AddInt32(&failCount, 1)
				return
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Results: %d success, %d failures", successCount, failCount)

	if successCount == 0 {
		t.Fatal("All concurrent opens failed")
	}
}

// TestConcurrentPageRendering tests rendering pages concurrently
func TestConcurrentPageRendering(t *testing.T) {
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

	numRenders := 20
	var wg sync.WaitGroup
	var successCount int32
	var failCount int32

	t.Logf("Rendering page %d times concurrently...", numRenders)

	for i := 0; i < numRenders; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			page, err := doc.LoadPage(0)
			if err != nil {
				t.Errorf("Goroutine %d: Failed to load page: %v", id, err)
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer page.Drop()

			matrix := nanopdf.MatrixScale(0.5, 0.5)
			pix, err := page.RenderToPixmap(matrix, false)
			if err != nil {
				t.Errorf("Goroutine %d: Failed to render: %v", id, err)
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer pix.Drop()

			width, _ := pix.Width()
			height, _ := pix.Height()

			if width <= 0 || height <= 0 {
				t.Errorf("Goroutine %d: Invalid dimensions: %dx%d", id, width, height)
				atomic.AddInt32(&failCount, 1)
				return
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Results: %d success, %d failures", successCount, failCount)

	if successCount < int32(float64(numRenders)*0.8) {
		t.Errorf("Too many failures: %d/%d succeeded", successCount, numRenders)
	}
}

// TestConcurrentTextExtraction tests extracting text concurrently
func TestConcurrentTextExtraction(t *testing.T) {
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

	numExtractions := 15
	var wg sync.WaitGroup
	var successCount int32

	t.Logf("Extracting text %d times concurrently...", numExtractions)

	for i := 0; i < numExtractions; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			page, err := doc.LoadPage(0)
			if err != nil {
				t.Errorf("Goroutine %d: Failed to load page: %v", id, err)
				return
			}
			defer page.Drop()

			text, err := page.ExtractText()
			if err != nil {
				t.Errorf("Goroutine %d: Failed to extract text: %v", id, err)
				return
			}

			if len(text) == 0 {
				t.Logf("Goroutine %d: Warning - no text extracted", id)
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Successfully extracted text %d/%d times", successCount, numExtractions)

	if successCount < int32(float64(numExtractions)*0.9) {
		t.Errorf("Too many extraction failures: %d/%d", successCount, numExtractions)
	}
}

// TestConcurrentMultipleDocuments tests handling multiple documents concurrently
func TestConcurrentMultipleDocuments(t *testing.T) {
	testPDFs := []string{
		"../../../test-pdfs/minimal/empty.pdf",
		"../../../test-pdfs/simple/hello-world.pdf",
		"../../../test-pdfs/simple/multi-page.pdf",
	}

	// Filter to only existing PDFs
	var existingPDFs []string
	for _, pdf := range testPDFs {
		if _, err := os.Stat(pdf); err == nil {
			existingPDFs = append(existingPDFs, pdf)
		}
	}

	if len(existingPDFs) == 0 {
		t.Skip("No test PDFs found")
	}

	var wg sync.WaitGroup
	var successCount int32

	t.Logf("Processing %d PDFs concurrently...", len(existingPDFs))

	for _, pdfPath := range existingPDFs {
		wg.Add(1)
		go func(path string) {
			defer wg.Done()

			ctx := nanopdf.NewContext()
			if ctx == nil {
				t.Errorf("Failed to create context for %s", path)
				return
			}
			defer ctx.Drop()

			doc, err := nanopdf.OpenDocument(ctx, path)
			if err != nil {
				t.Errorf("Failed to open %s: %v", path, err)
				return
			}
			defer doc.Drop()

			pageCount, err := doc.PageCount()
			if err != nil {
				t.Errorf("Failed to get page count for %s: %v", path, err)
				return
			}

			t.Logf("  %s: %d page(s)", path, pageCount)

			// Process first page
			if pageCount > 0 {
				page, err := doc.LoadPage(0)
				if err != nil {
					t.Errorf("Failed to load page 0 from %s: %v", path, err)
					return
				}
				defer page.Drop()

				// Try to render
				matrix := nanopdf.MatrixScale(0.5, 0.5)
				pix, err := page.RenderToPixmap(matrix, false)
				if err != nil {
					t.Logf("Render failed for %s (may be expected): %v", path, err)
				} else {
					pix.Drop()
				}
			}

			atomic.AddInt32(&successCount, 1)
		}(pdfPath)
	}

	wg.Wait()

	t.Logf("Successfully processed %d/%d PDFs concurrently", successCount, len(existingPDFs))

	if successCount == 0 {
		t.Error("Failed to process any PDFs concurrently")
	}
}

// TestConcurrentContextCreation tests creating contexts concurrently
func TestConcurrentContextCreation(t *testing.T) {
	numContexts := 50
	var wg sync.WaitGroup
	var successCount int32

	t.Logf("Creating %d contexts concurrently...", numContexts)

	for i := 0; i < numContexts; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			ctx := nanopdf.NewContext()
			if ctx == nil {
				t.Errorf("Goroutine %d: Failed to create context", id)
				return
			}
			defer ctx.Drop()

			// Perform a simple operation
			buf := nanopdf.NewBuffer(1024)
			if buf == nil {
				t.Errorf("Goroutine %d: Failed to create buffer", id)
				return
			}
			defer buf.Free()

			data := []byte("test data")
			if err := buf.Append(data); err != nil {
				t.Errorf("Goroutine %d: Failed to append data: %v", id, err)
				return
			}

			retrieved := buf.Bytes()
			if len(retrieved) != len(data) {
				t.Errorf("Goroutine %d: Data mismatch: got %d bytes, want %d",
					id, len(retrieved), len(data))
				return
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Successfully created %d/%d contexts", successCount, numContexts)

	if successCount < int32(float64(numContexts)*0.95) {
		t.Errorf("Too many context creation failures: %d/%d", successCount, numContexts)
	}
}

// TestRaceConditionDocumentAccess tests for race conditions in document access
func TestRaceConditionDocumentAccess(t *testing.T) {
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

	numReaders := 10
	iterations := 50
	var wg sync.WaitGroup

	t.Logf("Testing %d concurrent readers x %d iterations...", numReaders, iterations)

	// Multiple goroutines reading the same document
	for i := 0; i < numReaders; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			for j := 0; j < iterations; j++ {
				// Read operations
				pageCount, err := doc.PageCount()
				if err != nil {
					t.Errorf("Reader %d iteration %d: PageCount failed: %v", id, j, err)
					return
				}

				if pageCount > 0 {
					page, err := doc.LoadPage(0)
					if err != nil {
						t.Errorf("Reader %d iteration %d: LoadPage failed: %v", id, j, err)
						return
					}

					_ = page.Bounds()
					page.Drop()
				}

				// Small delay to increase chance of race conditions
				time.Sleep(time.Microsecond * 10)
			}
		}(i)
	}

	wg.Wait()
	t.Log("Race condition test completed without panics")
}

// TestConcurrentBufferOperations tests buffer operations with goroutines
func TestConcurrentBufferOperations(t *testing.T) {
	numBuffers := 20
	var wg sync.WaitGroup
	var successCount int32

	t.Logf("Testing %d concurrent buffer operations...", numBuffers)

	for i := 0; i < numBuffers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			buf := nanopdf.NewBuffer(1024)
			if buf == nil {
				t.Errorf("Goroutine %d: Failed to create buffer", id)
				return
			}
			defer buf.Free()

			// Append data in chunks
			for j := 0; j < 10; j++ {
				data := []byte("test data chunk")
				if err := buf.Append(data); err != nil {
					t.Errorf("Goroutine %d: Append failed: %v", id, err)
					return
				}
			}

			// Read data
			retrieved := buf.Bytes()
			expectedLen := 10 * len("test data chunk")
			if len(retrieved) != expectedLen {
				t.Errorf("Goroutine %d: Expected %d bytes, got %d", id, expectedLen, len(retrieved))
				return
			}

			// Clear and re-append
			buf.Clear()
			if err := buf.Append([]byte("new data")); err != nil {
				t.Errorf("Goroutine %d: Re-append failed: %v", id, err)
				return
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Successfully completed %d/%d buffer operations", successCount, numBuffers)

	if successCount < int32(float64(numBuffers)*0.95) {
		t.Errorf("Too many buffer operation failures: %d/%d", successCount, numBuffers)
	}
}

// TestConcurrentPixmapAccess tests concurrent pixmap operations
func TestConcurrentPixmapAccess(t *testing.T) {
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

	numGoroutines := 10
	var wg sync.WaitGroup
	var successCount int32

	t.Logf("Testing %d concurrent pixmap operations...", numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			matrix := nanopdf.MatrixScale(0.5, 0.5)
			pix, err := page.RenderToPixmap(matrix, false)
			if err != nil {
				t.Errorf("Goroutine %d: Render failed: %v", id, err)
				return
			}
			defer pix.Drop()

			// Access pixmap properties
			width, _ := pix.Width()
			height, _ := pix.Height()
			samples, _ := pix.Samples()

			if width <= 0 || height <= 0 {
				t.Errorf("Goroutine %d: Invalid dimensions: %dx%d", id, width, height)
				return
			}

			if len(samples) == 0 {
				t.Errorf("Goroutine %d: No sample data", id)
				return
			}

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	wg.Wait()

	t.Logf("Successfully completed %d/%d pixmap operations", successCount, numGoroutines)

	if successCount < int32(float64(numGoroutines)*0.9) {
		t.Errorf("Too many pixmap operation failures: %d/%d", successCount, numGoroutines)
	}
}

