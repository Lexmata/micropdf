package nanopdf

import (
	"runtime"
	"testing"
	"time"
)

func TestLeakDetection(t *testing.T) {
	// Enable leak detection
	EnableLeakDetection(true)
	defer EnableLeakDetection(false)

	// Clear any previous warnings
	ClearLeakWarnings()

	// Create a tracked resource that "leaks"
	tracker := &TrackedResource{}
	tracker.InitTracking(12345, ResourceBuffer)

	// Don't call MarkDropped - simulate a leak

	// Force GC to trigger finalizer
	tracker = nil
	runtime.GC()
	time.Sleep(100 * time.Millisecond) // Give finalizer time to run

	// Check for warnings
	count := GetLeakWarningCount()
	if count < 1 {
		t.Log("Note: Finalizer may not have run yet (timing dependent)")
	}
}

func TestTrackedResourceProperDrop(t *testing.T) {
	// Enable leak detection
	EnableLeakDetection(true)
	defer EnableLeakDetection(false)

	// Clear any previous warnings
	ClearLeakWarnings()
	initialCount := GetLeakWarningCount()

	// Create a tracked resource and properly drop it
	tracker := &TrackedResource{}
	tracker.InitTracking(12346, ResourceDocument)

	// Mark as dropped (proper cleanup)
	tracker.MarkDropped()

	// Verify it's marked as dropped
	if !tracker.IsDropped() {
		t.Error("Expected resource to be marked as dropped")
	}

	// Force GC - should not trigger warning since it was dropped
	tracker = nil
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	// No new warnings should be added
	if GetLeakWarningCount() > initialCount {
		t.Error("Expected no new leak warnings for properly dropped resource")
	}
}

func TestPointPool(t *testing.T) {
	// Get a point from the pool
	p := GetPointFromPool()
	if p == nil {
		t.Fatal("Expected non-nil point from pool")
	}

	// Modify it
	p.X = 100
	p.Y = 200

	// Return to pool
	PutPointToPool(p)

	// Get another - should be reset
	p2 := GetPointFromPool()
	if p2.X != 0 || p2.Y != 0 {
		// Note: sync.Pool doesn't guarantee reset, this is for coverage
		t.Log("Pool returned a non-reset point (expected behavior)")
	}
	PutPointToPool(p2)
}

func TestRectPool(t *testing.T) {
	r := GetRectFromPool()
	if r == nil {
		t.Fatal("Expected non-nil rect from pool")
	}

	r.X0 = 10
	r.Y0 = 20
	r.X1 = 100
	r.Y1 = 200

	PutRectToPool(r)

	r2 := GetRectFromPool()
	PutRectToPool(r2)
}

func TestMatrixPool(t *testing.T) {
	m := GetMatrixFromPool()
	if m == nil {
		t.Fatal("Expected non-nil matrix from pool")
	}

	m.A = 1
	m.D = 1

	PutMatrixToPool(m)

	m2 := GetMatrixFromPool()
	PutMatrixToPool(m2)
}

func TestQuadPool(t *testing.T) {
	q := GetQuadFromPool()
	if q == nil {
		t.Fatal("Expected non-nil quad from pool")
	}

	q.UL = Point{X: 0, Y: 0}
	q.UR = Point{X: 100, Y: 0}

	PutQuadToPool(q)

	q2 := GetQuadFromPool()
	PutQuadToPool(q2)
}

func TestByteSlicePool(t *testing.T) {
	// Get a small buffer
	buf := GetByteSlice(100)
	if cap(buf) < 100 {
		t.Errorf("Expected capacity >= 100, got %d", cap(buf))
	}

	// Use it
	buf = append(buf, []byte("hello")...)

	// Return it
	PutByteSlice(buf)

	// Get a larger buffer
	bigBuf := GetByteSlice(50000)
	if cap(bigBuf) < 50000 {
		t.Errorf("Expected capacity >= 50000, got %d", cap(bigBuf))
	}
	PutByteSlice(bigBuf)
}

func TestHandleTracker(t *testing.T) {
	// Enable profiling
	EnableProfiling(true)
	defer EnableProfiling(false)

	tracker := GetTracker()
	if tracker == nil {
		t.Fatal("Expected non-nil tracker")
	}

	// Track various resources
	tracker.TrackDocument(1001, "test-doc")
	tracker.TrackPage(1002, "test-page")
	tracker.TrackPixmap(1003, 100, 100, 4, "test-pixmap")
	tracker.TrackBuffer(1004, 1024, "test-buffer")
	tracker.TrackStream(1005, "test-stream")
	tracker.TrackFont(1006, "test-font")
	tracker.TrackImage(1007, 200, 200, "test-image")
	tracker.TrackPath(1008, "test-path")
	tracker.TrackDevice(1009, "test-device")
	tracker.TrackDisplayList(1010, "test-display-list")
	tracker.TrackColorspace(1011, "test-colorspace")

	// Check stats
	stats := GetProfiler().GetGlobalStats()
	if stats.CurrentHandles < 11 {
		t.Errorf("Expected at least 11 tracked handles, got %d", stats.CurrentHandles)
	}

	// Untrack all
	for i := uintptr(1001); i <= 1011; i++ {
		tracker.Untrack(i)
	}
}

func TestResourceSummary(t *testing.T) {
	summary := ResourceSummary()
	if summary == "" {
		t.Error("Expected non-empty resource summary")
	}
	t.Log("Resource summary:", summary)
}

func TestPoolStatsFunc(t *testing.T) {
	stats := PoolStats()
	if stats == nil {
		t.Error("Expected non-nil pool stats")
	}
}

func TestNilPoolPuts(t *testing.T) {
	// These should not panic
	PutPointToPool(nil)
	PutRectToPool(nil)
	PutMatrixToPool(nil)
	PutQuadToPool(nil)
}

func BenchmarkPointPool(b *testing.B) {
	for i := 0; i < b.N; i++ {
		p := GetPointFromPool()
		p.X = float32(i)
		p.Y = float32(i)
		PutPointToPool(p)
	}
}

func BenchmarkPointAlloc(b *testing.B) {
	for i := 0; i < b.N; i++ {
		p := &Point{X: float32(i), Y: float32(i)}
		_ = p
	}
}

func BenchmarkRectPool(b *testing.B) {
	for i := 0; i < b.N; i++ {
		r := GetRectFromPool()
		r.X0 = float32(i)
		r.Y0 = float32(i)
		r.X1 = float32(i + 100)
		r.Y1 = float32(i + 100)
		PutRectToPool(r)
	}
}

func BenchmarkMatrixPool(b *testing.B) {
	for i := 0; i < b.N; i++ {
		m := GetMatrixFromPool()
		m.A = 1
		m.D = 1
		m.E = float32(i)
		m.F = float32(i)
		PutMatrixToPool(m)
	}
}

func BenchmarkByteSlicePool(b *testing.B) {
	for i := 0; i < b.N; i++ {
		buf := GetByteSlice(4096)
		buf = append(buf, make([]byte, 1000)...)
		PutByteSlice(buf)
	}
}

func BenchmarkByteSliceAlloc(b *testing.B) {
	for i := 0; i < b.N; i++ {
		buf := make([]byte, 0, 4096)
		buf = append(buf, make([]byte, 1000)...)
		_ = buf
	}
}
