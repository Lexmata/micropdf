//go:build !cgo || mock
// +build !cgo mock

package micropdf

// Cookie represents progress tracking for long-running operations
type Cookie struct {
	handle uintptr
	ctx    *Context
}

// NewCookie creates a new progress tracking cookie
func NewCookie(ctx *Context) *Cookie {
	handle := newCookie(ctx.Handle())
	return &Cookie{
		handle: handle,
		ctx:    ctx,
	}
}

// Drop releases the cookie resources
func (c *Cookie) Drop() {
	if c.handle != 0 {
		dropCookie(c.ctx.Handle(), c.handle)
		c.handle = 0
	}
}

// Abort requests the operation to abort
func (c *Cookie) Abort() {
	abortCookie(c.ctx.Handle(), c.handle)
}

// Progress returns the current progress (0-100)
func (c *Cookie) Progress() int {
	return cookieProgress(c.ctx.Handle(), c.handle)
}

// IsAborted returns true if the operation was aborted
func (c *Cookie) IsAborted() bool {
	return cookieIsAborted(c.ctx.Handle(), c.handle) != 0
}

// Reset resets the cookie to its initial state
func (c *Cookie) Reset() {
	resetCookie(c.ctx.Handle(), c.handle)
}
