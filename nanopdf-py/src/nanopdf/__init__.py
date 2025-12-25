"""
NanoPDF - High-performance PDF manipulation library for Python

A Python interface to the NanoPDF library, providing fast PDF operations
through native Rust FFI bindings.

Example:
    >>> import nanopdf
    >>> doc = nanopdf.Document.open('file.pdf')
    >>> print(f"Pages: {doc.page_count()}")
    >>> page = doc.load_page(0)
    >>> text = page.extract_text()
    >>> doc.close()

Modules:
    - context: Context management
    - document: Document operations
    - page: Page operations
    - pixmap: Image/pixel operations
    - buffer: Buffer operations
    - geometry: Point, Rect, Matrix, Quad
    - colorspace: Color management
    - easy: Simplified API for common tasks
"""

from .version import __version__
from .context import Context
from .document import Document, Page
from .buffer import Buffer
from .pixmap import Pixmap
from .geometry import Point, Rect, IRect, Matrix, Quad
from .colorspace import Colorspace
from .errors import NanoPDFError, ErrorCode
from .easy import EasyPDF

__all__ = [
    # Version
    "__version__",
    # Core classes
    "Context",
    "Document",
    "Page",
    "Buffer",
    "Pixmap",
    # Geometry
    "Point",
    "Rect",
    "IRect",
    "Matrix",
    "Quad",
    # Color
    "Colorspace",
    # Errors
    "NanoPDFError",
    "ErrorCode",
    # Easy API
    "EasyPDF",
]

