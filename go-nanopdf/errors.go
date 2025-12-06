// Package nanopdf provides error types matching the Rust nanopdf library.
package nanopdf

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

// NanoPDFError represents an error from the nanopdf library.
type NanoPDFError struct {
	Code    ErrorCode
	Message string
	Cause   error
}

// Error implements the error interface.
func (e *NanoPDFError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying cause of the error.
func (e *NanoPDFError) Unwrap() error {
	return e.Cause
}

// Is checks if target error matches this error's code.
func (e *NanoPDFError) Is(target error) bool {
	var t *NanoPDFError
	if errors.As(target, &t) {
		return e.Code == t.Code
	}
	return false
}

// NewError creates a new NanoPDFError.
func NewError(code ErrorCode, message string) *NanoPDFError {
	return &NanoPDFError{Code: code, Message: message}
}

// WrapError wraps an existing error with a NanoPDFError.
func WrapError(code ErrorCode, message string, cause error) *NanoPDFError {
	return &NanoPDFError{Code: code, Message: message, Cause: cause}
}

// ErrGeneric creates a generic error.
func ErrGeneric(message string) *NanoPDFError {
	return NewError(ErrCodeGeneric, message)
}

// ErrSystem creates a system error.
func ErrSystem(message string, cause error) *NanoPDFError {
	return WrapError(ErrCodeSystem, message, cause)
}

// ErrFormat creates a format error.
func ErrFormat(message string) *NanoPDFError {
	return NewError(ErrCodeFormat, message)
}

// ErrEOF creates an EOF error.
func ErrEOF() *NanoPDFError {
	return NewError(ErrCodeEOF, "unexpected end of file")
}

// ErrArgument creates an argument error.
func ErrArgument(message string) *NanoPDFError {
	return NewError(ErrCodeArgument, message)
}

// ErrLimit creates a limit exceeded error.
func ErrLimit(message string) *NanoPDFError {
	return NewError(ErrCodeLimit, message)
}

// ErrUnsupported creates an unsupported feature error.
func ErrUnsupported(message string) *NanoPDFError {
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
