"""
Tests for enhanced PDF operations.
"""

import pytest
from micropdf import merge_pdfs, Context, MicroPDFError


def test_merge_pdfs_empty_inputs():
    """Test that merge_pdfs raises ValueError for empty input paths."""
    with pytest.raises(ValueError, match="Input PDF paths cannot be empty"):
        merge_pdfs([], "output.pdf")


def test_merge_pdfs_empty_output():
    """Test that merge_pdfs raises ValueError for empty output path."""
    with pytest.raises(ValueError, match="Output path cannot be empty"):
        merge_pdfs(["doc1.pdf"], "")


def test_merge_pdfs_with_context():
    """Test that merge_pdfs works with a provided context."""
    ctx = Context()
    try:
        # This will fail because the files don't exist, but we're testing the API
        with pytest.raises(MicroPDFError):
            merge_pdfs(["nonexistent1.pdf", "nonexistent2.pdf"], "output.pdf", ctx)
    finally:
        ctx.drop()


def test_merge_pdfs_without_context():
    """Test that merge_pdfs creates its own context when none is provided."""
    # This will fail because the files don't exist, but we're testing the API
    with pytest.raises(MicroPDFError):
        merge_pdfs(["nonexistent1.pdf", "nonexistent2.pdf"], "output.pdf")

