//go:build cgo && !mock
// +build cgo,!mock

package nanopdf

// #include "include/nanopdf_ffi.h"
import "C"

// Cookie represents progress tracking for long-running operations
type Cookie struct {
	handle C.fz_cookie
	ctx    *Context
}

// NewCookie creates a new progress tracking cookie
func NewCookie(ctx *Context) *Cookie {
	handle := C.fz_new_cookie(C.fz_context(ctx.Handle()))
	return &Cookie{
		handle: handle,
		ctx:    ctx,
	}
}

// Drop releases the cookie resources
func (c *Cookie) Drop() {
	if c.handle != 0 {
		C.fz_drop_cookie(C.fz_context(c.ctx.Handle()), c.handle)
		c.handle = 0
	}
}

// Abort requests the operation to abort
func (c *Cookie) Abort() {
	C.fz_abort_cookie(C.fz_context(c.ctx.Handle()), c.handle)
}

// Progress returns the current progress (0-100)
func (c *Cookie) Progress() int {
	return int(C.fz_cookie_progress(C.fz_context(c.ctx.Handle()), c.handle))
}

// IsAborted returns true if the operation was aborted
func (c *Cookie) IsAborted() bool {
	return C.fz_cookie_is_aborted(C.fz_context(c.ctx.Handle()), c.handle) != 0
}

// Reset resets the cookie to its initial state
func (c *Cookie) Reset() {
	C.fz_reset_cookie(C.fz_context(c.ctx.Handle()), c.handle)
}
