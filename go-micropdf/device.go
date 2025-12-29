package micropdf

// #include "include/micropdf_ffi.h"
import "C"

// Device represents a rendering device (destination for drawing operations)
type Device struct {
	handle C.fz_device_handle
	ctx    *Context
}

// NewDrawDevice creates a device that draws to a pixmap
func NewDrawDevice(ctx *Context, transform Matrix, pixmap *Pixmap) *Device {
	cTransform := C.fz_matrix{
		a: C.float(transform.A),
		b: C.float(transform.B),
		c: C.float(transform.C),
		d: C.float(transform.D),
		e: C.float(transform.E),
		f: C.float(transform.F),
	}

	handle := C.fz_new_draw_device(
		C.fz_context(ctx.Handle()),
		cTransform,
		C.fz_pixmap(pixmap.ptr),
	)

	return &Device{
		handle: handle,
		ctx:    ctx,
	}
}

// Drop releases the device resources
func (d *Device) Drop() {
	if d.handle != 0 {
		C.fz_drop_device(C.fz_context(d.ctx.Handle()), d.handle)
		d.handle = 0
	}
}

// Close closes the device (completes rendering)
func (d *Device) Close() {
	if d.handle != 0 {
		C.fz_close_device(C.fz_context(d.ctx.Handle()), d.handle)
	}
}

// BeginPage begins a new page on the device
func (d *Device) BeginPage(mediabox Rect, transform Matrix) {
	cRect := C.fz_rect{
		x0: C.float(mediabox.X0),
		y0: C.float(mediabox.Y0),
		x1: C.float(mediabox.X1),
		y1: C.float(mediabox.Y1),
	}

	cTransform := C.fz_matrix{
		a: C.float(transform.A),
		b: C.float(transform.B),
		c: C.float(transform.C),
		d: C.float(transform.D),
		e: C.float(transform.E),
		f: C.float(transform.F),
	}

	C.fz_begin_page(
		C.fz_context(d.ctx.Handle()),
		d.handle,
		cRect,
		cTransform,
	)
}

// EndPage ends the current page on the device
func (d *Device) EndPage() {
	C.fz_end_page(C.fz_context(d.ctx.Handle()), d.handle)
}

// DisplayList represents a display list (recorded sequence of drawing operations)
type DisplayList struct {
	handle C.fz_display_list
	ctx    *Context
}

// NewDisplayList creates a new display list
func NewDisplayList(ctx *Context, mediabox Rect) *DisplayList {
	cRect := C.fz_rect{
		x0: C.float(mediabox.X0),
		y0: C.float(mediabox.Y0),
		x1: C.float(mediabox.X1),
		y1: C.float(mediabox.Y1),
	}

	handle := C.fz_new_display_list(C.fz_context(ctx.Handle()), cRect)

	return &DisplayList{
		handle: handle,
		ctx:    ctx,
	}
}

// Drop releases the display list resources
func (dl *DisplayList) Drop() {
	// Note: We would need fz_drop_display_list in the FFI header
	// For now, display lists are handled differently
}
