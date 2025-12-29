#!/usr/bin/env python3
"""
Cross-Language Overhead Measurement - Python Binding

This measures FFI overhead for Python bindings compared to the Rust baseline.

Run with: python benchmarks/cross_language_overhead.py
"""

from __future__ import annotations

import json
import math
import time
from dataclasses import dataclass
from typing import Callable, List, Optional

ITERATIONS = 100_000
WARMUP_ITERATIONS = 1_000


@dataclass
class BenchResult:
    name: str
    iterations: int
    total_ns: int
    avg_ns: float
    throughput: float

    @staticmethod
    def create(name: str, iterations: int, total_ns: int) -> "BenchResult":
        avg_ns = total_ns / iterations
        throughput = 1_000_000_000.0 / avg_ns
        return BenchResult(
            name=name,
            iterations=iterations,
            total_ns=total_ns,
            avg_ns=avg_ns,
            throughput=throughput,
        )

    def print(self) -> None:
        print(
            f"{self.name:<40} {self.iterations:>10} iterations, "
            f"{self.avg_ns:>10.2f} ns/op, {self.throughput:>12.0f} ops/sec"
        )

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "iterations": self.iterations,
            "total_ns": self.total_ns,
            "avg_ns": self.avg_ns,
            "throughput": self.throughput,
        }


def warmup(f: Callable[[], None]) -> None:
    """Warmup function to trigger optimizations."""
    for _ in range(WARMUP_ITERATIONS):
        f()


def bench(name: str, iterations: int, f: Callable[[], None]) -> BenchResult:
    """Time a function."""
    warmup(f)

    start = time.perf_counter_ns()
    for _ in range(iterations):
        f()
    elapsed = time.perf_counter_ns() - start

    return BenchResult.create(name, iterations, elapsed)


# ============================================================================
# Geometry Types (Pure Python implementation for baseline)
# ============================================================================


class Point:
    """2D point."""

    __slots__ = ("x", "y")

    def __init__(self, x: float, y: float) -> None:
        self.x = float(x)
        self.y = float(y)

    def transform(self, m: "Matrix") -> "Point":
        return Point(
            self.x * m.a + self.y * m.c + m.e,
            self.x * m.b + self.y * m.d + m.f,
        )


class Rect:
    """Rectangle."""

    __slots__ = ("x0", "y0", "x1", "y1")

    def __init__(self, x0: float, y0: float, x1: float, y1: float) -> None:
        self.x0 = float(x0)
        self.y0 = float(y0)
        self.x1 = float(x1)
        self.y1 = float(y1)

    def contains(self, p: Point) -> bool:
        return self.x0 <= p.x <= self.x1 and self.y0 <= p.y <= self.y1

    def union(self, other: "Rect") -> "Rect":
        return Rect(
            min(self.x0, other.x0),
            min(self.y0, other.y0),
            max(self.x1, other.x1),
            max(self.y1, other.y1),
        )

    def transform(self, m: "Matrix") -> "Rect":
        # Transform all 4 corners
        p1x = self.x0 * m.a + self.y0 * m.c + m.e
        p1y = self.x0 * m.b + self.y0 * m.d + m.f
        p2x = self.x1 * m.a + self.y0 * m.c + m.e
        p2y = self.x1 * m.b + self.y0 * m.d + m.f
        p3x = self.x0 * m.a + self.y1 * m.c + m.e
        p3y = self.x0 * m.b + self.y1 * m.d + m.f
        p4x = self.x1 * m.a + self.y1 * m.c + m.e
        p4y = self.x1 * m.b + self.y1 * m.d + m.f

        return Rect(
            min(p1x, p2x, p3x, p4x),
            min(p1y, p2y, p3y, p4y),
            max(p1x, p2x, p3x, p4x),
            max(p1y, p2y, p3y, p4y),
        )


class Matrix:
    """2D transformation matrix."""

    __slots__ = ("a", "b", "c", "d", "e", "f")

    def __init__(
        self, a: float, b: float, c: float, d: float, e: float, f: float
    ) -> None:
        self.a = float(a)
        self.b = float(b)
        self.c = float(c)
        self.d = float(d)
        self.e = float(e)
        self.f = float(f)

    @staticmethod
    def identity() -> "Matrix":
        return Matrix(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    @staticmethod
    def scale(sx: float, sy: float) -> "Matrix":
        return Matrix(float(sx), 0.0, 0.0, float(sy), 0.0, 0.0)

    @staticmethod
    def rotate(degrees: float) -> "Matrix":
        rad = math.radians(degrees)
        cos = math.cos(rad)
        sin = math.sin(rad)
        return Matrix(cos, sin, -sin, cos, 0.0, 0.0)

    @staticmethod
    def translate(tx: float, ty: float) -> "Matrix":
        return Matrix(1.0, 0.0, 0.0, 1.0, float(tx), float(ty))

    def concat(self, other: "Matrix") -> "Matrix":
        return Matrix(
            self.a * other.a + self.b * other.c,
            self.a * other.b + self.b * other.d,
            self.c * other.a + self.d * other.c,
            self.c * other.b + self.d * other.d,
            self.e * other.a + self.f * other.c + other.e,
            self.e * other.b + self.f * other.d + other.f,
        )

    def invert(self) -> Optional["Matrix"]:
        det = self.a * self.d - self.b * self.c
        if abs(det) < 1e-14:
            return None
        inv_det = 1.0 / det
        return Matrix(
            self.d * inv_det,
            -self.b * inv_det,
            -self.c * inv_det,
            self.a * inv_det,
            (self.c * self.f - self.d * self.e) * inv_det,
            (self.b * self.e - self.a * self.f) * inv_det,
        )


class Buffer:
    """Dynamic byte buffer."""

    __slots__ = ("_data",)

    def __init__(self, capacity: int) -> None:
        self._data = bytearray(capacity)

    @staticmethod
    def from_slice(data: bytes) -> "Buffer":
        buf = Buffer(len(data))
        buf._data[:] = data
        return buf

    def append_data(self, data: bytes) -> None:
        self._data.extend(data)


# ============================================================================
# Main Benchmark
# ============================================================================


def main() -> None:
    print("=== Cross-Language Overhead Benchmark (Python) ===\n")
    print(f"Iterations: {ITERATIONS}")
    print(f"Warmup: {WARMUP_ITERATIONS}")
    print()

    results: List[BenchResult] = []

    # ========================================================================
    # Geometry Operations
    # ========================================================================

    print("--- Geometry Operations ---\n")

    # Point creation
    results.append(bench("point_create", ITERATIONS, lambda: Point(10.0, 20.0)))

    # Point transform
    p = Point(10.0, 20.0)
    m = Matrix.scale(2.0, 2.0)
    results.append(bench("point_transform", ITERATIONS, lambda: p.transform(m)))

    # Rect creation
    results.append(
        bench("rect_create", ITERATIONS, lambda: Rect(0.0, 0.0, 100.0, 100.0))
    )

    # Rect transform
    r = Rect(0.0, 0.0, 100.0, 100.0)
    m = Matrix.rotate(45.0)
    results.append(bench("rect_transform", ITERATIONS, lambda: r.transform(m)))

    # Rect contains point
    r = Rect(0.0, 0.0, 100.0, 100.0)
    test_point = Point(50.0, 50.0)
    results.append(
        bench("rect_contains_point", ITERATIONS, lambda: r.contains(test_point))
    )

    # Matrix creation
    results.append(bench("matrix_identity", ITERATIONS, Matrix.identity))
    results.append(bench("matrix_scale", ITERATIONS, lambda: Matrix.scale(2.0, 2.0)))
    results.append(bench("matrix_rotate", ITERATIONS, lambda: Matrix.rotate(45.0)))
    results.append(
        bench("matrix_translate", ITERATIONS, lambda: Matrix.translate(100.0, 100.0))
    )

    # Matrix concatenation
    m1 = Matrix.scale(2.0, 2.0)
    m2 = Matrix.rotate(45.0)
    results.append(bench("matrix_concat", ITERATIONS, lambda: m1.concat(m2)))

    # Matrix inversion
    m = Matrix.scale(2.0, 3.0)
    results.append(bench("matrix_invert", ITERATIONS, lambda: m.invert()))

    print()

    # ========================================================================
    # Buffer Operations
    # ========================================================================

    print("--- Buffer Operations ---\n")

    # Buffer creation
    results.append(bench("buffer_create_empty", ITERATIONS, lambda: Buffer(0)))
    results.append(bench("buffer_create_1KB", ITERATIONS, lambda: Buffer(1024)))

    # Buffer from data
    data_256 = bytes(256)
    results.append(
        bench("buffer_from_slice_256B", ITERATIONS, lambda: Buffer.from_slice(data_256))
    )

    data_1k = bytes(1024)
    results.append(
        bench("buffer_from_slice_1KB", ITERATIONS, lambda: Buffer.from_slice(data_1k))
    )

    # Buffer append
    chunk = bytes(64)

    def buffer_append_64b() -> None:
        buf = Buffer(64)
        buf.append_data(chunk)

    results.append(bench("buffer_append_64B", ITERATIONS // 10, buffer_append_64b))

    print()

    # ========================================================================
    # Combined Operations
    # ========================================================================

    print("--- Combined Operations ---\n")

    # Simulate page rendering setup
    def page_render_setup() -> None:
        dpi = 144.0
        scale = dpi / 72.0
        ctm = Matrix.scale(scale, scale)
        page_bounds = Rect(0.0, 0.0, 612.0, 792.0)
        page_bounds.transform(ctm)

    results.append(bench("page_render_setup", ITERATIONS // 10, page_render_setup))

    # Simulate text position calculation
    def text_position_calc() -> None:
        base = Point(72.0, 700.0)
        tm = Matrix.translate(0.0, -14.0)
        base.transform(tm)

    results.append(bench("text_position_calc", ITERATIONS, text_position_calc))

    # Simulate bounding box calculation for 10 items
    def bbox_calc_10_items() -> None:
        bbox = Rect(1e30, 1e30, -1e30, -1e30)
        for i in range(10):
            item = Rect(i * 10, i * 10, 100 + i * 10, 20 + i * 10)
            bbox = bbox.union(item)

    results.append(bench("bbox_calc_10_items", ITERATIONS // 10, bbox_calc_10_items))

    print()

    # ========================================================================
    # Summary
    # ========================================================================

    print("=== Summary ===\n")

    for result in results:
        result.print()

    print()

    # Output JSON for cross-language comparison
    print("--- JSON Output ---")
    print(json.dumps([r.to_dict() for r in results], indent=2))


if __name__ == "__main__":
    main()

