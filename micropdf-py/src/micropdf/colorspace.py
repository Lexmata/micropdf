"""Colorspace management for PDF operations."""

from typing import Optional
from .ffi import ffi, lib
from .context import Context


class Colorspace:
    """PDF colorspace (color model).

    Colorspaces define how colors are represented in the PDF.
    Common colorspaces: DeviceGray, DeviceRGB, DeviceCMYK.

    Example:
        >>> ctx = Context()
        >>> rgb = Colorspace.device_rgb(ctx)
        >>> print(rgb.components())  # 3
        >>> print(rgb.name())  # "DeviceRGB"
    """

    def __init__(self, ctx: Context, handle: int) -> None:
        self._ctx = ctx
        self._handle = handle

    @staticmethod
    def device_gray(ctx: Context) -> "Colorspace":
        """Get DeviceGray colorspace (1 component)."""
        handle = lib.fz_device_gray(ctx.handle)
        return Colorspace(ctx, int(handle))

    @staticmethod
    def device_rgb(ctx: Context) -> "Colorspace":
        """Get DeviceRGB colorspace (3 components: R, G, B)."""
        handle = lib.fz_device_rgb(ctx.handle)
        return Colorspace(ctx, int(handle))

    @staticmethod
    def device_bgr(ctx: Context) -> "Colorspace":
        """Get DeviceBGR colorspace (3 components: B, G, R)."""
        handle = lib.fz_device_bgr(ctx.handle)
        return Colorspace(ctx, int(handle))

    @staticmethod
    def device_cmyk(ctx: Context) -> "Colorspace":
        """Get DeviceCMYK colorspace (4 components: C, M, Y, K)."""
        handle = lib.fz_device_cmyk(ctx.handle)
        return Colorspace(ctx, int(handle))

    def components(self) -> int:
        """Get number of color components.

        Returns:
            1 for Gray, 3 for RGB/BGR, 4 for CMYK
        """
        return int(lib.fz_colorspace_n(self._ctx.handle, self._handle))

    def name(self) -> str:
        """Get colorspace name.

        Returns:
            Name like "DeviceGray", "DeviceRGB", "DeviceCMYK"
        """
        c_name = lib.fz_colorspace_name(self._ctx.handle, self._handle)
        if c_name == ffi.NULL:
            return ""
        return ffi.string(c_name).decode('utf-8')

    def is_gray(self) -> bool:
        """Check if this is a grayscale colorspace."""
        return self.components() == 1

    def is_rgb(self) -> bool:
        """Check if this is an RGB colorspace."""
        n = self.components()
        name = self.name()
        return n == 3 and name in ("DeviceRGB", "DeviceBGR")

    def is_cmyk(self) -> bool:
        """Check if this is a CMYK colorspace."""
        return self.components() == 4

    def __repr__(self) -> str:
        return f"Colorspace(name={self.name()!r}, components={self.components()})"

    @property
    def handle(self) -> int:
        """Get the internal handle."""
        return self._handle


__all__ = ["Colorspace"]

