package micropdf

// #include "include/micropdf_ffi.h"
// #include <stdlib.h>
import "C"
import (
	"unsafe"
)

// Font represents a PDF font
type Font struct {
	handle C.fz_font
	ctx    *Context
}

// NewFont creates a new font with the given name
func NewFont(ctx *Context, name string, bold, italic bool) *Font {
	cName := C.CString(name)
	defer C.free(unsafe.Pointer(cName))

	isBold := C.int(0)
	if bold {
		isBold = 1
	}

	isItalic := C.int(0)
	if italic {
		isItalic = 1
	}

	handle := C.fz_new_font(C.fz_context(ctx.Handle()), cName, isBold, isItalic, 0)

	return &Font{
		handle: handle,
		ctx:    ctx,
	}
}

// NewFontFromFile loads a font from a file
func NewFontFromFile(ctx *Context, name, path string, index int) (*Font, error) {
	cName := C.CString(name)
	defer C.free(unsafe.Pointer(cName))

	cPath := C.CString(path)
	defer C.free(unsafe.Pointer(cPath))

	handle := C.fz_new_font_from_file(
		C.fz_context(ctx.Handle()),
		cName,
		cPath,
		C.int(index),
		0,
	)

	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to load font from file")
	}

	return &Font{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// NewFontFromMemory loads a font from memory
func NewFontFromMemory(ctx *Context, name string, data []byte, index int) (*Font, error) {
	if len(data) == 0 {
		return nil, NewError(ErrCodeArgument, "font data is empty")
	}

	cName := C.CString(name)
	defer C.free(unsafe.Pointer(cName))

	handle := C.fz_new_font_from_memory(
		C.fz_context(ctx.Handle()),
		cName,
		(*C.uchar)(unsafe.Pointer(&data[0])),
		C.int(len(data)),
		C.int(index),
		0,
	)

	if handle == 0 {
		return nil, NewError(ErrCodeSystem, "failed to load font from memory")
	}

	return &Font{
		handle: handle,
		ctx:    ctx,
	}, nil
}

// Drop releases the font resources
func (f *Font) Drop() {
	if f.handle != 0 {
		C.fz_drop_font(C.fz_context(f.ctx.Handle()), f.handle)
		f.handle = 0
	}
}

// Name returns the font name
func (f *Font) Name() string {
	buf := make([]byte, 256)
	C.fz_font_name(
		C.fz_context(f.ctx.Handle()),
		f.handle,
		(*C.char)(unsafe.Pointer(&buf[0])),
		C.int(len(buf)),
	)

	// Find null terminator
	for i, b := range buf {
		if b == 0 {
			return string(buf[:i])
		}
	}
	return string(buf)
}

// IsBold returns true if the font is bold
func (f *Font) IsBold() bool {
	return C.fz_font_is_bold(C.fz_context(f.ctx.Handle()), f.handle) != 0
}

// IsItalic returns true if the font is italic
func (f *Font) IsItalic() bool {
	return C.fz_font_is_italic(C.fz_context(f.ctx.Handle()), f.handle) != 0
}

// EncodeCharacter encodes a Unicode code point to a glyph ID
func (f *Font) EncodeCharacter(unicode rune) int {
	return int(C.fz_encode_character(
		C.fz_context(f.ctx.Handle()),
		f.handle,
		C.int(unicode),
	))
}

// AdvanceGlyph returns the advance width for a glyph
func (f *Font) AdvanceGlyph(glyphID int) float32 {
	return float32(C.fz_advance_glyph(
		C.fz_context(f.ctx.Handle()),
		f.handle,
		C.int(glyphID),
		0,
	))
}
