package micropdf

import (
	"testing"
)

func TestPathBuilder(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	builder := NewPathBuilder().
		MoveTo(0, 0).
		LineTo(100, 0).
		LineTo(100, 100).
		LineTo(0, 100).
		Close()

	if builder.Len() != 5 {
		t.Errorf("Expected 5 commands, got %d", builder.Len())
	}

	path := builder.BuildNew(ctx)
	defer path.Drop()

	// Path should be valid
	if path == nil {
		t.Fatal("Failed to build path")
	}
}

func TestPathAddLines(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	// Add a triangle
	points := []float32{0, 0, 100, 0, 50, 100}
	path.AddLines(points)

	// Should work without error
}

func TestPathAddPolygon(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	// Add a square
	points := []float32{0, 0, 100, 0, 100, 100, 0, 100}
	path.AddPolygon(points)
}

func TestPathAddRects(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	// Add multiple rectangles
	rects := []float32{
		0, 0, 50, 50,
		60, 0, 50, 50,
		0, 60, 50, 50,
		60, 60, 50, 50,
	}
	path.AddRects(rects)
}

func TestPathAddRectsFromSlice(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	rects := []Rect{
		NewRect(0, 0, 50, 50),
		NewRect(60, 0, 110, 50),
	}
	path.AddRectsFromSlice(rects)
}

func TestPathAddPolyline(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	points := []Point{
		NewPoint(0, 0),
		NewPoint(50, 25),
		NewPoint(100, 0),
		NewPoint(100, 100),
	}
	path.AddPolyline(points)
}

func TestPathAddCommands(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	defer path.Drop()

	commands := []PathCommand{
		NewMoveToCmd(0, 0),
		NewLineToCmd(100, 0),
		NewCurveToCmd(150, 0, 150, 50, 100, 50),
		NewLineToCmd(0, 50),
		NewClosePathCmd(),
	}
	path.AddCommands(commands)
}

func TestPathBuilderReset(t *testing.T) {
	builder := NewPathBuilder().
		MoveTo(0, 0).
		LineTo(100, 100)

	if builder.Len() != 2 {
		t.Errorf("Expected 2 commands, got %d", builder.Len())
	}

	builder.Reset()

	if builder.Len() != 0 {
		t.Errorf("Expected 0 commands after reset, got %d", builder.Len())
	}
}

func BenchmarkPathIndividual(b *testing.B) {
	ctx := NewContext()
	if ctx == nil {
		b.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		path := NewPath(ctx)
		path.MoveTo(0, 0)
		path.LineTo(100, 0)
		path.LineTo(100, 100)
		path.LineTo(0, 100)
		path.ClosePath()
		path.Drop()
	}
}

func BenchmarkPathBatchLines(b *testing.B) {
	ctx := NewContext()
	if ctx == nil {
		b.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	points := []float32{0, 0, 100, 0, 100, 100, 0, 100}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		path := NewPath(ctx)
		path.AddLines(points)
		path.ClosePath()
		path.Drop()
	}
}

func BenchmarkPathBuilder(b *testing.B) {
	ctx := NewContext()
	if ctx == nil {
		b.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	builder := NewPathBuilder().
		MoveTo(0, 0).
		LineTo(100, 0).
		LineTo(100, 100).
		LineTo(0, 100).
		Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		path := NewPath(ctx)
		builder.Build(path)
		path.Drop()
	}
}
