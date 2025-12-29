package micropdf

// #include "include/micropdf_ffi.h"
// #include <stdlib.h>
import "C"
import (
	"unsafe"
)

// Stream represents an input stream (file or memory)
type Stream struct {
	handle C.fz_stream
	ctx    *Context
}

// OpenFile opens a stream from a file
func OpenFile(ctx *Context, filename string) (*Stream, error) {
	cFilename := C.CString(filename)
	defer C.free(unsafe.Pointer(cFilename))

	handle := C.fz_open_file(C.fz_context(ctx.Handle()), cFilename)
	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to open file stream")
	}

	return &Stream{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// OpenMemory opens a stream from memory
func OpenMemory(ctx *Context, data []byte) (*Stream, error) {
	if len(data) == 0 {
		return nil, NewError(ErrCodeArgument, "stream data is empty")
	}

	handle := C.fz_open_memory(
		C.fz_context(ctx.Handle()),
		(*C.uchar)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
	)

	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to open memory stream")
	}

	return &Stream{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// Drop releases the stream resources
func (s *Stream) Drop() {
	if s.handle != 0 {
		C.fz_drop_stream(C.fz_context(s.ctx.Handle()), s.handle)
		s.handle = 0
	}
}

// Read reads data from the stream into the provided buffer
// Returns the number of bytes read
func (s *Stream) Read(buffer []byte) (int, error) {
	if len(buffer) == 0 {
		return 0, nil
	}

	n := C.fz_read(
		C.fz_context(s.ctx.Handle()),
		s.handle,
		(*C.uchar)(unsafe.Pointer(&buffer[0])),
		C.size_t(len(buffer)),
	)

	return int(n), nil
}

// ReadByte reads a single byte from the stream
// Returns -1 on EOF
func (s *Stream) ReadByte() int {
	return int(C.fz_read_byte(C.fz_context(s.ctx.Handle()), s.handle))
}

// IsEOF returns true if the stream is at end-of-file
func (s *Stream) IsEOF() bool {
	return C.fz_is_eof(C.fz_context(s.ctx.Handle()), s.handle) != 0
}

// Seek seeks to a position in the stream
// whence: 0=SEEK_SET, 1=SEEK_CUR, 2=SEEK_END
func (s *Stream) Seek(offset int64, whence int) {
	C.fz_seek(
		C.fz_context(s.ctx.Handle()),
		s.handle,
		C.int64_t(offset),
		C.int(whence),
	)
}

// Tell returns the current position in the stream
func (s *Stream) Tell() int64 {
	return int64(C.fz_tell(C.fz_context(s.ctx.Handle()), s.handle))
}
