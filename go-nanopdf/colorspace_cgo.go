//go:build cgo && !mock
// +build cgo,!mock

package nanopdf

// #include "include/nanopdf_ffi.h"
import "C"

// Colorspace represents a PDF colorspace
type Colorspace struct {
	handle C.fz_colorspace
	ctx    *Context
}

// DeviceGray returns the device gray colorspace
func DeviceGray(ctx *Context) *Colorspace {
	handle := C.fz_device_gray(C.fz_context(ctx.Handle()))
	return &Colorspace{
		handle: handle,
		ctx:    ctx,
	}
}

// DeviceRGB returns the device RGB colorspace
func DeviceRGB(ctx *Context) *Colorspace {
	handle := C.fz_device_rgb(C.fz_context(ctx.Handle()))
	return &Colorspace{
		handle: handle,
		ctx:    ctx,
	}
}

// DeviceBGR returns the device BGR colorspace
func DeviceBGR(ctx *Context) *Colorspace {
	handle := C.fz_device_bgr(C.fz_context(ctx.Handle()))
	return &Colorspace{
		handle: handle,
		ctx:    ctx,
	}
}

// DeviceCMYK returns the device CMYK colorspace
func DeviceCMYK(ctx *Context) *Colorspace {
	handle := C.fz_device_cmyk(C.fz_context(ctx.Handle()))
	return &Colorspace{
		handle: handle,
		ctx:    ctx,
	}
}

// Components returns the number of components in the colorspace
// - 1 for Gray
// - 3 for RGB/BGR
// - 4 for CMYK
func (cs *Colorspace) Components() int {
	return int(C.fz_colorspace_n(C.fz_context(cs.ctx.Handle()), cs.handle))
}

// Name returns the colorspace name
func (cs *Colorspace) Name() string {
	cName := C.fz_colorspace_name(C.fz_context(cs.ctx.Handle()), cs.handle)
	if cName == nil {
		return ""
	}
	return C.GoString(cName)
}

// IsGray returns true if this is a grayscale colorspace
func (cs *Colorspace) IsGray() bool {
	return cs.Components() == 1
}

// IsRGB returns true if this is an RGB colorspace
func (cs *Colorspace) IsRGB() bool {
	n := cs.Components()
	name := cs.Name()
	return n == 3 && (name == "DeviceRGB" || name == "DeviceBGR")
}

// IsCMYK returns true if this is a CMYK colorspace
func (cs *Colorspace) IsCMYK() bool {
	return cs.Components() == 4
}
