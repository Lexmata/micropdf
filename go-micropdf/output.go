package micropdf

// #include "include/micropdf_ffi.h"
// #include <stdlib.h>
import "C"
import (
	"unsafe"
)

// Output represents an output stream (file or buffer)
type Output struct {
	handle C.fz_output
	ctx    *Context
}

// NewOutputWithPath creates an output to a file
func NewOutputWithPath(ctx *Context, filename string, append bool) (*Output, error) {
	cFilename := C.CString(filename)
	defer C.free(unsafe.Pointer(cFilename))

	appendFlag := C.int(0)
	if append {
		appendFlag = 1
	}

	handle := C.fz_new_output_with_path(
		C.fz_context(ctx.Handle()),
		cFilename,
		appendFlag,
	)

	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to create output stream")
	}

	return &Output{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// NewOutputWithBuffer creates an output to a buffer
func NewOutputWithBuffer(ctx *Context, buf *Buffer) (*Output, error) {
	handle := C.fz_new_output_with_buffer(
		C.fz_context(ctx.Handle()),
		C.fz_buffer(buf.ptr),
	)

	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to create output stream")
	}

	return &Output{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// Drop releases the output resources
func (o *Output) Drop() {
	if o.handle != 0 {
		C.fz_drop_output(C.fz_context(o.ctx.Handle()), o.handle)
		o.handle = 0
	}
}

// WriteData writes raw data to the output
func (o *Output) WriteData(data []byte) error {
	if len(data) == 0 {
		return nil
	}

	C.fz_write_data(
		C.fz_context(o.ctx.Handle()),
		o.handle,
		unsafe.Pointer(&data[0]),
		C.size_t(len(data)),
	)

	return nil
}

// WriteString writes a string to the output
func (o *Output) WriteString(s string) error {
	cStr := C.CString(s)
	defer C.free(unsafe.Pointer(cStr))

	C.fz_write_string(
		C.fz_context(o.ctx.Handle()),
		o.handle,
		cStr,
	)

	return nil
}

// WriteByte writes a single byte to the output
func (o *Output) WriteByte(b byte) error {
	C.fz_write_byte(
		C.fz_context(o.ctx.Handle()),
		o.handle,
		C.uchar(b),
	)

	return nil
}

// Close closes the output stream (flushes and closes file)
func (o *Output) Close() error {
	if o.handle != 0 {
		C.fz_close_output(C.fz_context(o.ctx.Handle()), o.handle)
	}
	return nil
}

// Tell returns the current position in the output
func (o *Output) Tell() int64 {
	return int64(C.fz_tell_output(C.fz_context(o.ctx.Handle()), o.handle))
}
