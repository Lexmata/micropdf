//go:build !cgo || mock
// +build !cgo mock

package nanopdf

import (
	"sync"
)

// Mock implementation for when CGO is not available

func version() string {
	return "0.1.0-mock"
}

func isMock() bool {
	return true
}

// Mock buffer storage
var (
	mockBuffers   = make(map[uintptr]*mockBuffer)
	mockBuffersMu sync.RWMutex
	nextBufferID  uintptr = 1
)

type mockBuffer struct {
	data []byte
}

func bufferNew(capacity int) uintptr {
	mockBuffersMu.Lock()
	defer mockBuffersMu.Unlock()

	id := nextBufferID
	nextBufferID++

	mockBuffers[id] = &mockBuffer{
		data: make([]byte, 0, capacity),
	}
	return id
}

func bufferFromData(data []byte) uintptr {
	mockBuffersMu.Lock()
	defer mockBuffersMu.Unlock()

	id := nextBufferID
	nextBufferID++

	buf := &mockBuffer{
		data: make([]byte, len(data)),
	}
	copy(buf.data, data)
	mockBuffers[id] = buf
	return id
}

func bufferFree(ptr uintptr) {
	mockBuffersMu.Lock()
	defer mockBuffersMu.Unlock()
	delete(mockBuffers, ptr)
}

func bufferLen(ptr uintptr) int {
	mockBuffersMu.RLock()
	defer mockBuffersMu.RUnlock()

	buf, ok := mockBuffers[ptr]
	if !ok {
		return 0
	}
	return len(buf.data)
}

func bufferData(ptr uintptr) []byte {
	mockBuffersMu.RLock()
	defer mockBuffersMu.RUnlock()

	buf, ok := mockBuffers[ptr]
	if !ok {
		return nil
	}

	result := make([]byte, len(buf.data))
	copy(result, buf.data)
	return result
}

func bufferAppend(ptr uintptr, data []byte) int {
	mockBuffersMu.Lock()
	defer mockBuffersMu.Unlock()

	buf, ok := mockBuffers[ptr]
	if !ok {
		return 1 // Error
	}
	buf.data = append(buf.data, data...)
	return 0 // Success
}

func bufferClear(ptr uintptr) {
	mockBuffersMu.Lock()
	defer mockBuffersMu.Unlock()

	buf, ok := mockBuffers[ptr]
	if ok {
		buf.data = buf.data[:0]
	}
}

// Mock context/document/page storage
var (
	mockContexts  = make(map[uintptr]*mockContext)
	mockDocuments = make(map[uintptr]*mockDocument)
	mockPages     = make(map[uintptr]*mockPage)
	mockPixmaps   = make(map[uintptr]*mockPixmap)
	mockStorageMu sync.RWMutex
	nextContextID uintptr = 1000
	nextDocID     uintptr = 2000
	nextPageID    uintptr = 3000
	nextPixmapID  uintptr = 4000
)

type mockContext struct{}

type mockDocument struct {
	pages int
}

type mockPage struct {
	pageNum int
	bounds  [4]float32
}

type mockPixmap struct {
	width  int
	height int
	data   []byte
}

// Context functions
func contextNew() uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	id := nextContextID
	nextContextID++
	mockContexts[id] = &mockContext{}
	return id
}

func contextDrop(ptr uintptr) {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()
	delete(mockContexts, ptr)
}

func contextClone(ptr uintptr) uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	if _, ok := mockContexts[ptr]; !ok {
		return 0
	}

	id := nextContextID
	nextContextID++
	mockContexts[id] = &mockContext{}
	return id
}

// Document functions
func documentOpenFromPath(_ uintptr, _ string) uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	id := nextDocID
	nextDocID++
	mockDocuments[id] = &mockDocument{pages: 1}
	return id
}

func documentOpenFromBuffer(_ uintptr, _ []byte, _ string) uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	id := nextDocID
	nextDocID++
	mockDocuments[id] = &mockDocument{pages: 1}
	return id
}

func documentDrop(_ uintptr, doc uintptr) {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()
	delete(mockDocuments, doc)
}

func documentCountPages(_ uintptr, doc uintptr) int {
	mockStorageMu.RLock()
	defer mockStorageMu.RUnlock()

	if d, ok := mockDocuments[doc]; ok {
		return d.pages
	}
	return 0
}

func documentNeedsPassword(_ uintptr, _ uintptr) bool {
	return false
}

func documentAuthenticate(_ uintptr, _ uintptr, _ string) bool {
	return true
}

func documentHasPermission(_ uintptr, _ uintptr, _ int) bool {
	return true
}

func documentGetMetadata(_ uintptr, _ uintptr, _ string) string {
	return ""
}

func documentSave(_ uintptr, _ uintptr, _ string) {
	// No-op for mock
}

func documentResolveLink(_ uintptr, _ uintptr, _ string) int {
	return -1
}

// Page functions
func pageLoad(_ uintptr, _ uintptr, pageNum int) uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	id := nextPageID
	nextPageID++
	mockPages[id] = &mockPage{
		pageNum: pageNum,
		bounds:  [4]float32{0, 0, 612, 792},
	}
	return id
}

func pageDrop(_ uintptr, page uintptr) {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()
	delete(mockPages, page)
}

func pageBounds(_ uintptr, page uintptr) (float32, float32, float32, float32) {
	mockStorageMu.RLock()
	defer mockStorageMu.RUnlock()

	if p, ok := mockPages[page]; ok {
		return p.bounds[0], p.bounds[1], p.bounds[2], p.bounds[3]
	}
	return 0, 0, 0, 0
}

func pageRenderToPixmap(_ uintptr, _ uintptr, matrix [6]float32, _ bool) uintptr {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()

	// Calculate size based on matrix scale
	width := int(612 * matrix[0])
	height := int(792 * matrix[3])

	id := nextPixmapID
	nextPixmapID++
	mockPixmaps[id] = &mockPixmap{
		width:  width,
		height: height,
		data:   make([]byte, width*height*3),
	}
	return id
}

func pageRenderToPNG(_ uintptr, _ uintptr, dpi float32) []byte {
	// Return a minimal PNG header
	scale := dpi / 72.0
	width := int(612 * scale)
	height := int(792 * scale)

	// Minimal PNG: signature + IHDR + IEND
	png := []byte{
		137, 80, 78, 71, 13, 10, 26, 10, // PNG signature
		0, 0, 0, 13, // IHDR length
		73, 72, 68, 82, // IHDR
		byte(width >> 24), byte(width >> 16), byte(width >> 8), byte(width),
		byte(height >> 24), byte(height >> 16), byte(height >> 8), byte(height),
		8, 2, 0, 0, 0, // bit depth, color type, etc
		0, 0, 0, 0, // CRC placeholder
		0, 0, 0, 0, // IEND length
		73, 69, 78, 68, // IEND
		174, 66, 96, 130, // IEND CRC
	}
	return png
}

func pageExtractText(_ uintptr, _ uintptr) string {
	return "Hello World"
}

func pageSearchText(_ uintptr, _ uintptr, needle string) [][4]float32 {
	if needle == "Hello" {
		return [][4]float32{{100, 700, 150, 712}}
	}
	return nil
}

// Pixmap functions
func pixmapDrop(_ uintptr, pix uintptr) {
	mockStorageMu.Lock()
	defer mockStorageMu.Unlock()
	delete(mockPixmaps, pix)
}

func pixmapWidth(_ uintptr, pix uintptr) int {
	mockStorageMu.RLock()
	defer mockStorageMu.RUnlock()

	if p, ok := mockPixmaps[pix]; ok {
		return p.width
	}
	return 0
}

func pixmapHeight(_ uintptr, pix uintptr) int {
	mockStorageMu.RLock()
	defer mockStorageMu.RUnlock()

	if p, ok := mockPixmaps[pix]; ok {
		return p.height
	}
	return 0
}

func pixmapSamples(_ uintptr, pix uintptr) []byte {
	mockStorageMu.RLock()
	defer mockStorageMu.RUnlock()

	if p, ok := mockPixmaps[pix]; ok {
		result := make([]byte, len(p.data))
		copy(result, p.data)
		return result
	}
	return nil
}
