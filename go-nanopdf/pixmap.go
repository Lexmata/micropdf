// Package nanopdf - Pixmap operations
package nanopdf

import (
	"sync"
)

// Pixmap represents a raster image buffer.
type Pixmap struct {
	ctx     *Context
	ptr     uintptr
	mu      sync.Mutex
	dropped bool
}

// Drop frees the pixmap and all associated resources.
func (p *Pixmap) Drop() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if !p.dropped && p.ptr != 0 && p.ctx != nil {
		pixmapDrop(p.ctx.Handle(), p.ptr)
		p.dropped = true
		p.ptr = 0
	}
}

// Width returns the width of the pixmap in pixels.
func (p *Pixmap) Width() (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return 0, ErrInvalidHandle
	}

	return pixmapWidth(p.ctx.Handle(), p.ptr), nil
}

// Height returns the height of the pixmap in pixels.
func (p *Pixmap) Height() (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return 0, ErrInvalidHandle
	}

	return pixmapHeight(p.ctx.Handle(), p.ptr), nil
}

// Samples returns the raw pixel data.
// The format depends on the colorspace and alpha settings.
func (p *Pixmap) Samples() ([]byte, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.dropped || p.ptr == 0 {
		return nil, ErrInvalidHandle
	}

	return pixmapSamples(p.ctx.Handle(), p.ptr), nil
}

// IsValid returns true if the pixmap is still valid (not dropped).
func (p *Pixmap) IsValid() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return !p.dropped && p.ptr != 0
}
