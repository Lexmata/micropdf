"""Context management for NanoPDF operations."""

from typing import Optional
from .ffi import ffi, lib, FZ_STORE_DEFAULT
from .errors import system_error


class Context:
    """Rendering context for PDF operations.

    The context manages memory allocation and error handling.
    It must be created before any other PDF operations.

    Args:
        max_store: Maximum size of resource store in bytes (default: 256MB)

    Example:
        >>> ctx = Context()
        >>> # ... perform operations ...
        >>> ctx.drop()

    Or use as context manager:
        >>> with Context() as ctx:
        ...     # ... perform operations ...
    """

    def __init__(self, max_store: int = FZ_STORE_DEFAULT) -> None:
        self._handle: Optional[int] = None
        self._dropped = False

        # Create context
        handle = lib.fz_new_context(ffi.NULL, ffi.NULL, max_store)
        if handle == 0:
            raise system_error("Failed to create context")

        self._handle = int(handle)

    def drop(self) -> None:
        """Free the context and all associated resources.

        After calling drop(), the context must not be used.
        """
        if not self._dropped and self._handle is not None and self._handle != 0:
            lib.fz_drop_context(self._handle)
            self._dropped = True
            self._handle = None

    def clone(self) -> "Context":
        """Create a new reference to the context.

        The cloned context shares the same underlying resources.

        Returns:
            A new Context instance sharing the same resources

        Raises:
            NanoPDFError: If context is dropped or clone fails
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot clone dropped context")

        handle = lib.fz_clone_context(self._handle)
        if handle == 0:
            raise system_error("Failed to clone context")

        ctx = Context.__new__(Context)
        ctx._handle = int(handle)
        ctx._dropped = False
        return ctx

    def is_valid(self) -> bool:
        """Check if the context is still valid (not dropped)."""
        return not self._dropped and self._handle is not None and self._handle != 0

    def __enter__(self) -> "Context":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager (automatically drops context)."""
        self.drop()

    def __del__(self) -> None:
        """Destructor - ensures context is dropped."""
        self.drop()

    def __repr__(self) -> str:
        status = "valid" if self.is_valid() else "dropped"
        return f"Context(handle={self._handle}, status={status})"

    @property
    def handle(self) -> int:
        """Get the internal handle (for FFI operations)."""
        if self._handle is None:
            raise system_error("Context handle is None")
        return self._handle


__all__ = ["Context"]

