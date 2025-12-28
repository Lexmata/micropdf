# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True
# cython: initializedcheck=False
"""
Fast Cython implementations of geometry hot paths.

This module provides optimized versions of frequently-called geometry operations
using Cython for near-C performance. The pure Python fallbacks in geometry.py
are used when Cython is not available.

Compile with: python setup.py build_ext --inplace
"""

import cython
from libc.math cimport sin, cos, sqrt, fabs

# ============================================================================
# Type Definitions
# ============================================================================

cdef struct CPoint:
    double x
    double y

cdef struct CRect:
    double x0
    double y0
    double x1
    double y1

cdef struct CMatrix:
    double a
    double b
    double c
    double d
    double e
    double f

cdef struct CQuad:
    CPoint ul
    CPoint ur
    CPoint ll
    CPoint lr

# ============================================================================
# Constants
# ============================================================================

cdef double PI = 3.14159265358979323846
cdef double DEG_TO_RAD = PI / 180.0

# Pre-computed sin/cos for common angles
cdef double SIN_0 = 0.0
cdef double COS_0 = 1.0
cdef double SIN_90 = 1.0
cdef double COS_90 = 0.0
cdef double SIN_180 = 0.0
cdef double COS_180 = -1.0
cdef double SIN_270 = -1.0
cdef double COS_270 = 0.0
cdef double SQRT2_2 = 0.7071067811865476  # sqrt(2)/2 for 45 degrees

# ============================================================================
# Point Operations
# ============================================================================

cpdef tuple transform_point(double x, double y, double a, double b, double c, double d, double e, double f):
    """Transform a point by a matrix. Returns (new_x, new_y)."""
    cdef double nx = x * a + y * c + e
    cdef double ny = x * b + y * d + f
    return (nx, ny)

cpdef double point_distance(double x1, double y1, double x2, double y2):
    """Calculate distance between two points."""
    cdef double dx = x2 - x1
    cdef double dy = y2 - y1
    return sqrt(dx * dx + dy * dy)

cpdef tuple point_normalize(double x, double y):
    """Normalize a point to unit length. Returns (nx, ny)."""
    cdef double length = sqrt(x * x + y * y)
    if length == 0:
        return (0.0, 0.0)
    return (x / length, y / length)

# ============================================================================
# Batch Point Operations
# ============================================================================

cpdef list transform_points_batch(list points, double a, double b, double c, double d, double e, double f):
    """
    Transform multiple points by a single matrix.
    
    Args:
        points: List of (x, y) tuples
        a, b, c, d, e, f: Matrix components
    
    Returns:
        List of transformed (x, y) tuples
    """
    cdef int n = len(points)
    cdef list result = [None] * n
    cdef double x, y, nx, ny
    cdef int i
    
    for i in range(n):
        x, y = points[i]
        nx = x * a + y * c + e
        ny = x * b + y * d + f
        result[i] = (nx, ny)
    
    return result

cpdef list point_distances_batch(double from_x, double from_y, list points):
    """
    Calculate distances from one point to multiple points.
    
    Args:
        from_x, from_y: Source point
        points: List of (x, y) tuples
    
    Returns:
        List of distances
    """
    cdef int n = len(points)
    cdef list result = [0.0] * n
    cdef double x, y, dx, dy
    cdef int i
    
    for i in range(n):
        x, y = points[i]
        dx = x - from_x
        dy = y - from_y
        result[i] = sqrt(dx * dx + dy * dy)
    
    return result

# ============================================================================
# Matrix Operations
# ============================================================================

cpdef tuple matrix_concat(double a1, double b1, double c1, double d1, double e1, double f1,
                          double a2, double b2, double c2, double d2, double e2, double f2):
    """
    Concatenate two matrices. Returns (a, b, c, d, e, f).
    """
    cdef double a = a1 * a2 + b1 * c2
    cdef double b = a1 * b2 + b1 * d2
    cdef double c = c1 * a2 + d1 * c2
    cdef double d = c1 * b2 + d1 * d2
    cdef double e = e1 * a2 + f1 * c2 + e2
    cdef double f = e1 * b2 + f1 * d2 + f2
    return (a, b, c, d, e, f)

cpdef tuple matrix_rotate(double degrees):
    """
    Create a rotation matrix. Returns (a, b, c, d, e, f).
    Uses cached values for common angles (0, 90, 180, 270, ±45).
    """
    cdef double s, c_val
    cdef int int_deg
    
    # Fast path for common angles
    if degrees == 0:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    elif degrees == 90:
        return (0.0, 1.0, -1.0, 0.0, 0.0, 0.0)
    elif degrees == 180:
        return (-1.0, 0.0, 0.0, -1.0, 0.0, 0.0)
    elif degrees == 270 or degrees == -90:
        return (0.0, -1.0, 1.0, 0.0, 0.0, 0.0)
    elif degrees == 45:
        return (SQRT2_2, SQRT2_2, -SQRT2_2, SQRT2_2, 0.0, 0.0)
    elif degrees == -45:
        return (SQRT2_2, -SQRT2_2, SQRT2_2, SQRT2_2, 0.0, 0.0)
    
    # General case
    cdef double rad = degrees * DEG_TO_RAD
    s = sin(rad)
    c_val = cos(rad)
    return (c_val, s, -s, c_val, 0.0, 0.0)

cpdef tuple matrix_invert(double a, double b, double c, double d, double e, double f):
    """
    Invert a matrix. Returns (a, b, c, d, e, f) or None if singular.
    """
    cdef double det = a * d - b * c
    if fabs(det) < 1e-14:
        return None
    
    cdef double inv_det = 1.0 / det
    return (
        d * inv_det,
        -b * inv_det,
        -c * inv_det,
        a * inv_det,
        (c * f - d * e) * inv_det,
        (b * e - a * f) * inv_det
    )

# ============================================================================
# Rect Operations
# ============================================================================

cpdef tuple rect_transform(double x0, double y0, double x1, double y1,
                           double a, double b, double c, double d, double e, double f):
    """
    Transform a rectangle by a matrix. Returns (x0, y0, x1, y1).
    """
    # Fast path: identity matrix (translation only)
    if a == 1.0 and b == 0.0 and c == 0.0 and d == 1.0:
        return (x0 + e, y0 + f, x1 + e, y1 + f)
    
    # Fast path: axis-aligned (scale + translate, no rotation)
    if b == 0.0 and c == 0.0:
        cdef double nx0 = x0 * a + e
        cdef double nx1 = x1 * a + e
        cdef double ny0 = y0 * d + f
        cdef double ny1 = y1 * d + f
        # Handle negative scale
        if nx0 > nx1:
            nx0, nx1 = nx1, nx0
        if ny0 > ny1:
            ny0, ny1 = ny1, ny0
        return (nx0, ny0, nx1, ny1)
    
    # General case: transform all four corners
    cdef double p1x = x0 * a + y0 * c + e
    cdef double p1y = x0 * b + y0 * d + f
    cdef double p2x = x1 * a + y0 * c + e
    cdef double p2y = x1 * b + y0 * d + f
    cdef double p3x = x0 * a + y1 * c + e
    cdef double p3y = x0 * b + y1 * d + f
    cdef double p4x = x1 * a + y1 * c + e
    cdef double p4y = x1 * b + y1 * d + f
    
    # Compute bounding box
    cdef double min_x = p1x
    cdef double max_x = p1x
    cdef double min_y = p1y
    cdef double max_y = p1y
    
    if p2x < min_x: min_x = p2x
    if p2x > max_x: max_x = p2x
    if p3x < min_x: min_x = p3x
    if p3x > max_x: max_x = p3x
    if p4x < min_x: min_x = p4x
    if p4x > max_x: max_x = p4x
    
    if p2y < min_y: min_y = p2y
    if p2y > max_y: max_y = p2y
    if p3y < min_y: min_y = p3y
    if p3y > max_y: max_y = p3y
    if p4y < min_y: min_y = p4y
    if p4y > max_y: max_y = p4y
    
    return (min_x, min_y, max_x, max_y)

cpdef tuple rect_union(double x0a, double y0a, double x1a, double y1a,
                       double x0b, double y0b, double x1b, double y1b):
    """Union of two rectangles. Returns (x0, y0, x1, y1)."""
    cdef double min_x = x0a if x0a < x0b else x0b
    cdef double min_y = y0a if y0a < y0b else y0b
    cdef double max_x = x1a if x1a > x1b else x1b
    cdef double max_y = y1a if y1a > y1b else y1b
    return (min_x, min_y, max_x, max_y)

cpdef tuple rect_intersect(double x0a, double y0a, double x1a, double y1a,
                           double x0b, double y0b, double x1b, double y1b):
    """Intersection of two rectangles. Returns (x0, y0, x1, y1)."""
    cdef double max_x0 = x0a if x0a > x0b else x0b
    cdef double max_y0 = y0a if y0a > y0b else y0b
    cdef double min_x1 = x1a if x1a < x1b else x1b
    cdef double min_y1 = y1a if y1a < y1b else y1b
    return (max_x0, max_y0, min_x1, min_y1)

cpdef bint rect_contains_point(double x0, double y0, double x1, double y1, double px, double py):
    """Check if a rectangle contains a point."""
    return px >= x0 and px < x1 and py >= y0 and py < y1

# ============================================================================
# Batch Rect Operations
# ============================================================================

cpdef list transform_rects_batch(list rects, double a, double b, double c, double d, double e, double f):
    """
    Transform multiple rectangles by a single matrix.
    
    Args:
        rects: List of (x0, y0, x1, y1) tuples
        a, b, c, d, e, f: Matrix components
    
    Returns:
        List of transformed (x0, y0, x1, y1) tuples
    """
    cdef int n = len(rects)
    cdef list result = [None] * n
    cdef double x0, y0, x1, y1
    cdef int i
    
    # Fast path: identity matrix
    if a == 1.0 and b == 0.0 and c == 0.0 and d == 1.0:
        for i in range(n):
            x0, y0, x1, y1 = rects[i]
            result[i] = (x0 + e, y0 + f, x1 + e, y1 + f)
        return result
    
    for i in range(n):
        x0, y0, x1, y1 = rects[i]
        result[i] = rect_transform(x0, y0, x1, y1, a, b, c, d, e, f)
    
    return result

cpdef list rect_contains_points_batch(double x0, double y0, double x1, double y1, list points):
    """
    Check which points are inside a rectangle.
    
    Args:
        x0, y0, x1, y1: Rectangle bounds
        points: List of (x, y) tuples
    
    Returns:
        List of booleans
    """
    cdef int n = len(points)
    cdef list result = [False] * n
    cdef double px, py
    cdef int i
    
    for i in range(n):
        px, py = points[i]
        result[i] = px >= x0 and px < x1 and py >= y0 and py < y1
    
    return result

# ============================================================================
# Quad Operations
# ============================================================================

cpdef tuple quad_bounds(double ul_x, double ul_y, double ur_x, double ur_y,
                        double ll_x, double ll_y, double lr_x, double lr_y):
    """
    Get bounding rectangle of a quad. Returns (x0, y0, x1, y1).
    """
    cdef double min_x = ul_x
    cdef double max_x = ul_x
    cdef double min_y = ul_y
    cdef double max_y = ul_y
    
    if ur_x < min_x: min_x = ur_x
    if ur_x > max_x: max_x = ur_x
    if ll_x < min_x: min_x = ll_x
    if ll_x > max_x: max_x = ll_x
    if lr_x < min_x: min_x = lr_x
    if lr_x > max_x: max_x = lr_x
    
    if ur_y < min_y: min_y = ur_y
    if ur_y > max_y: max_y = ur_y
    if ll_y < min_y: min_y = ll_y
    if ll_y > max_y: max_y = ll_y
    if lr_y < min_y: min_y = lr_y
    if lr_y > max_y: max_y = lr_y
    
    return (min_x, min_y, max_x, max_y)

cpdef bint quad_contains_point(double ul_x, double ul_y, double ur_x, double ur_y,
                               double ll_x, double ll_y, double lr_x, double lr_y,
                               double px, double py):
    """
    Check if a quad contains a point using cross products.
    """
    # Bounding box early exit
    cdef double min_x = ul_x
    cdef double max_x = ul_x
    cdef double min_y = ul_y
    cdef double max_y = ul_y
    
    if ur_x < min_x: min_x = ur_x
    if ur_x > max_x: max_x = ur_x
    if ll_x < min_x: min_x = ll_x
    if ll_x > max_x: max_x = ll_x
    if lr_x < min_x: min_x = lr_x
    if lr_x > max_x: max_x = lr_x
    
    if ur_y < min_y: min_y = ur_y
    if ur_y > max_y: max_y = ur_y
    if ll_y < min_y: min_y = ll_y
    if ll_y > max_y: max_y = ll_y
    if lr_y < min_y: min_y = lr_y
    if lr_y > max_y: max_y = lr_y
    
    if px < min_x or px > max_x or py < min_y or py > max_y:
        return False
    
    # Cross product checks
    cdef double c1 = (ur_x - ul_x) * (py - ul_y) - (ur_y - ul_y) * (px - ul_x)
    if c1 < 0:
        return False
    
    cdef double c2 = (lr_x - ur_x) * (py - ur_y) - (lr_y - ur_y) * (px - ur_x)
    if c2 < 0:
        return False
    
    cdef double c3 = (ll_x - lr_x) * (py - lr_y) - (ll_y - lr_y) * (px - lr_x)
    if c3 < 0:
        return False
    
    cdef double c4 = (ul_x - ll_x) * (py - ll_y) - (ul_y - ll_y) * (px - ll_x)
    if c4 < 0:
        return False
    
    return True

cpdef tuple quad_transform(double ul_x, double ul_y, double ur_x, double ur_y,
                           double ll_x, double ll_y, double lr_x, double lr_y,
                           double a, double b, double c, double d, double e, double f):
    """
    Transform a quad by a matrix.
    Returns (ul_x, ul_y, ur_x, ur_y, ll_x, ll_y, lr_x, lr_y).
    """
    return (
        ul_x * a + ul_y * c + e, ul_x * b + ul_y * d + f,
        ur_x * a + ur_y * c + e, ur_x * b + ur_y * d + f,
        ll_x * a + ll_y * c + e, ll_x * b + ll_y * d + f,
        lr_x * a + lr_y * c + e, lr_x * b + lr_y * d + f
    )

