package nanopdf

import (
	"bytes"
	"testing"
)

func TestBuffer(t *testing.T) {
	t.Run("NewBuffer", func(t *testing.T) {
		buf := NewBuffer(1024)
		if buf == nil {
			t.Fatal("expected non-nil buffer")
		}
		defer buf.Free()

		if buf.Len() != 0 {
			t.Errorf("expected length 0, got %d", buf.Len())
		}
		if !buf.IsEmpty() {
			t.Error("expected buffer to be empty")
		}
	})

	t.Run("FromBytes", func(t *testing.T) {
		data := []byte("Hello, World!")
		buf := NewBufferFromBytes(data)
		if buf == nil {
			t.Fatal("expected non-nil buffer")
		}
		defer buf.Free()

		if buf.Len() != len(data) {
			t.Errorf("expected length %d, got %d", len(data), buf.Len())
		}
		if !bytes.Equal(buf.Bytes(), data) {
			t.Errorf("data mismatch")
		}
	})

	t.Run("FromString", func(t *testing.T) {
		s := "Hello, NanoPDF!"
		buf := NewBufferFromString(s)
		if buf == nil {
			t.Fatal("expected non-nil buffer")
		}
		defer buf.Free()

		if buf.String() != s {
			t.Errorf("expected %q, got %q", s, buf.String())
		}
	})

	t.Run("Append", func(t *testing.T) {
		buf := NewBuffer(0)
		if buf == nil {
			t.Fatal("expected non-nil buffer")
		}
		defer buf.Free()

		err := buf.AppendString("Hello")
		if err != nil {
			t.Fatalf("append failed: %v", err)
		}

		err = buf.AppendString(", World!")
		if err != nil {
			t.Fatalf("append failed: %v", err)
		}

		if buf.String() != "Hello, World!" {
			t.Errorf("expected %q, got %q", "Hello, World!", buf.String())
		}
	})

	t.Run("AppendByte", func(t *testing.T) {
		buf := NewBuffer(0)
		defer buf.Free()

		for _, b := range []byte("ABC") {
			if err := buf.AppendByte(b); err != nil {
				t.Fatal(err)
			}
		}

		if buf.String() != "ABC" {
			t.Errorf("expected %q, got %q", "ABC", buf.String())
		}
	})

	t.Run("Clear", func(t *testing.T) {
		buf := NewBufferFromString("Some data")
		defer buf.Free()

		buf.Clear()
		if buf.Len() != 0 {
			t.Errorf("expected length 0 after clear, got %d", buf.Len())
		}
	})

	t.Run("Clone", func(t *testing.T) {
		original := NewBufferFromString("Original")
		defer original.Free()

		cloned := original.Clone()
		if cloned == nil {
			t.Fatal("clone returned nil")
		}
		defer cloned.Free()

		if cloned.String() != original.String() {
			t.Error("clone data mismatch")
		}

		// Modify original, clone should be unaffected
		original.AppendString(" Modified")
		if cloned.String() == original.String() {
			t.Error("clone should be independent")
		}
	})

	t.Run("NilBuffer", func(t *testing.T) {
		var buf *Buffer = nil
		if buf.Len() != 0 {
			t.Error("nil buffer should have length 0")
		}
		if !buf.IsEmpty() {
			t.Error("nil buffer should be empty")
		}
		if buf.Bytes() != nil {
			t.Error("nil buffer bytes should be nil")
		}
	})
}

