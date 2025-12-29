package micropdf

import (
	"testing"
)

func TestContextNew(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("NewContext returned nil")
	}
	defer ctx.Drop()

	if !ctx.IsValid() {
		t.Error("Context should be valid after creation")
	}
}

func TestContextDrop(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("NewContext returned nil")
	}

	ctx.Drop()

	if ctx.IsValid() {
		t.Error("Context should be invalid after drop")
	}

	// Multiple drops should be safe
	ctx.Drop()
}

func TestContextClone(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("NewContext returned nil")
	}
	defer ctx.Drop()

	cloned := ctx.Clone()
	if cloned == nil {
		t.Fatal("Clone returned nil")
	}
	defer cloned.Drop()

	if !cloned.IsValid() {
		t.Error("Cloned context should be valid")
	}

	// Original should still be valid
	if !ctx.IsValid() {
		t.Error("Original context should still be valid after cloning")
	}
}

func TestContextDroppedClone(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("NewContext returned nil")
	}

	ctx.Drop()

	// Cloning a dropped context should return nil
	cloned := ctx.Clone()
	if cloned != nil {
		t.Error("Clone of dropped context should return nil")
		cloned.Drop()
	}
}
