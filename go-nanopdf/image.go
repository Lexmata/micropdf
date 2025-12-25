package nanopdf

// #include "include/nanopdf_ffi.h"
// #include <stdlib.h>
import "C"
import (
	"unsafe"
)

// Image represents a PDF image
type Image struct {
	handle C.fz_image
	ctx    *Context
}

// NewImageFromFile loads an image from a file
func NewImageFromFile(ctx *Context, path string) (*Image, error) {
	cPath := C.CString(path)
	defer C.free(unsafe.Pointer(cPath))

	handle := C.fz_new_image_from_file(C.fz_context(ctx.Handle()), cPath)
	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to load image from file")
	}

	return &Image{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// NewImageFromBuffer loads an image from a buffer
func NewImageFromBuffer(ctx *Context, buf *Buffer) (*Image, error) {
	handle := C.fz_new_image_from_buffer(C.fz_context(ctx.Handle()), C.fz_buffer(buf.ptr))
	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to load image from buffer")
	}

	return &Image{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// NewImageFromPixmap creates an image from a pixmap
func NewImageFromPixmap(ctx *Context, pixmap *Pixmap) (*Image, error) {
	handle := C.fz_new_image_from_pixmap(
		C.fz_context(ctx.Handle()),
		C.fz_pixmap(pixmap.ptr),
		0, // No mask
	)

	if handle == 0 {
		return nil, NewError(ErrCodeGeneric, "failed to create image from pixmap")
	}

	return &Image{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// Drop releases the image resources
func (img *Image) Drop() {
	if img.handle != 0 {
		C.fz_drop_image(C.fz_context(img.ctx.Handle()), img.handle)
		img.handle = 0
	}
}

// Keep increments the reference count
func (img *Image) Keep() *Image {
	if img.handle != 0 {
		C.fz_keep_image(C.fz_context(img.ctx.Handle()), img.handle)
	}
	return img
}

// Width returns the image width in pixels
func (img *Image) Width() int {
	return int(C.fz_image_width(C.fz_context(img.ctx.Handle()), img.handle))
}

// Height returns the image height in pixels
func (img *Image) Height() int {
	return int(C.fz_image_height(C.fz_context(img.ctx.Handle()), img.handle))
}

// Colorspace returns the image colorspace
func (img *Image) Colorspace() *Colorspace {
	handle := C.fz_image_colorspace(C.fz_context(img.ctx.Handle()), img.handle)
	if handle == 0 {
		return nil
	}

	return &Colorspace{
		handle: handle,
		ctx:    img.ctx,
	}
}

// ToPixmap decodes the image to a pixmap for rendering
func (img *Image) ToPixmap() (*Pixmap, error) {
	var w, h C.int

	pixmapHandle := C.fz_get_pixmap_from_image(
		C.fz_context(img.ctx.Handle()),
		img.handle,
		nil, // No subarea
		nil, // No transform
		&w,
		&h,
	)

	if pixmapHandle == 0 {
		return nil, NewError(ErrCodeGeneric, "failed to decode image to pixmap")
	}

	return &Pixmap{
		ptr: uintptr(pixmapHandle),
		ctx: img.ctx,
	}, nil
}
