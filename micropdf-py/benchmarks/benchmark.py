#!/usr/bin/env python3
"""
MicroPDF Python Benchmark Suite

Usage:
    python benchmarks/benchmark.py

Requirements:
    pip install micropdf
"""

import timeit
import statistics
import sys
import platform
from datetime import datetime
from typing import Callable, List, Tuple


def benchmark(func: Callable, name: str, iterations: int = 10000, warmup: int = 1000) -> Tuple[float, float, float]:
    """Run a benchmark and return (mean_ns, min_ns, max_ns)."""
    # Warmup
    for _ in range(warmup):
        func()

    # Time the function
    times = []
    for _ in range(iterations):
        start = timeit.default_timer()
        func()
        end = timeit.default_timer()
        times.append((end - start) * 1e9)  # Convert to nanoseconds

    mean_ns = statistics.mean(times)
    min_ns = min(times)
    max_ns = max(times)

    return mean_ns, min_ns, max_ns


def format_time(ns: float) -> str:
    """Format time in appropriate units."""
    if ns >= 1e9:
        return f"{ns / 1e9:.2f} s"
    elif ns >= 1e6:
        return f"{ns / 1e6:.2f} ms"
    elif ns >= 1e3:
        return f"{ns / 1e3:.2f} µs"
    else:
        return f"{ns:.2f} ns"


def format_ops(ns: float) -> str:
    """Format operations per second."""
    if ns <= 0:
        return "N/A"
    ops = 1e9 / ns
    if ops >= 1e9:
        return f"{ops / 1e9:.2f}B"
    elif ops >= 1e6:
        return f"{ops / 1e6:.2f}M"
    elif ops >= 1e3:
        return f"{ops / 1e3:.2f}K"
    else:
        return f"{ops:.2f}"


def run_benchmarks() -> None:
    """Run all benchmarks."""
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                    MicroPDF Python Benchmark Suite                          ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print()
    print(f"Python version: {sys.version}")
    print(f"Platform: {platform.system()} {platform.machine()}")
    print(f"Date: {datetime.now().isoformat()}")

    # Import modules
    try:
        from micropdf.geometry import Point, Rect, IRect, Matrix, Quad
    except ImportError:
        print("\nError: micropdf not installed. Using pure Python geometry classes.")
        # Define pure Python versions for benchmarking
        import math

        class Point:
            __slots__ = ('x', 'y')
            def __init__(self, x: float, y: float):
                self.x = float(x)
                self.y = float(y)

            def transform(self, m: 'Matrix') -> 'Point':
                return Point(
                    self.x * m.a + self.y * m.c + m.e,
                    self.x * m.b + self.y * m.d + m.f
                )

            def distance(self, other: 'Point') -> float:
                dx = self.x - other.x
                dy = self.y - other.y
                return (dx * dx + dy * dy) ** 0.5

            def __eq__(self, other):
                return self.x == other.x and self.y == other.y

        class Rect:
            __slots__ = ('x0', 'y0', 'x1', 'y1')
            def __init__(self, x0: float, y0: float, x1: float, y1: float):
                self.x0 = float(x0)
                self.y0 = float(y0)
                self.x1 = float(x1)
                self.y1 = float(y1)

            def width(self) -> float:
                return abs(self.x1 - self.x0)

            def height(self) -> float:
                return abs(self.y1 - self.y0)

            def contains(self, p: Point) -> bool:
                return self.x0 <= p.x <= self.x1 and self.y0 <= p.y <= self.y1

            def union(self, other: 'Rect') -> 'Rect':
                return Rect(
                    min(self.x0, other.x0),
                    min(self.y0, other.y0),
                    max(self.x1, other.x1),
                    max(self.y1, other.y1)
                )

            def intersect(self, other: 'Rect') -> 'Rect':
                return Rect(
                    max(self.x0, other.x0),
                    max(self.y0, other.y0),
                    min(self.x1, other.x1),
                    min(self.y1, other.y1)
                )

            def transform(self, m: 'Matrix') -> 'Rect':
                corners = [
                    Point(self.x0, self.y0).transform(m),
                    Point(self.x1, self.y0).transform(m),
                    Point(self.x0, self.y1).transform(m),
                    Point(self.x1, self.y1).transform(m),
                ]
                xs = [p.x for p in corners]
                ys = [p.y for p in corners]
                return Rect(min(xs), min(ys), max(xs), max(ys))

        class IRect:
            __slots__ = ('x0', 'y0', 'x1', 'y1')
            def __init__(self, x0: int, y0: int, x1: int, y1: int):
                self.x0 = int(x0)
                self.y0 = int(y0)
                self.x1 = int(x1)
                self.y1 = int(y1)

            def width(self) -> int:
                return abs(self.x1 - self.x0)

            def height(self) -> int:
                return abs(self.y1 - self.y0)

        class Matrix:
            __slots__ = ('a', 'b', 'c', 'd', 'e', 'f')
            def __init__(self, a: float, b: float, c: float, d: float, e: float, f: float):
                self.a = float(a)
                self.b = float(b)
                self.c = float(c)
                self.d = float(d)
                self.e = float(e)
                self.f = float(f)

            @staticmethod
            def identity() -> 'Matrix':
                return Matrix(1, 0, 0, 1, 0, 0)

            @staticmethod
            def scale(sx: float, sy: float) -> 'Matrix':
                return Matrix(sx, 0, 0, sy, 0, 0)

            @staticmethod
            def translate(tx: float, ty: float) -> 'Matrix':
                return Matrix(1, 0, 0, 1, tx, ty)

            @staticmethod
            def rotate(degrees: float) -> 'Matrix':
                rad = math.radians(degrees)
                c = math.cos(rad)
                s = math.sin(rad)
                return Matrix(c, s, -s, c, 0, 0)

            def concat(self, other: 'Matrix') -> 'Matrix':
                return Matrix(
                    self.a * other.a + self.b * other.c,
                    self.a * other.b + self.b * other.d,
                    self.c * other.a + self.d * other.c,
                    self.c * other.b + self.d * other.d,
                    self.e * other.a + self.f * other.c + other.e,
                    self.e * other.b + self.f * other.d + other.f
                )

        class Quad:
            __slots__ = ('ul', 'ur', 'll', 'lr')
            def __init__(self, ul: Point, ur: Point, ll: Point, lr: Point):
                self.ul = ul
                self.ur = ur
                self.ll = ll
                self.lr = lr

            @staticmethod
            def from_rect(r: Rect) -> 'Quad':
                return Quad(
                    Point(r.x0, r.y0),
                    Point(r.x1, r.y0),
                    Point(r.x0, r.y1),
                    Point(r.x1, r.y1)
                )

            def to_rect(self) -> Rect:
                xs = [self.ul.x, self.ur.x, self.ll.x, self.lr.x]
                ys = [self.ul.y, self.ur.y, self.ll.y, self.lr.y]
                return Rect(min(xs), min(ys), max(xs), max(ys))

            def transform(self, m: Matrix) -> 'Quad':
                return Quad(
                    self.ul.transform(m),
                    self.ur.transform(m),
                    self.ll.transform(m),
                    self.lr.transform(m)
                )

    results: List[Tuple[str, float, float, float]] = []

    # ========================================================================
    # Point Benchmarks
    # ========================================================================
    print("\n" + "=" * 80)
    print("  Point Benchmarks")
    print("=" * 80 + "\n")

    # Point construction
    results.append(("Point constructor", *benchmark(lambda: Point(100, 200), "Point constructor")))

    # Point operations
    p1 = Point(100, 200)
    p2 = Point(300, 400)
    m = Matrix.scale(2, 2)

    results.append(("Point.transform", *benchmark(lambda: p1.transform(m), "Point.transform")))
    results.append(("Point.distance", *benchmark(lambda: p1.distance(p2), "Point.distance")))
    results.append(("Point.__eq__", *benchmark(lambda: p1 == p2, "Point.__eq__")))

    # ========================================================================
    # Rect Benchmarks
    # ========================================================================
    print("\n" + "=" * 80)
    print("  Rect Benchmarks")
    print("=" * 80 + "\n")

    results.append(("Rect constructor", *benchmark(lambda: Rect(0, 0, 100, 100), "Rect constructor")))

    r1 = Rect(0, 0, 100, 100)
    r2 = Rect(50, 50, 150, 150)
    p = Point(50, 50)

    results.append(("Rect.width", *benchmark(lambda: r1.width(), "Rect.width")))
    results.append(("Rect.height", *benchmark(lambda: r1.height(), "Rect.height")))
    results.append(("Rect.contains", *benchmark(lambda: r1.contains(p), "Rect.contains")))
    results.append(("Rect.union", *benchmark(lambda: r1.union(r2), "Rect.union")))
    results.append(("Rect.intersect", *benchmark(lambda: r1.intersect(r2), "Rect.intersect")))
    results.append(("Rect.transform", *benchmark(lambda: r1.transform(m), "Rect.transform")))

    # ========================================================================
    # IRect Benchmarks
    # ========================================================================
    print("\n" + "=" * 80)
    print("  IRect Benchmarks")
    print("=" * 80 + "\n")

    results.append(("IRect constructor", *benchmark(lambda: IRect(0, 0, 100, 100), "IRect constructor")))

    ir = IRect(0, 0, 100, 100)
    results.append(("IRect.width", *benchmark(lambda: ir.width(), "IRect.width")))
    results.append(("IRect.height", *benchmark(lambda: ir.height(), "IRect.height")))

    # ========================================================================
    # Matrix Benchmarks
    # ========================================================================
    print("\n" + "=" * 80)
    print("  Matrix Benchmarks")
    print("=" * 80 + "\n")

    results.append(("Matrix constructor", *benchmark(lambda: Matrix(1, 0, 0, 1, 0, 0), "Matrix constructor")))
    results.append(("Matrix.identity", *benchmark(lambda: Matrix.identity(), "Matrix.identity")))
    results.append(("Matrix.scale", *benchmark(lambda: Matrix.scale(2, 2), "Matrix.scale")))
    results.append(("Matrix.translate", *benchmark(lambda: Matrix.translate(10, 20), "Matrix.translate")))
    results.append(("Matrix.rotate", *benchmark(lambda: Matrix.rotate(45), "Matrix.rotate")))

    m1 = Matrix.scale(2, 2)
    m2 = Matrix.rotate(45)
    results.append(("Matrix.concat", *benchmark(lambda: m1.concat(m2), "Matrix.concat")))

    # Chain of 3 transforms
    results.append(("Matrix concat chain (3x)", *benchmark(
        lambda: Matrix.translate(10, 20).concat(Matrix.scale(2, 2)).concat(Matrix.rotate(45)),
        "Matrix concat chain"
    )))

    # ========================================================================
    # Quad Benchmarks
    # ========================================================================
    print("\n" + "=" * 80)
    print("  Quad Benchmarks")
    print("=" * 80 + "\n")

    results.append(("Quad.from_rect", *benchmark(lambda: Quad.from_rect(r1), "Quad.from_rect")))

    q = Quad.from_rect(r1)
    results.append(("Quad.to_rect", *benchmark(lambda: q.to_rect(), "Quad.to_rect")))
    results.append(("Quad.transform", *benchmark(lambda: q.transform(m), "Quad.transform")))

    # ========================================================================
    # Buffer Benchmarks (if available)
    # ========================================================================
    try:
        from micropdf.context import Context
        from micropdf.buffer import Buffer

        print("\n" + "=" * 80)
        print("  Buffer Benchmarks")
        print("=" * 80 + "\n")

        ctx = Context()

        # Buffer creation
        def create_buffer():
            buf = Buffer(ctx, 0)
            buf.drop()
        results.append(("Buffer constructor", *benchmark(create_buffer, "Buffer constructor", iterations=1000)))

        def create_buffer_capacity():
            buf = Buffer(ctx, 1024)
            buf.drop()
        results.append(("Buffer(capacity=1024)", *benchmark(create_buffer_capacity, "Buffer(capacity=1024)", iterations=1000)))

        # Buffer from bytes
        data_1kb = b"x" * 1024
        def buffer_from_bytes():
            buf = Buffer.from_bytes(ctx, data_1kb)
            buf.drop()
        results.append(("Buffer.from_bytes(1KB)", *benchmark(buffer_from_bytes, "Buffer.from_bytes", iterations=1000)))

        # Buffer operations
        buf = Buffer.from_bytes(ctx, data_1kb)
        results.append(("Buffer.length", *benchmark(lambda: buf.length(), "Buffer.length", iterations=10000)))
        results.append(("Buffer.data", *benchmark(lambda: buf.data(), "Buffer.data", iterations=1000)))
        buf.drop()

    except ImportError:
        print("\n(Buffer benchmarks skipped - native library not available)")

    # ========================================================================
    # Results Summary
    # ========================================================================
    print("\n" + "=" * 80)
    print("  Results Summary")
    print("=" * 80 + "\n")

    print("| Benchmark | Mean | Min | Max | ops/sec |")
    print("|-----------|------|-----|-----|---------|")

    for name, mean, min_val, max_val in results:
        print(f"| {name:30} | {format_time(mean):>10} | {format_time(min_val):>10} | {format_time(max_val):>10} | {format_ops(mean):>8} |")

    # Find fastest and slowest
    sorted_results = sorted(results, key=lambda x: x[1])

    print("\n" + "=" * 80)
    print("  Analysis")
    print("=" * 80 + "\n")

    print(f"Fastest: {sorted_results[0][0]} ({format_time(sorted_results[0][1])})")
    print(f"Slowest: {sorted_results[-1][0]} ({format_time(sorted_results[-1][1])})")

    # Identify bottlenecks (operations > 1µs)
    bottlenecks = [(n, m) for n, m, _, _ in results if m > 1000]
    if bottlenecks:
        print("\nBottlenecks (>1µs):")
        for name, mean in sorted(bottlenecks, key=lambda x: -x[1]):
            print(f"  - {name}: {format_time(mean)}")

    print("\n✅ Benchmark suite completed successfully\n")


if __name__ == "__main__":
    run_benchmarks()

