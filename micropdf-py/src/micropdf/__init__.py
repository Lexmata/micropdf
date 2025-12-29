"""
MicroPDF - High-performance PDF manipulation library for Python

A Python interface to the MicroPDF library, providing fast PDF operations
through native Rust FFI bindings.

Example:
    >>> import micropdf
    >>> doc = micropdf.Document.open('file.pdf')
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
from .geometry import (
    Point, Rect, IRect, Matrix, Quad,
    transform_points_batch, transform_rects_batch,
    point_distances_batch, point_distances_squared_batch,
    rect_contains_points_batch, count_points_in_rect,
    rect_union_batch, filter_points_in_rect, nearest_point
)
from .colorspace import Colorspace
from .errors import MicroPDFError, ErrorCode
from .easy import EasyPDF
from .enhanced import merge_pdfs

# Resource tracking and profiling
from .resource_tracking import (
    enable_tracking,
    track_resource,
    untrack_resource,
    get_tracked_resources,
    get_potential_leaks,
    get_leak_warnings,
    get_memory_summary,
    clear_tracking,
    cached_ffi_call,
    get_cached_ffi_func,
    clear_ffi_cache,
    get_object_memory_size,
    get_all_object_sizes,
    print_memory_report,
    ResourceScope,
    TrackedResource,
)

from .profiler import (
    enable_profiling,
    enable_stack_traces,
    is_profiling_enabled,
    track_allocation,
    track_deallocation,
    get_leak_report,
    print_leak_report,
    reset_profiler,
    start_tracemalloc,
    stop_tracemalloc,
    print_tracemalloc_top,
    force_gc,
    print_gc_stats,
    get_memory_usage,
    print_memory_usage,
    ResourceType,
)

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
    # Batch operations
    "transform_points_batch",
    "transform_rects_batch",
    "point_distances_batch",
    "point_distances_squared_batch",
    "rect_contains_points_batch",
    "count_points_in_rect",
    "rect_union_batch",
    "filter_points_in_rect",
    "nearest_point",
    # Color
    "Colorspace",
    # Errors
    "MicroPDFError",
    "ErrorCode",
    # Easy API
    "EasyPDF",
    # Resource tracking
    "enable_tracking",
    "track_resource",
    "untrack_resource",
    "get_tracked_resources",
    "get_potential_leaks",
    "get_leak_warnings",
    "get_memory_summary",
    "clear_tracking",
    "cached_ffi_call",
    "get_cached_ffi_func",
    "clear_ffi_cache",
    "get_object_memory_size",
    "get_all_object_sizes",
    "print_memory_report",
    "ResourceScope",
    "TrackedResource",
    # Profiler
    "enable_profiling",
    "enable_stack_traces",
    "is_profiling_enabled",
    "track_allocation",
    "track_deallocation",
    "get_leak_report",
    "print_leak_report",
    "reset_profiler",
    "start_tracemalloc",
    "stop_tracemalloc",
    "print_tracemalloc_top",
    "force_gc",
    "print_gc_stats",
    "get_memory_usage",
    "print_memory_usage",
    "ResourceType",
]

