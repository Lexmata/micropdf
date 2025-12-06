// Package nanopdf - Document operations
package nanopdf

import (
	"sync"
)

// Document represents a PDF or other document.
type Document struct {
	ctx     *Context
	ptr     uintptr
	mu      sync.Mutex
	dropped bool
}

// OpenDocument opens a document from a file path.
func OpenDocument(ctx *Context, path string) (*Document, error) {
	if ctx == nil || !ctx.IsValid() {
		return nil, ErrInvalidContext
	}

	ptr := documentOpenFromPath(ctx.Handle(), path)
	if ptr == 0 {
		return nil, ErrFailedToOpen
	}

	return &Document{
		ctx: ctx,
		ptr: ptr,
	}, nil
}

// OpenDocumentFromBytes opens a document from a byte slice.
func OpenDocumentFromBytes(ctx *Context, data []byte, magic string) (*Document, error) {
	if ctx == nil || !ctx.IsValid() {
		return nil, ErrInvalidContext
	}

	if len(data) == 0 {
		return nil, ErrInvalidArgument
	}

	ptr := documentOpenFromBuffer(ctx.Handle(), data, magic)
	if ptr == 0 {
		return nil, ErrFailedToOpen
	}

	return &Document{
		ctx: ctx,
		ptr: ptr,
	}, nil
}

// Drop frees the document and all associated resources.
func (d *Document) Drop() {
	d.mu.Lock()
	defer d.mu.Unlock()

	if !d.dropped && d.ptr != 0 && d.ctx != nil {
		documentDrop(d.ctx.Handle(), d.ptr)
		d.dropped = true
		d.ptr = 0
	}
}

// PageCount returns the number of pages in the document.
func (d *Document) PageCount() (int, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return 0, ErrInvalidHandle
	}

	return documentCountPages(d.ctx.Handle(), d.ptr), nil
}

// NeedsPassword returns true if the document is encrypted and requires a password.
func (d *Document) NeedsPassword() (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return false, ErrInvalidHandle
	}

	return documentNeedsPassword(d.ctx.Handle(), d.ptr), nil
}

// Authenticate attempts to authenticate the document with the given password.
// Returns true if authentication was successful.
func (d *Document) Authenticate(password string) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return false, ErrInvalidHandle
	}

	return documentAuthenticate(d.ctx.Handle(), d.ptr, password), nil
}

// HasPermission checks if the document has a specific permission.
func (d *Document) HasPermission(permission int) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return false, ErrInvalidHandle
	}

	return documentHasPermission(d.ctx.Handle(), d.ptr, permission), nil
}

// GetMetadata retrieves metadata value for the given key.
// Common keys: "Title", "Author", "Subject", "Keywords", "Creator", "Producer"
func (d *Document) GetMetadata(key string) (string, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return "", ErrInvalidHandle
	}

	return documentGetMetadata(d.ctx.Handle(), d.ptr, key), nil
}

// Save saves the document to a file.
func (d *Document) Save(path string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return ErrInvalidHandle
	}

	documentSave(d.ctx.Handle(), d.ptr, path)
	return nil
}

// ResolveLink resolves a named destination to a page number.
// Returns -1 if the named destination is not found.
func (d *Document) ResolveLink(name string) (int, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return -1, ErrInvalidHandle
	}

	page := documentResolveLink(d.ctx.Handle(), d.ptr, name)
	if page < 0 {
		return -1, nil
	}
	return page, nil
}

// LoadPage loads a specific page from the document.
func (d *Document) LoadPage(pageNum int) (*Page, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.dropped || d.ptr == 0 {
		return nil, ErrInvalidHandle
	}

	pagePtr := pageLoad(d.ctx.Handle(), d.ptr, pageNum)
	if pagePtr == 0 {
		return nil, ErrFailedToLoad
	}

	return &Page{
		ctx:     d.ctx,
		ptr:     pagePtr,
		pageNum: pageNum,
	}, nil
}

// IsValid returns true if the document is still valid (not dropped).
func (d *Document) IsValid() bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	return !d.dropped && d.ptr != 0
}
