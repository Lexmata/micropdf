"""Resource Tracking and FFI Optimization for MicroPDF.

This module provides:
- WeakRef-based handle tracking for debug leak detection
- FFI function caching with functools.lru_cache
- Memory size calculations for all types
- Context managers for resource cleanup

Example:
    >>> from micropdf.resource_tracking import (
    ...     track_resource, untrack_resource, get_tracked_resources,
    ...     get_memory_summary
    ... )
    >>> track_resource(doc, doc.handle, "Document", "my-document.pdf")
    >>> # ... use document ...
    >>> untrack_resource(doc.handle)
"""

from __future__ import annotations

import functools
import sys
import threading
import weakref
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Callable, TypeVar, ParamSpec

# Import profiler for integration
from .profiler import (
    MemoryProfiler,
    ResourceType,
    get_profiler,
    track_allocation,
    track_deallocation,
)


# ============================================================================
# WeakRef-Based Resource Tracking
# ============================================================================

@dataclass
class TrackedResource:
    """Information about a tracked resource."""

    handle: int
    resource_type: str
    tag: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    python_size: int = 0

    def age(self) -> timedelta:
        """Get age of this resource."""
        return datetime.now() - self.created_at


class ResourceTracker:
    """Track resources using weak references for leak detection.

    This tracker complements the profiler by using Python's weakref
    to detect when objects are garbage collected without explicit cleanup.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._resources: dict[int, TrackedResource] = {}
        self._weak_refs: dict[int, weakref.ref] = {}
        self._leak_warnings: list[str] = []
        self._enabled = False

    def enable(self, enabled: bool = True) -> None:
        """Enable or disable tracking."""
        self._enabled = enabled

    def is_enabled(self) -> bool:
        """Check if tracking is enabled."""
        return self._enabled

    def track(
        self,
        obj: object,
        handle: int,
        resource_type: str,
        tag: str | None = None,
    ) -> None:
        """Track a resource using weak reference.

        Args:
            obj: The Python object to track
            handle: The native handle ID
            resource_type: Type of resource (e.g., "Document", "Page")
            tag: Optional tag for identification
        """
        if not self._enabled:
            return

        python_size = sys.getsizeof(obj) if obj is not None else 0

        info = TrackedResource(
            handle=handle,
            resource_type=resource_type,
            tag=tag,
            python_size=python_size,
        )

        def on_gc(ref: weakref.ref) -> None:
            """Called when object is garbage collected."""
            with self._lock:
                if handle in self._resources:
                    resource = self._resources[handle]
                    warning = (
                        f"[LEAK] {resource.resource_type} (handle={handle}"
                        f"{f', tag={resource.tag}' if resource.tag else ''}) "
                        f"was garbage collected without being explicitly closed"
                    )
                    self._leak_warnings.append(warning)

                    # Print in non-production environments
                    import os
                    if os.environ.get("MICROPDF_DEBUG"):
                        print(f"WARNING: {warning}", file=sys.stderr)

        with self._lock:
            self._resources[handle] = info
            try:
                self._weak_refs[handle] = weakref.ref(obj, on_gc)
            except TypeError:
                # Some objects don't support weak references
                pass

    def untrack(self, handle: int) -> TrackedResource | None:
        """Untrack a resource (called when properly closed).

        Args:
            handle: The native handle ID

        Returns:
            The tracked resource info if found, None otherwise
        """
        if not self._enabled:
            return None

        with self._lock:
            self._weak_refs.pop(handle, None)
            return self._resources.pop(handle, None)

    def get_tracked(self) -> list[TrackedResource]:
        """Get all currently tracked resources."""
        with self._lock:
            return list(self._resources.values())

    def get_potential_leaks(self, min_age_seconds: float = 60.0) -> list[TrackedResource]:
        """Get resources older than min_age (potential leaks)."""
        cutoff = datetime.now() - timedelta(seconds=min_age_seconds)
        with self._lock:
            return [r for r in self._resources.values() if r.created_at < cutoff]

    def get_leak_warnings(self) -> list[str]:
        """Get and clear leak warnings."""
        with self._lock:
            warnings = self._leak_warnings.copy()
            self._leak_warnings.clear()
            return warnings

    def clear(self) -> None:
        """Clear all tracking data."""
        with self._lock:
            self._resources.clear()
            self._weak_refs.clear()
            self._leak_warnings.clear()

    def get_memory_summary(self) -> dict:
        """Get summary of tracked resources and memory."""
        with self._lock:
            by_type: dict[str, dict] = {}
            total_python_size = 0

            for resource in self._resources.values():
                rt = resource.resource_type
                if rt not in by_type:
                    by_type[rt] = {"count": 0, "python_bytes": 0}

                by_type[rt]["count"] += 1
                by_type[rt]["python_bytes"] += resource.python_size
                total_python_size += resource.python_size

            return {
                "total_tracked": len(self._resources),
                "total_python_bytes": total_python_size,
                "by_type": by_type,
                "leak_warnings": len(self._leak_warnings),
            }


# Global tracker instance
_tracker = ResourceTracker()


def enable_tracking(enabled: bool = True) -> None:
    """Enable or disable resource tracking."""
    _tracker.enable(enabled)


def track_resource(
    obj: object,
    handle: int,
    resource_type: str,
    tag: str | None = None,
) -> None:
    """Track a resource for leak detection.

    Args:
        obj: The Python object to track
        handle: The native handle ID
        resource_type: Type of resource
        tag: Optional identification tag
    """
    _tracker.track(obj, handle, resource_type, tag)


def untrack_resource(handle: int) -> None:
    """Untrack a resource (call when closing/dropping)."""
    _tracker.untrack(handle)


def get_tracked_resources() -> list[TrackedResource]:
    """Get all currently tracked resources."""
    return _tracker.get_tracked()


def get_potential_leaks(min_age_seconds: float = 60.0) -> list[TrackedResource]:
    """Get resources that may be leaks (older than threshold)."""
    return _tracker.get_potential_leaks(min_age_seconds)


def get_leak_warnings() -> list[str]:
    """Get and clear leak warnings."""
    return _tracker.get_leak_warnings()


def get_memory_summary() -> dict:
    """Get summary of tracked resources and memory usage."""
    return _tracker.get_memory_summary()


def clear_tracking() -> None:
    """Clear all tracking data."""
    _tracker.clear()


# ============================================================================
# FFI Function Caching
# ============================================================================

P = ParamSpec("P")
R = TypeVar("R")


def cached_ffi_call(maxsize: int = 128):
    """Decorator to cache FFI function results.

    Use this for FFI functions that return the same result for the same inputs
    and don't have side effects.

    Args:
        maxsize: Maximum cache size (default 128)

    Example:
        >>> @cached_ffi_call(maxsize=64)
        ... def get_device_rgb_colorspace(ctx_handle: int) -> int:
        ...     return lib.fz_device_rgb(ctx_handle)
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        cached = functools.lru_cache(maxsize=maxsize)(func)

        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            return cached(*args, **kwargs)

        # Expose cache info
        wrapper.cache_info = cached.cache_info  # type: ignore
        wrapper.cache_clear = cached.cache_clear  # type: ignore

        return wrapper

    return decorator


# Pre-cached FFI lookups for frequently used operations
_ffi_cache: dict[str, object] = {}
_ffi_cache_lock = threading.Lock()


def get_cached_ffi_func(name: str):
    """Get a cached FFI function by name.

    This avoids repeated attribute lookups on the FFI lib object.

    Args:
        name: Name of the FFI function

    Returns:
        The cached FFI function
    """
    with _ffi_cache_lock:
        if name not in _ffi_cache:
            from .ffi import lib
            _ffi_cache[name] = getattr(lib, name)
        return _ffi_cache[name]


def clear_ffi_cache() -> None:
    """Clear the FFI function cache."""
    with _ffi_cache_lock:
        _ffi_cache.clear()


# ============================================================================
# Memory Debugging Utilities
# ============================================================================

def get_object_memory_size(obj: object) -> int:
    """Get memory size of a Python object.

    For MicroPDF objects, this uses __sizeof__ if available,
    otherwise falls back to sys.getsizeof.
    """
    if hasattr(obj, "__sizeof__"):
        return obj.__sizeof__()
    return sys.getsizeof(obj)


def get_all_object_sizes() -> dict[str, int]:
    """Get memory sizes of all common MicroPDF types.

    Returns:
        Dictionary mapping type names to their base sizes
    """
    from .geometry import Point, Rect, IRect, Matrix, Quad
    from .context import Context
    from .buffer import Buffer

    # Create minimal instances to measure
    sizes = {
        "Point": Point(0, 0).__sizeof__(),
        "Rect": Rect(0, 0, 0, 0).__sizeof__(),
        "IRect": IRect(0, 0, 0, 0).__sizeof__(),
        "Matrix": Matrix(1, 0, 0, 1, 0, 0).__sizeof__(),
    }

    # Add base sizes for types we can't easily instantiate
    sizes["Context"] = 56  # Approximate
    sizes["Document"] = 56  # Approximate
    sizes["Page"] = 56  # Approximate
    sizes["Buffer"] = 56  # Approximate
    sizes["Pixmap"] = 56  # Approximate

    return sizes


def print_memory_report(min_age_seconds: float = 60.0) -> None:
    """Print a comprehensive memory report.

    Args:
        min_age_seconds: Minimum age for potential leak detection
    """
    summary = get_memory_summary()
    leaks = get_potential_leaks(min_age_seconds)
    warnings = get_leak_warnings()

    print("=" * 60)
    print("MicroPDF Memory Report (Python)")
    print("=" * 60)
    print()

    print(f"Total tracked resources: {summary['total_tracked']}")
    print(f"Total Python memory: {summary['total_python_bytes']} bytes")
    print(f"Leak warnings: {summary['leak_warnings']}")
    print()

    if summary["by_type"]:
        print("Resources by type:")
        for rtype, info in summary["by_type"].items():
            print(f"  {rtype}: {info['count']} ({info['python_bytes']} bytes)")
        print()

    if leaks:
        print(f"Potential leaks (older than {min_age_seconds}s): {len(leaks)}")
        for leak in leaks[:10]:
            age = leak.age().total_seconds()
            print(
                f"  {leak.resource_type} (handle={leak.handle}): "
                f"age={age:.1f}s{f', tag={leak.tag}' if leak.tag else ''}"
            )
        if len(leaks) > 10:
            print(f"  ... and {len(leaks) - 10} more")
        print()

    if warnings:
        print("Leak warnings:")
        for warning in warnings[:5]:
            print(f"  {warning}")
        if len(warnings) > 5:
            print(f"  ... and {len(warnings) - 5} more")


# ============================================================================
# Context Manager Utilities
# ============================================================================

class ResourceScope:
    """Context manager for automatic resource cleanup.

    Tracks all resources created within the scope and ensures
    they are properly closed when exiting.

    Example:
        >>> with ResourceScope() as scope:
        ...     ctx = scope.add(Context())
        ...     doc = scope.add(Document.open(ctx, "file.pdf"))
        ...     # Resources automatically closed on exit
    """

    def __init__(self) -> None:
        self._resources: list[object] = []

    def add(self, resource: R) -> R:
        """Add a resource to the scope.

        Args:
            resource: Resource to track (must have drop() or close() method)

        Returns:
            The same resource (for chaining)
        """
        self._resources.append(resource)
        return resource

    def __enter__(self) -> "ResourceScope":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        # Close resources in reverse order
        for resource in reversed(self._resources):
            try:
                if hasattr(resource, "drop"):
                    resource.drop()
                elif hasattr(resource, "close"):
                    resource.close()
            except Exception:
                pass  # Ignore cleanup errors


__all__ = [
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
]

