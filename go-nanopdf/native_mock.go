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

