// Package micropdf - Page operations
package micropdf

import (
	"sync"
)

// Page represents a single page in a document.
type Page struct {
	ctx     *Context
	ptr     uintptr
	pageNum int
	mu      sync.Mutex
	dropped bool
}

// Drop frees the page and all associated resources.
func (p *Page) Drop() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if !p.dropped && p.ptr != 0 && p.ctx != nil {
		pageDrop(p.ctx.Handle(), p.ptr)
		p.dropped = true
		p.ptr = 0
	}
}

// PageNumber returns the page number (0-based).
func (p *Page) PageNumber() int {
	return p.pageNum
}

// Bounds returns the page bounds as a Rect.
func (p *Page) Bounds() Rect {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return Rect{}
	}

	x0, y0, x1, y1 := pageBounds(p.ctx.Handle(), p.ptr)
	return Rect{X0: x0, Y0: y0, X1: x1, Y1: y1}
}

// RenderToPixmap renders the page to a pixmap with the given transformation matrix.
func (p *Page) RenderToPixmap(matrix Matrix, alpha bool) (*Pixmap, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return nil, ErrInvalidHandle
	}

	matArray := [6]float32{matrix.A, matrix.B, matrix.C, matrix.D, matrix.E, matrix.F}
	pixPtr := pageRenderToPixmap(p.ctx.Handle(), p.ptr, matArray, alpha)

	if pixPtr == 0 {
		return nil, ErrRenderFailed
	}

	return &Pixmap{
		ctx: p.ctx,
		ptr: pixPtr,
	}, nil
}

// RenderToPNG renders the page directly to a PNG byte slice.
func (p *Page) RenderToPNG(dpi float32) ([]byte, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return nil, ErrInvalidHandle
	}

	data := pageRenderToPNG(p.ctx.Handle(), p.ptr, dpi)
	if data == nil {
		return nil, ErrRenderFailed
	}

	return data, nil
}

// ExtractText extracts all text from the page as a single string.
func (p *Page) ExtractText() (string, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return "", ErrInvalidHandle
	}

	return pageExtractText(p.ctx.Handle(), p.ptr), nil
}

// SearchText searches for the given text on the page.
// Returns a slice of rectangles where the text was found.
func (p *Page) SearchText(needle string) ([]Rect, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return nil, ErrInvalidHandle
	}

	hits := pageSearchText(p.ctx.Handle(), p.ptr, needle)
	results := make([]Rect, len(hits))
	for i, hit := range hits {
		results[i] = Rect{
			X0: hit[0],
			Y0: hit[1],
			X1: hit[2],
			Y1: hit[3],
		}
	}

	return results, nil
}

// IsValid returns true if the page is still valid (not dropped).
func (p *Page) IsValid() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return !p.dropped && p.ptr != 0
}
