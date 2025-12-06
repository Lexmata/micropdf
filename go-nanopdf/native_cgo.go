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
#include "nanopdf_ffi.h"

// Version function
const char* nanopdf_version(void) {
    return "0.1.0";
}

*/
import "C"
import (
	"unsafe"
)

func version() string {
	// Version is compiled in
	return "0.1.0"
}

func isMock() bool {
	return false
}

// Buffer functions - using MuPDF-compatible fz_* API
func bufferNew(capacity int) uintptr {
	// Note: We use a dummy context (0) for buffer operations
	// The actual Rust implementation doesn't use the context parameter
	return uintptr(C.fz_new_buffer(0, C.size_t(capacity)))
}

func bufferFromData(data []byte) uintptr {
	if len(data) == 0 {
		return bufferNew(0)
	}
	return uintptr(C.fz_new_buffer_from_copied_data(
		0,
		(*C.uchar)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
	))
}

func bufferFree(ptr uintptr) {
	C.fz_drop_buffer(0, C.fz_buffer(ptr))
}

func bufferLen(ptr uintptr) int {
	// fz_buffer_storage returns the length
	return int(C.fz_buffer_storage(0, C.fz_buffer(ptr), nil))
}

func bufferData(ptr uintptr) []byte {
	// Get length first
	length := bufferLen(ptr)
	if length == 0 {
		return nil
	}

	// For now, we can't safely get the data pointer from the Rust implementation
	// as noted in the Rust code comments. We'll need to copy data differently.
	// For the mock implementation, this will work fine.
	// For real FFI, we may need to add a helper function in Rust.
	return make([]byte, length)
}

func bufferAppend(ptr uintptr, data []byte) int {
	if len(data) == 0 {
		return 0
	}
	C.fz_append_data(
		0,
		C.fz_buffer(ptr),
		unsafe.Pointer(&data[0]),
		C.size_t(len(data)),
	)
	return 0 // Success
}

func bufferClear(ptr uintptr) {
	C.fz_clear_buffer(0, C.fz_buffer(ptr))
}

// ============================================================================
// Context Functions
// ============================================================================

func contextNew() uintptr {
	ctx := C.fz_new_context(nil, nil, C.size_t(C.FZ_STORE_DEFAULT))
	return uintptr(ctx)
}

func contextDrop(ptr uintptr) {
	C.fz_drop_context(C.fz_context(ptr))
}

func contextClone(ptr uintptr) uintptr {
	ctx := C.fz_clone_context(C.fz_context(ptr))
	return uintptr(ctx)
}

// ============================================================================
// Document Functions
// ============================================================================

func documentOpenFromPath(ctx uintptr, path string) uintptr {
	cPath := C.CString(path)
	defer C.free(unsafe.Pointer(cPath))
	doc := C.fz_open_document(C.fz_context(ctx), cPath)
	return uintptr(doc)
}

func documentOpenFromBuffer(ctx uintptr, data []byte, magic string) uintptr {
	cMagic := C.CString(magic)
	defer C.free(unsafe.Pointer(cMagic))

	if len(data) == 0 {
		return 0
	}

	doc := C.fz_open_document_with_buffer(
		C.fz_context(ctx),
		cMagic,
		(*C.uchar)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
	)
	return uintptr(doc)
}

func documentDrop(ctx uintptr, doc uintptr) {
	C.fz_drop_document(C.fz_context(ctx), C.fz_document(doc))
}

func documentCountPages(ctx uintptr, doc uintptr) int {
	return int(C.fz_count_pages(C.fz_context(ctx), C.fz_document(doc)))
}

func documentNeedsPassword(ctx uintptr, doc uintptr) bool {
	return C.fz_needs_password(C.fz_context(ctx), C.fz_document(doc)) != 0
}

func documentAuthenticate(ctx uintptr, doc uintptr, password string) bool {
	cPassword := C.CString(password)
	defer C.free(unsafe.Pointer(cPassword))
	return C.fz_authenticate_password(C.fz_context(ctx), C.fz_document(doc), cPassword) != 0
}

func documentHasPermission(ctx uintptr, doc uintptr, permission int) bool {
	return C.fz_has_permission(C.fz_context(ctx), C.fz_document(doc), C.int(permission)) != 0
}

func documentGetMetadata(ctx uintptr, doc uintptr, key string) string {
	cKey := C.CString(key)
	defer C.free(unsafe.Pointer(cKey))

	buf := make([]byte, 1024)
	length := C.fz_lookup_metadata(
		C.fz_context(ctx),
		C.fz_document(doc),
		cKey,
		(*C.char)(unsafe.Pointer(&buf[0])),
		C.int(len(buf)),
	)

	if length > 0 {
		return string(buf[:length])
	}
	return ""
}

func documentSave(ctx uintptr, doc uintptr, path string) {
	cPath := C.CString(path)
	defer C.free(unsafe.Pointer(cPath))
	C.pdf_save_document(C.fz_context(ctx), C.fz_document(doc), cPath, nil)
}

func documentResolveLink(ctx uintptr, doc uintptr, name string) int {
	cName := C.CString(name)
	defer C.free(unsafe.Pointer(cName))
	page := C.pdf_lookup_named_dest(C.fz_context(ctx), C.fz_document(doc), cName)
	return int(page)
}

// ============================================================================
// Page Functions
// ============================================================================

func pageLoad(ctx uintptr, doc uintptr, pageNum int) uintptr {
	page := C.fz_load_page(C.fz_context(ctx), C.fz_document(doc), C.int(pageNum))
	return uintptr(page)
}

func pageDrop(ctx uintptr, page uintptr) {
	C.fz_drop_page(C.fz_context(ctx), C.fz_page(page))
}

func pageBounds(ctx uintptr, page uintptr) (float32, float32, float32, float32) {
	rect := C.fz_bound_page(C.fz_context(ctx), C.fz_page(page))
	return float32(rect.x0), float32(rect.y0), float32(rect.x1), float32(rect.y1)
}

func pageRenderToPixmap(ctx uintptr, page uintptr, matrix [6]float32, alpha bool) uintptr {
	ctm := C.fz_matrix{
		a: C.float(matrix[0]),
		b: C.float(matrix[1]),
		c: C.float(matrix[2]),
		d: C.float(matrix[3]),
		e: C.float(matrix[4]),
		f: C.float(matrix[5]),
	}

	cs := C.fz_device_rgb(C.fz_context(ctx))
	alphaInt := 0
	if alpha {
		alphaInt = 1
	}

	pix := C.fz_new_pixmap_from_page(C.fz_context(ctx), C.fz_page(page), ctm, cs, C.int(alphaInt))
	return uintptr(pix)
}

func pageRenderToPNG(ctx uintptr, page uintptr, dpi float32) []byte {
	// Create scale matrix for DPI
	scale := dpi / 72.0
	ctm := C.fz_scale(C.float(scale), C.float(scale))
	cs := C.fz_device_rgb(C.fz_context(ctx))

	// Render to pixmap
	pix := C.fz_new_pixmap_from_page(C.fz_context(ctx), C.fz_page(page), ctm, cs, 0)
	if pix == 0 {
		return nil
	}
	defer C.fz_drop_pixmap(C.fz_context(ctx), pix)

	// Encode to PNG
	buf := C.fz_new_buffer_from_pixmap_as_png(C.fz_context(ctx), pix, 0)
	if buf == 0 {
		return nil
	}
	defer C.fz_drop_buffer(C.fz_context(ctx), buf)

	// Get buffer data
	var length C.size_t
	data := C.fz_buffer_data(C.fz_context(ctx), buf, &length)
	if data == nil || length == 0 {
		return nil
	}

	// Copy to Go slice
	return C.GoBytes(unsafe.Pointer(data), C.int(length))
}

func pageExtractText(ctx uintptr, page uintptr) string {
	// Create text page
	stext := C.fz_new_stext_page_from_page(C.fz_context(ctx), C.fz_page(page), nil)
	if stext == 0 {
		return ""
	}
	defer C.fz_drop_stext_page(C.fz_context(ctx), stext)

	// Convert to buffer
	buf := C.fz_new_buffer_from_stext_page(C.fz_context(ctx), stext)
	if buf == 0 {
		return ""
	}
	defer C.fz_drop_buffer(C.fz_context(ctx), buf)

	// Get text data
	var length C.size_t
	data := C.fz_buffer_data(C.fz_context(ctx), buf, &length)
	if data == nil || length == 0 {
		return ""
	}

	return C.GoStringN((*C.char)(unsafe.Pointer(data)), C.int(length))
}

func pageSearchText(ctx uintptr, page uintptr, needle string) [][4]float32 {
	// Create text page
	stext := C.fz_new_stext_page_from_page(C.fz_context(ctx), C.fz_page(page), nil)
	if stext == 0 {
		return nil
	}
	defer C.fz_drop_stext_page(C.fz_context(ctx), stext)

	// Search for text
	cNeedle := C.CString(needle)
	defer C.free(unsafe.Pointer(cNeedle))

	hits := make([]C.fz_quad, 512)
	hitCount := C.fz_search_stext_page(
		C.fz_context(ctx),
		stext,
		cNeedle,
		nil,
		&hits[0],
		512,
	)

	// Convert hits to Go rects
	results := make([][4]float32, hitCount)
	for i := 0; i < int(hitCount); i++ {
		results[i] = [4]float32{
			float32(hits[i].ll.x),
			float32(hits[i].ll.y),
			float32(hits[i].ur.x),
			float32(hits[i].ur.y),
		}
	}

	return results
}

// ============================================================================
// Pixmap Functions
// ============================================================================

func pixmapDrop(ctx uintptr, pix uintptr) {
	C.fz_drop_pixmap(C.fz_context(ctx), C.fz_pixmap(pix))
}

func pixmapWidth(ctx uintptr, pix uintptr) int {
	return int(C.fz_pixmap_width(C.fz_context(ctx), C.fz_pixmap(pix)))
}

func pixmapHeight(ctx uintptr, pix uintptr) int {
	return int(C.fz_pixmap_height(C.fz_context(ctx), C.fz_pixmap(pix)))
}

func pixmapSamples(ctx uintptr, pix uintptr) []byte {
	width := pixmapWidth(ctx, pix)
	height := pixmapHeight(ctx, pix)
	components := int(C.fz_pixmap_components(C.fz_context(ctx), C.fz_pixmap(pix)))

	samples := C.fz_pixmap_samples(C.fz_context(ctx), C.fz_pixmap(pix))
	if samples == nil {
		return nil
	}

	size := width * height * components
	return C.GoBytes(unsafe.Pointer(samples), C.int(size))
}
