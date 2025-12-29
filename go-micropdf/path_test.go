//go:build cgo && !mock
// +build cgo,!mock

package micropdf

import (
	"testing"
)

func TestPathCreate(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	if path == nil {
		t.Fatal("Failed to create path")
	}
	defer path.Drop()
}

func TestPathChaining(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	if path == nil {
		t.Fatal("Failed to create path")
	}
	defer path.Drop()

	// Test method chaining
	result := path.
		MoveTo(10, 10).
		LineTo(100, 10).
		LineTo(100, 100).
		LineTo(10, 100).
		ClosePath()

	if result != path {
		t.Error("Method chaining should return the same path object")
	}
}

func TestPathRectTo(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	if path == nil {
		t.Fatal("Failed to create path")
	}
	defer path.Drop()

	// Add a rectangle
	path.RectTo(10, 10, 80, 60)

	// Get bounds with identity transform
	bounds := path.Bounds(MatrixIdentity())

	// Check that bounds are reasonable (not zero)
	if bounds.X0 >= bounds.X1 || bounds.Y0 >= bounds.Y1 {
		t.Errorf("Invalid bounds: %+v", bounds)
	}
}

func TestPathCurveTo(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	path := NewPath(ctx)
	if path == nil {
		t.Fatal("Failed to create path")
	}
	defer path.Drop()

	// Create a curve
	path.
		MoveTo(0, 0).
		CurveTo(10, 20, 30, 40, 50, 60).
		ClosePath()

	// Verify path is not nil (basic sanity check)
	bounds := path.Bounds(MatrixIdentity())
	if bounds.X0 == 0 && bounds.X1 == 0 && bounds.Y0 == 0 && bounds.Y1 == 0 {
		t.Error("Path bounds should not all be zero")
	}
}
