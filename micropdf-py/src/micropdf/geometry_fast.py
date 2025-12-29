"""
Fast geometry operations with Cython acceleration.

This module provides optimized geometry functions that automatically use
Cython-compiled code when available, falling back to pure Python implementations.

Usage:
    from micropdf.geometry_fast import (
        transform_point,
        transform_points_batch,
        matrix_rotate,
        rect_transform,
        quad_contains_point,
    )

To enable Cython acceleration:
    cd micropdf-py
    pip install cython
    python setup_cython.py build_ext --inplace
"""

from __future__ import annotations

import math
from typing import List, Optional, Tuple

# Try to import Cython-optimized functions
_USE_CYTHON = False
try:
    from micropdf._geometry_fast import (
        transform_point as _cy_transform_point,
        transform_points_batch as _cy_transform_points_batch,
        point_distance as _cy_point_distance,
        point_normalize as _cy_point_normalize,
        point_distances_batch as _cy_point_distances_batch,
        matrix_concat as _cy_matrix_concat,
        matrix_rotate as _cy_matrix_rotate,
        matrix_invert as _cy_matrix_invert,
        rect_transform as _cy_rect_transform,
        rect_union as _cy_rect_union,
        rect_intersect as _cy_rect_intersect,
        rect_contains_point as _cy_rect_contains_point,
        transform_rects_batch as _cy_transform_rects_batch,
        rect_contains_points_batch as _cy_rect_contains_points_batch,
        quad_bounds as _cy_quad_bounds,
        quad_contains_point as _cy_quad_contains_point,
        quad_transform as _cy_quad_transform,
    )
    _USE_CYTHON = True
except ImportError:
    pass

# ============================================================================
# Pure Python Fallbacks
# ============================================================================

def _py_transform_point(x: float, y: float, a: float, b: float, c: float, d: float, e: float, f: float) -> Tuple[float, float]:
    """Transform a point by a matrix."""
    return (x * a + y * c + e, x * b + y * d + f)

def _py_point_distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """Calculate distance between two points."""
    dx = x2 - x1
    dy = y2 - y1
    return math.sqrt(dx * dx + dy * dy)

def _py_point_normalize(x: float, y: float) -> Tuple[float, float]:
    """Normalize a point to unit length."""
    length = math.sqrt(x * x + y * y)
    if length == 0:
        return (0.0, 0.0)
    return (x / length, y / length)

def _py_transform_points_batch(points: List[Tuple[float, float]], a: float, b: float, c: float, d: float, e: float, f: float) -> List[Tuple[float, float]]:
    """Transform multiple points by a single matrix."""
    return [(x * a + y * c + e, x * b + y * d + f) for x, y in points]

def _py_point_distances_batch(from_x: float, from_y: float, points: List[Tuple[float, float]]) -> List[float]:
    """Calculate distances from one point to multiple points."""
    result = []
    for x, y in points:
        dx = x - from_x
        dy = y - from_y
        result.append(math.sqrt(dx * dx + dy * dy))
    return result

def _py_matrix_concat(a1: float, b1: float, c1: float, d1: float, e1: float, f1: float,
                      a2: float, b2: float, c2: float, d2: float, e2: float, f2: float) -> Tuple[float, ...]:
    """Concatenate two matrices."""
    return (
        a1 * a2 + b1 * c2,
        a1 * b2 + b1 * d2,
        c1 * a2 + d1 * c2,
        c1 * b2 + d1 * d2,
        e1 * a2 + f1 * c2 + e2,
        e1 * b2 + f1 * d2 + f2,
    )

# Pre-computed values for common angles
_SQRT2_2 = 0.7071067811865476

def _py_matrix_rotate(degrees: float) -> Tuple[float, ...]:
    """Create a rotation matrix with caching for common angles."""
    if degrees == 0:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    elif degrees == 90:
        return (0.0, 1.0, -1.0, 0.0, 0.0, 0.0)
    elif degrees == 180:
        return (-1.0, 0.0, 0.0, -1.0, 0.0, 0.0)
    elif degrees == 270 or degrees == -90:
        return (0.0, -1.0, 1.0, 0.0, 0.0, 0.0)
    elif degrees == 45:
        return (_SQRT2_2, _SQRT2_2, -_SQRT2_2, _SQRT2_2, 0.0, 0.0)
    elif degrees == -45:
        return (_SQRT2_2, -_SQRT2_2, _SQRT2_2, _SQRT2_2, 0.0, 0.0)

    rad = math.radians(degrees)
    s = math.sin(rad)
    c = math.cos(rad)
    return (c, s, -s, c, 0.0, 0.0)

def _py_matrix_invert(a: float, b: float, c: float, d: float, e: float, f: float) -> Optional[Tuple[float, ...]]:
    """Invert a matrix."""
    det = a * d - b * c
    if abs(det) < 1e-14:
        return None
    inv_det = 1.0 / det
    return (
        d * inv_det,
        -b * inv_det,
        -c * inv_det,
        a * inv_det,
        (c * f - d * e) * inv_det,
        (b * e - a * f) * inv_det,
    )

def _py_rect_transform(x0: float, y0: float, x1: float, y1: float,
                       a: float, b: float, c: float, d: float, e: float, f: float) -> Tuple[float, ...]:
    """Transform a rectangle by a matrix."""
    # Fast path: identity matrix
    if a == 1.0 and b == 0.0 and c == 0.0 and d == 1.0:
        return (x0 + e, y0 + f, x1 + e, y1 + f)

    # Fast path: axis-aligned
    if b == 0.0 and c == 0.0:
        nx0 = x0 * a + e
        nx1 = x1 * a + e
        ny0 = y0 * d + f
        ny1 = y1 * d + f
        if nx0 > nx1:
            nx0, nx1 = nx1, nx0
        if ny0 > ny1:
            ny0, ny1 = ny1, ny0
        return (nx0, ny0, nx1, ny1)

    # General case
    p1x, p1y = x0 * a + y0 * c + e, x0 * b + y0 * d + f
    p2x, p2y = x1 * a + y0 * c + e, x1 * b + y0 * d + f
    p3x, p3y = x0 * a + y1 * c + e, x0 * b + y1 * d + f
    p4x, p4y = x1 * a + y1 * c + e, x1 * b + y1 * d + f

    return (
        min(p1x, p2x, p3x, p4x),
        min(p1y, p2y, p3y, p4y),
        max(p1x, p2x, p3x, p4x),
        max(p1y, p2y, p3y, p4y),
    )

def _py_rect_union(x0a: float, y0a: float, x1a: float, y1a: float,
                   x0b: float, y0b: float, x1b: float, y1b: float) -> Tuple[float, ...]:
    """Union of two rectangles."""
    return (min(x0a, x0b), min(y0a, y0b), max(x1a, x1b), max(y1a, y1b))

def _py_rect_intersect(x0a: float, y0a: float, x1a: float, y1a: float,
                       x0b: float, y0b: float, x1b: float, y1b: float) -> Tuple[float, ...]:
    """Intersection of two rectangles."""
    return (max(x0a, x0b), max(y0a, y0b), min(x1a, x1b), min(y1a, y1b))

def _py_rect_contains_point(x0: float, y0: float, x1: float, y1: float, px: float, py: float) -> bool:
    """Check if a rectangle contains a point."""
    return px >= x0 and px < x1 and py >= y0 and py < y1

def _py_transform_rects_batch(rects: List[Tuple[float, ...]], a: float, b: float, c: float, d: float, e: float, f: float) -> List[Tuple[float, ...]]:
    """Transform multiple rectangles."""
    if a == 1.0 and b == 0.0 and c == 0.0 and d == 1.0:
        return [(x0 + e, y0 + f, x1 + e, y1 + f) for x0, y0, x1, y1 in rects]
    return [_py_rect_transform(x0, y0, x1, y1, a, b, c, d, e, f) for x0, y0, x1, y1 in rects]

def _py_rect_contains_points_batch(x0: float, y0: float, x1: float, y1: float,
                                   points: List[Tuple[float, float]]) -> List[bool]:
    """Check which points are inside a rectangle."""
    return [px >= x0 and px < x1 and py >= y0 and py < y1 for px, py in points]

def _py_quad_bounds(ul_x: float, ul_y: float, ur_x: float, ur_y: float,
                    ll_x: float, ll_y: float, lr_x: float, lr_y: float) -> Tuple[float, ...]:
    """Get bounding rectangle of a quad."""
    return (
        min(ul_x, ur_x, ll_x, lr_x),
        min(ul_y, ur_y, ll_y, lr_y),
        max(ul_x, ur_x, ll_x, lr_x),
        max(ul_y, ur_y, ll_y, lr_y),
    )

def _py_quad_contains_point(ul_x: float, ul_y: float, ur_x: float, ur_y: float,
                            ll_x: float, ll_y: float, lr_x: float, lr_y: float,
                            px: float, py: float) -> bool:
    """Check if a quad contains a point."""
    # Bounding box early exit
    min_x = min(ul_x, ur_x, ll_x, lr_x)
    max_x = max(ul_x, ur_x, ll_x, lr_x)
    min_y = min(ul_y, ur_y, ll_y, lr_y)
    max_y = max(ul_y, ur_y, ll_y, lr_y)

    if px < min_x or px > max_x or py < min_y or py > max_y:
        return False

    # Cross product checks
    c1 = (ur_x - ul_x) * (py - ul_y) - (ur_y - ul_y) * (px - ul_x)
    if c1 < 0:
        return False

    c2 = (lr_x - ur_x) * (py - ur_y) - (lr_y - ur_y) * (px - ur_x)
    if c2 < 0:
        return False

    c3 = (ll_x - lr_x) * (py - lr_y) - (ll_y - lr_y) * (px - lr_x)
    if c3 < 0:
        return False

    c4 = (ul_x - ll_x) * (py - ll_y) - (ul_y - ll_y) * (px - ll_x)
    if c4 < 0:
        return False

    return True

def _py_quad_transform(ul_x: float, ul_y: float, ur_x: float, ur_y: float,
                       ll_x: float, ll_y: float, lr_x: float, lr_y: float,
                       a: float, b: float, c: float, d: float, e: float, f: float) -> Tuple[float, ...]:
    """Transform a quad by a matrix."""
    return (
        ul_x * a + ul_y * c + e, ul_x * b + ul_y * d + f,
        ur_x * a + ur_y * c + e, ur_x * b + ur_y * d + f,
        ll_x * a + ll_y * c + e, ll_x * b + ll_y * d + f,
        lr_x * a + lr_y * c + e, lr_x * b + lr_y * d + f,
    )

# ============================================================================
# Public API - Use Cython if available, else pure Python
# ============================================================================

if _USE_CYTHON:
    transform_point = _cy_transform_point
    point_distance = _cy_point_distance
    point_normalize = _cy_point_normalize
    transform_points_batch = _cy_transform_points_batch
    point_distances_batch = _cy_point_distances_batch
    matrix_concat = _cy_matrix_concat
    matrix_rotate = _cy_matrix_rotate
    matrix_invert = _cy_matrix_invert
    rect_transform = _cy_rect_transform
    rect_union = _cy_rect_union
    rect_intersect = _cy_rect_intersect
    rect_contains_point = _cy_rect_contains_point
    transform_rects_batch = _cy_transform_rects_batch
    rect_contains_points_batch = _cy_rect_contains_points_batch
    quad_bounds = _cy_quad_bounds
    quad_contains_point = _cy_quad_contains_point
    quad_transform = _cy_quad_transform
else:
    transform_point = _py_transform_point
    point_distance = _py_point_distance
    point_normalize = _py_point_normalize
    transform_points_batch = _py_transform_points_batch
    point_distances_batch = _py_point_distances_batch
    matrix_concat = _py_matrix_concat
    matrix_rotate = _py_matrix_rotate
    matrix_invert = _py_matrix_invert
    rect_transform = _py_rect_transform
    rect_union = _py_rect_union
    rect_intersect = _py_rect_intersect
    rect_contains_point = _py_rect_contains_point
    transform_rects_batch = _py_transform_rects_batch
    rect_contains_points_batch = _py_rect_contains_points_batch
    quad_bounds = _py_quad_bounds
    quad_contains_point = _py_quad_contains_point
    quad_transform = _py_quad_transform

def is_cython_available() -> bool:
    """Check if Cython-optimized functions are being used."""
    return _USE_CYTHON

# ============================================================================
# Helper functions for use with geometry classes
# ============================================================================

def transform_point_obj(point, matrix) -> Tuple[float, float]:
    """Transform a Point object by a Matrix object."""
    return transform_point(point.x, point.y, matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)

def transform_rect_obj(rect, matrix) -> Tuple[float, float, float, float]:
    """Transform a Rect object by a Matrix object."""
    return rect_transform(rect.x0, rect.y0, rect.x1, rect.y1, matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)

def transform_quad_obj(quad, matrix) -> Tuple[float, ...]:
    """Transform a Quad object by a Matrix object."""
    return quad_transform(
        quad.ul.x, quad.ul.y, quad.ur.x, quad.ur.y,
        quad.ll.x, quad.ll.y, quad.lr.x, quad.lr.y,
        matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f
    )

