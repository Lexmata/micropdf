// Package micropdf provides error types matching the Rust micropdf library.
package micropdf

import (
	"errors"
	"fmt"
)

// ErrorCode represents the type of error that occurred.
type ErrorCode int

const (
	// ErrCodeGeneric is a generic error.
	ErrCodeGeneric ErrorCode = iota
	// ErrCodeSystem is a system error (I/O, memory, etc.).
	ErrCodeSystem
	// ErrCodeFormat is a format/parsing error.
	ErrCodeFormat
	// ErrCodeEOF indicates unexpected end of file.
	ErrCodeEOF
	// ErrCodeArgument is an invalid argument error.
	ErrCodeArgument
	// ErrCodeLimit indicates a limit was exceeded.
	ErrCodeLimit
	// ErrCodeUnsupported indicates an unsupported feature.
	ErrCodeUnsupported
)

func (c ErrorCode) String() string {
	switch c {
	case ErrCodeGeneric:
		return "GENERIC"
	case ErrCodeSystem:
		return "SYSTEM"
	case ErrCodeFormat:
		return "FORMAT"
	case ErrCodeEOF:
		return "EOF"
	case ErrCodeArgument:
		return "ARGUMENT"
	case ErrCodeLimit:
		return "LIMIT"
	case ErrCodeUnsupported:
		return "UNSUPPORTED"
	default:
		return "UNKNOWN"
	}
}

// MicroPDFError represents an error from the micropdf library.
type MicroPDFError struct {
	Code    ErrorCode
	Message string
	Cause   error
}

// Error implements the error interface.
func (e *MicroPDFError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying cause of the error.
func (e *MicroPDFError) Unwrap() error {
	return e.Cause
}

// Is checks if target error matches this error's code.
func (e *MicroPDFError) Is(target error) bool {
	var t *MicroPDFError
	if errors.As(target, &t) {
		return e.Code == t.Code
	}
	return false
}

// NewError creates a new MicroPDFError.
func NewError(code ErrorCode, message string) *MicroPDFError {
	return &MicroPDFError{Code: code, Message: message}
}

// WrapError wraps an existing error with a MicroPDFError.
func WrapError(code ErrorCode, message string, cause error) *MicroPDFError {
	return &MicroPDFError{Code: code, Message: message, Cause: cause}
}

// ErrGeneric creates a generic error.
func ErrGeneric(message string) *MicroPDFError {
	return NewError(ErrCodeGeneric, message)
}

// ErrSystem creates a system error.
func ErrSystem(message string, cause error) *MicroPDFError {
	return WrapError(ErrCodeSystem, message, cause)
}

// ErrFormat creates a format error.
func ErrFormat(message string) *MicroPDFError {
	return NewError(ErrCodeFormat, message)
}

// ErrEOF creates an EOF error.
func ErrEOF() *MicroPDFError {
	return NewError(ErrCodeEOF, "unexpected end of file")
}

// ErrArgument creates an argument error.
func ErrArgument(message string) *MicroPDFError {
	return NewError(ErrCodeArgument, message)
}

// ErrLimit creates a limit exceeded error.
func ErrLimit(message string) *MicroPDFError {
	return NewError(ErrCodeLimit, message)
}

// ErrUnsupported creates an unsupported feature error.
func ErrUnsupported(message string) *MicroPDFError {
	return NewError(ErrCodeUnsupported, message)
}

// Predefined sentinel errors for common cases.
var (
	// ErrNilPointer indicates a nil pointer was passed.
	ErrNilPointer = ErrArgument("nil pointer")
	// ErrInvalidDimensions indicates invalid dimensions.
	ErrInvalidDimensions = ErrArgument("invalid dimensions")
	// ErrOutOfBounds indicates an out of bounds access.
	ErrOutOfBounds = ErrArgument("index out of bounds")
	// ErrBufferTooSmall indicates the buffer is too small.
	ErrBufferTooSmall = ErrArgument("buffer too small")
	// ErrInvalidContext indicates an invalid or dropped context.
	ErrInvalidContext = ErrArgument("invalid or dropped context")
	// ErrInvalidHandle indicates an invalid or dropped handle.
	ErrInvalidHandle = ErrArgument("invalid or dropped handle")
	// ErrInvalidArgument indicates an invalid argument.
	ErrInvalidArgument = ErrArgument("invalid argument")
	// ErrFailedToOpen indicates failure to open a document.
	ErrFailedToOpen = ErrGeneric("failed to open document")
	// ErrFailedToLoad indicates failure to load a resource.
	ErrFailedToLoad = ErrGeneric("failed to load resource")
	// ErrRenderFailed indicates a rendering operation failed.
	ErrRenderFailed = ErrGeneric("rendering failed")
)
