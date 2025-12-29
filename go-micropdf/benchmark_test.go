package micropdf

import (
	"testing"
)

// ============================================================================
// Buffer Benchmarks
// ============================================================================

func BenchmarkBufferNew(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := NewBuffer(0)
		if buf != nil {
			buf.Free()
		}
	}
}

func BenchmarkBufferNewWithCapacity(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := NewBuffer(1024)
		if buf != nil {
			buf.Free()
		}
	}
}

func BenchmarkBufferFromBytes1KB(b *testing.B) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i & 0xff)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		buf := NewBufferFromBytes(data)
		if buf != nil {
			buf.Free()
		}
	}
}

func BenchmarkBufferFromBytes16KB(b *testing.B) {
	data := make([]byte, 16384)
	for i := range data {
		data[i] = byte(i & 0xff)
	}
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		buf := NewBufferFromBytes(data)
		if buf != nil {
			buf.Free()
		}
	}
}

func BenchmarkBufferFromString(b *testing.B) {
	s := "Hello, World!"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := NewBufferFromString(s)
		if buf != nil {
			buf.Free()
		}
	}
}

func BenchmarkBufferBytes1KB(b *testing.B) {
	data := make([]byte, 1024)
	buf := NewBufferFromBytes(data)
	if buf == nil {
		b.Skip("buffer creation failed")
	}
	defer buf.Free()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = buf.Bytes()
	}
}

func BenchmarkBufferString1KB(b *testing.B) {
	data := make([]byte, 1024)
	buf := NewBufferFromBytes(data)
	if buf == nil {
		b.Skip("buffer creation failed")
	}
	defer buf.Free()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = buf.String()
	}
}

func BenchmarkBufferLen(b *testing.B) {
	data := make([]byte, 1024)
	buf := NewBufferFromBytes(data)
	if buf == nil {
		b.Skip("buffer creation failed")
	}
	defer buf.Free()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = buf.Len()
	}
}

func BenchmarkBufferAppend(b *testing.B) {
	chunk := []byte("0123456789")
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := NewBuffer(1024)
		if buf == nil {
			continue
		}
		for j := 0; j < 100; j++ {
			_ = buf.Append(chunk)
		}
		buf.Free()
	}
}

func BenchmarkBufferClone1KB(b *testing.B) {
	data := make([]byte, 1024)
	buf := NewBufferFromBytes(data)
	if buf == nil {
		b.Skip("buffer creation failed")
	}
	defer buf.Free()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		clone := buf.Clone()
		if clone != nil {
			clone.Free()
		}
	}
}

// ============================================================================
// Point Benchmarks
// ============================================================================

func BenchmarkPointNew(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewPoint(100, 200)
	}
}

func BenchmarkPointTransform(b *testing.B) {
	p := NewPoint(100, 200)
	m := MatrixScale(2, 2)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p.Transform(m)
	}
}

func BenchmarkPointTransformComplex(b *testing.B) {
	p := NewPoint(100, 200)
	m := MatrixTranslate(10, 20).Concat(MatrixScale(1.5, 1.5)).Concat(MatrixRotate(30))
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p.Transform(m)
	}
}

func BenchmarkPointDistance(b *testing.B) {
	p1 := NewPoint(100, 200)
	p2 := NewPoint(300, 400)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p1.Distance(p2)
	}
}

func BenchmarkPointAdd(b *testing.B) {
	p1 := NewPoint(100, 200)
	p2 := NewPoint(300, 400)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p1.Add(p2)
	}
}

func BenchmarkPointSub(b *testing.B) {
	p1 := NewPoint(100, 200)
	p2 := NewPoint(300, 400)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p1.Sub(p2)
	}
}

func BenchmarkPointScale(b *testing.B) {
	p := NewPoint(100, 200)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p.Scale(2.5)
	}
}

func BenchmarkPointEquals(b *testing.B) {
	p1 := NewPoint(100, 200)
	p2 := NewPoint(100, 200)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = p1.Equals(p2)
	}
}

// ============================================================================
// Rect Benchmarks
// ============================================================================

func BenchmarkRectNew(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewRect(0, 0, 100, 100)
	}
}

func BenchmarkRectFromXYWH(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewRectFromXYWH(0, 0, 100, 100)
	}
}

func BenchmarkRectContains(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	p := NewPoint(50, 50)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Contains(p)
	}
}

func BenchmarkRectContainsXY(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.ContainsXY(50, 50)
	}
}

func BenchmarkRectUnion(b *testing.B) {
	r1 := NewRect(0, 0, 100, 100)
	r2 := NewRect(50, 50, 150, 150)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r1.Union(r2)
	}
}

func BenchmarkRectIntersect(b *testing.B) {
	r1 := NewRect(0, 0, 100, 100)
	r2 := NewRect(50, 50, 150, 150)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r1.Intersect(r2)
	}
}

func BenchmarkRectIncludePoint(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	p := NewPoint(150, 150)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.IncludePoint(p)
	}
}

func BenchmarkRectTranslate(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Translate(10, 20)
	}
}

func BenchmarkRectScale(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Scale(2, 2)
	}
}

func BenchmarkRectToIRect(b *testing.B) {
	r := NewRect(10.3, 20.7, 100.2, 200.9)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.ToIRect()
	}
}

func BenchmarkRectWidth(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Width()
	}
}

func BenchmarkRectHeight(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Height()
	}
}

// ============================================================================
// IRect Benchmarks
// ============================================================================

func BenchmarkIRectNew(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewIRect(0, 0, 100, 100)
	}
}

func BenchmarkIRectWidth(b *testing.B) {
	r := NewIRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Width()
	}
}

// ============================================================================
// Matrix Benchmarks
// ============================================================================

func BenchmarkMatrixNew(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewMatrix(1, 0, 0, 1, 0, 0)
	}
}

func BenchmarkMatrixIdentity(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixIdentity()
	}
}

func BenchmarkMatrixTranslate(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixTranslate(10, 20)
	}
}

func BenchmarkMatrixScale(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixScale(2, 2)
	}
}

func BenchmarkMatrixRotate(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixRotate(45)
	}
}

func BenchmarkMatrixRotateCached(b *testing.B) {
	// Test cached angles (0, 90, 180, 270)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixRotate(90)
	}
}

func BenchmarkMatrixRotateIntDegree(b *testing.B) {
	// Test integer degrees (uses lookup table)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixRotate(37) // Non-cached but integer
	}
}

func BenchmarkMatrixRotateFractional(b *testing.B) {
	// Test fractional degrees (full trig)
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixRotate(37.5)
	}
}

func BenchmarkMatrixShear(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixShear(0.5, 0.3)
	}
}

func BenchmarkMatrixConcat(b *testing.B) {
	m1 := MatrixScale(2, 2)
	m2 := MatrixRotate(45)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m1.Concat(m2)
	}
}

func BenchmarkMatrixConcatChain(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = MatrixTranslate(10, 20).Concat(MatrixScale(2, 2)).Concat(MatrixRotate(45))
	}
}

func BenchmarkMatrixPreTranslate(b *testing.B) {
	m := MatrixScale(2, 2)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m.PreTranslate(10, 20)
	}
}

func BenchmarkMatrixPostTranslate(b *testing.B) {
	m := MatrixScale(2, 2)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m.PostTranslate(10, 20)
	}
}

func BenchmarkMatrixTransformPoint(b *testing.B) {
	m := MatrixScale(2, 2)
	p := NewPoint(100, 200)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m.TransformPoint(p)
	}
}

func BenchmarkMatrixTransformRect(b *testing.B) {
	m := MatrixScale(2, 2)
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m.TransformRect(r)
	}
}

func BenchmarkMatrixTransformRectComplex(b *testing.B) {
	m := MatrixTranslate(10, 20).Concat(MatrixScale(1.5, 1.5)).Concat(MatrixRotate(30))
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = m.TransformRect(r)
	}
}

// ============================================================================
// Quad Benchmarks
// ============================================================================

func BenchmarkQuadNew(b *testing.B) {
	ul := NewPoint(0, 0)
	ur := NewPoint(100, 0)
	ll := NewPoint(0, 100)
	lr := NewPoint(100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = NewQuad(ul, ur, ll, lr)
	}
}

func BenchmarkQuadFromRect(b *testing.B) {
	r := NewRect(0, 0, 100, 100)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = QuadFromRect(r)
	}
}

func BenchmarkQuadTransform(b *testing.B) {
	q := QuadFromRect(NewRect(0, 0, 100, 100))
	m := MatrixScale(2, 2)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = q.Transform(m)
	}
}

func BenchmarkQuadTransformComplex(b *testing.B) {
	q := QuadFromRect(NewRect(0, 0, 100, 100))
	m := MatrixTranslate(10, 20).Concat(MatrixScale(1.5, 1.5)).Concat(MatrixRotate(30))
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = q.Transform(m)
	}
}

func BenchmarkQuadBounds(b *testing.B) {
	q := QuadFromRect(NewRect(0, 0, 100, 100))
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = q.Bounds()
	}
}
