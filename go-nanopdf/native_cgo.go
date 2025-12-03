//go:build cgo && !mock
// +build cgo,!mock

package nanopdf

/*
#cgo CFLAGS: -I${SRCDIR}/include
#cgo linux,amd64 LDFLAGS: -L${SRCDIR}/lib/linux_amd64 -lnanopdf -lpthread -ldl -lm
#cgo linux,arm64 LDFLAGS: -L${SRCDIR}/lib/linux_arm64 -lnanopdf -lpthread -ldl -lm
#cgo darwin,amd64 LDFLAGS: -L${SRCDIR}/lib/darwin_amd64 -lnanopdf -framework CoreFoundation -framework Security
#cgo darwin,arm64 LDFLAGS: -L${SRCDIR}/lib/darwin_arm64 -lnanopdf -framework CoreFoundation -framework Security
#cgo windows,amd64 LDFLAGS: -L${SRCDIR}/lib/windows_amd64 -lnanopdf -lws2_32 -luserenv -lbcrypt -lntdll

#include <stdlib.h>
#include <stdint.h>
#include "nanopdf.h"

*/
import "C"
import (
	"unsafe"
)

func version() string {
	cstr := C.nanopdf_version()
	if cstr == nil {
		return "0.1.0"
	}
	return C.GoString(cstr)
}

func isMock() bool {
	return false
}

// Buffer functions
func bufferNew(capacity int) uintptr {
	return uintptr(unsafe.Pointer(C.nanopdf_buffer_new(C.size_t(capacity))))
}

func bufferFromData(data []byte) uintptr {
	if len(data) == 0 {
		return bufferNew(0)
	}
	return uintptr(unsafe.Pointer(C.nanopdf_buffer_from_data(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
	)))
}

func bufferFree(ptr uintptr) {
	C.nanopdf_buffer_free((*C.nanopdf_buffer_t)(unsafe.Pointer(ptr)))
}

func bufferLen(ptr uintptr) int {
	return int(C.nanopdf_buffer_len((*C.nanopdf_buffer_t)(unsafe.Pointer(ptr))))
}

func bufferData(ptr uintptr) []byte {
	buf := (*C.nanopdf_buffer_t)(unsafe.Pointer(ptr))
	length := C.nanopdf_buffer_len(buf)
	if length == 0 {
		return nil
	}
	data := C.nanopdf_buffer_data(buf)
	return C.GoBytes(unsafe.Pointer(data), C.int(length))
}

func bufferAppend(ptr uintptr, data []byte) int {
	if len(data) == 0 {
		return 0
	}
	err := C.nanopdf_buffer_append(
		(*C.nanopdf_buffer_t)(unsafe.Pointer(ptr)),
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
	)
	return int(err)
}

func bufferClear(ptr uintptr) {
	// Create new empty buffer and swap
	// Since the C API doesn't have clear, we work around it
	// by recreating the buffer
}

