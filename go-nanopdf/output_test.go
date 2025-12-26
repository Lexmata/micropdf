//go:build cgo && !mock
// +build cgo,!mock

package nanopdf

import (
	"os"
	"path/filepath"
	"testing"
)

func TestOutputWithBuffer(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	buf := NewBuffer(256)
	if buf == nil {
		t.Fatal("Failed to create buffer")
	}
	defer buf.Free()

	output, err := NewOutputWithBuffer(ctx, buf)
	if err != nil {
		t.Fatalf("Failed to create output: %v", err)
	}
	defer output.Drop()

	// Write data
	testData := []byte("Hello, Output!")
	if err := output.WriteData(testData); err != nil {
		t.Fatalf("Failed to write data: %v", err)
	}

	// Write string
	if err := output.WriteString(" More text."); err != nil {
		t.Fatalf("Failed to write string: %v", err)
	}

	// Write byte
	if err := output.WriteByte('\n'); err != nil {
		t.Fatalf("Failed to write byte: %v", err)
	}

	// Check position
	pos := output.Tell()
	if pos == 0 {
		t.Error("Position should be non-zero after writes")
	}
}

func TestOutputWithFile(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Create temp file
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test_output.txt")

	output, err := NewOutputWithPath(ctx, testFile, false)
	if err != nil {
		t.Fatalf("Failed to create file output: %v", err)
	}

	// Write test data
	testData := "Test file output"
	if err := output.WriteString(testData); err != nil {
		t.Fatalf("Failed to write string: %v", err)
	}

	// Close output
	if err := output.Close(); err != nil {
		t.Fatalf("Failed to close output: %v", err)
	}
	output.Drop()

	// Verify file exists and has content
	data, err := os.ReadFile(testFile)
	if err != nil {
		t.Fatalf("Failed to read output file: %v", err)
	}

	if string(data) != testData {
		t.Errorf("File content = %q, expected %q", string(data), testData)
	}
}

func TestOutputTell(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	buf := NewBuffer(256)
	defer buf.Free()

	output, err := NewOutputWithBuffer(ctx, buf)
	if err != nil {
		t.Fatalf("Failed to create output: %v", err)
	}
	defer output.Drop()

	// Initial position should be 0
	if pos := output.Tell(); pos != 0 {
		t.Errorf("Initial position = %d, expected 0", pos)
	}

	// Write 10 bytes
	if err := output.WriteData([]byte("0123456789")); err != nil {
		t.Fatalf("WriteData failed: %v", err)
	}

	// Position should be 10
	if pos := output.Tell(); pos != 10 {
		t.Errorf("Position after 10 bytes = %d, expected 10", pos)
	}
}
