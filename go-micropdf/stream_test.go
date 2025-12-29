//go:build cgo && !mock
// +build cgo,!mock

package micropdf

import (
	"bytes"
	"testing"
)

func TestOpenMemoryStream(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	testData := []byte("Hello, World!")
	stream, err := OpenMemory(ctx, testData)
	if err != nil {
		t.Fatalf("Failed to open memory stream: %v", err)
	}
	defer stream.Drop()

	// Read data back
	buf := make([]byte, len(testData))
	n, err := stream.Read(buf)
	if err != nil {
		t.Fatalf("Failed to read from stream: %v", err)
	}

	if n != len(testData) {
		t.Errorf("Read %d bytes, expected %d", n, len(testData))
	}

	if !bytes.Equal(buf, testData) {
		t.Errorf("Read data %q, expected %q", buf, testData)
	}
}

func TestStreamReadByte(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	testData := []byte{0x41, 0x42, 0x43} // ABC
	stream, err := OpenMemory(ctx, testData)
	if err != nil {
		t.Fatalf("Failed to open memory stream: %v", err)
	}
	defer stream.Drop()

	// Read bytes individually
	for i, expected := range testData {
		got := stream.ReadByte()
		if got != int(expected) {
			t.Errorf("Byte %d: got %d, expected %d", i, got, expected)
		}
	}

	// Check EOF
	if !stream.IsEOF() {
		t.Error("Stream should be at EOF")
	}
}

func TestStreamSeekTell(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	testData := []byte("0123456789")
	stream, err := OpenMemory(ctx, testData)
	if err != nil {
		t.Fatalf("Failed to open memory stream: %v", err)
	}
	defer stream.Drop()

	// Initial position
	if pos := stream.Tell(); pos != 0 {
		t.Errorf("Initial position = %d, expected 0", pos)
	}

	// Seek to position 5
	stream.Seek(5, 0) // SEEK_SET
	if pos := stream.Tell(); pos != 5 {
		t.Errorf("After seek: position = %d, expected 5", pos)
	}

	// Read and verify
	buf := make([]byte, 1)
	if _, err := stream.Read(buf); err != nil {
		t.Fatalf("Read failed: %v", err)
	}
	if buf[0] != '5' {
		t.Errorf("Read byte %c, expected '5'", buf[0])
	}
}

func TestStreamEmptyData(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	_, err := OpenMemory(ctx, []byte{})
	if err == nil {
		t.Error("Expected error for empty data")
	}
}
