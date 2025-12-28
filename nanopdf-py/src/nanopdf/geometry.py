"""Geometry primitives for PDF operations.

Optimized for performance with:
- __slots__ to reduce memory and access time
- Pure Python fast paths to avoid FFI overhead
- In-place mutation variants (_inplace suffix)
- Cached rotation matrices for common angles
"""

from __future__ import annotations
from typing import Tuple, Optional, TYPE_CHECKING
import math

# Lazy import FFI only when needed for C interop
_ffi = None
_lib = None


def _get_ffi():
    """Lazy load FFI to avoid import overhead for pure Python usage."""
    global _ffi, _lib
    if _ffi is None:
        from .ffi import ffi, lib
        _ffi = ffi
        _lib = lib
    return _ffi, _lib


# Pre-computed rotation matrices for common angles (avoids trig)
_ROTATION_CACHE: dict[float, tuple[float, float, float, float, float, float]] = {
    0: (1.0, 0.0, 0.0, 1.0, 0.0, 0.0),
    90: (0.0, 1.0, -1.0, 0.0, 0.0, 0.0),
    180: (-1.0, 0.0, 0.0, -1.0, 0.0, 0.0),
    270: (0.0, -1.0, 1.0, 0.0, 0.0, 0.0),
    -90: (0.0, -1.0, 1.0, 0.0, 0.0, 0.0),
    45: (0.7071067811865476, 0.7071067811865476, -0.7071067811865476, 0.7071067811865476, 0.0, 0.0),
    -45: (0.7071067811865476, -0.7071067811865476, 0.7071067811865476, 0.7071067811865476, 0.0, 0.0),
}


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
    __slots__ = ('x', 'y')

    def __init__(self, x: float, y: float) -> None:
        self.x = float(x)
        self.y = float(y)

    def transform(self, matrix: Matrix) -> Point:
        """Transform the point by a matrix (returns new Point)."""
        # Inline calculation to avoid FFI and method calls
        return Point(
            self.x * matrix.a + self.y * matrix.c + matrix.e,
            self.x * matrix.b + self.y * matrix.d + matrix.f
        )

    def transform_inplace(self, matrix: Matrix) -> Point:
        """Transform the point in place (modifies self, returns self)."""
        x = self.x * matrix.a + self.y * matrix.c + matrix.e
        y = self.x * matrix.b + self.y * matrix.d + matrix.f
        self.x = x
        self.y = y
        return self

    def distance(self, other: Point) -> float:
        """Calculate Euclidean distance to another point."""
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx * dx + dy * dy)

    def distance_squared(self, other: Point) -> float:
        """Calculate squared distance (avoids sqrt for comparisons)."""
        dx = self.x - other.x
        dy = self.y - other.y
        return dx * dx + dy * dy

    def add(self, other: Point) -> Point:
        """Add another point."""
        return Point(self.x + other.x, self.y + other.y)

    def sub(self, other: Point) -> Point:
        """Subtract another point."""
        return Point(self.x - other.x, self.y - other.y)

    def scale(self, factor: float) -> Point:
        """Scale by a factor."""
        return Point(self.x * factor, self.y * factor)

    def __repr__(self) -> str:
        return f"Point({self.x}, {self.y})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return False
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))

    def __sizeof__(self) -> int:
        """Return size of object in bytes (for memory debugging)."""
        # Base object + 2 floats (8 bytes each)
        return object.__sizeof__(self) + 16


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
    __slots__ = ('x0', 'y0', 'x1', 'y1')

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
        """Transform rectangle by a matrix (returns new Rect)."""
        # Fast path: identity matrix (just translation)
        if matrix.a == 1.0 and matrix.b == 0.0 and matrix.c == 0.0 and matrix.d == 1.0:
            return Rect(
                self.x0 + matrix.e,
                self.y0 + matrix.f,
                self.x1 + matrix.e,
                self.y1 + matrix.f
            )

        # Fast path: axis-aligned (no rotation/shear)
        if matrix.b == 0.0 and matrix.c == 0.0:
            nx0 = self.x0 * matrix.a + matrix.e
            nx1 = self.x1 * matrix.a + matrix.e
            ny0 = self.y0 * matrix.d + matrix.f
            ny1 = self.y1 * matrix.d + matrix.f
            # Handle negative scale
            if nx0 > nx1:
                nx0, nx1 = nx1, nx0
            if ny0 > ny1:
                ny0, ny1 = ny1, ny0
            return Rect(nx0, ny0, nx1, ny1)

        # General case: transform all four corners inline
        a, b, c, d, e, f = matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f
        x0, y0, x1, y1 = self.x0, self.y0, self.x1, self.y1

        # Transform corners inline (avoid Point allocation)
        p1x = x0 * a + y0 * c + e
        p1y = x0 * b + y0 * d + f
        p2x = x1 * a + y0 * c + e
        p2y = x1 * b + y0 * d + f
        p3x = x0 * a + y1 * c + e
        p3y = x0 * b + y1 * d + f
        p4x = x1 * a + y1 * c + e
        p4y = x1 * b + y1 * d + f

        return Rect(
            min(p1x, p2x, p3x, p4x),
            min(p1y, p2y, p3y, p4y),
            max(p1x, p2x, p3x, p4x),
            max(p1y, p2y, p3y, p4y)
        )

    def transform_inplace(self, matrix: Matrix) -> Rect:
        """Transform rectangle in place (modifies self, returns self)."""
        result = self.transform(matrix)
        self.x0, self.y0, self.x1, self.y1 = result.x0, result.y0, result.x1, result.y1
        return self

    def normalize(self) -> Rect:
        """Return normalized rect (x0 <= x1, y0 <= y1)."""
        x0, x1 = (self.x0, self.x1) if self.x0 <= self.x1 else (self.x1, self.x0)
        y0, y1 = (self.y0, self.y1) if self.y0 <= self.y1 else (self.y1, self.y0)
        return Rect(x0, y0, x1, y1)

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

    def __hash__(self) -> int:
        return hash((self.x0, self.y0, self.x1, self.y1))

    def __sizeof__(self) -> int:
        """Return size of object in bytes (for memory debugging)."""
        # Base object + 4 floats (8 bytes each)
        return object.__sizeof__(self) + 32

    @staticmethod
    def _from_c(c_rect) -> Rect:
        """Create Rect from C fz_rect structure."""
        return Rect(c_rect.x0, c_rect.y0, c_rect.x1, c_rect.y1)

    def _to_c(self):
        """Convert to C fz_rect structure."""
        ffi, _ = _get_ffi()
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
    __slots__ = ('x0', 'y0', 'x1', 'y1')

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

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, IRect):
            return False
        return (
            self.x0 == other.x0 and
            self.y0 == other.y0 and
            self.x1 == other.x1 and
            self.y1 == other.y1
        )

    def __hash__(self) -> int:
        return hash((self.x0, self.y0, self.x1, self.y1))

    def __sizeof__(self) -> int:
        """Return size of object in bytes (for memory debugging)."""
        # Base object + 4 ints (4 bytes each)
        return object.__sizeof__(self) + 16


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
    __slots__ = ('a', 'b', 'c', 'd', 'e', 'f')

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
        """Create identity matrix (pure Python, no FFI)."""
        return Matrix(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

    @staticmethod
    def scale(sx: float, sy: float) -> Matrix:
        """Create scale matrix (pure Python, no FFI)."""
        return Matrix(float(sx), 0.0, 0.0, float(sy), 0.0, 0.0)

    @staticmethod
    def translate(tx: float, ty: float) -> Matrix:
        """Create translation matrix (pure Python, no FFI)."""
        return Matrix(1.0, 0.0, 0.0, 1.0, float(tx), float(ty))

    @staticmethod
    def rotate(degrees: float) -> Matrix:
        """Create rotation matrix (uses cache for common angles)."""
        # Check cache for common angles
        cached = _ROTATION_CACHE.get(degrees)
        if cached is not None:
            return Matrix(*cached)

        # Calculate sin/cos
        rad = math.radians(degrees)
        c = math.cos(rad)
        s = math.sin(rad)
        return Matrix(c, s, -s, c, 0.0, 0.0)

    @staticmethod
    def shear(sx: float, sy: float) -> Matrix:
        """Create shear matrix."""
        return Matrix(1.0, float(sy), float(sx), 1.0, 0.0, 0.0)

    def concat(self, other: Matrix) -> Matrix:
        """Concatenate with another matrix (pure Python)."""
        return Matrix(
            self.a * other.a + self.b * other.c,
            self.a * other.b + self.b * other.d,
            self.c * other.a + self.d * other.c,
            self.c * other.b + self.d * other.d,
            self.e * other.a + self.f * other.c + other.e,
            self.e * other.b + self.f * other.d + other.f
        )

    def concat_inplace(self, other: Matrix) -> Matrix:
        """Concatenate in place (modifies self, returns self)."""
        a = self.a * other.a + self.b * other.c
        b = self.a * other.b + self.b * other.d
        c = self.c * other.a + self.d * other.c
        d = self.c * other.b + self.d * other.d
        e = self.e * other.a + self.f * other.c + other.e
        f = self.e * other.b + self.f * other.d + other.f
        self.a, self.b, self.c, self.d, self.e, self.f = a, b, c, d, e, f
        return self

    def pre_translate(self, tx: float, ty: float) -> Matrix:
        """Pre-multiply by translation."""
        return Matrix.translate(tx, ty).concat(self)

    def post_translate(self, tx: float, ty: float) -> Matrix:
        """Post-multiply by translation (fast path: just add to e, f)."""
        return Matrix(self.a, self.b, self.c, self.d, self.e + tx, self.f + ty)

    def pre_scale(self, sx: float, sy: float) -> Matrix:
        """Pre-multiply by scale."""
        return Matrix.scale(sx, sy).concat(self)

    def post_scale(self, sx: float, sy: float) -> Matrix:
        """Post-multiply by scale."""
        return self.concat(Matrix.scale(sx, sy))

    def pre_rotate(self, degrees: float) -> Matrix:
        """Pre-multiply by rotation."""
        return Matrix.rotate(degrees).concat(self)

    def post_rotate(self, degrees: float) -> Matrix:
        """Post-multiply by rotation."""
        return self.concat(Matrix.rotate(degrees))

    def invert(self) -> Optional[Matrix]:
        """Invert the matrix (returns None if singular)."""
        det = self.a * self.d - self.b * self.c
        if abs(det) < 1e-10:
            return None
        inv_det = 1.0 / det
        return Matrix(
            self.d * inv_det,
            -self.b * inv_det,
            -self.c * inv_det,
            self.a * inv_det,
            (self.c * self.f - self.d * self.e) * inv_det,
            (self.b * self.e - self.a * self.f) * inv_det
        )

    def is_identity(self) -> bool:
        """Check if this is the identity matrix."""
        return (
            self.a == 1.0 and self.b == 0.0 and
            self.c == 0.0 and self.d == 1.0 and
            self.e == 0.0 and self.f == 0.0
        )

    def is_rectilinear(self) -> bool:
        """Check if the matrix maps axis-aligned rects to axis-aligned rects."""
        return (self.b == 0.0 and self.c == 0.0) or (self.a == 0.0 and self.d == 0.0)

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

    def __hash__(self) -> int:
        return hash((self.a, self.b, self.c, self.d, self.e, self.f))

    def __sizeof__(self) -> int:
        """Return size of object in bytes (for memory debugging)."""
        # Base object + 6 floats (8 bytes each)
        return object.__sizeof__(self) + 48

    def _to_c(self):
        """Convert to C fz_matrix structure."""
        ffi, _ = _get_ffi()
        return ffi.new("fz_matrix*", {
            "a": self.a,
            "b": self.b,
            "c": self.c,
            "d": self.d,
            "e": self.e,
            "f": self.f,
        })[0]

    @staticmethod
    def _from_c(c_matrix) -> Matrix:
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
    __slots__ = ('ul', 'ur', 'll', 'lr')

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
        """Convert to axis-aligned bounding rectangle (optimized)."""
        ul_x, ul_y = self.ul.x, self.ul.y
        ur_x, ur_y = self.ur.x, self.ur.y
        ll_x, ll_y = self.ll.x, self.ll.y
        lr_x, lr_y = self.lr.x, self.lr.y
        return Rect(
            min(ul_x, ur_x, ll_x, lr_x),
            min(ul_y, ur_y, ll_y, lr_y),
            max(ul_x, ur_x, ll_x, lr_x),
            max(ul_y, ur_y, ll_y, lr_y)
        )

    def transform(self, matrix: Matrix) -> Quad:
        """Transform quad by a matrix (returns new Quad)."""
        return Quad(
            self.ul.transform(matrix),
            self.ur.transform(matrix),
            self.ll.transform(matrix),
            self.lr.transform(matrix)
        )

    def transform_inplace(self, matrix: Matrix) -> Quad:
        """Transform quad in place (modifies self, returns self)."""
        self.ul.transform_inplace(matrix)
        self.ur.transform_inplace(matrix)
        self.ll.transform_inplace(matrix)
        self.lr.transform_inplace(matrix)
        return self

    def contains_point(self, p: Point) -> bool:
        """Check if a point is inside the quad."""
        # Fast bounding box check first
        ul_x, ul_y = self.ul.x, self.ul.y
        ur_x, ur_y = self.ur.x, self.ur.y
        ll_x, ll_y = self.ll.x, self.ll.y
        lr_x, lr_y = self.lr.x, self.lr.y
        px, py = p.x, p.y

        min_x = min(ul_x, ur_x, ll_x, lr_x)
        max_x = max(ul_x, ur_x, ll_x, lr_x)
        min_y = min(ul_y, ur_y, ll_y, lr_y)
        max_y = max(ul_y, ur_y, ll_y, lr_y)

        if px < min_x or px > max_x or py < min_y or py > max_y:
            return False

        # Fast path for axis-aligned rectangles
        if (ul_x == ll_x and ur_x == lr_x and
            ul_y == ur_y and ll_y == lr_y):
            return True  # Already passed bounding box check

        # Cross product check for general quads
        def cross_sign(ax: float, ay: float, bx: float, by: float, cx: float, cy: float) -> float:
            return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)

        # Check if point is on the same side of all edges
        c1 = cross_sign(ul_x, ul_y, ur_x, ur_y, px, py)
        c2 = cross_sign(ur_x, ur_y, lr_x, lr_y, px, py)
        c3 = cross_sign(lr_x, lr_y, ll_x, ll_y, px, py)
        c4 = cross_sign(ll_x, ll_y, ul_x, ul_y, px, py)

        return (c1 >= 0 and c2 >= 0 and c3 >= 0 and c4 >= 0)

    def __repr__(self) -> str:
        return f"Quad(ul={self.ul}, ur={self.ur}, ll={self.ll}, lr={self.lr})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Quad):
            return False
        return (
            self.ul == other.ul and
            self.ur == other.ur and
            self.ll == other.ll and
            self.lr == other.lr
        )

    def __sizeof__(self) -> int:
        """Return size of object in bytes (for memory debugging)."""
        # Base object + 4 Point references (8 bytes each) + Point objects
        return object.__sizeof__(self) + 32 + 4 * self.ul.__sizeof__()


# ============================================================================
# Batch Operations (NumPy-backed when available)
# ============================================================================

try:
    import numpy as np
    _HAS_NUMPY = True
except ImportError:
    _HAS_NUMPY = False


def transform_points_batch(points: list[Point], matrix: Matrix) -> list[Point]:
    """Transform multiple points efficiently.

    Uses NumPy when available for ~10x speedup on large batches.
    """
    if not points:
        return []

    if _HAS_NUMPY and len(points) > 10:
        # NumPy vectorized path
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        a, b, c, d, e, f = matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f

        # Apply transform: x' = ax + cy + e, y' = bx + dy + f
        result_x = coords[:, 0] * a + coords[:, 1] * c + e
        result_y = coords[:, 0] * b + coords[:, 1] * d + f

        return [Point(x, y) for x, y in zip(result_x, result_y)]
    else:
        # Pure Python path
        return [p.transform(matrix) for p in points]


def transform_rects_batch(rects: list[Rect], matrix: Matrix) -> list[Rect]:
    """Transform multiple rectangles efficiently.

    Uses NumPy when available for speedup on large batches.
    """
    if not rects:
        return []

    if _HAS_NUMPY and len(rects) > 10:
        # NumPy vectorized path
        a, b, c, d, e, f = matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f

        # Extract corners
        n = len(rects)
        corners = np.zeros((n, 4, 2), dtype=np.float64)
        for i, r in enumerate(rects):
            corners[i, 0] = [r.x0, r.y0]
            corners[i, 1] = [r.x1, r.y0]
            corners[i, 2] = [r.x0, r.y1]
            corners[i, 3] = [r.x1, r.y1]

        # Transform all corners
        x = corners[:, :, 0]
        y = corners[:, :, 1]
        tx = x * a + y * c + e
        ty = x * b + y * d + f

        # Find bounding boxes
        min_x = np.min(tx, axis=1)
        max_x = np.max(tx, axis=1)
        min_y = np.min(ty, axis=1)
        max_y = np.max(ty, axis=1)

        return [Rect(x0, y0, x1, y1) for x0, y0, x1, y1 in zip(min_x, min_y, max_x, max_y)]
    else:
        # Pure Python path
        return [r.transform(matrix) for r in rects]


def point_distances_batch(from_point: Point, points: list[Point]) -> list[float]:
    """Calculate distances from one point to multiple points.

    Uses NumPy when available for speedup on large batches.

    Args:
        from_point: Reference point to measure from
        points: List of points to measure to

    Returns:
        List of distances in same order as input points
    """
    if not points:
        return []

    if _HAS_NUMPY and len(points) > 10:
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        dx = coords[:, 0] - from_point.x
        dy = coords[:, 1] - from_point.y
        return list(np.sqrt(dx * dx + dy * dy))
    else:
        return [from_point.distance(p) for p in points]


def point_distances_squared_batch(from_point: Point, points: list[Point]) -> list[float]:
    """Calculate squared distances from one point to multiple points.

    Faster than distances when you don't need the actual distance
    (e.g., finding nearest point).

    Args:
        from_point: Reference point to measure from
        points: List of points to measure to

    Returns:
        List of squared distances in same order as input points
    """
    if not points:
        return []

    if _HAS_NUMPY and len(points) > 10:
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        dx = coords[:, 0] - from_point.x
        dy = coords[:, 1] - from_point.y
        return list(dx * dx + dy * dy)
    else:
        return [from_point.distance_squared(p) for p in points]


def rect_contains_points_batch(rect: Rect, points: list[Point]) -> list[bool]:
    """Test which points are inside a rectangle.

    Uses NumPy when available for speedup on large batches.

    Args:
        rect: Rectangle to test against
        points: List of points to test

    Returns:
        List of booleans (True = inside, False = outside)
    """
    if not points:
        return []

    if _HAS_NUMPY and len(points) > 10:
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        inside = (
            (coords[:, 0] >= rect.x0) &
            (coords[:, 0] < rect.x1) &
            (coords[:, 1] >= rect.y0) &
            (coords[:, 1] < rect.y1)
        )
        return list(inside)
    else:
        return [rect.contains_point(p) for p in points]


def count_points_in_rect(rect: Rect, points: list[Point]) -> int:
    """Count how many points are inside a rectangle.

    More efficient than len([p for p in points if rect.contains_point(p)]).

    Args:
        rect: Rectangle to test against
        points: List of points to count

    Returns:
        Number of points inside the rectangle
    """
    if not points:
        return 0

    if _HAS_NUMPY and len(points) > 10:
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        inside = (
            (coords[:, 0] >= rect.x0) &
            (coords[:, 0] < rect.x1) &
            (coords[:, 1] >= rect.y0) &
            (coords[:, 1] < rect.y1)
        )
        return int(np.sum(inside))
    else:
        return sum(1 for p in points if rect.contains_point(p))


def rect_union_batch(rects: list[Rect]) -> Optional[Rect]:
    """Compute the union (bounding box) of multiple rectangles.

    Args:
        rects: List of rectangles to union

    Returns:
        Rectangle containing all input rectangles, or None if empty list
    """
    if not rects:
        return None

    if len(rects) == 1:
        return Rect(rects[0].x0, rects[0].y0, rects[0].x1, rects[0].y1)

    if _HAS_NUMPY and len(rects) > 10:
        coords = np.array([[r.x0, r.y0, r.x1, r.y1] for r in rects], dtype=np.float64)
        return Rect(
            float(np.min(coords[:, 0])),
            float(np.min(coords[:, 1])),
            float(np.max(coords[:, 2])),
            float(np.max(coords[:, 3]))
        )
    else:
        result = Rect(rects[0].x0, rects[0].y0, rects[0].x1, rects[0].y1)
        for r in rects[1:]:
            result = result.union(r)
        return result


def filter_points_in_rect(rect: Rect, points: list[Point]) -> list[Point]:
    """Filter points to only those inside a rectangle.

    Args:
        rect: Rectangle to test against
        points: List of points to filter

    Returns:
        List of points that are inside the rectangle
    """
    if not points:
        return []

    if _HAS_NUMPY and len(points) > 10:
        coords = np.array([[p.x, p.y] for p in points], dtype=np.float64)
        inside = (
            (coords[:, 0] >= rect.x0) &
            (coords[:, 0] < rect.x1) &
            (coords[:, 1] >= rect.y0) &
            (coords[:, 1] < rect.y1)
        )
        return [p for p, is_in in zip(points, inside) if is_in]
    else:
        return [p for p in points if rect.contains_point(p)]


def nearest_point(from_point: Point, points: list[Point]) -> Optional[Point]:
    """Find the nearest point in a list.

    Args:
        from_point: Reference point
        points: List of points to search

    Returns:
        The nearest point, or None if list is empty
    """
    if not points:
        return None

    if len(points) == 1:
        return points[0]

    # Use squared distances to avoid sqrt
    distances = point_distances_squared_batch(from_point, points)
    min_idx = distances.index(min(distances))
    return points[min_idx]


__all__ = [
    "Point", "Rect", "IRect", "Matrix", "Quad",
    "transform_points_batch", "transform_rects_batch",
    "point_distances_batch", "point_distances_squared_batch",
    "rect_contains_points_batch", "count_points_in_rect",
    "rect_union_batch", "filter_points_in_rect", "nearest_point"
]

