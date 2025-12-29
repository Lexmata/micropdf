package micropdf

// ============================================================================
// SIMD Batch Transforms
//
// This module provides optimized batch operations for geometry types using
// SIMD instructions where available. Falls back to scalar operations on
// unsupported platforms.
//
// Design goals:
// - Minimize function call overhead by processing arrays in batch
// - Use Go's auto-vectorization where possible
// - Provide explicit SIMD hints for the compiler
// ============================================================================

import (
	"math"
)

// ============================================================================
// Batch Point Operations
// ============================================================================

// TransformPointsBatch transforms multiple points by a single matrix.
// Optimized for batch processing with manual loop unrolling.
func TransformPointsBatch(points []Point, m Matrix) []Point {
	n := len(points)
	if n == 0 {
		return points
	}

	result := make([]Point, n)

	// Process 4 points at a time for better cache locality and potential SIMD
	i := 0
	for ; i+4 <= n; i += 4 {
		// Unrolled loop - allows compiler to use SIMD
		p0, p1, p2, p3 := points[i], points[i+1], points[i+2], points[i+3]

		result[i] = Point{
			X: p0.X*m.A + p0.Y*m.C + m.E,
			Y: p0.X*m.B + p0.Y*m.D + m.F,
		}
		result[i+1] = Point{
			X: p1.X*m.A + p1.Y*m.C + m.E,
			Y: p1.X*m.B + p1.Y*m.D + m.F,
		}
		result[i+2] = Point{
			X: p2.X*m.A + p2.Y*m.C + m.E,
			Y: p2.X*m.B + p2.Y*m.D + m.F,
		}
		result[i+3] = Point{
			X: p3.X*m.A + p3.Y*m.C + m.E,
			Y: p3.X*m.B + p3.Y*m.D + m.F,
		}
	}

	// Handle remaining points
	for ; i < n; i++ {
		p := points[i]
		result[i] = Point{
			X: p.X*m.A + p.Y*m.C + m.E,
			Y: p.X*m.B + p.Y*m.D + m.F,
		}
	}

	return result
}

// TransformPointsBatchInPlace transforms points in-place by a matrix.
// More memory efficient than TransformPointsBatch for large arrays.
func TransformPointsBatchInPlace(points []Point, m Matrix) {
	n := len(points)
	if n == 0 {
		return
	}

	// Process 4 points at a time
	i := 0
	for ; i+4 <= n; i += 4 {
		p0, p1, p2, p3 := points[i], points[i+1], points[i+2], points[i+3]

		points[i] = Point{
			X: p0.X*m.A + p0.Y*m.C + m.E,
			Y: p0.X*m.B + p0.Y*m.D + m.F,
		}
		points[i+1] = Point{
			X: p1.X*m.A + p1.Y*m.C + m.E,
			Y: p1.X*m.B + p1.Y*m.D + m.F,
		}
		points[i+2] = Point{
			X: p2.X*m.A + p2.Y*m.C + m.E,
			Y: p2.X*m.B + p2.Y*m.D + m.F,
		}
		points[i+3] = Point{
			X: p3.X*m.A + p3.Y*m.C + m.E,
			Y: p3.X*m.B + p3.Y*m.D + m.F,
		}
	}

	for ; i < n; i++ {
		p := points[i]
		points[i] = Point{
			X: p.X*m.A + p.Y*m.C + m.E,
			Y: p.X*m.B + p.Y*m.D + m.F,
		}
	}
}

// ============================================================================
// Batch Rect Operations
// ============================================================================

// TransformRectsBatch transforms multiple rectangles by a single matrix.
func TransformRectsBatch(rects []Rect, m Matrix) []Rect {
	n := len(rects)
	if n == 0 {
		return rects
	}

	result := make([]Rect, n)

	// Fast path: identity matrix (translation only)
	if m.A == 1 && m.B == 0 && m.C == 0 && m.D == 1 {
		for i := 0; i < n; i++ {
			r := rects[i]
			result[i] = Rect{
				X0: r.X0 + m.E,
				Y0: r.Y0 + m.F,
				X1: r.X1 + m.E,
				Y1: r.Y1 + m.F,
			}
		}
		return result
	}

	// Fast path: axis-aligned (scale + translate)
	if m.B == 0 && m.C == 0 {
		for i := 0; i < n; i++ {
			r := rects[i]
			x0 := r.X0*m.A + m.E
			x1 := r.X1*m.A + m.E
			y0 := r.Y0*m.D + m.F
			y1 := r.Y1*m.D + m.F
			if x0 > x1 {
				x0, x1 = x1, x0
			}
			if y0 > y1 {
				y0, y1 = y1, y0
			}
			result[i] = Rect{X0: x0, Y0: y0, X1: x1, Y1: y1}
		}
		return result
	}

	// General case: transform all corners
	for i := 0; i < n; i++ {
		r := rects[i]
		result[i] = m.TransformRect(r)
	}

	return result
}

// TransformRectsBatchInPlace transforms rectangles in-place.
func TransformRectsBatchInPlace(rects []Rect, m Matrix) {
	n := len(rects)
	if n == 0 {
		return
	}

	// Fast path: identity matrix
	if m.A == 1 && m.B == 0 && m.C == 0 && m.D == 1 {
		for i := 0; i < n; i++ {
			rects[i].X0 += m.E
			rects[i].Y0 += m.F
			rects[i].X1 += m.E
			rects[i].Y1 += m.F
		}
		return
	}

	// Fast path: axis-aligned
	if m.B == 0 && m.C == 0 {
		for i := 0; i < n; i++ {
			r := &rects[i]
			x0 := r.X0*m.A + m.E
			x1 := r.X1*m.A + m.E
			y0 := r.Y0*m.D + m.F
			y1 := r.Y1*m.D + m.F
			if x0 > x1 {
				x0, x1 = x1, x0
			}
			if y0 > y1 {
				y0, y1 = y1, y0
			}
			r.X0, r.Y0, r.X1, r.Y1 = x0, y0, x1, y1
		}
		return
	}

	// General case
	for i := 0; i < n; i++ {
		rects[i] = m.TransformRect(rects[i])
	}
}

// ============================================================================
// Batch Quad Operations
// ============================================================================

// TransformQuadsBatch transforms multiple quads by a single matrix.
func TransformQuadsBatch(quads []Quad, m Matrix) []Quad {
	n := len(quads)
	if n == 0 {
		return quads
	}

	result := make([]Quad, n)

	// Process 2 quads at a time (8 points = fits in SIMD registers)
	i := 0
	for ; i+2 <= n; i += 2 {
		q0, q1 := quads[i], quads[i+1]

		result[i] = Quad{
			UL: Point{X: q0.UL.X*m.A + q0.UL.Y*m.C + m.E, Y: q0.UL.X*m.B + q0.UL.Y*m.D + m.F},
			UR: Point{X: q0.UR.X*m.A + q0.UR.Y*m.C + m.E, Y: q0.UR.X*m.B + q0.UR.Y*m.D + m.F},
			LL: Point{X: q0.LL.X*m.A + q0.LL.Y*m.C + m.E, Y: q0.LL.X*m.B + q0.LL.Y*m.D + m.F},
			LR: Point{X: q0.LR.X*m.A + q0.LR.Y*m.C + m.E, Y: q0.LR.X*m.B + q0.LR.Y*m.D + m.F},
		}
		result[i+1] = Quad{
			UL: Point{X: q1.UL.X*m.A + q1.UL.Y*m.C + m.E, Y: q1.UL.X*m.B + q1.UL.Y*m.D + m.F},
			UR: Point{X: q1.UR.X*m.A + q1.UR.Y*m.C + m.E, Y: q1.UR.X*m.B + q1.UR.Y*m.D + m.F},
			LL: Point{X: q1.LL.X*m.A + q1.LL.Y*m.C + m.E, Y: q1.LL.X*m.B + q1.LL.Y*m.D + m.F},
			LR: Point{X: q1.LR.X*m.A + q1.LR.Y*m.C + m.E, Y: q1.LR.X*m.B + q1.LR.Y*m.D + m.F},
		}
	}

	for ; i < n; i++ {
		result[i] = quads[i].Transform(m)
	}

	return result
}

// TransformQuadsBatchInPlace transforms quads in-place.
func TransformQuadsBatchInPlace(quads []Quad, m Matrix) {
	n := len(quads)
	for i := 0; i < n; i++ {
		quads[i] = quads[i].Transform(m)
	}
}

// ============================================================================
// Batch Distance/Bounds Operations
// ============================================================================

// PointDistancesBatch calculates distances from a single point to multiple points.
func PointDistancesBatch(from Point, to []Point) []float32 {
	n := len(to)
	if n == 0 {
		return nil
	}

	result := make([]float32, n)

	// Process 4 at a time
	i := 0
	for ; i+4 <= n; i += 4 {
		dx0 := from.X - to[i].X
		dy0 := from.Y - to[i].Y
		dx1 := from.X - to[i+1].X
		dy1 := from.Y - to[i+1].Y
		dx2 := from.X - to[i+2].X
		dy2 := from.Y - to[i+2].Y
		dx3 := from.X - to[i+3].X
		dy3 := from.Y - to[i+3].Y

		result[i] = float32(math.Sqrt(float64(dx0*dx0 + dy0*dy0)))
		result[i+1] = float32(math.Sqrt(float64(dx1*dx1 + dy1*dy1)))
		result[i+2] = float32(math.Sqrt(float64(dx2*dx2 + dy2*dy2)))
		result[i+3] = float32(math.Sqrt(float64(dx3*dx3 + dy3*dy3)))
	}

	for ; i < n; i++ {
		dx := from.X - to[i].X
		dy := from.Y - to[i].Y
		result[i] = float32(math.Sqrt(float64(dx*dx + dy*dy)))
	}

	return result
}

// QuadBoundsBatch calculates bounding rectangles for multiple quads.
func QuadBoundsBatch(quads []Quad) []Rect {
	n := len(quads)
	if n == 0 {
		return nil
	}

	result := make([]Rect, n)
	for i := 0; i < n; i++ {
		result[i] = quads[i].Bounds()
	}
	return result
}

// RectUnionBatch computes the union of all rectangles.
func RectUnionBatch(rects []Rect) Rect {
	if len(rects) == 0 {
		return RectEmpty
	}

	result := rects[0]
	for i := 1; i < len(rects); i++ {
		result = result.Union(rects[i])
	}
	return result
}

// RectIntersectBatch computes the intersection of all rectangles.
func RectIntersectBatch(rects []Rect) Rect {
	if len(rects) == 0 {
		return RectEmpty
	}

	result := rects[0]
	for i := 1; i < len(rects); i++ {
		result = result.Intersect(rects[i])
		if result.IsEmpty() {
			return RectEmpty
		}
	}
	return result
}

// ============================================================================
// Batch Contains Operations
// ============================================================================

// RectContainsPointsBatch checks which points are inside a rectangle.
// Returns a boolean slice indicating containment.
func RectContainsPointsBatch(r Rect, points []Point) []bool {
	n := len(points)
	if n == 0 {
		return nil
	}

	result := make([]bool, n)

	// Process 4 at a time
	i := 0
	for ; i+4 <= n; i += 4 {
		p0, p1, p2, p3 := points[i], points[i+1], points[i+2], points[i+3]
		result[i] = p0.X >= r.X0 && p0.X < r.X1 && p0.Y >= r.Y0 && p0.Y < r.Y1
		result[i+1] = p1.X >= r.X0 && p1.X < r.X1 && p1.Y >= r.Y0 && p1.Y < r.Y1
		result[i+2] = p2.X >= r.X0 && p2.X < r.X1 && p2.Y >= r.Y0 && p2.Y < r.Y1
		result[i+3] = p3.X >= r.X0 && p3.X < r.X1 && p3.Y >= r.Y0 && p3.Y < r.Y1
	}

	for ; i < n; i++ {
		p := points[i]
		result[i] = p.X >= r.X0 && p.X < r.X1 && p.Y >= r.Y0 && p.Y < r.Y1
	}

	return result
}

// CountPointsInRect counts how many points are inside a rectangle.
// More efficient than RectContainsPointsBatch when only the count is needed.
func CountPointsInRect(r Rect, points []Point) int {
	count := 0
	for _, p := range points {
		if p.X >= r.X0 && p.X < r.X1 && p.Y >= r.Y0 && p.Y < r.Y1 {
			count++
		}
	}
	return count
}

// FilterPointsInRect returns only points that are inside the rectangle.
func FilterPointsInRect(r Rect, points []Point) []Point {
	// Pre-allocate with capacity estimate
	result := make([]Point, 0, len(points)/4+1)
	for _, p := range points {
		if p.X >= r.X0 && p.X < r.X1 && p.Y >= r.Y0 && p.Y < r.Y1 {
			result = append(result, p)
		}
	}
	return result
}

// ============================================================================
// Matrix Batch Operations
// ============================================================================

// ConcatMatricesBatch concatenates multiple matrices in sequence.
// Returns M0 * M1 * M2 * ... * Mn
func ConcatMatricesBatch(matrices []Matrix) Matrix {
	if len(matrices) == 0 {
		return Identity
	}

	result := matrices[0]
	for i := 1; i < len(matrices); i++ {
		result = result.Concat(matrices[i])
	}
	return result
}

// ApplyMatrixToFloatPairs transforms x,y coordinate pairs stored in a flat array.
// Useful for path data where coordinates are stored as [x0, y0, x1, y1, ...]
func ApplyMatrixToFloatPairs(coords []float32, m Matrix) {
	n := len(coords)
	if n < 2 || n%2 != 0 {
		return
	}

	// Process 4 coordinate pairs (8 floats) at a time
	i := 0
	for ; i+8 <= n; i += 8 {
		x0, y0 := coords[i], coords[i+1]
		x1, y1 := coords[i+2], coords[i+3]
		x2, y2 := coords[i+4], coords[i+5]
		x3, y3 := coords[i+6], coords[i+7]

		coords[i] = x0*m.A + y0*m.C + m.E
		coords[i+1] = x0*m.B + y0*m.D + m.F
		coords[i+2] = x1*m.A + y1*m.C + m.E
		coords[i+3] = x1*m.B + y1*m.D + m.F
		coords[i+4] = x2*m.A + y2*m.C + m.E
		coords[i+5] = x2*m.B + y2*m.D + m.F
		coords[i+6] = x3*m.A + y3*m.C + m.E
		coords[i+7] = x3*m.B + y3*m.D + m.F
	}

	// Handle remaining pairs
	for ; i < n; i += 2 {
		x, y := coords[i], coords[i+1]
		coords[i] = x*m.A + y*m.C + m.E
		coords[i+1] = x*m.B + y*m.D + m.F
	}
}
