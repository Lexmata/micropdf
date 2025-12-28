// Cross-Language Overhead Measurement - Go Binding
//
// This measures FFI overhead for Go bindings compared to the Rust baseline.
//
// Run with: go run benchmarks/cross_language_overhead.go

package main

import (
	"encoding/json"
	"fmt"
	"math"
	"time"
)

const (
	iterations       = 100000
	warmupIterations = 1000
)

// BenchResult holds benchmark results
type BenchResult struct {
	Name       string  `json:"name"`
	Iterations int     `json:"iterations"`
	TotalNs    int64   `json:"total_ns"`
	AvgNs      float64 `json:"avg_ns"`
	Throughput float64 `json:"throughput"`
}

func newBenchResult(name string, iterations int, totalNs int64) BenchResult {
	avgNs := float64(totalNs) / float64(iterations)
	throughput := 1_000_000_000.0 / avgNs
	return BenchResult{
		Name:       name,
		Iterations: iterations,
		TotalNs:    totalNs,
		AvgNs:      avgNs,
		Throughput: throughput,
	}
}

func (r BenchResult) Print() {
	fmt.Printf("%-40s %10d iterations, %10.2f ns/op, %12.0f ops/sec\n",
		r.Name, r.Iterations, r.AvgNs, r.Throughput)
}

// Warmup runs the function to trigger optimizations
func warmup(f func()) {
	for i := 0; i < warmupIterations; i++ {
		f()
	}
}

// Bench measures function execution time
func bench(name string, iterations int, f func()) BenchResult {
	warmup(f)

	start := time.Now()
	for i := 0; i < iterations; i++ {
		f()
	}
	elapsed := time.Since(start)

	return newBenchResult(name, iterations, elapsed.Nanoseconds())
}

// Simulate Point type (replace with actual nanopdf.Point when available)
type Point struct {
	X, Y float64
}

func NewPoint(x, y float64) Point {
	return Point{X: x, Y: y}
}

// Simulate Rect type
type Rect struct {
	X0, Y0, X1, Y1 float64
}

func NewRect(x0, y0, x1, y1 float64) Rect {
	return Rect{X0: x0, Y0: y0, X1: x1, Y1: y1}
}

func (r Rect) Contains(p Point) bool {
	return p.X >= r.X0 && p.X <= r.X1 && p.Y >= r.Y0 && p.Y <= r.Y1
}

func (r Rect) Union(other Rect) Rect {
	return Rect{
		X0: min(r.X0, other.X0),
		Y0: min(r.Y0, other.Y0),
		X1: max(r.X1, other.X1),
		Y1: max(r.Y1, other.Y1),
	}
}

func (r Rect) Transform(m Matrix) Rect {
	// Transform all 4 corners
	p1 := Point{r.X0*m.A + r.Y0*m.C + m.E, r.X0*m.B + r.Y0*m.D + m.F}
	p2 := Point{r.X1*m.A + r.Y0*m.C + m.E, r.X1*m.B + r.Y0*m.D + m.F}
	p3 := Point{r.X0*m.A + r.Y1*m.C + m.E, r.X0*m.B + r.Y1*m.D + m.F}
	p4 := Point{r.X1*m.A + r.Y1*m.C + m.E, r.X1*m.B + r.Y1*m.D + m.F}

	return Rect{
		X0: min(p1.X, p2.X, p3.X, p4.X),
		Y0: min(p1.Y, p2.Y, p3.Y, p4.Y),
		X1: max(p1.X, p2.X, p3.X, p4.X),
		Y1: max(p1.Y, p2.Y, p3.Y, p4.Y),
	}
}

// Simulate Matrix type
type Matrix struct {
	A, B, C, D, E, F float64
}

func MatrixIdentity() Matrix {
	return Matrix{A: 1, B: 0, C: 0, D: 1, E: 0, F: 0}
}

func MatrixScale(sx, sy float64) Matrix {
	return Matrix{A: sx, B: 0, C: 0, D: sy, E: 0, F: 0}
}

func MatrixRotate(degrees float64) Matrix {
	rad := degrees * math.Pi / 180.0
	cos := math.Cos(rad)
	sin := math.Sin(rad)
	return Matrix{A: cos, B: sin, C: -sin, D: cos, E: 0, F: 0}
}

func MatrixTranslate(tx, ty float64) Matrix {
	return Matrix{A: 1, B: 0, C: 0, D: 1, E: tx, F: ty}
}

func (m Matrix) Concat(other Matrix) Matrix {
	return Matrix{
		A: m.A*other.A + m.B*other.C,
		B: m.A*other.B + m.B*other.D,
		C: m.C*other.A + m.D*other.C,
		D: m.C*other.B + m.D*other.D,
		E: m.E*other.A + m.F*other.C + other.E,
		F: m.E*other.B + m.F*other.D + other.F,
	}
}

func (m Matrix) Invert() (Matrix, bool) {
	det := m.A*m.D - m.B*m.C
	if det == 0 {
		return Matrix{}, false
	}
	invDet := 1.0 / det
	return Matrix{
		A: m.D * invDet,
		B: -m.B * invDet,
		C: -m.C * invDet,
		D: m.A * invDet,
		E: (m.C*m.F - m.D*m.E) * invDet,
		F: (m.B*m.E - m.A*m.F) * invDet,
	}, true
}

func (p Point) Transform(m Matrix) Point {
	return Point{
		X: p.X*m.A + p.Y*m.C + m.E,
		Y: p.X*m.B + p.Y*m.D + m.F,
	}
}

// Buffer simulates nanopdf.Buffer
type Buffer struct {
	data []byte
}

func NewBuffer(capacity int) *Buffer {
	return &Buffer{data: make([]byte, 0, capacity)}
}

func BufferFromSlice(data []byte) *Buffer {
	buf := &Buffer{data: make([]byte, len(data))}
	copy(buf.data, data)
	return buf
}

func (b *Buffer) AppendData(data []byte) {
	b.data = append(b.data, data...)
}

func main() {
	fmt.Println("=== Cross-Language Overhead Benchmark (Go) ===")
	fmt.Println()
	fmt.Printf("Iterations: %d\n", iterations)
	fmt.Printf("Warmup: %d\n", warmupIterations)
	fmt.Println()

	var results []BenchResult

	// ========================================================================
	// Geometry Operations
	// ========================================================================

	fmt.Println("--- Geometry Operations ---")
	fmt.Println()

	// Point creation
	results = append(results, bench("point_create", iterations, func() {
		_ = NewPoint(10.0, 20.0)
	}))

	// Point transform
	p := NewPoint(10.0, 20.0)
	m := MatrixScale(2.0, 2.0)
	results = append(results, bench("point_transform", iterations, func() {
		_ = p.Transform(m)
	}))

	// Rect creation
	results = append(results, bench("rect_create", iterations, func() {
		_ = NewRect(0.0, 0.0, 100.0, 100.0)
	}))

	// Rect transform
	r := NewRect(0.0, 0.0, 100.0, 100.0)
	m = MatrixRotate(45.0)
	results = append(results, bench("rect_transform", iterations, func() {
		_ = r.Transform(m)
	}))

	// Rect contains point
	r = NewRect(0.0, 0.0, 100.0, 100.0)
	p = NewPoint(50.0, 50.0)
	results = append(results, bench("rect_contains_point", iterations, func() {
		_ = r.Contains(p)
	}))

	// Matrix creation
	results = append(results, bench("matrix_identity", iterations, func() {
		_ = MatrixIdentity()
	}))

	results = append(results, bench("matrix_scale", iterations, func() {
		_ = MatrixScale(2.0, 2.0)
	}))

	results = append(results, bench("matrix_rotate", iterations, func() {
		_ = MatrixRotate(45.0)
	}))

	results = append(results, bench("matrix_translate", iterations, func() {
		_ = MatrixTranslate(100.0, 100.0)
	}))

	// Matrix concatenation
	m1 := MatrixScale(2.0, 2.0)
	m2 := MatrixRotate(45.0)
	results = append(results, bench("matrix_concat", iterations, func() {
		_ = m1.Concat(m2)
	}))

	// Matrix inversion
	m = MatrixScale(2.0, 3.0)
	results = append(results, bench("matrix_invert", iterations, func() {
		_, _ = m.Invert()
	}))

	fmt.Println()

	// ========================================================================
	// Buffer Operations
	// ========================================================================

	fmt.Println("--- Buffer Operations ---")
	fmt.Println()

	// Buffer creation
	results = append(results, bench("buffer_create_empty", iterations, func() {
		_ = NewBuffer(0)
	}))

	results = append(results, bench("buffer_create_1KB", iterations, func() {
		_ = NewBuffer(1024)
	}))

	// Buffer from data
	data := make([]byte, 256)
	results = append(results, bench("buffer_from_slice_256B", iterations, func() {
		_ = BufferFromSlice(data)
	}))

	data = make([]byte, 1024)
	results = append(results, bench("buffer_from_slice_1KB", iterations, func() {
		_ = BufferFromSlice(data)
	}))

	// Buffer append
	chunk := make([]byte, 64)
	results = append(results, bench("buffer_append_64B", iterations/10, func() {
		buf := NewBuffer(64)
		buf.AppendData(chunk)
	}))

	fmt.Println()

	// ========================================================================
	// Combined Operations
	// ========================================================================

	fmt.Println("--- Combined Operations ---")
	fmt.Println()

	// Simulate page rendering setup
	results = append(results, bench("page_render_setup", iterations/10, func() {
		dpi := 144.0
		scale := dpi / 72.0
		ctm := MatrixScale(scale, scale)
		pageBounds := NewRect(0.0, 0.0, 612.0, 792.0)
		_ = pageBounds.Transform(ctm)
	}))

	// Simulate text position calculation
	results = append(results, bench("text_position_calc", iterations, func() {
		base := NewPoint(72.0, 700.0)
		m := MatrixTranslate(0.0, -14.0)
		_ = base.Transform(m)
	}))

	// Simulate bounding box calculation for 10 items
	results = append(results, bench("bbox_calc_10_items", iterations/10, func() {
		bbox := Rect{X0: 1e30, Y0: 1e30, X1: -1e30, Y1: -1e30}
		for i := 0; i < 10; i++ {
			item := NewRect(float64(i)*10.0, float64(i)*10.0, 100.0+float64(i)*10.0, 20.0+float64(i)*10.0)
			bbox = bbox.Union(item)
		}
		_ = bbox
	}))

	fmt.Println()

	// ========================================================================
	// Summary
	// ========================================================================

	fmt.Println("=== Summary ===")
	fmt.Println()

	for _, result := range results {
		result.Print()
	}

	fmt.Println()

	// Output JSON for cross-language comparison
	fmt.Println("--- JSON Output ---")
	jsonBytes, _ := json.MarshalIndent(results, "", "  ")
	fmt.Println(string(jsonBytes))
}

func min(vals ...float64) float64 {
	m := vals[0]
	for _, v := range vals[1:] {
		if v < m {
			m = v
		}
	}
	return m
}

func max(vals ...float64) float64 {
	m := vals[0]
	for _, v := range vals[1:] {
		if v > m {
			m = v
		}
	}
	return m
}

