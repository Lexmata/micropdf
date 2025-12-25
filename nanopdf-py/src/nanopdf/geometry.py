"""Geometry primitives for PDF operations."""

from __future__ import annotations
from typing import Tuple, Optional
from .ffi import ffi, lib


class Point:
    """2D point with x and y coordinates.

    Args:
        x: X coordinate
        y: Y coordinate

    Example:
        >>> p = Point(10, 20)
        >>> p.x, p.y
        (10.0, 20.0)
    """

    def __init__(self, x: float, y: float) -> None:
        self.x = float(x)
        self.y = float(y)

    def transform(self, matrix: Matrix) -> Point:
        """Transform the point by a matrix."""
        m = matrix._to_c()
        x = self.x * m.a + self.y * m.c + m.e
        y = self.x * m.b + self.y * m.d + m.f
        return Point(x, y)

    def distance(self, other: Point) -> float:
        """Calculate Euclidean distance to another point."""
        dx = self.x - other.x
        dy = self.y - other.y
        return (dx * dx + dy * dy) ** 0.5

    def __repr__(self) -> str:
        return f"Point({self.x}, {self.y})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return False
        return self.x == other.x and self.y == other.y


class Rect:
    """Rectangle defined by two corners (x0, y0) and (x1, y1).

    Args:
        x0: Left edge
        y0: Top edge
        x1: Right edge
        y1: Bottom edge

    Example:
        >>> r = Rect(0, 0, 612, 792)  # US Letter
        >>> r.width(), r.height()
        (612.0, 792.0)
    """

    def __init__(self, x0: float, y0: float, x1: float, y1: float) -> None:
        self.x0 = float(x0)
        self.y0 = float(y0)
        self.x1 = float(x1)
        self.y1 = float(y1)

    def width(self) -> float:
        """Get rectangle width."""
        return abs(self.x1 - self.x0)

    def height(self) -> float:
        """Get rectangle height."""
        return abs(self.y1 - self.y0)

    def area(self) -> float:
        """Get rectangle area."""
        return self.width() * self.height()

    def is_empty(self) -> bool:
        """Check if rectangle is empty."""
        return self.x0 >= self.x1 or self.y0 >= self.y1

    def is_infinite(self) -> bool:
        """Check if rectangle is infinite."""
        inf = float('inf')
        return self.x0 == -inf and self.y0 == -inf and self.x1 == inf and self.y1 == inf

    def contains(self, point: Point) -> bool:
        """Check if rectangle contains a point."""
        return (
            self.x0 <= point.x <= self.x1 and
            self.y0 <= point.y <= self.y1
        )

    def intersect(self, other: Rect) -> Optional[Rect]:
        """Get intersection with another rectangle."""
        x0 = max(self.x0, other.x0)
        y0 = max(self.y0, other.y0)
        x1 = min(self.x1, other.x1)
        y1 = min(self.y1, other.y1)

        if x0 >= x1 or y0 >= y1:
            return None

        return Rect(x0, y0, x1, y1)

    def union(self, other: Rect) -> Rect:
        """Get union with another rectangle."""
        if self.is_empty():
            return other
        if other.is_empty():
            return self

        return Rect(
            min(self.x0, other.x0),
            min(self.y0, other.y0),
            max(self.x1, other.x1),
            max(self.y1, other.y1),
        )

    def transform(self, matrix: Matrix) -> Rect:
        """Transform rectangle by a matrix."""
        # Transform all four corners
        corners = [
            Point(self.x0, self.y0).transform(matrix),
            Point(self.x1, self.y0).transform(matrix),
            Point(self.x0, self.y1).transform(matrix),
            Point(self.x1, self.y1).transform(matrix),
        ]

        # Find bounding box
        xs = [p.x for p in corners]
        ys = [p.y for p in corners]

        return Rect(min(xs), min(ys), max(xs), max(ys))

    def __repr__(self) -> str:
        return f"Rect({self.x0}, {self.y0}, {self.x1}, {self.y1})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Rect):
            return False
        return (
            self.x0 == other.x0 and
            self.y0 == other.y0 and
            self.x1 == other.x1 and
            self.y1 == other.y1
        )

    @staticmethod
    def _from_c(c_rect: "ffi.CData") -> Rect:
        """Create Rect from C fz_rect structure."""
        return Rect(c_rect.x0, c_rect.y0, c_rect.x1, c_rect.y1)

    def _to_c(self) -> "ffi.CData":
        """Convert to C fz_rect structure."""
        return ffi.new("fz_rect*", {
            "x0": self.x0,
            "y0": self.y0,
            "x1": self.x1,
            "y1": self.y1,
        })[0]


class IRect:
    """Integer rectangle (for pixel operations).

    Args:
        x0: Left edge (integer)
        y0: Top edge (integer)
        x1: Right edge (integer)
        y1: Bottom edge (integer)
    """

    def __init__(self, x0: int, y0: int, x1: int, y1: int) -> None:
        self.x0 = int(x0)
        self.y0 = int(y0)
        self.x1 = int(x1)
        self.y1 = int(y1)

    def width(self) -> int:
        """Get rectangle width."""
        return abs(self.x1 - self.x0)

    def height(self) -> int:
        """Get rectangle height."""
        return abs(self.y1 - self.y0)

    def __repr__(self) -> str:
        return f"IRect({self.x0}, {self.y0}, {self.x1}, {self.y1})"


class Matrix:
    """2D transformation matrix.

    Matrix is represented as [a, b, c, d, e, f] where:
        [ a  c  e ]
        [ b  d  f ]
        [ 0  0  1 ]

    Args:
        a, b, c, d, e, f: Matrix coefficients

    Example:
        >>> m = Matrix.scale(2, 2)  # 2x scale
        >>> m = Matrix.rotate(90)   # 90 degree rotation
    """

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
    def identity() -> Matrix:
        """Create identity matrix."""
        m = lib.fz_identity()
        return Matrix(m.a, m.b, m.c, m.d, m.e, m.f)

    @staticmethod
    def scale(sx: float, sy: float) -> Matrix:
        """Create scale matrix."""
        m = lib.fz_scale(sx, sy)
        return Matrix(m.a, m.b, m.c, m.d, m.e, m.f)

    @staticmethod
    def translate(tx: float, ty: float) -> Matrix:
        """Create translation matrix."""
        m = lib.fz_translate(tx, ty)
        return Matrix(m.a, m.b, m.c, m.d, m.e, m.f)

    @staticmethod
    def rotate(degrees: float) -> Matrix:
        """Create rotation matrix."""
        m = lib.fz_rotate(degrees)
        return Matrix(m.a, m.b, m.c, m.d, m.e, m.f)

    def concat(self, other: Matrix) -> Matrix:
        """Concatenate with another matrix."""
        m1 = self._to_c()
        m2 = other._to_c()
        result = lib.fz_concat(m1, m2)
        return Matrix(result.a, result.b, result.c, result.d, result.e, result.f)

    def __matmul__(self, other: Matrix) -> Matrix:
        """Matrix multiplication using @ operator."""
        return self.concat(other)

    def __repr__(self) -> str:
        return f"Matrix({self.a}, {self.b}, {self.c}, {self.d}, {self.e}, {self.f})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Matrix):
            return False
        return (
            self.a == other.a and
            self.b == other.b and
            self.c == other.c and
            self.d == other.d and
            self.e == other.e and
            self.f == other.f
        )

    def _to_c(self) -> "ffi.CData":
        """Convert to C fz_matrix structure."""
        return ffi.new("fz_matrix*", {
            "a": self.a,
            "b": self.b,
            "c": self.c,
            "d": self.d,
            "e": self.e,
            "f": self.f,
        })[0]

    @staticmethod
    def _from_c(c_matrix: "ffi.CData") -> Matrix:
        """Create Matrix from C fz_matrix structure."""
        return Matrix(
            c_matrix.a,
            c_matrix.b,
            c_matrix.c,
            c_matrix.d,
            c_matrix.e,
            c_matrix.f,
        )


class Quad:
    """Quadrilateral defined by four corner points.

    Used for rotated text bounding boxes.

    Args:
        ul: Upper-left point
        ur: Upper-right point
        ll: Lower-left point
        lr: Lower-right point
    """

    def __init__(self, ul: Point, ur: Point, ll: Point, lr: Point) -> None:
        self.ul = ul
        self.ur = ur
        self.ll = ll
        self.lr = lr

    @staticmethod
    def from_rect(rect: Rect) -> Quad:
        """Create quad from axis-aligned rectangle."""
        return Quad(
            Point(rect.x0, rect.y0),  # upper-left
            Point(rect.x1, rect.y0),  # upper-right
            Point(rect.x0, rect.y1),  # lower-left
            Point(rect.x1, rect.y1),  # lower-right
        )

    def to_rect(self) -> Rect:
        """Convert to axis-aligned bounding rectangle."""
        xs = [self.ul.x, self.ur.x, self.ll.x, self.lr.x]
        ys = [self.ul.y, self.ur.y, self.ll.y, self.lr.y]
        return Rect(min(xs), min(ys), max(xs), max(ys))

    def __repr__(self) -> str:
        return f"Quad(ul={self.ul}, ur={self.ur}, ll={self.ll}, lr={self.lr})"


__all__ = ["Point", "Rect", "IRect", "Matrix", "Quad"]

