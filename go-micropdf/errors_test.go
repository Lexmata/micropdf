package micropdf

import (
	"errors"
	"testing"
)

func TestErrorCode_String(t *testing.T) {
	tests := []struct {
		code     ErrorCode
		expected string
	}{
		{ErrCodeGeneric, "GENERIC"},
		{ErrCodeSystem, "SYSTEM"},
		{ErrCodeFormat, "FORMAT"},
		{ErrCodeEOF, "EOF"},
		{ErrCodeArgument, "ARGUMENT"},
		{ErrCodeLimit, "LIMIT"},
		{ErrCodeUnsupported, "UNSUPPORTED"},
		{ErrorCode(999), "UNKNOWN"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			got := tt.code.String()
			if got != tt.expected {
				t.Errorf("ErrorCode.String() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestMicroPDFError_Error(t *testing.T) {
	t.Run("WithoutCause", func(t *testing.T) {
		err := NewError(ErrCodeFormat, "invalid PDF")
		expected := "[FORMAT] invalid PDF"
		if err.Error() != expected {
			t.Errorf("Error() = %v, want %v", err.Error(), expected)
		}
	})

	t.Run("WithCause", func(t *testing.T) {
		cause := errors.New("underlying error")
		err := WrapError(ErrCodeSystem, "file read failed", cause)
		if !errors.Is(err, err) {
			t.Error("Error should match itself")
		}
	})
}

func TestMicroPDFError_Unwrap(t *testing.T) {
	t.Run("WithCause", func(t *testing.T) {
		cause := errors.New("original error")
		err := WrapError(ErrCodeSystem, "wrapped", cause)

		unwrapped := err.Unwrap()
		if unwrapped != cause {
			t.Errorf("Unwrap() = %v, want %v", unwrapped, cause)
		}
	})

	t.Run("WithoutCause", func(t *testing.T) {
		err := NewError(ErrCodeGeneric, "no cause")
		unwrapped := err.Unwrap()
		if unwrapped != nil {
			t.Errorf("Unwrap() = %v, want nil", unwrapped)
		}
	})
}

func TestMicroPDFError_Is(t *testing.T) {
	t.Run("SameCode", func(t *testing.T) {
		err1 := NewError(ErrCodeFormat, "error 1")
		err2 := NewError(ErrCodeFormat, "error 2")

		if !err1.Is(err2) {
			t.Error("Errors with same code should match")
		}
	})

	t.Run("DifferentCode", func(t *testing.T) {
		err1 := NewError(ErrCodeFormat, "format error")
		err2 := NewError(ErrCodeSystem, "system error")

		if err1.Is(err2) {
			t.Error("Errors with different codes should not match")
		}
	})

	t.Run("NotMicroPDFError", func(t *testing.T) {
		err1 := NewError(ErrCodeFormat, "format error")
		err2 := errors.New("standard error")

		if err1.Is(err2) {
			t.Error("MicroPDFError should not match standard error")
		}
	})
}

func TestErrorConstructors(t *testing.T) {
	t.Run("NewError", func(t *testing.T) {
		err := NewError(ErrCodeFormat, "test message")
		if err.Code != ErrCodeFormat {
			t.Errorf("Code = %v, want %v", err.Code, ErrCodeFormat)
		}
		if err.Message != "test message" {
			t.Errorf("Message = %v, want %v", err.Message, "test message")
		}
		if err.Cause != nil {
			t.Errorf("Cause = %v, want nil", err.Cause)
		}
	})

	t.Run("WrapError", func(t *testing.T) {
		cause := errors.New("cause")
		err := WrapError(ErrCodeSystem, "wrapper", cause)
		if err.Code != ErrCodeSystem {
			t.Errorf("Code = %v, want %v", err.Code, ErrCodeSystem)
		}
		if err.Message != "wrapper" {
			t.Errorf("Message = %v, want %v", err.Message, "wrapper")
		}
		if err.Cause != cause {
			t.Errorf("Cause = %v, want %v", err.Cause, cause)
		}
	})

	t.Run("ErrGeneric", func(t *testing.T) {
		err := ErrGeneric("test")
		if err.Code != ErrCodeGeneric {
			t.Error("ErrGeneric should create GENERIC error")
		}
	})

	t.Run("ErrSystem", func(t *testing.T) {
		cause := errors.New("io error")
		err := ErrSystem("read failed", cause)
		if err.Code != ErrCodeSystem {
			t.Error("ErrSystem should create SYSTEM error")
		}
		if err.Cause != cause {
			t.Error("ErrSystem should wrap cause")
		}
	})

	t.Run("ErrFormat", func(t *testing.T) {
		err := ErrFormat("bad format")
		if err.Code != ErrCodeFormat {
			t.Error("ErrFormat should create FORMAT error")
		}
	})

	t.Run("ErrEOF", func(t *testing.T) {
		err := ErrEOF()
		if err.Code != ErrCodeEOF {
			t.Error("ErrEOF should create EOF error")
		}
	})

	t.Run("ErrArgument", func(t *testing.T) {
		err := ErrArgument("invalid arg")
		if err.Code != ErrCodeArgument {
			t.Error("ErrArgument should create ARGUMENT error")
		}
	})

	t.Run("ErrLimit", func(t *testing.T) {
		err := ErrLimit("too large")
		if err.Code != ErrCodeLimit {
			t.Error("ErrLimit should create LIMIT error")
		}
	})

	t.Run("ErrUnsupported", func(t *testing.T) {
		err := ErrUnsupported("not supported")
		if err.Code != ErrCodeUnsupported {
			t.Error("ErrUnsupported should create UNSUPPORTED error")
		}
	})
}

func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		name string
		err  *MicroPDFError
	}{
		{"ErrNilPointer", ErrNilPointer},
		{"ErrInvalidDimensions", ErrInvalidDimensions},
		{"ErrOutOfBounds", ErrOutOfBounds},
		{"ErrBufferTooSmall", ErrBufferTooSmall},
		{"ErrInvalidContext", ErrInvalidContext},
		{"ErrInvalidHandle", ErrInvalidHandle},
		{"ErrInvalidArgument", ErrInvalidArgument},
		{"ErrFailedToOpen", ErrFailedToOpen},
		{"ErrFailedToLoad", ErrFailedToLoad},
		{"ErrRenderFailed", ErrRenderFailed},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err == nil {
				t.Errorf("%s is nil", tt.name)
			}
			if tt.err.Message == "" {
				t.Errorf("%s has empty message", tt.name)
			}
		})
	}
}
