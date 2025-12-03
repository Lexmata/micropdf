package nanopdf

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

