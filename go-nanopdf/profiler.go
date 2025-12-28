// Package nanopdf provides memory profiling and leak detection utilities.
//
// Enable profiling with EnableProfiling(true) to track handle allocations.
// Use GetLeakReport() to identify potential memory leaks.
package nanopdf

import (
	"fmt"
	"runtime"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ResourceType identifies the type of resource being tracked
type ResourceType int

const (
	ResourceContext ResourceType = iota
	ResourceBuffer
	ResourceStream
	ResourcePixmap
	ResourceDocument
	ResourcePage
	ResourceFont
	ResourceImage
	ResourcePath
	ResourceText
	ResourceDevice
	ResourceDisplayList
	ResourceColorspace
	ResourcePdfObject
	ResourceOutline
	ResourceLink
	ResourceAnnotation
	ResourceStextPage
	ResourceCookie
	ResourceArchive
	ResourceOther
)

func (r ResourceType) String() string {
	names := []string{
		"Context", "Buffer", "Stream", "Pixmap", "Document",
		"Page", "Font", "Image", "Path", "Text", "Device",
		"DisplayList", "Colorspace", "PdfObject", "Outline",
		"Link", "Annotation", "StextPage", "Cookie", "Archive", "Other",
	}
	if int(r) < len(names) {
		return names[r]
	}
	return fmt.Sprintf("Unknown(%d)", r)
}

// AllocationRecord represents a single tracked allocation
type AllocationRecord struct {
	Handle       uint64
	ResourceType ResourceType
	SizeBytes    int64
	AllocatedAt  time.Time
	StackTrace   string
	Tag          string
}

// Age returns how long this allocation has been alive
func (a *AllocationRecord) Age() time.Duration {
	return time.Since(a.AllocatedAt)
}

// TypeStats holds statistics for a specific resource type
type TypeStats struct {
	CurrentCount          int64
	CurrentBytes          int64
	TotalAllocated        int64
	TotalDeallocated      int64
	TotalBytesAllocated   int64
	TotalBytesDeallocated int64
	PeakCount             int64
	PeakBytes             int64
}

// GlobalStats holds overall memory statistics
type GlobalStats struct {
	TotalHandlesCreated   int64
	TotalHandlesDestroyed int64
	CurrentHandles        int64
	CurrentBytes          int64
	PeakHandles           int64
	PeakBytes             int64
	Uptime                time.Duration
}

// MemoryProfiler tracks allocations and detects leaks
type MemoryProfiler struct {
	mu            sync.RWMutex
	enabled       atomic.Bool
	captureStacks atomic.Bool
	allocations   map[uint64]*AllocationRecord
	statsByType   map[ResourceType]*TypeStats
	startTime     time.Time

	// Atomic counters for lock-free reads
	totalCreated   atomic.Int64
	totalDestroyed atomic.Int64
	currentHandles atomic.Int64
	currentBytes   atomic.Int64
	peakHandles    atomic.Int64
	peakBytes      atomic.Int64
}

var (
	globalProfiler     *MemoryProfiler
	globalProfilerOnce sync.Once
)

// GetProfiler returns the global memory profiler instance
func GetProfiler() *MemoryProfiler {
	globalProfilerOnce.Do(func() {
		globalProfiler = NewMemoryProfiler()
	})
	return globalProfiler
}

// NewMemoryProfiler creates a new memory profiler
func NewMemoryProfiler() *MemoryProfiler {
	return &MemoryProfiler{
		allocations: make(map[uint64]*AllocationRecord),
		statsByType: make(map[ResourceType]*TypeStats),
		startTime:   time.Now(),
	}
}

// EnableProfiling turns profiling on or off
func EnableProfiling(enabled bool) {
	GetProfiler().enabled.Store(enabled)
}

// EnableStackTraces enables or disables stack trace capture
func EnableStackTraces(enabled bool) {
	GetProfiler().captureStacks.Store(enabled)
}

// IsProfilingEnabled returns whether profiling is enabled
func IsProfilingEnabled() bool {
	return GetProfiler().enabled.Load()
}

// RecordAllocation tracks a new allocation
func (p *MemoryProfiler) RecordAllocation(handle uint64, resourceType ResourceType, sizeBytes int64, tag string) {
	if !p.enabled.Load() {
		return
	}

	record := &AllocationRecord{
		Handle:       handle,
		ResourceType: resourceType,
		SizeBytes:    sizeBytes,
		AllocatedAt:  time.Now(),
		Tag:          tag,
	}

	if p.captureStacks.Load() {
		record.StackTrace = captureStackTrace(3)
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	p.allocations[handle] = record

	// Update type stats
	stats, ok := p.statsByType[resourceType]
	if !ok {
		stats = &TypeStats{}
		p.statsByType[resourceType] = stats
	}
	stats.CurrentCount++
	stats.CurrentBytes += sizeBytes
	stats.TotalAllocated++
	stats.TotalBytesAllocated += sizeBytes
	if stats.CurrentCount > stats.PeakCount {
		stats.PeakCount = stats.CurrentCount
	}
	if stats.CurrentBytes > stats.PeakBytes {
		stats.PeakBytes = stats.CurrentBytes
	}

	// Update global counters
	p.totalCreated.Add(1)
	current := p.currentHandles.Add(1)
	p.currentBytes.Add(sizeBytes)

	// Update peak (compare-and-swap loop)
	for {
		peak := p.peakHandles.Load()
		if current <= peak {
			break
		}
		if p.peakHandles.CompareAndSwap(peak, current) {
			break
		}
	}
}

// RecordDeallocation tracks a deallocation
func (p *MemoryProfiler) RecordDeallocation(handle uint64) *AllocationRecord {
	if !p.enabled.Load() {
		return nil
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	record, ok := p.allocations[handle]
	if !ok {
		return nil
	}

	delete(p.allocations, handle)

	// Update type stats
	if stats, ok := p.statsByType[record.ResourceType]; ok {
		stats.CurrentCount--
		stats.CurrentBytes -= record.SizeBytes
		stats.TotalDeallocated++
		stats.TotalBytesDeallocated += record.SizeBytes
	}

	// Update global counters
	p.totalDestroyed.Add(1)
	p.currentHandles.Add(-1)
	p.currentBytes.Add(-record.SizeBytes)

	return record
}

// GetLiveAllocations returns all currently live allocations
func (p *MemoryProfiler) GetLiveAllocations() []*AllocationRecord {
	p.mu.RLock()
	defer p.mu.RUnlock()

	result := make([]*AllocationRecord, 0, len(p.allocations))
	for _, record := range p.allocations {
		result = append(result, record)
	}
	return result
}

// GetPotentialLeaks returns allocations older than minAge
func (p *MemoryProfiler) GetPotentialLeaks(minAge time.Duration) []*AllocationRecord {
	p.mu.RLock()
	defer p.mu.RUnlock()

	var result []*AllocationRecord
	cutoff := time.Now().Add(-minAge)
	for _, record := range p.allocations {
		if record.AllocatedAt.Before(cutoff) {
			result = append(result, record)
		}
	}
	return result
}

// GetStatsByType returns statistics grouped by resource type
func (p *MemoryProfiler) GetStatsByType() map[ResourceType]*TypeStats {
	p.mu.RLock()
	defer p.mu.RUnlock()

	result := make(map[ResourceType]*TypeStats)
	for k, v := range p.statsByType {
		copy := *v
		result[k] = &copy
	}
	return result
}

// GetGlobalStats returns global statistics
func (p *MemoryProfiler) GetGlobalStats() GlobalStats {
	return GlobalStats{
		TotalHandlesCreated:   p.totalCreated.Load(),
		TotalHandlesDestroyed: p.totalDestroyed.Load(),
		CurrentHandles:        p.currentHandles.Load(),
		CurrentBytes:          p.currentBytes.Load(),
		PeakHandles:           p.peakHandles.Load(),
		PeakBytes:             p.peakBytes.Load(),
		Uptime:                time.Since(p.startTime),
	}
}

// Reset clears all profiling data
func (p *MemoryProfiler) Reset() {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.allocations = make(map[uint64]*AllocationRecord)
	p.statsByType = make(map[ResourceType]*TypeStats)
	p.totalCreated.Store(0)
	p.totalDestroyed.Store(0)
	p.currentHandles.Store(0)
	p.currentBytes.Store(0)
	p.peakHandles.Store(0)
	p.peakBytes.Store(0)
}

// LeakReport contains information about potential memory leaks
type LeakReport struct {
	GeneratedAt         time.Time
	MinAgeThreshold     time.Duration
	TotalPotentialLeaks int
	LeaksByType         map[ResourceType][]*AllocationRecord
	GlobalStats         GlobalStats
}

// GenerateLeakReport creates a detailed leak report
func (p *MemoryProfiler) GenerateLeakReport(minAge time.Duration) *LeakReport {
	leaks := p.GetPotentialLeaks(minAge)

	leaksByType := make(map[ResourceType][]*AllocationRecord)
	for _, leak := range leaks {
		leaksByType[leak.ResourceType] = append(leaksByType[leak.ResourceType], leak)
	}

	return &LeakReport{
		GeneratedAt:         time.Now(),
		MinAgeThreshold:     minAge,
		TotalPotentialLeaks: len(leaks),
		LeaksByType:         leaksByType,
		GlobalStats:         p.GetGlobalStats(),
	}
}

// String generates a human-readable leak report
func (r *LeakReport) String() string {
	var sb strings.Builder

	sb.WriteString("=== NanoPDF Memory Leak Report (Go) ===\n\n")
	sb.WriteString(fmt.Sprintf("Generated: %s\n", r.GeneratedAt.Format(time.RFC3339)))
	sb.WriteString(fmt.Sprintf("Min age threshold: %s\n", r.MinAgeThreshold))
	sb.WriteString(fmt.Sprintf("Total potential leaks: %d\n\n", r.TotalPotentialLeaks))

	sb.WriteString("--- Global Statistics ---\n")
	sb.WriteString(fmt.Sprintf("Handles created: %d\n", r.GlobalStats.TotalHandlesCreated))
	sb.WriteString(fmt.Sprintf("Handles destroyed: %d\n", r.GlobalStats.TotalHandlesDestroyed))
	sb.WriteString(fmt.Sprintf("Current handles: %d\n", r.GlobalStats.CurrentHandles))
	sb.WriteString(fmt.Sprintf("Current memory: %d bytes\n", r.GlobalStats.CurrentBytes))
	sb.WriteString(fmt.Sprintf("Peak handles: %d\n", r.GlobalStats.PeakHandles))
	sb.WriteString(fmt.Sprintf("Peak memory: %d bytes\n", r.GlobalStats.PeakBytes))
	sb.WriteString(fmt.Sprintf("Uptime: %s\n\n", r.GlobalStats.Uptime))

	sb.WriteString("--- Leaks by Type ---\n")

	// Sort types for consistent output
	var types []ResourceType
	for t := range r.LeaksByType {
		types = append(types, t)
	}
	sort.Slice(types, func(i, j int) bool { return types[i] < types[j] })

	for _, resourceType := range types {
		leaks := r.LeaksByType[resourceType]
		if len(leaks) == 0 {
			continue
		}

		sb.WriteString(fmt.Sprintf("\n%s (%d leaks):\n", resourceType, len(leaks)))

		// Sort by age (oldest first)
		sort.Slice(leaks, func(i, j int) bool {
			return leaks[i].AllocatedAt.Before(leaks[j].AllocatedAt)
		})

		for i, leak := range leaks {
			if i >= 10 {
				sb.WriteString(fmt.Sprintf("  ... and %d more\n", len(leaks)-10))
				break
			}
			sb.WriteString(fmt.Sprintf("  %d. Handle %d - %d bytes, age %s",
				i+1, leak.Handle, leak.SizeBytes, leak.Age().Round(time.Second)))
			if leak.Tag != "" {
				sb.WriteString(fmt.Sprintf(", tag: %s", leak.Tag))
			}
			sb.WriteString("\n")
			if leak.StackTrace != "" {
				for _, line := range strings.Split(leak.StackTrace, "\n")[:5] {
					sb.WriteString(fmt.Sprintf("      %s\n", line))
				}
			}
		}
	}

	return sb.String()
}

// PrintLeakReport prints a leak report to stderr
func PrintLeakReport(minAge time.Duration) {
	report := GetProfiler().GenerateLeakReport(minAge)
	fmt.Println(report.String())
}

// GetLeakReport returns a leak report for the given minimum age
func GetLeakReport(minAge time.Duration) *LeakReport {
	return GetProfiler().GenerateLeakReport(minAge)
}

// captureStackTrace captures the current goroutine's stack trace
func captureStackTrace(skip int) string {
	const maxStackSize = 4096
	buf := make([]byte, maxStackSize)
	n := runtime.Stack(buf, false)

	// Skip the first `skip` frames
	lines := strings.Split(string(buf[:n]), "\n")
	if len(lines) > skip*2 {
		lines = lines[skip*2:]
	}

	return strings.Join(lines, "\n")
}

// TrackAllocation is a convenience function for tracking allocations
func TrackAllocation(handle uint64, resourceType ResourceType, sizeBytes int64) {
	GetProfiler().RecordAllocation(handle, resourceType, sizeBytes, "")
}

// TrackAllocationTagged tracks an allocation with a custom tag
func TrackAllocationTagged(handle uint64, resourceType ResourceType, sizeBytes int64, tag string) {
	GetProfiler().RecordAllocation(handle, resourceType, sizeBytes, tag)
}

// TrackDeallocation is a convenience function for tracking deallocations
func TrackDeallocation(handle uint64) {
	GetProfiler().RecordDeallocation(handle)
}

// MemStats returns runtime memory statistics
func MemStats() runtime.MemStats {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return m
}

// PrintMemStats prints current memory statistics
func PrintMemStats() {
	m := MemStats()
	fmt.Printf("=== Go Runtime Memory Stats ===\n")
	fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
	fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
	fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
	fmt.Printf("NumGC: %d\n", m.NumGC)
	fmt.Printf("HeapAlloc: %d MB\n", m.HeapAlloc/1024/1024)
	fmt.Printf("HeapInuse: %d MB\n", m.HeapInuse/1024/1024)
	fmt.Printf("HeapObjects: %d\n", m.HeapObjects)
}
