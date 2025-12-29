"""Memory Profiler - Detailed memory leak detection for MicroPDF.

This module provides comprehensive memory profiling capabilities:
- Handle allocation tracking with stack traces
- Leak detection for unreleased handles
- Memory usage statistics by type
- Integration with tracemalloc for detailed allocation tracking

Example:
    >>> from micropdf.profiler import enable_profiling, get_leak_report
    >>> enable_profiling(True)
    >>> # ... use MicroPDF ...
    >>> report = get_leak_report(min_age_seconds=60)
    >>> print(report)
"""

from __future__ import annotations

import gc
import sys
import threading
import traceback
import tracemalloc
import weakref
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import IntEnum
from typing import Callable, ClassVar


class ResourceType(IntEnum):
    """Resource types being tracked."""

    CONTEXT = 0
    BUFFER = 1
    STREAM = 2
    PIXMAP = 3
    DOCUMENT = 4
    PAGE = 5
    FONT = 6
    IMAGE = 7
    PATH = 8
    TEXT = 9
    DEVICE = 10
    DISPLAY_LIST = 11
    COLORSPACE = 12
    PDF_OBJECT = 13
    OUTLINE = 14
    LINK = 15
    ANNOTATION = 16
    STEXT_PAGE = 17
    COOKIE = 18
    ARCHIVE = 19
    OTHER = 255

    @property
    def display_name(self) -> str:
        """Get human-readable name."""
        names = {
            ResourceType.CONTEXT: "Context",
            ResourceType.BUFFER: "Buffer",
            ResourceType.STREAM: "Stream",
            ResourceType.PIXMAP: "Pixmap",
            ResourceType.DOCUMENT: "Document",
            ResourceType.PAGE: "Page",
            ResourceType.FONT: "Font",
            ResourceType.IMAGE: "Image",
            ResourceType.PATH: "Path",
            ResourceType.TEXT: "Text",
            ResourceType.DEVICE: "Device",
            ResourceType.DISPLAY_LIST: "DisplayList",
            ResourceType.COLORSPACE: "Colorspace",
            ResourceType.PDF_OBJECT: "PdfObject",
            ResourceType.OUTLINE: "Outline",
            ResourceType.LINK: "Link",
            ResourceType.ANNOTATION: "Annotation",
            ResourceType.STEXT_PAGE: "StextPage",
            ResourceType.COOKIE: "Cookie",
            ResourceType.ARCHIVE: "Archive",
            ResourceType.OTHER: "Other",
        }
        return names.get(self, f"Unknown({self.value})")


@dataclass
class AllocationRecord:
    """Record of a single allocation."""

    handle: int
    resource_type: ResourceType
    size_bytes: int
    allocated_at: datetime
    stack_trace: str | None = None
    tag: str | None = None

    def age(self) -> timedelta:
        """Get the age of this allocation."""
        return datetime.now() - self.allocated_at


@dataclass
class TypeStats:
    """Statistics for a specific resource type."""

    current_count: int = 0
    current_bytes: int = 0
    total_allocated: int = 0
    total_deallocated: int = 0
    total_bytes_allocated: int = 0
    total_bytes_deallocated: int = 0
    peak_count: int = 0
    peak_bytes: int = 0


@dataclass
class GlobalStats:
    """Global statistics snapshot."""

    total_handles_created: int
    total_handles_destroyed: int
    current_handles: int
    current_bytes: int
    peak_handles: int
    peak_bytes: int
    uptime: timedelta


@dataclass
class LeakReport:
    """Leak detection report."""

    generated_at: datetime
    min_age_threshold: timedelta
    total_potential_leaks: int
    leaks_by_type: dict[ResourceType, list[AllocationRecord]]
    global_stats: GlobalStats

    def __str__(self) -> str:
        """Generate a human-readable report."""
        lines = []

        lines.append("=== MicroPDF Memory Leak Report (Python) ===")
        lines.append("")
        lines.append(f"Generated: {self.generated_at.isoformat()}")
        lines.append(f"Min age threshold: {self.min_age_threshold}")
        lines.append(f"Total potential leaks: {self.total_potential_leaks}")
        lines.append("")

        lines.append("--- Global Statistics ---")
        lines.append(f"Handles created: {self.global_stats.total_handles_created}")
        lines.append(f"Handles destroyed: {self.global_stats.total_handles_destroyed}")
        lines.append(f"Current handles: {self.global_stats.current_handles}")
        lines.append(f"Current memory: {self.global_stats.current_bytes} bytes")
        lines.append(f"Peak handles: {self.global_stats.peak_handles}")
        lines.append(f"Peak memory: {self.global_stats.peak_bytes} bytes")
        lines.append(f"Uptime: {self.global_stats.uptime}")
        lines.append("")

        lines.append("--- Leaks by Type ---")

        for resource_type in sorted(self.leaks_by_type.keys(), key=lambda x: x.value):
            leaks = self.leaks_by_type[resource_type]
            if not leaks:
                continue

            lines.append("")
            lines.append(f"{resource_type.display_name} ({len(leaks)} leaks):")

            # Sort by age (oldest first)
            sorted_leaks = sorted(leaks, key=lambda x: x.allocated_at)

            for i, leak in enumerate(sorted_leaks[:10]):
                age = leak.age()
                line = f"  {i + 1}. Handle {leak.handle} - {leak.size_bytes} bytes, age {age}"
                if leak.tag:
                    line += f", tag: {leak.tag}"
                lines.append(line)

                if leak.stack_trace:
                    for stack_line in leak.stack_trace.split("\n")[:5]:
                        lines.append(f"      {stack_line.strip()}")

            if len(sorted_leaks) > 10:
                lines.append(f"  ... and {len(sorted_leaks) - 10} more")

        return "\n".join(lines)


class MemoryProfiler:
    """Memory profiler for tracking handle allocations and detecting leaks."""

    _instance: ClassVar[MemoryProfiler | None] = None
    _lock: ClassVar[threading.Lock] = threading.Lock()

    def __init__(self) -> None:
        """Initialize the profiler."""
        self._enabled = False
        self._capture_stack_traces = False
        self._allocations: dict[int, AllocationRecord] = {}
        self._stats_by_type: dict[ResourceType, TypeStats] = {}
        self._start_time = datetime.now()
        self._lock = threading.RLock()

        # Counters
        self._total_created = 0
        self._total_destroyed = 0
        self._current_handles = 0
        self._current_bytes = 0
        self._peak_handles = 0
        self._peak_bytes = 0

        # WeakRef tracking for detecting objects that were GC'd without cleanup
        self._weak_refs: dict[int, weakref.ref] = {}
        self._weak_ref_callback: Callable[[weakref.ref], None] | None = None

    @classmethod
    def get_instance(cls) -> MemoryProfiler:
        """Get the singleton profiler instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def set_enabled(self, enabled: bool) -> None:
        """Enable or disable profiling."""
        self._enabled = enabled

    def set_stack_trace_capture(self, enabled: bool) -> None:
        """Enable or disable stack trace capture."""
        self._capture_stack_traces = enabled

    def is_enabled(self) -> bool:
        """Check if profiling is enabled."""
        return self._enabled

    def record_allocation(
        self,
        handle: int,
        resource_type: ResourceType,
        size_bytes: int,
        tag: str | None = None,
    ) -> None:
        """Record a new allocation."""
        if not self._enabled:
            return

        record = AllocationRecord(
            handle=handle,
            resource_type=resource_type,
            size_bytes=size_bytes,
            allocated_at=datetime.now(),
            tag=tag,
        )

        if self._capture_stack_traces:
            record.stack_trace = "".join(traceback.format_stack()[:-1])

        with self._lock:
            self._allocations[handle] = record

            # Update type stats
            if resource_type not in self._stats_by_type:
                self._stats_by_type[resource_type] = TypeStats()
            stats = self._stats_by_type[resource_type]

            stats.current_count += 1
            stats.current_bytes += size_bytes
            stats.total_allocated += 1
            stats.total_bytes_allocated += size_bytes
            stats.peak_count = max(stats.peak_count, stats.current_count)
            stats.peak_bytes = max(stats.peak_bytes, stats.current_bytes)

            # Update global stats
            self._total_created += 1
            self._current_handles += 1
            self._current_bytes += size_bytes
            self._peak_handles = max(self._peak_handles, self._current_handles)
            self._peak_bytes = max(self._peak_bytes, self._current_bytes)

    def record_deallocation(self, handle: int) -> AllocationRecord | None:
        """Record a deallocation."""
        if not self._enabled:
            return None

        with self._lock:
            record = self._allocations.pop(handle, None)
            if record is None:
                return None

            # Update type stats
            stats = self._stats_by_type.get(record.resource_type)
            if stats:
                stats.current_count -= 1
                stats.current_bytes -= record.size_bytes
                stats.total_deallocated += 1
                stats.total_bytes_deallocated += record.size_bytes

            # Update global stats
            self._total_destroyed += 1
            self._current_handles -= 1
            self._current_bytes -= record.size_bytes

            # Remove weak ref if present
            self._weak_refs.pop(handle, None)

            return record

    def register_weak_ref(
        self, target: object, handle: int, resource_type: ResourceType
    ) -> None:
        """Register an object for GC tracking."""
        if not self._enabled:
            return

        def callback(ref: weakref.ref) -> None:
            if handle in self._allocations:
                print(
                    f"[MicroPDF] Handle {handle} ({resource_type.display_name}) "
                    f"was garbage collected without being explicitly freed.",
                    file=sys.stderr,
                )

        try:
            ref = weakref.ref(target, callback)
            with self._lock:
                self._weak_refs[handle] = ref
        except TypeError:
            # Some objects don't support weak references
            pass

    def get_live_allocations(self) -> list[AllocationRecord]:
        """Get all currently live allocations."""
        with self._lock:
            return list(self._allocations.values())

    def get_potential_leaks(self, min_age: timedelta) -> list[AllocationRecord]:
        """Get allocations older than min_age (potential leaks)."""
        cutoff = datetime.now() - min_age
        with self._lock:
            return [r for r in self._allocations.values() if r.allocated_at < cutoff]

    def get_stats_by_type(self) -> dict[ResourceType, TypeStats]:
        """Get statistics by resource type."""
        with self._lock:
            return {k: TypeStats(**v.__dict__) for k, v in self._stats_by_type.items()}

    def get_global_stats(self) -> GlobalStats:
        """Get global statistics snapshot."""
        with self._lock:
            return GlobalStats(
                total_handles_created=self._total_created,
                total_handles_destroyed=self._total_destroyed,
                current_handles=self._current_handles,
                current_bytes=self._current_bytes,
                peak_handles=self._peak_handles,
                peak_bytes=self._peak_bytes,
                uptime=datetime.now() - self._start_time,
            )

    def reset(self) -> None:
        """Reset all profiling data."""
        with self._lock:
            self._allocations.clear()
            self._stats_by_type.clear()
            self._weak_refs.clear()
            self._total_created = 0
            self._total_destroyed = 0
            self._current_handles = 0
            self._current_bytes = 0
            self._peak_handles = 0
            self._peak_bytes = 0
            self._start_time = datetime.now()

    def generate_leak_report(self, min_age: timedelta) -> LeakReport:
        """Generate a leak report."""
        leaks = self.get_potential_leaks(min_age)

        leaks_by_type: dict[ResourceType, list[AllocationRecord]] = {}
        for leak in leaks:
            if leak.resource_type not in leaks_by_type:
                leaks_by_type[leak.resource_type] = []
            leaks_by_type[leak.resource_type].append(leak)

        return LeakReport(
            generated_at=datetime.now(),
            min_age_threshold=min_age,
            total_potential_leaks=len(leaks),
            leaks_by_type=leaks_by_type,
            global_stats=self.get_global_stats(),
        )


# Module-level convenience functions


def get_profiler() -> MemoryProfiler:
    """Get the global memory profiler instance."""
    return MemoryProfiler.get_instance()


def enable_profiling(enabled: bool = True) -> None:
    """Enable or disable memory profiling."""
    get_profiler().set_enabled(enabled)


def enable_stack_traces(enabled: bool = True) -> None:
    """Enable or disable stack trace capture."""
    get_profiler().set_stack_trace_capture(enabled)


def is_profiling_enabled() -> bool:
    """Check if profiling is enabled."""
    return get_profiler().is_enabled()


def track_allocation(
    handle: int,
    resource_type: ResourceType,
    size_bytes: int,
    tag: str | None = None,
) -> None:
    """Track an allocation."""
    get_profiler().record_allocation(handle, resource_type, size_bytes, tag)


def track_deallocation(handle: int) -> None:
    """Track a deallocation."""
    get_profiler().record_deallocation(handle)


def get_leak_report(min_age_seconds: float = 60.0) -> LeakReport:
    """Get a leak report for allocations older than min_age_seconds."""
    return get_profiler().generate_leak_report(timedelta(seconds=min_age_seconds))


def print_leak_report(min_age_seconds: float = 60.0) -> None:
    """Print a leak report to stdout."""
    report = get_leak_report(min_age_seconds)
    print(report)


def reset_profiler() -> None:
    """Reset the profiler."""
    get_profiler().reset()


# tracemalloc integration


def start_tracemalloc(nframes: int = 25) -> None:
    """Start tracemalloc for detailed Python memory tracking."""
    tracemalloc.start(nframes)


def stop_tracemalloc() -> None:
    """Stop tracemalloc."""
    tracemalloc.stop()


def get_tracemalloc_snapshot() -> tracemalloc.Snapshot | None:
    """Get current tracemalloc snapshot."""
    if tracemalloc.is_tracing():
        return tracemalloc.take_snapshot()
    return None


def print_tracemalloc_top(limit: int = 10) -> None:
    """Print top memory allocations from tracemalloc."""
    if not tracemalloc.is_tracing():
        print("tracemalloc is not running. Call start_tracemalloc() first.")
        return

    snapshot = tracemalloc.take_snapshot()
    stats = snapshot.statistics("lineno")

    print("=== Top Memory Allocations (tracemalloc) ===")
    for i, stat in enumerate(stats[:limit], 1):
        print(f"{i}. {stat}")


def compare_snapshots(
    snapshot1: tracemalloc.Snapshot,
    snapshot2: tracemalloc.Snapshot,
    limit: int = 10,
) -> None:
    """Compare two tracemalloc snapshots and print differences."""
    stats = snapshot2.compare_to(snapshot1, "lineno")

    print("=== Memory Allocation Changes ===")
    for i, stat in enumerate(stats[:limit], 1):
        print(f"{i}. {stat}")


# GC integration


def force_gc() -> dict:
    """Force garbage collection and return statistics."""
    gc.collect()
    return {
        "collected": gc.get_count(),
        "garbage": len(gc.garbage),
        "objects_tracked": len(gc.get_objects()),
    }


def print_gc_stats() -> None:
    """Print garbage collector statistics."""
    print("=== Garbage Collector Statistics ===")
    print(f"Counts: {gc.get_count()}")
    print(f"Thresholds: {gc.get_threshold()}")
    print(f"Objects tracked: {len(gc.get_objects())}")
    print(f"Garbage (uncollectable): {len(gc.garbage)}")


def get_memory_usage() -> dict:
    """Get current process memory usage (requires psutil)."""
    try:
        import psutil

        process = psutil.Process()
        mem_info = process.memory_info()
        return {
            "rss": mem_info.rss,
            "vms": mem_info.vms,
            "rss_mb": mem_info.rss / 1024 / 1024,
            "vms_mb": mem_info.vms / 1024 / 1024,
        }
    except ImportError:
        return {"error": "psutil not installed"}


def print_memory_usage() -> None:
    """Print current process memory usage."""
    mem = get_memory_usage()
    print("=== Process Memory Usage ===")
    if "error" in mem:
        print(f"Error: {mem['error']}")
    else:
        print(f"RSS: {mem['rss_mb']:.2f} MB")
        print(f"VMS: {mem['vms_mb']:.2f} MB")

