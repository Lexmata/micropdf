"""
Enhanced PDF operations for MicroPDF.

This module provides advanced PDF manipulation functions beyond the standard
MuPDF API, including PDF merging, splitting, optimization, and more.
"""

from typing import List
from .ffi import ffi, lib
from .context import Context
from .errors import MicroPDFError


def merge_pdfs(input_paths: List[str], output_path: str, ctx: Context = None) -> int:
    """
    Merge multiple PDF files into a single output PDF.

    This function takes a list of input PDF file paths and merges them into a new PDF
    at the specified output path. It is designed to handle large and potentially
    corrupted PDFs by attempting to recover and process pages robustly.

    Args:
        input_paths: A list of strings, where each string is a path to an input PDF file.
        output_path: The path where the merged PDF will be saved.
        ctx: Optional context for the operation. If None, a default context is created.

    Returns:
        The total number of pages in the merged document.

    Raises:
        ValueError: If input_paths is empty or output_path is invalid.
        MicroPDFError: If the merge operation fails.

    Example:
        >>> from micropdf import merge_pdfs
        >>> page_count = merge_pdfs(
        ...     ['document1.pdf', 'document2.pdf', 'document3.pdf'],
        ...     'merged.pdf'
        ... )
        >>> print(f"Merged {page_count} pages")
        Merged 15 pages
    """
    if not input_paths:
        raise ValueError("Input PDF paths cannot be empty")
    
    if not output_path:
        raise ValueError("Output path cannot be empty")

    # Create context if not provided
    if ctx is None:
        ctx = Context()
        should_drop = True
    else:
        should_drop = False

    try:
        # Convert Python strings to C strings
        c_paths = [ffi.new("char[]", path.encode('utf-8')) for path in input_paths]
        c_paths_array = ffi.new("char *[]", c_paths)
        c_output_path = ffi.new("char[]", output_path.encode('utf-8'))

        # Call the Rust FFI function
        result = lib.np_merge_pdfs(
            ctx._handle,
            c_paths_array,
            len(input_paths),
            c_output_path
        )

        if result < 0:
            raise MicroPDFError(f"Failed to merge PDFs: error code {result}")

        return result

    finally:
        if should_drop:
            ctx.drop()


__all__ = ['merge_pdfs']

