"""Pixmap operations for NanoPDF."""

from typing import Optional
from .ffi import ffi, lib
from .context import Context
from .geometry import Matrix
from .colorspace import Colorspace
from .buffer import Buffer
from .errors import system_error, argument_error


class Pixmap:
    """Pixel buffer for rendered content.

    Pixmaps store raster image data with a specific colorspace.
    They are typically created by rendering pages.

    Example:
        >>> from nanopdf import Context, Document, Matrix, Colorspace
        >>> ctx = Context()
        >>> doc = Document.open(ctx, 'file.pdf')
        >>> page = doc.load_page(0)
        >>> cs = Colorspace.device_rgb(ctx)
        >>> matrix = Matrix.scale(2.0, 2.0)
        >>> pix = Pixmap.from_page(ctx, page, matrix, cs, alpha=False)
        >>> print(pix.width(), pix.height())
        >>> png_data = pix.to_png()
        >>> pix.drop()
    """

    def __init__(self, ctx: Context, handle: int) -> None:
        self._ctx = ctx
        self._handle: Optional[int] = handle
        self._dropped = False

    @staticmethod
    def create(
        ctx: Context, colorspace: Colorspace, width: int, height: int, alpha: bool = False
    ) -> "Pixmap":
        """Create a new pixmap.

        Args:
            ctx: Context for pixmap operations
            colorspace: Color model for the pixmap
            width: Width in pixels
            height: Height in pixels
            alpha: Whether to include alpha channel

        Returns:
            New Pixmap instance
        """
        handle = lib.fz_new_pixmap(
            ctx.handle,
            colorspace.handle,
            width,
            height,
            1 if alpha else 0
        )

        if handle == 0:
            raise system_error("Failed to create pixmap")

        return Pixmap(ctx, int(handle))

    @staticmethod
    def from_page(
        ctx: Context,
        page: "Page",  # type: ignore
        matrix: Matrix,
        colorspace: Colorspace,
        alpha: bool = False
    ) -> "Pixmap":
        """Render a page to a pixmap.

        Args:
            ctx: Context for operations
            page: Page to render
            matrix: Transformation matrix (usually scale for DPI)
            colorspace: Color model for output
            alpha: Include alpha channel

        Returns:
            Rendered Pixmap
        """
        from .document import Page

        if not isinstance(page, Page):
            raise argument_error("page must be a Page instance")

        c_matrix = matrix._to_c()

        handle = lib.fz_new_pixmap_from_page(
            ctx.handle,
            page.handle,
            c_matrix,
            colorspace.handle,
            1 if alpha else 0
        )

        if handle == 0:
            raise system_error("Failed to render page to pixmap")

        return Pixmap(ctx, int(handle))

    def drop(self) -> None:
        """Free the pixmap resources."""
        if not self._dropped and self._handle is not None and self._handle != 0:
            lib.fz_drop_pixmap(self._ctx.handle, self._handle)
            self._dropped = True
            self._handle = None

    def width(self) -> int:
        """Get pixmap width in pixels."""
        if self._dropped or self._handle is None:
            return 0

        return int(lib.fz_pixmap_width(self._ctx.handle, self._handle))

    def height(self) -> int:
        """Get pixmap height in pixels."""
        if self._dropped or self._handle is None:
            return 0

        return int(lib.fz_pixmap_height(self._ctx.handle, self._handle))

    def components(self) -> int:
        """Get number of color components per pixel."""
        if self._dropped or self._handle is None:
            return 0

        return int(lib.fz_pixmap_components(self._ctx.handle, self._handle))

    def stride(self) -> int:
        """Get stride (bytes per row)."""
        if self._dropped or self._handle is None:
            return 0

        return int(lib.fz_pixmap_stride(self._ctx.handle, self._handle))

    def samples(self) -> bytes:
        """Get raw pixel data as bytes.

        Returns:
            Raw pixel data (width * height * components bytes)
        """
        if self._dropped or self._handle is None:
            return b""

        width = self.width()
        height = self.height()
        components = self.components()
        size = width * height * components

        if size == 0:
            return b""

        data_ptr = lib.fz_pixmap_samples(self._ctx.handle, self._handle)
        if data_ptr == ffi.NULL:
            return b""

        return ffi.buffer(data_ptr, size)[:]

    def to_png(self) -> bytes:
        """Convert pixmap to PNG format.

        Returns:
            PNG image data as bytes
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot convert dropped pixmap to PNG")

        # Create PNG buffer
        buf_handle = lib.fz_new_buffer_from_pixmap_as_png(
            self._ctx.handle,
            self._handle,
            0  # default color params
        )

        if buf_handle == 0:
            raise system_error("Failed to convert pixmap to PNG")

        try:
            # Get PNG data
            size_ptr = ffi.new("size_t*")
            data = lib.fz_buffer_data(self._ctx.handle, buf_handle, size_ptr)

            if data == ffi.NULL or size_ptr[0] == 0:
                return b""

            return ffi.buffer(data, size_ptr[0])[:]
        finally:
            lib.fz_drop_buffer(self._ctx.handle, buf_handle)

    def save_png(self, path: str) -> None:
        """Save pixmap as PNG file.

        Args:
            path: Output file path
        """
        png_data = self.to_png()
        with open(path, 'wb') as f:
            f.write(png_data)

    def clear(self) -> None:
        """Clear pixmap to white."""
        if self._dropped or self._handle is None:
            return

        lib.fz_clear_pixmap(self._ctx.handle, self._handle)

    def __enter__(self) -> "Pixmap":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager."""
        self.drop()

    def __del__(self) -> None:
        """Destructor."""
        self.drop()

    def __repr__(self) -> str:
        if self._dropped:
            return "Pixmap(dropped=True)"
        return f"Pixmap({self.width()}x{self.height()}, components={self.components()})"

    @property
    def handle(self) -> int:
        """Get the internal handle."""
        if self._handle is None:
            raise system_error("Pixmap handle is None")
        return self._handle


__all__ = ["Pixmap"]

