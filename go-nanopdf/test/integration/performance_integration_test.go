//go:build integration
// +build integration

package integration

import (
	"os"
	"runtime"
	"testing"
	"time"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

// TestPerformanceDocumentOpen benchmarks document opening
func TestPerformanceDocumentOpen(t *testing.T) {
	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	iterations := 100
	start := time.Now()

	for i := 0; i < iterations; i++ {
		doc, err := nanopdf.OpenDocument(ctx, pdfPath)
		if err != nil {
			t.Fatalf("Iteration %d: Failed to open document: %v", i, err)
		}
		doc.Drop()
	}

	duration := time.Since(start)
	avgTime := duration / time.Duration(iterations)

	t.Logf("Opened document %d times in %v", iterations, duration)
	t.Logf("Average: %v per open", avgTime)
	t.Logf("Rate: %.2f opens/sec", float64(iterations)/duration.Seconds())

	// Performance threshold: should open at least 50 times per second
	if avgTime > 20*time.Millisecond {
		t.Logf("Warning: Document opening is slow (avg %v)", avgTime)
	}
}

// TestPerformancePageRendering benchmarks page rendering
func TestPerformancePageRendering(t *testing.T) {
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

	scales := []struct {
		name  string
		scale float32
	}{
		{"Small (0.25x)", 0.25},
		{"Medium (0.5x)", 0.5},
		{"Normal (1.0x)", 1.0},
		{"Large (2.0x)", 2.0},
	}

	iterations := 50

	for _, s := range scales {
		matrix := nanopdf.MatrixScale(s.scale, s.scale)
		start := time.Now()

		for i := 0; i < iterations; i++ {
			pix, err := page.RenderToPixmap(matrix, false)
			if err != nil {
				t.Errorf("%s iteration %d: Render failed: %v", s.name, i, err)
				break
			}
			pix.Drop()
		}

		duration := time.Since(start)
		avgTime := duration / time.Duration(iterations)

		t.Logf("%s: %d renders in %v (avg %v, %.2f fps)",
			s.name, iterations, duration, avgTime, float64(iterations)/duration.Seconds())
	}
}

// TestPerformanceTextExtraction benchmarks text extraction
func TestPerformanceTextExtraction(t *testing.T) {
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

	iterations := 200
	start := time.Now()
	var totalChars int

	for i := 0; i < iterations; i++ {
		text, err := page.ExtractText()
		if err != nil {
			t.Errorf("Iteration %d: Extract failed: %v", i, err)
			break
		}
		totalChars += len(text)
	}

	duration := time.Since(start)
	avgTime := duration / time.Duration(iterations)

	t.Logf("Extracted text %d times in %v", iterations, duration)
	t.Logf("Average: %v per extraction", avgTime)
	t.Logf("Rate: %.2f extractions/sec", float64(iterations)/duration.Seconds())
	t.Logf("Total characters: %d", totalChars)
}

// TestPerformanceMultiPageDocument tests performance with larger documents
func TestPerformanceMultiPageDocument(t *testing.T) {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := "../../../test-pdfs/simple/multi-page.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Multi-page test PDF not found")
	}

	start := time.Now()

	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		t.Fatalf("Failed to open document: %v", err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		t.Fatalf("Failed to get page count: %v", err)
	}

	openTime := time.Since(start)
	t.Logf("Opened %d-page document in %v", pageCount, openTime)

	// Load all pages
	start = time.Now()
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			t.Errorf("Failed to load page %d: %v", i, err)
			continue
		}
		page.Drop()
	}
	loadTime := time.Since(start)
	t.Logf("Loaded %d pages in %v (avg %v/page)", pageCount, loadTime, loadTime/time.Duration(pageCount))

	// Render all pages
	start = time.Now()
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			continue
		}

		matrix := nanopdf.MatrixScale(0.5, 0.5)
		pix, err := page.RenderToPixmap(matrix, false)
		if err != nil {
			t.Errorf("Failed to render page %d: %v", i, err)
		} else {
			pix.Drop()
		}

		page.Drop()
	}
	renderTime := time.Since(start)
	t.Logf("Rendered %d pages in %v (avg %v/page)", pageCount, renderTime, renderTime/time.Duration(pageCount))

	// Extract text from all pages
	start = time.Now()
	var totalText int
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			continue
		}

		text, err := page.ExtractText()
		if err == nil {
			totalText += len(text)
		}

		page.Drop()
	}
	extractTime := time.Since(start)
	t.Logf("Extracted text from %d pages in %v (avg %v/page, %d chars total)",
		pageCount, extractTime, extractTime/time.Duration(pageCount), totalText)
}

// TestMemoryUsage tests memory consumption
func TestMemoryUsage(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping memory test in short mode")
	}

	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	// Force GC and get baseline
	runtime.GC()
	var m1 runtime.MemStats
	runtime.ReadMemStats(&m1)
	baselineAlloc := m1.Alloc

	t.Logf("Baseline memory: %d KB", baselineAlloc/1024)

	ctx := nanopdf.NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Open and close documents repeatedly
	iterations := 100
	for i := 0; i < iterations; i++ {
		doc, err := nanopdf.OpenDocument(ctx, pdfPath)
		if err != nil {
			t.Fatalf("Iteration %d: Failed to open document: %v", i, err)
		}

		page, err := doc.LoadPage(0)
		if err == nil {
			matrix := nanopdf.MatrixScale(0.5, 0.5)
			pix, err := page.RenderToPixmap(matrix, false)
			if err == nil {
				pix.Drop()
			}
			page.Drop()
		}

		doc.Drop()

		// Sample memory every 10 iterations
		if (i+1)%10 == 0 {
			runtime.GC()
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			t.Logf("After %d iterations: %d KB (delta: %d KB)",
				i+1, m.Alloc/1024, int64(m.Alloc-baselineAlloc)/1024)
		}
	}

	// Final memory check
	runtime.GC()
	var m2 runtime.MemStats
	runtime.ReadMemStats(&m2)
	finalAlloc := m2.Alloc
	delta := int64(finalAlloc - baselineAlloc)

	t.Logf("Final memory: %d KB (delta: %d KB)", finalAlloc/1024, delta/1024)

	// Memory leak detection: delta should be reasonable
	if delta > 10*1024*1024 { // 10 MB
		t.Errorf("Possible memory leak: %d KB increase after %d iterations", delta/1024, iterations)
	}
}

// TestStressRepeatedOperations stress tests repeated operations
func TestStressRepeatedOperations(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping stress test in short mode")
	}

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

	iterations := 1000
	t.Logf("Performing %d iterations of mixed operations...", iterations)

	start := time.Now()
	var successCount int
	var failCount int

	for i := 0; i < iterations; i++ {
		// Mix of operations
		switch i % 4 {
		case 0:
			// Render
			matrix := nanopdf.MatrixScale(0.5, 0.5)
			pix, err := page.RenderToPixmap(matrix, false)
			if err != nil {
				failCount++
			} else {
				pix.Drop()
				successCount++
			}

		case 1:
			// Extract text
			_, err := page.ExtractText()
			if err != nil {
				failCount++
			} else {
				successCount++
			}

		case 2:
			// Get bounds
			_ = page.Bounds()
			successCount++

		case 3:
			// Search text
			_, err := page.SearchText("test")
			if err != nil {
				failCount++
			} else {
				successCount++
			}
		}

		// Progress update
		if (i+1)%100 == 0 {
			t.Logf("Progress: %d/%d (%.1f%%) - %d success, %d failures",
				i+1, iterations, float64(i+1)/float64(iterations)*100, successCount, failCount)
		}
	}

	duration := time.Since(start)
	t.Logf("Completed %d iterations in %v", iterations, duration)
	t.Logf("Success: %d, Failures: %d, Success rate: %.2f%%",
		successCount, failCount, float64(successCount)/float64(iterations)*100)

	if successCount < iterations*90/100 {
		t.Errorf("Success rate too low: %d/%d (%.2f%%)",
			successCount, iterations, float64(successCount)/float64(iterations)*100)
	}
}

// TestPerformanceBufferOperations benchmarks buffer operations
func TestPerformanceBufferOperations(t *testing.T) {
	iterations := 10000
	bufferSize := 1024

	// Test buffer creation
	start := time.Now()
	for i := 0; i < iterations; i++ {
		buf := nanopdf.NewBuffer(bufferSize)
		if buf == nil {
			t.Fatal("Failed to create buffer")
		}
		buf.Free()
	}
	createTime := time.Since(start)
	t.Logf("Created and freed %d buffers in %v (avg %v)",
		iterations, createTime, createTime/time.Duration(iterations))

	// Test buffer append
	buf := nanopdf.NewBuffer(bufferSize)
	if buf == nil {
		t.Fatal("Failed to create buffer")
	}
	defer buf.Free()

	data := []byte("test data")
	start = time.Now()
	for i := 0; i < iterations; i++ {
		if err := buf.Append(data); err != nil {
			t.Fatalf("Append failed at iteration %d: %v", i, err)
		}
	}
	appendTime := time.Since(start)
	t.Logf("Appended data %d times in %v (avg %v)",
		iterations, appendTime, appendTime/time.Duration(iterations))

	// Test buffer read
	start = time.Now()
	for i := 0; i < iterations; i++ {
		_ = buf.Bytes()
	}
	readTime := time.Since(start)
	t.Logf("Read buffer %d times in %v (avg %v)",
		iterations, readTime, readTime/time.Duration(iterations))
}

// TestPerformanceGeometry benchmarks geometry operations
func TestPerformanceGeometry(t *testing.T) {
	iterations := 100000

	// Test matrix operations
	start := time.Now()
	m := nanopdf.MatrixIdentity()
	for i := 0; i < iterations; i++ {
		m = m.PreTranslate(1.0, 1.0)
		m = m.PreScale(1.1, 1.1)
		m = m.PreRotate(1.0)
	}
	matrixTime := time.Since(start)
	t.Logf("Performed %d matrix operations in %v (avg %v)",
		iterations*3, matrixTime, matrixTime/time.Duration(iterations*3))

	// Test rect operations
	start = time.Now()
	r1 := nanopdf.Rect{X0: 0, Y0: 0, X1: 100, Y1: 100}
	r2 := nanopdf.Rect{X0: 50, Y0: 50, X1: 150, Y1: 150}
	p := nanopdf.Point{X: 75, Y: 75}
	for i := 0; i < iterations; i++ {
		_ = r1.Union(r2)
		_ = r1.Intersect(r2)
		_ = r1.Contains(p)
		intersect := r1.Intersect(r2)
		_ = !intersect.IsEmpty() // Check if rects intersect
	}
	rectTime := time.Since(start)
	t.Logf("Performed %d rect operations in %v (avg %v)",
		iterations*5, rectTime, rectTime/time.Duration(iterations*5))

	// Test point operations
	start = time.Now()
	p = nanopdf.Point{X: 100, Y: 100}
	for i := 0; i < iterations; i++ {
		_ = m.TransformPoint(p)
		_ = r1.ContainsXY(p.X, p.Y)
	}
	pointTime := time.Since(start)
	t.Logf("Performed %d point operations in %v (avg %v)",
		iterations*2, pointTime, pointTime/time.Duration(iterations*2))
}

// TestResourceCleanup tests proper resource cleanup
func TestResourceCleanup(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping resource cleanup test in short mode")
	}

	pdfPath := "../../../test-pdfs/simple/hello-world.pdf"
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		t.Skip("Test PDF not found")
	}

	// Get baseline goroutine count
	runtime.GC()
	baselineGoroutines := runtime.NumGoroutine()

	t.Logf("Baseline goroutines: %d", baselineGoroutines)

	// Create and destroy resources repeatedly
	iterations := 50
	for i := 0; i < iterations; i++ {
		ctx := nanopdf.NewContext()
		if ctx == nil {
			t.Fatal("Failed to create context")
		}

		doc, err := nanopdf.OpenDocument(ctx, pdfPath)
		if err != nil {
			ctx.Drop()
			t.Fatalf("Failed to open document: %v", err)
		}

		page, err := doc.LoadPage(0)
		if err == nil {
			matrix := nanopdf.MatrixScale(0.5, 0.5)
			pix, err := page.RenderToPixmap(matrix, false)
			if err == nil {
				pix.Drop()
			}
			page.Drop()
		}

		doc.Drop()
		ctx.Drop()

		// Check goroutine count periodically
		if (i+1)%10 == 0 {
			runtime.GC()
			currentGoroutines := runtime.NumGoroutine()
			t.Logf("After %d iterations: %d goroutines (delta: %d)",
				i+1, currentGoroutines, currentGoroutines-baselineGoroutines)
		}
	}

	// Final check
	runtime.GC()
	time.Sleep(100 * time.Millisecond) // Allow goroutines to finish
	finalGoroutines := runtime.NumGoroutine()

	t.Logf("Final goroutines: %d (delta: %d)", finalGoroutines, finalGoroutines-baselineGoroutines)

	// Allow some deviation but detect goroutine leaks
	if finalGoroutines > baselineGoroutines+10 {
		t.Errorf("Possible goroutine leak: %d goroutines at baseline, %d after test",
			baselineGoroutines, finalGoroutines)
	}
}
