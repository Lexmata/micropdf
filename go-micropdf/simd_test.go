package micropdf

import (
	"math"
	"testing"
)

func TestTransformPointsBatch(t *testing.T) {
	m := MatrixScale(2, 2).Concat(MatrixTranslate(10, 20))
	points := []Point{
		{X: 0, Y: 0},
		{X: 1, Y: 1},
		{X: 10, Y: 20},
		{X: -5, Y: 5},
		{X: 100, Y: 200},
	}

	result := TransformPointsBatch(points, m)

	if len(result) != len(points) {
		t.Errorf("expected %d points, got %d", len(points), len(result))
	}

	// Verify each point matches individual transform
	for i, p := range points {
		expected := p.Transform(m)
		if result[i] != expected {
			t.Errorf("point %d: expected %v, got %v", i, expected, result[i])
		}
	}
}

func TestTransformPointsBatchInPlace(t *testing.T) {
	m := MatrixRotate(45)
	original := []Point{
		{X: 1, Y: 0},
		{X: 0, Y: 1},
		{X: 10, Y: 10},
	}

	// Make expected results
	expected := make([]Point, len(original))
	for i, p := range original {
		expected[i] = p.Transform(m)
	}

	// Transform in place
	points := make([]Point, len(original))
	copy(points, original)
	TransformPointsBatchInPlace(points, m)

	for i := range points {
		if !floatEquals(points[i].X, expected[i].X, 1e-6) || !floatEquals(points[i].Y, expected[i].Y, 1e-6) {
			t.Errorf("point %d: expected %v, got %v", i, expected[i], points[i])
		}
	}
}

func TestTransformRectsBatch(t *testing.T) {
	m := MatrixScale(2, 3)
	rects := []Rect{
		{X0: 0, Y0: 0, X1: 10, Y1: 10},
		{X0: 5, Y0: 5, X1: 15, Y1: 15},
		{X0: -10, Y0: -10, X1: 0, Y1: 0},
	}

	result := TransformRectsBatch(rects, m)

	if len(result) != len(rects) {
		t.Errorf("expected %d rects, got %d", len(rects), len(result))
	}

	// First rect: (0,0)-(10,10) scaled by (2,3) = (0,0)-(20,30)
	if result[0].X0 != 0 || result[0].Y0 != 0 || result[0].X1 != 20 || result[0].Y1 != 30 {
		t.Errorf("rect 0: expected (0,0,20,30), got %v", result[0])
	}
}

func TestTransformRectsBatchIdentity(t *testing.T) {
	m := MatrixTranslate(100, 200)
	rects := []Rect{
		{X0: 0, Y0: 0, X1: 10, Y1: 10},
	}

	result := TransformRectsBatch(rects, m)

	// Translation: (0,0)-(10,10) + (100,200) = (100,200)-(110,210)
	if result[0].X0 != 100 || result[0].Y0 != 200 || result[0].X1 != 110 || result[0].Y1 != 210 {
		t.Errorf("expected (100,200,110,210), got %v", result[0])
	}
}

func TestTransformQuadsBatch(t *testing.T) {
	m := MatrixScale(2, 2)
	quads := []Quad{
		QuadFromRect(Rect{X0: 0, Y0: 0, X1: 10, Y1: 10}),
		QuadFromRect(Rect{X0: 5, Y0: 5, X1: 15, Y1: 15}),
	}

	result := TransformQuadsBatch(quads, m)

	if len(result) != len(quads) {
		t.Errorf("expected %d quads, got %d", len(quads), len(result))
	}

	// Verify first quad
	expected := quads[0].Transform(m)
	if result[0].UL != expected.UL || result[0].UR != expected.UR {
		t.Errorf("quad 0 mismatch: expected %v, got %v", expected, result[0])
	}
}

func TestPointDistancesBatch(t *testing.T) {
	from := Point{X: 0, Y: 0}
	to := []Point{
		{X: 3, Y: 4},   // distance = 5
		{X: 0, Y: 10},  // distance = 10
		{X: 1, Y: 0},   // distance = 1
		{X: -3, Y: -4}, // distance = 5
	}

	result := PointDistancesBatch(from, to)

	expected := []float32{5, 10, 1, 5}
	for i, d := range result {
		if !floatEquals(d, expected[i], 1e-6) {
			t.Errorf("distance %d: expected %f, got %f", i, expected[i], d)
		}
	}
}

func TestRectContainsPointsBatch(t *testing.T) {
	r := Rect{X0: 0, Y0: 0, X1: 10, Y1: 10}
	points := []Point{
		{X: 5, Y: 5},   // inside
		{X: 0, Y: 0},   // on edge (inside)
		{X: 10, Y: 10}, // on far edge (outside)
		{X: -1, Y: 5},  // outside
		{X: 5, Y: 15},  // outside
	}

	result := RectContainsPointsBatch(r, points)

	expected := []bool{true, true, false, false, false}
	for i, v := range result {
		if v != expected[i] {
			t.Errorf("point %d: expected %v, got %v", i, expected[i], v)
		}
	}
}

func TestCountPointsInRect(t *testing.T) {
	r := Rect{X0: 0, Y0: 0, X1: 10, Y1: 10}
	points := []Point{
		{X: 5, Y: 5},
		{X: 0, Y: 0},
		{X: 15, Y: 15},
		{X: 2, Y: 8},
	}

	count := CountPointsInRect(r, points)
	if count != 3 {
		t.Errorf("expected 3, got %d", count)
	}
}

func TestFilterPointsInRect(t *testing.T) {
	r := Rect{X0: 0, Y0: 0, X1: 10, Y1: 10}
	points := []Point{
		{X: 5, Y: 5},
		{X: 0, Y: 0},
		{X: 15, Y: 15},
		{X: 2, Y: 8},
	}

	result := FilterPointsInRect(r, points)
	if len(result) != 3 {
		t.Errorf("expected 3 points, got %d", len(result))
	}
}

func TestRectUnionBatch(t *testing.T) {
	rects := []Rect{
		{X0: 0, Y0: 0, X1: 10, Y1: 10},
		{X0: 5, Y0: 5, X1: 15, Y1: 15},
		{X0: -5, Y0: -5, X1: 5, Y1: 5},
	}

	result := RectUnionBatch(rects)

	// Union should be (-5,-5) to (15,15)
	if result.X0 != -5 || result.Y0 != -5 || result.X1 != 15 || result.Y1 != 15 {
		t.Errorf("expected (-5,-5,15,15), got %v", result)
	}
}

func TestApplyMatrixToFloatPairs(t *testing.T) {
	coords := []float32{0, 0, 1, 0, 1, 1, 0, 1}
	m := MatrixScale(2, 2)

	ApplyMatrixToFloatPairs(coords, m)

	expected := []float32{0, 0, 2, 0, 2, 2, 0, 2}
	for i, v := range coords {
		if v != expected[i] {
			t.Errorf("coord %d: expected %f, got %f", i, expected[i], v)
		}
	}
}

func TestConcatMatricesBatch(t *testing.T) {
	matrices := []Matrix{
		MatrixScale(2, 2),
		MatrixTranslate(10, 10),
		MatrixRotate(0), // Identity rotation
	}

	result := ConcatMatricesBatch(matrices)

	// Should be equivalent to Scale(2,2) then Translate(10,10)
	expected := MatrixScale(2, 2).Concat(MatrixTranslate(10, 10))

	if result != expected {
		t.Errorf("expected %v, got %v", expected, result)
	}
}

// Helper
func floatEquals(a, b, epsilon float32) bool {
	return math.Abs(float64(a-b)) < float64(epsilon)
}

// Benchmarks
func BenchmarkTransformPointsBatch_10(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	points := make([]Point, 10)
	for i := range points {
		points[i] = Point{X: float32(i), Y: float32(i)}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = TransformPointsBatch(points, m)
	}
}

func BenchmarkTransformPointsBatch_100(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	points := make([]Point, 100)
	for i := range points {
		points[i] = Point{X: float32(i), Y: float32(i)}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = TransformPointsBatch(points, m)
	}
}

func BenchmarkTransformPointsBatch_1000(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	points := make([]Point, 1000)
	for i := range points {
		points[i] = Point{X: float32(i), Y: float32(i)}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = TransformPointsBatch(points, m)
	}
}

func BenchmarkTransformPointsIndividual_1000(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	points := make([]Point, 1000)
	for i := range points {
		points[i] = Point{X: float32(i), Y: float32(i)}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		result := make([]Point, 1000)
		for j, p := range points {
			result[j] = p.Transform(m)
		}
		_ = result
	}
}

func BenchmarkTransformPointsBatchInPlace_1000(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	points := make([]Point, 1000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Reset points each iteration
		for j := range points {
			points[j] = Point{X: float32(j), Y: float32(j)}
		}
		TransformPointsBatchInPlace(points, m)
	}
}

func BenchmarkApplyMatrixToFloatPairs_1000(b *testing.B) {
	m := MatrixScale(2, 2).Concat(MatrixRotate(45))
	coords := make([]float32, 2000) // 1000 coordinate pairs
	for i := 0; i < 2000; i += 2 {
		coords[i] = float32(i / 2)
		coords[i+1] = float32(i / 2)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ApplyMatrixToFloatPairs(coords, m)
	}
}
