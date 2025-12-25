"""Easy API - Simplified interface for common PDF tasks.

This module provides a high-level, Pythonic interface for the most common
PDF operations with automatic resource management.

Example:
    >>> from nanopdf import EasyPDF
    >>>
    >>> # Extract text (single line!)
    >>> text = EasyPDF.extract_text('document.pdf')
    >>>
    >>> # Render to PNG
    >>> EasyPDF.render_to_png('document.pdf', 'output.png', page=0, dpi=300)
    >>>
    >>> # Fluent API with context manager
    >>> with EasyPDF.open('document.pdf') as pdf:
    ...     info = pdf.get_info()
    ...     text = pdf.extract_all_text()
    ...     pdf.render_page(0, 'page.png', dpi=150)
"""

from typing import Optional, Dict, List
from pathlib import Path
from .context import Context
from .document import Document, Page
from .pixmap import Pixmap
from .colorspace import Colorspace
from .geometry import Matrix, Rect, Quad
from .errors import argument_error


class DocumentInfo:
    """Document information container."""

    def __init__(self) -> None:
        self.page_count: int = 0
        self.title: str = ""
        self.author: str = ""
        self.subject: str = ""
        self.keywords: str = ""
        self.creator: str = ""
        self.producer: str = ""
        self.is_encrypted: bool = False


class EasyPDF:
    """Simplified, fluent API for common PDF operations.

    Provides automatic resource management and intuitive method chaining.

    Example:
        >>> with EasyPDF.open('document.pdf') as pdf:
        ...     print(f"Pages: {pdf.page_count()}")
        ...     text = pdf.extract_all_text()
        ...     pdf.render_page(0, 'page.png', dpi=300)
    """

    def __init__(self, ctx: Context, doc: Document) -> None:
        self._ctx = ctx
        self._doc = doc
        self._auto_close = True

    @staticmethod
    def open(path: str) -> "EasyPDF":
        """Open a PDF document.

        Args:
            path: Path to PDF file

        Returns:
            EasyPDF instance with automatic cleanup

        Example:
            >>> with EasyPDF.open('file.pdf') as pdf:
            ...     print(pdf.page_count())
        """
        ctx = Context()
        doc = Document.open(ctx, path)
        return EasyPDF(ctx, doc)

    @staticmethod
    def open_with_password(path: str, password: str) -> "EasyPDF":
        """Open a password-protected PDF.

        Args:
            path: Path to PDF file
            password: Password for decryption

        Returns:
            EasyPDF instance
        """
        ctx = Context()
        doc = Document.open(ctx, path)

        if doc.needs_password():
            if not doc.authenticate(password):
                doc.drop()
                ctx.drop()
                raise argument_error("Invalid password")

        return EasyPDF(ctx, doc)

    @staticmethod
    def from_bytes(data: bytes) -> "EasyPDF":
        """Open a PDF from bytes.

        Args:
            data: PDF data as bytes

        Returns:
            EasyPDF instance
        """
        ctx = Context()
        doc = Document.from_bytes(ctx, data)
        return EasyPDF(ctx, doc)

    def page_count(self) -> int:
        """Get number of pages."""
        return self._doc.page_count()

    def is_encrypted(self) -> bool:
        """Check if document is encrypted."""
        return self._doc.needs_password()

    def get_metadata(self) -> Dict[str, str]:
        """Get all document metadata.

        Returns:
            Dictionary with metadata keys and values
        """
        keys = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"]
        return {key: self._doc.get_metadata(key) for key in keys}

    def get_info(self) -> DocumentInfo:
        """Get comprehensive document information.

        Returns:
            DocumentInfo object with all available information
        """
        info = DocumentInfo()
        info.page_count = self.page_count()
        info.title = self._doc.get_metadata("Title")
        info.author = self._doc.get_metadata("Author")
        info.subject = self._doc.get_metadata("Subject")
        info.keywords = self._doc.get_metadata("Keywords")
        info.creator = self._doc.get_metadata("Creator")
        info.producer = self._doc.get_metadata("Producer")
        info.is_encrypted = self.is_encrypted()
        return info

    def extract_all_text(self) -> str:
        """Extract text from all pages.

        Returns:
            All text content concatenated with page breaks
        """
        texts = []
        for i in range(self.page_count()):
            with self._doc.load_page(i) as page:
                texts.append(page.extract_text())
        return "\n\n".join(texts)

    def extract_page_text(self, page_num: int) -> str:
        """Extract text from a specific page.

        Args:
            page_num: Page number (0-based)

        Returns:
            Text content of the page
        """
        with self._doc.load_page(page_num) as page:
            return page.extract_text()

    def search_all(self, needle: str) -> List[Dict]:
        """Search for text across all pages.

        Args:
            needle: Text to search for

        Returns:
            List of dicts with page_num and bbox keys
        """
        results = []
        for i in range(self.page_count()):
            with self._doc.load_page(i) as page:
                quads = page.search_text(needle)
                for quad in quads:
                    results.append({
                        'page_num': i,
                        'bbox': quad.to_rect(),
                    })
        return results

    def render_page(
        self,
        page_num: int,
        output_path: str,
        dpi: float = 72.0,
        alpha: bool = False
    ) -> None:
        """Render a page to PNG file.

        Args:
            page_num: Page number (0-based)
            output_path: Output PNG file path
            dpi: Dots per inch for rendering (default: 72)
            alpha: Include alpha channel (default: False)
        """
        scale = dpi / 72.0
        matrix = Matrix.scale(scale, scale)
        colorspace = Colorspace.device_rgb(self._ctx)

        with self._doc.load_page(page_num) as page:
            with Pixmap.from_page(self._ctx, page, matrix, colorspace, alpha) as pix:
                pix.save_png(output_path)

    def render_all_pages(
        self,
        output_dir: str,
        prefix: str = "page",
        dpi: float = 72.0
    ) -> List[str]:
        """Render all pages to PNG files.

        Args:
            output_dir: Directory for output files
            prefix: Filename prefix (default: "page")
            dpi: Dots per inch (default: 72)

        Returns:
            List of generated file paths
        """
        import os
        os.makedirs(output_dir, exist_ok=True)

        paths = []
        for i in range(self.page_count()):
            output_path = os.path.join(output_dir, f"{prefix}_{i:04d}.png")
            self.render_page(i, output_path, dpi)
            paths.append(output_path)

        return paths

    def get_page_bounds(self, page_num: int) -> Rect:
        """Get bounds of a specific page.

        Args:
            page_num: Page number (0-based)

        Returns:
            Rectangle representing page dimensions
        """
        with self._doc.load_page(page_num) as page:
            return page.bounds()

    def close(self) -> None:
        """Close the document and free resources."""
        if self._doc:
            self._doc.drop()
        if self._ctx:
            self._ctx.drop()

    def __enter__(self) -> "EasyPDF":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager."""
        if self._auto_close:
            self.close()

    def __del__(self) -> None:
        """Destructor."""
        if self._auto_close:
            self.close()

    # Static helper methods for one-liners
    @staticmethod
    def extract_text(path: str, page: Optional[int] = None) -> str:
        """Extract text from a PDF (static helper).

        Args:
            path: Path to PDF file
            page: Optional specific page (0-based), or None for all pages

        Returns:
            Extracted text

        Example:
            >>> text = EasyPDF.extract_text('document.pdf')
            >>> text = EasyPDF.extract_text('document.pdf', page=0)
        """
        with EasyPDF.open(path) as pdf:
            if page is not None:
                return pdf.extract_page_text(page)
            return pdf.extract_all_text()

    @staticmethod
    def render_to_png(
        path: str,
        output_path: str,
        page: int = 0,
        dpi: float = 72.0
    ) -> None:
        """Render a page to PNG (static helper).

        Args:
            path: Path to PDF file
            output_path: Output PNG file path
            page: Page number (0-based, default: 0)
            dpi: Dots per inch (default: 72)

        Example:
            >>> EasyPDF.render_to_png('in.pdf', 'out.png', page=0, dpi=300)
        """
        with EasyPDF.open(path) as pdf:
            pdf.render_page(page, output_path, dpi)

    @staticmethod
    def get_page_count(path: str) -> int:
        """Get page count (static helper).

        Args:
            path: Path to PDF file

        Returns:
            Number of pages
        """
        with EasyPDF.open(path) as pdf:
            return pdf.page_count()

    @staticmethod
    def get_info(path: str) -> DocumentInfo:
        """Get document info (static helper).

        Args:
            path: Path to PDF file

        Returns:
            DocumentInfo object
        """
        with EasyPDF.open(path) as pdf:
            return pdf.get_info()


__all__ = ["EasyPDF", "DocumentInfo"]

