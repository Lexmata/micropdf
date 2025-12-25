"""Buffer operations for NanoPDF."""

from typing import Optional
from .ffi import ffi, lib
from .context import Context
from .errors import argument_error


class Buffer:
    """Dynamic byte buffer.

    Buffers provide efficient storage for variable-length byte data.

    Args:
        ctx: Context for buffer operations
        capacity: Initial capacity in bytes

    Example:
        >>> ctx = Context()
        >>> buf = Buffer(ctx, 1024)
        >>> buf.append(b"Hello, PDF!")
        >>> print(buf.length())
        >>> buf.drop()
    """

    def __init__(self, ctx: Context, capacity: int = 0) -> None:
        self._ctx = ctx
        self._handle: Optional[int] = None
        self._dropped = False

        handle = lib.fz_new_buffer(ctx.handle, capacity)
        if handle == 0:
            raise argument_error("Failed to create buffer")

        self._handle = int(handle)

    @staticmethod
    def from_bytes(ctx: Context, data: bytes) -> "Buffer":
        """Create buffer from byte data.

        Args:
            ctx: Context for buffer operations
            data: Byte data to copy into buffer

        Returns:
            New Buffer containing the data
        """
        if not data:
            return Buffer(ctx, 0)

        c_data = ffi.new("unsigned char[]", data)
        handle = lib.fz_new_buffer_from_copied_data(ctx.handle, c_data, len(data))

        if handle == 0:
            raise argument_error("Failed to create buffer from data")

        buf = Buffer.__new__(Buffer)
        buf._ctx = ctx
        buf._handle = int(handle)
        buf._dropped = False
        return buf

    def drop(self) -> None:
        """Free the buffer resources."""
        if not self._dropped and self._handle is not None and self._handle != 0:
            lib.fz_drop_buffer(self._ctx.handle, self._handle)
            self._dropped = True
            self._handle = None

    def length(self) -> int:
        """Get buffer length in bytes."""
        if self._dropped or self._handle is None:
            return 0

        return int(lib.fz_buffer_storage(self._ctx.handle, self._handle, ffi.NULL))

    def data(self) -> bytes:
        """Get buffer contents as bytes."""
        if self._dropped or self._handle is None:
            return b""

        size_ptr = ffi.new("size_t*")
        data_ptr = lib.fz_buffer_data(self._ctx.handle, self._handle, size_ptr)

        if data_ptr == ffi.NULL or size_ptr[0] == 0:
            return b""

        return ffi.buffer(data_ptr, size_ptr[0])[:]

    def append(self, data: bytes) -> None:
        """Append data to buffer."""
        if self._dropped or self._handle is None:
            raise argument_error("Cannot append to dropped buffer")

        if not data:
            return

        c_data = ffi.new("unsigned char[]", data)
        lib.fz_append_data(self._ctx.handle, self._handle, c_data, len(data))

    def append_string(self, s: str) -> None:
        """Append string to buffer (UTF-8 encoded)."""
        self.append(s.encode('utf-8'))

    def clear(self) -> None:
        """Clear buffer contents."""
        if self._dropped or self._handle is None:
            return

        lib.fz_clear_buffer(self._ctx.handle, self._handle)

    def is_empty(self) -> bool:
        """Check if buffer is empty."""
        return self.length() == 0

    def __len__(self) -> int:
        """Get buffer length (enables len(buffer))."""
        return self.length()

    def __bytes__(self) -> bytes:
        """Get buffer as bytes (enables bytes(buffer))."""
        return self.data()

    def __enter__(self) -> "Buffer":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager (automatically drops buffer)."""
        self.drop()

    def __del__(self) -> None:
        """Destructor - ensures buffer is dropped."""
        self.drop()

    def __repr__(self) -> str:
        return f"Buffer(length={self.length()}, dropped={self._dropped})"

    @property
    def handle(self) -> int:
        """Get the internal handle."""
        if self._handle is None:
            raise argument_error("Buffer handle is None")
        return self._handle


__all__ = ["Buffer"]

