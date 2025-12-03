package nanopdf

import (
	"errors"
)

// Buffer is a dynamic byte buffer for PDF data.
type Buffer struct {
	ptr uintptr
}

// NewBuffer creates a new buffer with the given initial capacity.
func NewBuffer(capacity int) *Buffer {
	ptr := bufferNew(capacity)
	if ptr == 0 {
		return nil
	}
	return &Buffer{ptr: ptr}
}

// NewBufferFromBytes creates a buffer from existing byte data.
func NewBufferFromBytes(data []byte) *Buffer {
	if len(data) == 0 {
		return NewBuffer(0)
	}
	ptr := bufferFromData(data)
	if ptr == 0 {
		return nil
	}
	return &Buffer{ptr: ptr}
}

// NewBufferFromString creates a buffer from a string.
func NewBufferFromString(s string) *Buffer {
	return NewBufferFromBytes([]byte(s))
}

// Free releases the buffer's resources.
// The buffer should not be used after calling Free.
func (b *Buffer) Free() {
	if b != nil && b.ptr != 0 {
		bufferFree(b.ptr)
		b.ptr = 0
	}
}

// Len returns the number of bytes in the buffer.
func (b *Buffer) Len() int {
	if b == nil || b.ptr == 0 {
		return 0
	}
	return bufferLen(b.ptr)
}

// IsEmpty returns true if the buffer has no data.
func (b *Buffer) IsEmpty() bool {
	return b.Len() == 0
}

// Bytes returns a copy of the buffer's data.
func (b *Buffer) Bytes() []byte {
	if b == nil || b.ptr == 0 {
		return nil
	}
	return bufferData(b.ptr)
}

// String returns the buffer's data as a string.
func (b *Buffer) String() string {
	return string(b.Bytes())
}

// Append appends data to the buffer.
func (b *Buffer) Append(data []byte) error {
	if b == nil || b.ptr == 0 {
		return errors.New("buffer is nil")
	}
	if len(data) == 0 {
		return nil
	}
	err := bufferAppend(b.ptr, data)
	if err != 0 {
		return errors.New("failed to append to buffer")
	}
	return nil
}

// AppendString appends a string to the buffer.
func (b *Buffer) AppendString(s string) error {
	return b.Append([]byte(s))
}

// AppendByte appends a single byte to the buffer.
func (b *Buffer) AppendByte(c byte) error {
	return b.Append([]byte{c})
}

// Clear removes all data from the buffer.
func (b *Buffer) Clear() {
	if b != nil && b.ptr != 0 {
		bufferClear(b.ptr)
	}
}

// Clone creates a copy of the buffer.
func (b *Buffer) Clone() *Buffer {
	if b == nil || b.ptr == 0 {
		return nil
	}
	return NewBufferFromBytes(b.Bytes())
}

