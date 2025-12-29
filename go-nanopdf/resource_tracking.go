// Package nanopdf provides resource tracking and finalizer-based leak detection.
//
// This file implements runtime.SetFinalizer-based leak detection for debug builds
// and provides sync.Pool instances for frequently allocated types.
package nanopdf

import (
	"fmt"
	"runtime"
	"sync"
	"sync/atomic"
)

// ============================================================================
// Debug Leak Detection with Finalizers
// ============================================================================

var (
	// debugLeakDetection enables finalizer-based leak detection
	debugLeakDetection atomic.Bool

	// leakWarnings tracks resources that were garbage collected without being dropped
	leakWarnings      []string
	leakWarningsMutex sync.Mutex
	leakWarningsCount atomic.Int64
)

// EnableLeakDetection enables finalizer-based leak detection.
// When enabled, resources that are garbage collected without being properly
// dropped will generate warnings. This is useful for debugging but adds
// overhead, so it should only be enabled in development/debug builds.
func EnableLeakDetection(enabled bool) {
	debugLeakDetection.Store(enabled)
}

// IsLeakDetectionEnabled returns whether leak detection is enabled.
func IsLeakDetectionEnabled() bool {
	return debugLeakDetection.Load()
}

// GetLeakWarnings returns all accumulated leak warnings and clears the list.
func GetLeakWarnings() []string {
	leakWarningsMutex.Lock()
	defer leakWarningsMutex.Unlock()

	warnings := leakWarnings
	leakWarnings = nil
	return warnings
}

// GetLeakWarningCount returns the total number of leak warnings since last clear.
func GetLeakWarningCount() int64 {
	return leakWarningsCount.Load()
}

// ClearLeakWarnings clears all leak warnings.
func ClearLeakWarnings() {
	leakWarningsMutex.Lock()
	defer leakWarningsMutex.Unlock()
	leakWarnings = nil
	leakWarningsCount.Store(0)
}

// recordLeakWarning records a leak warning when a resource is garbage collected
// without being properly dropped.
func recordLeakWarning(resourceType string, handle uintptr, stackTrace string) {
	warning := fmt.Sprintf("[LEAK] %s (handle=%d) was garbage collected without being dropped", resourceType, handle)
	if stackTrace != "" {
		warning += "\n  Allocation stack:\n" + stackTrace
	}

	leakWarningsMutex.Lock()
	leakWarnings = append(leakWarnings, warning)
	leakWarningsMutex.Unlock()

	leakWarningsCount.Add(1)

	// Also print to stderr in debug mode
	fmt.Println(warning)
}

// ============================================================================
// Tracked Resource Wrapper
// ============================================================================

// TrackedResource is embedded in resource types to provide automatic tracking.
type TrackedResource struct {
	handle       uintptr
	resourceType ResourceType
	dropped      atomic.Bool
	stackTrace   string
}

// InitTracking initializes tracking for a resource.
// Should be called immediately after resource creation.
func (t *TrackedResource) InitTracking(handle uintptr, resourceType ResourceType) {
	t.handle = handle
	t.resourceType = resourceType

	if IsProfilingEnabled() {
		// Record in profiler
		TrackAllocation(uint64(handle), resourceType, 0)
	}

	if debugLeakDetection.Load() {
		// Capture stack trace for debugging
		t.stackTrace = captureStackTrace(3)

		// Set finalizer for leak detection
		// Note: We pass a pointer to the TrackedResource, not the parent struct
		runtime.SetFinalizer(t, func(tr *TrackedResource) {
			if !tr.dropped.Load() {
				recordLeakWarning(tr.resourceType.String(), tr.handle, tr.stackTrace)
			}
		})
	}
}

// MarkDropped marks the resource as properly dropped.
// This should be called in the Drop() method of resource types.
func (t *TrackedResource) MarkDropped() {
	if t.dropped.Swap(true) {
		return // Already dropped
	}

	if IsProfilingEnabled() {
		TrackDeallocation(uint64(t.handle))
	}

	// Clear finalizer since resource was properly dropped
	if debugLeakDetection.Load() {
		runtime.SetFinalizer(t, nil)
	}
}

// IsDropped returns whether the resource has been dropped.
func (t *TrackedResource) IsDropped() bool {
	return t.dropped.Load()
}

// ============================================================================
// Sync.Pool for Frequently Allocated Types
// ============================================================================

// PointPool is a sync.Pool for Point objects
var PointPool = sync.Pool{
	New: func() interface{} {
		return &Point{}
	},
}

// RectPool is a sync.Pool for Rect objects
var RectPool = sync.Pool{
	New: func() interface{} {
		return &Rect{}
	},
}

// MatrixPool is a sync.Pool for Matrix objects
var MatrixPool = sync.Pool{
	New: func() interface{} {
		return &Matrix{}
	},
}

// QuadPool is a sync.Pool for Quad objects
var QuadPool = sync.Pool{
	New: func() interface{} {
		return &Quad{}
	},
}

// GetPointFromPool gets a Point from the pool.
func GetPointFromPool() *Point {
	return PointPool.Get().(*Point)
}

// PutPointToPool returns a Point to the pool.
func PutPointToPool(p *Point) {
	if p == nil {
		return
	}
	p.X = 0
	p.Y = 0
	PointPool.Put(p)
}

// GetRectFromPool gets a Rect from the pool.
func GetRectFromPool() *Rect {
	return RectPool.Get().(*Rect)
}

// PutRectToPool returns a Rect to the pool.
func PutRectToPool(r *Rect) {
	if r == nil {
		return
	}
	r.X0 = 0
	r.Y0 = 0
	r.X1 = 0
	r.Y1 = 0
	RectPool.Put(r)
}

// GetMatrixFromPool gets a Matrix from the pool.
func GetMatrixFromPool() *Matrix {
	return MatrixPool.Get().(*Matrix)
}

// PutMatrixToPool returns a Matrix to the pool.
func PutMatrixToPool(m *Matrix) {
	if m == nil {
		return
	}
	m.A = 0
	m.B = 0
	m.C = 0
	m.D = 0
	m.E = 0
	m.F = 0
	MatrixPool.Put(m)
}

// GetQuadFromPool gets a Quad from the pool.
func GetQuadFromPool() *Quad {
	return QuadPool.Get().(*Quad)
}

// PutQuadToPool returns a Quad to the pool.
func PutQuadToPool(q *Quad) {
	if q == nil {
		return
	}
	q.UL = Point{}
	q.UR = Point{}
	q.LL = Point{}
	q.LR = Point{}
	QuadPool.Put(q)
}

// ============================================================================
// Buffer Pools for CGO
// ============================================================================

// ByteSlicePool pools byte slices for CGO operations
type ByteSlicePool struct {
	pools []*sync.Pool
	sizes []int
}

// Common buffer sizes for pooling
var defaultBufferSizes = []int{
	64,     // Tiny
	256,    // Small strings
	1024,   // 1KB
	4096,   // 4KB (page size)
	16384,  // 16KB
	65536,  // 64KB
	262144, // 256KB
}

// globalByteSlicePool is the global buffer pool
var globalByteSlicePool = NewByteSlicePool(defaultBufferSizes)

// NewByteSlicePool creates a new byte slice pool with given size classes.
func NewByteSlicePool(sizes []int) *ByteSlicePool {
	pools := make([]*sync.Pool, len(sizes))
	for i, size := range sizes {
		bufSize := size // capture for closure
		pools[i] = &sync.Pool{
			New: func() interface{} {
				return make([]byte, 0, bufSize)
			},
		}
	}
	return &ByteSlicePool{pools: pools, sizes: sizes}
}

// Get returns a byte slice with at least the requested capacity.
func (p *ByteSlicePool) Get(minCapacity int) []byte {
	for i, size := range p.sizes {
		if size >= minCapacity {
			buf := p.pools[i].Get().([]byte)
			return buf[:0] // Reset length but keep capacity
		}
	}
	// No suitable pool, allocate directly
	return make([]byte, 0, minCapacity)
}

// Put returns a byte slice to the pool.
func (p *ByteSlicePool) Put(buf []byte) {
	cap := cap(buf)
	for i, size := range p.sizes {
		if cap == size {
			p.pools[i].Put(buf[:0]) //nolint:staticcheck // SA6002: slice pooling is still beneficial despite interface allocation
			return
		}
	}
	// Capacity doesn't match any pool size, let GC handle it
}

// GetByteSlice gets a byte slice from the global pool with at least the specified capacity.
func GetByteSlice(minCapacity int) []byte {
	return globalByteSlicePool.Get(minCapacity)
}

// PutByteSlice returns a byte slice to the global pool.
func PutByteSlice(buf []byte) {
	globalByteSlicePool.Put(buf)
}

// ============================================================================
// Handle Tracking Utilities
// ============================================================================

// HandleTracker provides convenient methods for tracking handles.
type HandleTracker struct {
	profiler *MemoryProfiler
}

// NewHandleTracker creates a new handle tracker using the global profiler.
func NewHandleTracker() *HandleTracker {
	return &HandleTracker{profiler: GetProfiler()}
}

// TrackDocument tracks a document handle.
func (h *HandleTracker) TrackDocument(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceDocument, 0, tag)
}

// TrackPage tracks a page handle.
func (h *HandleTracker) TrackPage(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourcePage, 0, tag)
}

// TrackPixmap tracks a pixmap handle with estimated size.
func (h *HandleTracker) TrackPixmap(handle uintptr, width, height, components int, tag string) {
	size := int64(width * height * components)
	h.profiler.RecordAllocation(uint64(handle), ResourcePixmap, size, tag)
}

// TrackBuffer tracks a buffer handle with size.
func (h *HandleTracker) TrackBuffer(handle uintptr, size int64, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceBuffer, size, tag)
}

// TrackStream tracks a stream handle.
func (h *HandleTracker) TrackStream(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceStream, 0, tag)
}

// TrackFont tracks a font handle.
func (h *HandleTracker) TrackFont(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceFont, 0, tag)
}

// TrackImage tracks an image handle with estimated size.
func (h *HandleTracker) TrackImage(handle uintptr, width, height int, tag string) {
	size := int64(width * height * 4) // Assume RGBA
	h.profiler.RecordAllocation(uint64(handle), ResourceImage, size, tag)
}

// TrackPath tracks a path handle.
func (h *HandleTracker) TrackPath(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourcePath, 0, tag)
}

// TrackDevice tracks a device handle.
func (h *HandleTracker) TrackDevice(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceDevice, 0, tag)
}

// TrackDisplayList tracks a display list handle.
func (h *HandleTracker) TrackDisplayList(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceDisplayList, 0, tag)
}

// TrackColorspace tracks a colorspace handle.
func (h *HandleTracker) TrackColorspace(handle uintptr, tag string) {
	h.profiler.RecordAllocation(uint64(handle), ResourceColorspace, 0, tag)
}

// Untrack removes tracking for a handle.
func (h *HandleTracker) Untrack(handle uintptr) {
	h.profiler.RecordDeallocation(uint64(handle))
}

// globalTracker is the global handle tracker
var globalTracker = NewHandleTracker()

// GetTracker returns the global handle tracker.
func GetTracker() *HandleTracker {
	return globalTracker
}

// ============================================================================
// Stats and Reporting
// ============================================================================

// PoolStats returns statistics about the geometry pools.
func PoolStats() map[string]int {
	// We can't directly get pool sizes, but we can provide estimates
	// based on what's been allocated
	return map[string]int{
		"point_pool":  0, // sync.Pool doesn't expose size
		"rect_pool":   0,
		"matrix_pool": 0,
		"quad_pool":   0,
	}
}

// ResourceSummary returns a summary of tracked resources.
func ResourceSummary() string {
	stats := GetProfiler().GetGlobalStats()
	return fmt.Sprintf(
		"Resources: %d live (peak %d), %d bytes (peak %d bytes), %d created, %d destroyed",
		stats.CurrentHandles, stats.PeakHandles,
		stats.CurrentBytes, stats.PeakBytes,
		stats.TotalHandlesCreated, stats.TotalHandlesDestroyed,
	)
}
