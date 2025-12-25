"""Error types for NanoPDF."""

from enum import IntEnum
from typing import Optional


class ErrorCode(IntEnum):
    """Error codes for NanoPDF operations."""

    GENERIC = 0
    SYSTEM = 1
    FORMAT = 2
    EOF = 3
    ARGUMENT = 4
    LIMIT = 5
    UNSUPPORTED = 6


class NanoPDFError(Exception):
    """Base exception for all NanoPDF errors.

    Args:
        code: Error code indicating the type of error
        message: Human-readable error message
        cause: Optional underlying exception

    Attributes:
        code (ErrorCode): The error code
        message (str): Error message
        cause (Optional[Exception]): Underlying exception if any
    """

    def __init__(
        self, code: ErrorCode, message: str, cause: Optional[Exception] = None
    ) -> None:
        self.code = code
        self.message = message
        self.cause = cause
        super().__init__(self._format_message())

    def _format_message(self) -> str:
        """Format the error message."""
        msg = f"[{self.code.name}] {self.message}"
        if self.cause:
            msg += f": {self.cause}"
        return msg

    def __repr__(self) -> str:
        return f"NanoPDFError(code={self.code!r}, message={self.message!r})"


def generic_error(message: str) -> NanoPDFError:
    """Create a generic error."""
    return NanoPDFError(ErrorCode.GENERIC, message)


def system_error(message: str, cause: Optional[Exception] = None) -> NanoPDFError:
    """Create a system error (I/O, memory, etc.)."""
    return NanoPDFError(ErrorCode.SYSTEM, message, cause)


def format_error(message: str) -> NanoPDFError:
    """Create a format/parsing error."""
    return NanoPDFError(ErrorCode.FORMAT, message)


def eof_error(message: str = "Unexpected end of file") -> NanoPDFError:
    """Create an EOF error."""
    return NanoPDFError(ErrorCode.EOF, message)


def argument_error(message: str) -> NanoPDFError:
    """Create an invalid argument error."""
    return NanoPDFError(ErrorCode.ARGUMENT, message)


def limit_error(message: str) -> NanoPDFError:
    """Create a limit exceeded error."""
    return NanoPDFError(ErrorCode.LIMIT, message)


def unsupported_error(message: str) -> NanoPDFError:
    """Create an unsupported feature error."""
    return NanoPDFError(ErrorCode.UNSUPPORTED, message)


__all__ = [
    "ErrorCode",
    "NanoPDFError",
    "generic_error",
    "system_error",
    "format_error",
    "eof_error",
    "argument_error",
    "limit_error",
    "unsupported_error",
]

