"""Tests for geometry primitives."""

import pytest
from nanopdf.geometry import Point, Rect, Matrix, Quad


class TestPoint:
    """Test Point class."""

    def test_create_point(self):
        """Test point creation."""
        p = Point(10, 20)
        assert p.x == 10.0
        assert p.y == 20.0

    def test_point_distance(self):
        """Test distance calculation."""
        p1 = Point(0, 0)
        p2 = Point(3, 4)
        assert p1.distance(p2) == 5.0

    def test_point_transform(self):
        """Test point transformation."""
        p = Point(10, 20)
        m = Matrix.translate(5, 10)
        transformed = p.transform(m)
        assert transformed.x == 15.0
        assert transformed.y == 30.0


class TestRect:
    """Test Rect class."""

    def test_create_rect(self):
        """Test rectangle creation."""
        r = Rect(0, 0, 100, 200)
        assert r.x0 == 0
        assert r.y0 == 0
        assert r.x1 == 100
        assert r.y1 == 200

    def test_rect_dimensions(self):
        """Test width and height."""
        r = Rect(0, 0, 100, 200)
        assert r.width() == 100
        assert r.height() == 200
        assert r.area() == 20000

    def test_rect_contains(self):
        """Test point containment."""
        r = Rect(0, 0, 100, 100)
        assert r.contains(Point(50, 50))
        assert not r.contains(Point(150, 50))

    def test_rect_intersect(self):
        """Test rectangle intersection."""
        r1 = Rect(0, 0, 100, 100)
        r2 = Rect(50, 50, 150, 150)
        intersection = r1.intersect(r2)
        assert intersection is not None
        assert intersection.x0 == 50
        assert intersection.y0 == 50
        assert intersection.x1 == 100
        assert intersection.y1 == 100

    def test_rect_union(self):
        """Test rectangle union."""
        r1 = Rect(0, 0, 50, 50)
        r2 = Rect(25, 25, 75, 75)
        union = r1.union(r2)
        assert union.x0 == 0
        assert union.y0 == 0
        assert union.x1 == 75
        assert union.y1 == 75


class TestMatrix:
    """Test Matrix class."""

    def test_identity(self):
        """Test identity matrix."""
        m = Matrix.identity()
        assert m.a == 1.0
        assert m.d == 1.0
        assert m.b == 0.0
        assert m.c == 0.0
        assert m.e == 0.0
        assert m.f == 0.0

    def test_scale(self):
        """Test scale matrix."""
        m = Matrix.scale(2, 3)
        assert m.a == 2.0
        assert m.d == 3.0

    def test_translate(self):
        """Test translation matrix."""
        m = Matrix.translate(10, 20)
        assert m.e == 10.0
        assert m.f == 20.0

    def test_concat(self):
        """Test matrix concatenation."""
        m1 = Matrix.scale(2, 2)
        m2 = Matrix.translate(10, 10)
        result = m1.concat(m2)
        # Should combine both transformations
        assert result.a == 2.0
        assert result.d == 2.0


class TestQuad:
    """Test Quad class."""

    def test_from_rect(self):
        """Test quad from rectangle."""
        r = Rect(0, 0, 100, 100)
        q = Quad.from_rect(r)
        assert q.ul.x == 0 and q.ul.y == 0
        assert q.ur.x == 100 and q.ur.y == 0
        assert q.ll.x == 0 and q.ll.y == 100
        assert q.lr.x == 100 and q.lr.y == 100

    def test_to_rect(self):
        """Test quad to rectangle."""
        q = Quad(
            Point(0, 0),
            Point(100, 0),
            Point(0, 100),
            Point(100, 100)
        )
        r = q.to_rect()
        assert r.x0 == 0
        assert r.y0 == 0
        assert r.x1 == 100
        assert r.y1 == 100

