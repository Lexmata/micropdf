// Package micropdf - Context management
package micropdf

import (
	"sync"
)

// Context manages memory allocation and error handling for PDF operations.
// It must be created before any other PDF operations and should be dropped when done.
type Context struct {
	ptr     uintptr
	mu      sync.Mutex
	dropped bool
}

// NewContext creates a new rendering context with default settings.
// The context must be explicitly closed by calling Drop() when done.
func NewContext() *Context {
	ptr := contextNew()
	if ptr == 0 {
		return nil
	}
	return &Context{ptr: ptr}
}

// Drop frees the context and all associated resources.
// After calling Drop(), the context must not be used.
func (c *Context) Drop() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.dropped && c.ptr != 0 {
		contextDrop(c.ptr)
		c.dropped = true
		c.ptr = 0
	}
}

// Clone creates a new reference to the context.
// The cloned context shares the same underlying resources.
func (c *Context) Clone() *Context {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.dropped || c.ptr == 0 {
		return nil
	}

	ptr := contextClone(c.ptr)
	if ptr == 0 {
		return nil
	}

	return &Context{ptr: ptr}
}

// IsValid returns true if the context is still valid (not dropped).
func (c *Context) IsValid() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return !c.dropped && c.ptr != 0
}

// Handle returns the underlying context handle.
// This is used internally by other MicroPDF types.
func (c *Context) Handle() uintptr {
	return c.ptr
}
