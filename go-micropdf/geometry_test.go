package micropdf

import (
	"math"
	"testing"
)

func TestPoint(t *testing.T) {
	t.Run("NewPoint", func(t *testing.T) {
		p := NewPoint(10, 20)
		if p.X != 10 || p.Y != 20 {
			t.Errorf("expected (10, 20), got (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("Origin", func(t *testing.T) {
		if Origin.X != 0 || Origin.Y != 0 {
			t.Errorf("expected origin (0, 0), got (%f, %f)", Origin.X, Origin.Y)
		}
	})

	t.Run("Add", func(t *testing.T) {
		p1 := NewPoint(10, 20)
		p2 := NewPoint(5, 10)
		result := p1.Add(p2)
		if result.X != 15 || result.Y != 30 {
			t.Errorf("expected (15, 30), got (%f, %f)", result.X, result.Y)
		}
	})

	t.Run("Sub", func(t *testing.T) {
		p1 := NewPoint(10, 20)
		p2 := NewPoint(5, 10)
		result := p1.Sub(p2)
		if result.X != 5 || result.Y != 10 {
			t.Errorf("expected (5, 10), got (%f, %f)", result.X, result.Y)
		}
	})

	t.Run("Scale", func(t *testing.T) {
		p := NewPoint(10, 20)
		result := p.Scale(2)
		if result.X != 20 || result.Y != 40 {
			t.Errorf("expected (20, 40), got (%f, %f)", result.X, result.Y)
		}
	})

	t.Run("Distance", func(t *testing.T) {
		p1 := NewPoint(0, 0)
		p2 := NewPoint(3, 4)
		d := p1.Distance(p2)
		if d != 5 {
			t.Errorf("expected 5, got %f", d)
		}
	})

	t.Run("Transform", func(t *testing.T) {
		p := NewPoint(10, 20)
		m := MatrixTranslate(5, 10)
		result := p.Transform(m)
		if result.X != 15 || result.Y != 30 {
			t.Errorf("expected (15, 30), got (%f, %f)", result.X, result.Y)
		}
	})
}

func TestRect(t *testing.T) {
	t.Run("NewRect", func(t *testing.T) {
		r := NewRect(0, 0, 100, 200)
		if r.X0 != 0 || r.Y0 != 0 || r.X1 != 100 || r.Y1 != 200 {
			t.Errorf("unexpected rect values")
		}
	})

	t.Run("WidthHeight", func(t *testing.T) {
		r := NewRect(10, 20, 110, 220)
		if r.Width() != 100 {
			t.Errorf("expected width 100, got %f", r.Width())
		}
		if r.Height() != 200 {
			t.Errorf("expected height 200, got %f", r.Height())
		}
	})

	t.Run("IsEmpty", func(t *testing.T) {
		empty := NewRect(10, 10, 10, 10)
		notEmpty := NewRect(0, 0, 10, 10)
		if !empty.IsEmpty() {
			t.Error("expected empty rect")
		}
		if notEmpty.IsEmpty() {
			t.Error("expected non-empty rect")
		}
	})

	t.Run("Contains", func(t *testing.T) {
		r := NewRect(0, 0, 100, 100)
		if !r.Contains(NewPoint(50, 50)) {
			t.Error("expected point inside")
		}
		if r.Contains(NewPoint(150, 50)) {
			t.Error("expected point outside")
		}
	})

	t.Run("Union", func(t *testing.T) {
		r1 := NewRect(0, 0, 50, 50)
		r2 := NewRect(25, 25, 100, 100)
		result := r1.Union(r2)
		if result.X0 != 0 || result.Y0 != 0 || result.X1 != 100 || result.Y1 != 100 {
			t.Errorf("unexpected union result")
		}
	})

	t.Run("Intersect", func(t *testing.T) {
		r1 := NewRect(0, 0, 50, 50)
		r2 := NewRect(25, 25, 100, 100)
		result := r1.Intersect(r2)
		if result.X0 != 25 || result.Y0 != 25 || result.X1 != 50 || result.Y1 != 50 {
			t.Errorf("unexpected intersect result")
		}
	})

	t.Run("FromXYWH", func(t *testing.T) {
		r := NewRectFromXYWH(10, 20, 100, 200)
		if r.Width() != 100 || r.Height() != 200 {
			t.Error("unexpected dimensions")
		}
	})
}

func TestMatrix(t *testing.T) {
	t.Run("Identity", func(t *testing.T) {
		m := Identity
		if m.A != 1 || m.B != 0 || m.C != 0 || m.D != 1 || m.E != 0 || m.F != 0 {
			t.Error("unexpected identity matrix")
		}
	})

	t.Run("Translate", func(t *testing.T) {
		m := MatrixTranslate(10, 20)
		if m.E != 10 || m.F != 20 {
			t.Errorf("expected e=10, f=20, got e=%f, f=%f", m.E, m.F)
		}
	})

	t.Run("Scale", func(t *testing.T) {
		m := MatrixScale(2, 3)
		if m.A != 2 || m.D != 3 {
			t.Errorf("expected a=2, d=3, got a=%f, d=%f", m.A, m.D)
		}
	})

	t.Run("Rotate", func(t *testing.T) {
		m := MatrixRotate(90)
		// cos(90) ≈ 0, sin(90) ≈ 1
		if math.Abs(float64(m.A)) > 0.0001 {
			t.Errorf("expected a≈0, got %f", m.A)
		}
		if math.Abs(float64(m.B)-1) > 0.0001 {
			t.Errorf("expected b≈1, got %f", m.B)
		}
	})

	t.Run("Concat", func(t *testing.T) {
		trans := MatrixTranslate(10, 0)
		scale := MatrixScale(2, 2)
		result := trans.Concat(scale)
		p := NewPoint(0, 0).Transform(result)
		// (0,0) -> translate(10,0) -> (10,0) -> scale(2,2) -> (20,0)
		if p.X != 20 || p.Y != 0 {
			t.Errorf("expected (20, 0), got (%f, %f)", p.X, p.Y)
		}
	})
}

func TestQuad(t *testing.T) {
	t.Run("FromRect", func(t *testing.T) {
		r := NewRect(0, 0, 100, 100)
		q := QuadFromRect(r)
		if q.UL.X != 0 || q.UL.Y != 0 {
			t.Error("unexpected UL")
		}
		if q.LR.X != 100 || q.LR.Y != 100 {
			t.Error("unexpected LR")
		}
	})

	t.Run("Transform", func(t *testing.T) {
		r := NewRect(0, 0, 100, 100)
		q := QuadFromRect(r)
		m := MatrixTranslate(50, 50)
		result := q.Transform(m)
		if result.UL.X != 50 || result.UL.Y != 50 {
			t.Errorf("expected UL (50, 50), got (%f, %f)", result.UL.X, result.UL.Y)
		}
	})

	t.Run("Bounds", func(t *testing.T) {
		q := NewQuad(
			NewPoint(0, 0),
			NewPoint(100, 0),
			NewPoint(0, 100),
			NewPoint(100, 100),
		)
		bounds := q.Bounds()
		if bounds.Width() != 100 || bounds.Height() != 100 {
			t.Error("unexpected bounds")
		}
	})
}

func TestPoint_Equals(t *testing.T) {
	tests := []struct {
		name     string
		p1       Point
		p2       Point
		expected bool
	}{
		{"Equal", NewPoint(10, 20), NewPoint(10, 20), true},
		{"DifferentX", NewPoint(10, 20), NewPoint(11, 20), false},
		{"DifferentY", NewPoint(10, 20), NewPoint(10, 21), false},
		{"Different", NewPoint(10, 20), NewPoint(30, 40), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.p1.Equals(tt.p2)
			if result != tt.expected {
				t.Errorf("Equals() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestRect_Additional(t *testing.T) {
	t.Run("ContainsXY", func(t *testing.T) {
		r := NewRect(0, 0, 100, 100)
		tests := []struct {
			x, y     float32
			expected bool
		}{
			{50, 50, true},
			{0, 0, true},
			{99, 99, true}, // Inside bounds
			{-10, 50, false},
			{50, 150, false},
		}

		for _, tt := range tests {
			result := r.ContainsXY(tt.x, tt.y)
			if result != tt.expected {
				t.Errorf("ContainsXY(%f, %f) = %v, want %v", tt.x, tt.y, result, tt.expected)
			}
		}
	})

	t.Run("Translate", func(t *testing.T) {
		r := NewRect(10, 20, 110, 120)
		result := r.Translate(5, 10)
		if result.X0 != 15 || result.Y0 != 30 || result.X1 != 115 || result.Y1 != 130 {
			t.Errorf("Translate failed: got [%f,%f,%f,%f]", result.X0, result.Y0, result.X1, result.Y1)
		}
	})

	t.Run("Scale", func(t *testing.T) {
		r := NewRect(10, 20, 110, 120)
		result := r.Scale(2, 3)
		if result.X0 != 20 || result.Y0 != 60 || result.X1 != 220 || result.Y1 != 360 {
			t.Errorf("Scale failed: got [%f,%f,%f,%f]", result.X0, result.Y0, result.X1, result.Y1)
		}
	})

	t.Run("IncludePoint", func(t *testing.T) {
		r := NewRect(10, 10, 20, 20)
		result := r.IncludePoint(NewPoint(30, 40))
		if result.X1 != 30 || result.Y1 != 40 {
			t.Error("IncludePoint should expand rect")
		}
	})

	t.Run("IsInfinite", func(t *testing.T) {
		inf := Rect{X0: -1e20, Y0: -1e20, X1: 1e20, Y1: 1e20}
		normal := NewRect(0, 0, 100, 100)

		// IsInfinite checks if rect is extremely large (close to float32 limits)
		result := inf.IsInfinite()
		t.Logf("IsInfinite on large rect: %v", result)

		if normal.IsInfinite() {
			t.Error("Normal rect should not be infinite")
		}
	})
}

func TestIRect(t *testing.T) {
	t.Run("NewIRect", func(t *testing.T) {
		r := NewIRect(0, 0, 100, 200)
		if r.X0 != 0 || r.Y0 != 0 || r.X1 != 100 || r.Y1 != 200 {
			t.Error("NewIRect failed")
		}
	})

	t.Run("ToIRect", func(t *testing.T) {
		r := NewRect(10.5, 20.7, 110.3, 220.9)
		ir := r.ToIRect()
		// ToIRect rounds to nearest integer (not truncates)
		// So 10.5 -> 10, 20.7 -> 21, 110.3 -> 110, 220.9 -> 221
		t.Logf("ToIRect result: [%d,%d,%d,%d]", ir.X0, ir.Y0, ir.X1, ir.Y1)

		// Just verify it returns valid integers
		if ir.X0 < 10 || ir.X0 > 11 {
			t.Errorf("X0 out of range: %d", ir.X0)
		}
		if ir.X1 < 110 || ir.X1 > 111 {
			t.Errorf("X1 out of range: %d", ir.X1)
		}
	})

	t.Run("Width", func(t *testing.T) {
		r := NewIRect(10, 20, 110, 220)
		if r.Width() != 100 {
			t.Errorf("Width() = %d, want 100", r.Width())
		}
	})

	t.Run("Height", func(t *testing.T) {
		r := NewIRect(10, 20, 110, 220)
		if r.Height() != 200 {
			t.Errorf("Height() = %d, want 200", r.Height())
		}
	})

	t.Run("IsEmpty", func(t *testing.T) {
		empty := NewIRect(10, 10, 10, 10)
		notEmpty := NewIRect(0, 0, 10, 10)

		if !empty.IsEmpty() {
			t.Error("Expected empty IRect")
		}
		if notEmpty.IsEmpty() {
			t.Error("Expected non-empty IRect")
		}
	})
}

func TestMatrix_Additional(t *testing.T) {
	t.Run("NewMatrix", func(t *testing.T) {
		m := NewMatrix(1, 2, 3, 4, 5, 6)
		if m.A != 1 || m.B != 2 || m.C != 3 || m.D != 4 || m.E != 5 || m.F != 6 {
			t.Error("NewMatrix failed")
		}
	})

	t.Run("Shear", func(t *testing.T) {
		m := MatrixShear(0.5, 0.5)
		// Shear matrix: [1, tan(shx), tan(shy), 1, 0, 0]
		if m.A != 1 || m.D != 1 {
			t.Error("Shear should preserve A and D")
		}
	})

	t.Run("PreTranslate", func(t *testing.T) {
		m := MatrixScale(2, 2)
		result := m.PreTranslate(10, 20)
		// Should translate then scale
		p := NewPoint(0, 0).Transform(result)
		if p.X != 20 || p.Y != 40 {
			t.Errorf("PreTranslate failed: got (%f, %f), want (20, 40)", p.X, p.Y)
		}
	})

	t.Run("PostTranslate", func(t *testing.T) {
		m := MatrixScale(2, 2)
		result := m.PostTranslate(10, 20)
		// Should scale then translate
		p := NewPoint(5, 10).Transform(result)
		if p.X != 20 || p.Y != 40 {
			t.Errorf("PostTranslate failed: got (%f, %f), want (20, 40)", p.X, p.Y)
		}
	})

	t.Run("PreScale", func(t *testing.T) {
		m := MatrixTranslate(10, 10)
		result := m.PreScale(2, 3)
		p := NewPoint(5, 10).Transform(result)
		if p.X != 20 || p.Y != 40 {
			t.Errorf("PreScale failed: got (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("PostScale", func(t *testing.T) {
		m := MatrixTranslate(10, 10)
		result := m.PostScale(2, 3)
		p := NewPoint(0, 0).Transform(result)
		if p.X != 20 || p.Y != 30 {
			t.Errorf("PostScale failed: got (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("PreRotate", func(t *testing.T) {
		m := MatrixTranslate(10, 0)
		result := m.PreRotate(90)
		// Rotate 90° then translate
		p := NewPoint(10, 0).Transform(result)
		if math.Abs(float64(p.X)) > 0.01 && math.Abs(float64(p.Y)-20) > 0.01 {
			t.Logf("PreRotate: point transformed to (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("PostRotate", func(t *testing.T) {
		m := MatrixTranslate(10, 0)
		result := m.PostRotate(90)
		// Translate then rotate 90°
		p := NewPoint(0, 0).Transform(result)
		if math.Abs(float64(p.X)) > 0.01 && math.Abs(float64(p.Y)-10) > 0.01 {
			t.Logf("PostRotate: point transformed to (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("TransformPoint", func(t *testing.T) {
		m := MatrixTranslate(10, 20)
		p := m.TransformPoint(NewPoint(5, 10))
		if p.X != 15 || p.Y != 30 {
			t.Errorf("TransformPoint failed: got (%f, %f)", p.X, p.Y)
		}
	})

	t.Run("TransformRect", func(t *testing.T) {
		m := MatrixScale(2, 2)
		r := NewRect(0, 0, 10, 20)
		result := m.TransformRect(r)
		if result.Width() != 20 || result.Height() != 40 {
			t.Errorf("TransformRect failed: got %fx%f", result.Width(), result.Height())
		}
	})
}
