"""Document and Page operations for NanoPDF."""

from typing import Optional, List
from .ffi import ffi, lib
from .context import Context
from .geometry import Rect, Quad
from .errors import system_error, argument_error


class Page:
    """PDF page.

    Represents a single page in a PDF document.

    Example:
        >>> doc = Document.open(ctx, 'file.pdf')
        >>> page = doc.load_page(0)
        >>> bounds = page.bounds()
        >>> text = page.extract_text()
        >>> page.drop()
    """

    def __init__(self, ctx: Context, handle: int) -> None:
        self._ctx = ctx
        self._handle: Optional[int] = handle
        self._dropped = False

    def drop(self) -> None:
        """Free the page resources."""
        if not self._dropped and self._handle is not None and self._handle != 0:
            lib.fz_drop_page(self._ctx.handle, self._handle)
            self._dropped = True
            self._handle = None

    def bounds(self) -> Rect:
        """Get page bounds (bounding rectangle).

        Returns:
            Rectangle representing the page dimensions
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot get bounds of dropped page")

        c_rect = lib.fz_bound_page(self._ctx.handle, self._handle)
        return Rect._from_c(c_rect)

    def extract_text(self) -> str:
        """Extract all text from the page.

        Returns:
            Plain text content of the page
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot extract text from dropped page")

        # Create text page
        stext = lib.fz_new_stext_page_from_page(self._ctx.handle, self._handle, ffi.NULL)
        if stext == 0:
            return ""

        try:
            # Convert to buffer
            buf = lib.fz_new_buffer_from_stext_page(self._ctx.handle, stext)
            if buf == 0:
                return ""

            try:
                # Get text data
                size_ptr = ffi.new("size_t*")
                data = lib.fz_buffer_data(self._ctx.handle, buf, size_ptr)

                if data == ffi.NULL or size_ptr[0] == 0:
                    return ""

                return ffi.string(data, size_ptr[0]).decode('utf-8', errors='replace')
            finally:
                lib.fz_drop_buffer(self._ctx.handle, buf)
        finally:
            lib.fz_drop_stext_page(self._ctx.handle, stext)

    def search_text(self, needle: str, max_hits: int = 512) -> List[Quad]:
        """Search for text on the page.

        Args:
            needle: Text to search for
            max_hits: Maximum number of results to return

        Returns:
            List of Quad objects representing hit locations
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot search dropped page")

        # Create text page
        stext = lib.fz_new_stext_page_from_page(self._ctx.handle, self._handle, ffi.NULL)
        if stext == 0:
            return []

        try:
            # Prepare hit array
            hits = ffi.new(f"fz_quad[{max_hits}]")
            c_needle = ffi.new("char[]", needle.encode('utf-8'))

            # Search
            hit_count = lib.fz_search_stext_page(
                self._ctx.handle,
                stext,
                c_needle,
                ffi.NULL,
                hits,
                max_hits
            )

            # Convert results
            results = []
            for i in range(hit_count):
                from .geometry import Point
                quad = Quad(
                    ul=Point(hits[i].ul.x, hits[i].ul.y),
                    ur=Point(hits[i].ur.x, hits[i].ur.y),
                    ll=Point(hits[i].ll.x, hits[i].ll.y),
                    lr=Point(hits[i].lr.x, hits[i].lr.y),
                )
                results.append(quad)

            return results
        finally:
            lib.fz_drop_stext_page(self._ctx.handle, stext)

    def __enter__(self) -> "Page":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager."""
        self.drop()

    def __del__(self) -> None:
        """Destructor."""
        self.drop()

    def __repr__(self) -> str:
        return f"Page(handle={self._handle}, dropped={self._dropped})"

    @property
    def handle(self) -> int:
        """Get the internal handle."""
        if self._handle is None:
            raise system_error("Page handle is None")
        return self._handle


class Document:
    """PDF document.

    Represents a loaded PDF document with methods for accessing
    pages, metadata, and performing document-level operations.

    Example:
        >>> ctx = Context()
        >>> doc = Document.open(ctx, 'file.pdf')
        >>> print(doc.page_count())
        >>> page = doc.load_page(0)
        >>> doc.save('output.pdf')
        >>> doc.drop()
    """

    def __init__(self, ctx: Context, handle: int) -> None:
        self._ctx = ctx
        self._handle: Optional[int] = handle
        self._dropped = False

    @staticmethod
    def open(ctx: Context, path: str) -> "Document":
        """Open a PDF document from file path.

        Args:
            ctx: Context for document operations
            path: Path to PDF file

        Returns:
            Document instance

        Raises:
            NanoPDFError: If file cannot be opened
        """
        c_path = ffi.new("char[]", path.encode('utf-8'))
        handle = lib.fz_open_document(ctx.handle, c_path)

        if handle == 0:
            raise system_error(f"Failed to open document: {path}")

        return Document(ctx, int(handle))

    @staticmethod
    def from_bytes(ctx: Context, data: bytes, magic: str = ".pdf") -> "Document":
        """Open a PDF document from bytes.

        Args:
            ctx: Context for document operations
            data: PDF data as bytes
            magic: File extension hint (default: ".pdf")

        Returns:
            Document instance

        Raises:
            NanoPDFError: If data is invalid
        """
        if not data:
            raise argument_error("Document data is empty")

        c_magic = ffi.new("char[]", magic.encode('utf-8'))
        c_data = ffi.new("unsigned char[]", data)

        handle = lib.fz_open_document_with_buffer(
            ctx.handle,
            c_magic,
            c_data,
            len(data)
        )

        if handle == 0:
            raise system_error("Failed to open document from bytes")

        return Document(ctx, int(handle))

    def drop(self) -> None:
        """Free the document resources."""
        if not self._dropped and self._handle is not None and self._handle != 0:
            lib.fz_drop_document(self._ctx.handle, self._handle)
            self._dropped = True
            self._handle = None

    def page_count(self) -> int:
        """Get the number of pages in the document.

        Returns:
            Number of pages
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot get page count of dropped document")

        return int(lib.fz_count_pages(self._ctx.handle, self._handle))

    def needs_password(self) -> bool:
        """Check if document is encrypted and needs password.

        Returns:
            True if password is required
        """
        if self._dropped or self._handle is None:
            return False

        return bool(lib.fz_needs_password(self._ctx.handle, self._handle))

    def authenticate(self, password: str) -> bool:
        """Authenticate with password.

        Args:
            password: Password to try

        Returns:
            True if password is correct
        """
        if self._dropped or self._handle is None:
            return False

        c_password = ffi.new("char[]", password.encode('utf-8'))
        result = lib.fz_authenticate_password(self._ctx.handle, self._handle, c_password)
        return bool(result)

    def has_permission(self, permission: int) -> bool:
        """Check if document has a specific permission.

        Args:
            permission: Permission flag to check

        Returns:
            True if permission is granted
        """
        if self._dropped or self._handle is None:
            return False

        return bool(lib.fz_has_permission(self._ctx.handle, self._handle, permission))

    def get_metadata(self, key: str) -> str:
        """Get document metadata value.

        Args:
            key: Metadata key (e.g., "Title", "Author", "Subject")

        Returns:
            Metadata value or empty string if not found
        """
        if self._dropped or self._handle is None:
            return ""

        buf = ffi.new("char[1024]")
        c_key = ffi.new("char[]", key.encode('utf-8'))

        length = lib.fz_lookup_metadata(
            self._ctx.handle,
            self._handle,
            c_key,
            buf,
            1024
        )

        if length > 0:
            return ffi.string(buf, length).decode('utf-8', errors='replace')

        return ""

    def load_page(self, page_num: int) -> Page:
        """Load a page from the document.

        Args:
            page_num: Page number (0-based)

        Returns:
            Page instance

        Raises:
            NanoPDFError: If page cannot be loaded
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot load page from dropped document")

        if page_num < 0 or page_num >= self.page_count():
            raise argument_error(f"Invalid page number: {page_num}")

        handle = lib.fz_load_page(self._ctx.handle, self._handle, page_num)
        if handle == 0:
            raise system_error(f"Failed to load page {page_num}")

        return Page(self._ctx, int(handle))

    def save(self, path: str) -> None:
        """Save document to file.

        Args:
            path: Output file path
        """
        if self._dropped or self._handle is None:
            raise system_error("Cannot save dropped document")

        c_path = ffi.new("char[]", path.encode('utf-8'))
        lib.pdf_save_document(self._ctx.handle, self._handle, c_path, ffi.NULL)

    def __enter__(self) -> "Document":
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore
        """Exit context manager."""
        self.drop()

    def __del__(self) -> None:
        """Destructor."""
        self.drop()

    def __repr__(self) -> str:
        pages = 0 if self._dropped else self.page_count()
        return f"Document(pages={pages}, dropped={self._dropped})"

    @property
    def handle(self) -> int:
        """Get the internal handle."""
        if self._handle is None:
            raise system_error("Document handle is None")
        return self._handle


__all__ = ["Document", "Page"]

