//go:build cgo && !mock
// +build cgo,!mock

package micropdf

// #include "include/micropdf_ffi.h"
import "C"

// Path represents a vector graphics path
type Path struct {
	handle C.fz_path
	ctx    *Context
}

// NewPath creates a new empty path
func NewPath(ctx *Context) *Path {
	handle := C.fz_new_path(C.fz_context(ctx.Handle()))
	return &Path{
		handle: handle,
		ctx:    ctx,
	}
}

// Drop releases the path resources
func (p *Path) Drop() {
	if p.handle != 0 {
		C.fz_drop_path(C.fz_context(p.ctx.Handle()), p.handle)
		p.handle = 0
	}
}

// MoveTo moves the current point to (x, y)
func (p *Path) MoveTo(x, y float32) *Path {
	C.fz_moveto(
		C.fz_context(p.ctx.Handle()),
		p.handle,
		C.float(x),
		C.float(y),
	)
	return p
}

// LineTo adds a line from the current point to (x, y)
func (p *Path) LineTo(x, y float32) *Path {
	C.fz_lineto(
		C.fz_context(p.ctx.Handle()),
		p.handle,
		C.float(x),
		C.float(y),
	)
	return p
}

// CurveTo adds a cubic Bezier curve
func (p *Path) CurveTo(x1, y1, x2, y2, x3, y3 float32) *Path {
	C.fz_curveto(
		C.fz_context(p.ctx.Handle()),
		p.handle,
		C.float(x1),
		C.float(y1),
		C.float(x2),
		C.float(y2),
		C.float(x3),
		C.float(y3),
	)
	return p
}

// ClosePath closes the current subpath
func (p *Path) ClosePath() *Path {
	C.fz_closepath(C.fz_context(p.ctx.Handle()), p.handle)
	return p
}

// RectTo adds a rectangle to the path
func (p *Path) RectTo(x, y, w, h float32) *Path {
	C.fz_rectto(
		C.fz_context(p.ctx.Handle()),
		p.handle,
		C.float(x),
		C.float(y),
		C.float(w),
		C.float(h),
	)
	return p
}

// Bounds returns the bounding box of the path
func (p *Path) Bounds(transform Matrix) Rect {
	cTransform := C.fz_matrix{
		a: C.float(transform.A),
		b: C.float(transform.B),
		c: C.float(transform.C),
		d: C.float(transform.D),
		e: C.float(transform.E),
		f: C.float(transform.F),
	}

	cRect := C.fz_bound_path(
		C.fz_context(p.ctx.Handle()),
		p.handle,
		nil, // No stroke for now
		cTransform,
	)

	return Rect{
		X0: float32(cRect.x0),
		Y0: float32(cRect.y0),
		X1: float32(cRect.x1),
		Y1: float32(cRect.y1),
	}
}
