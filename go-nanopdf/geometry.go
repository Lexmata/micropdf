package nanopdf

import "math"

// Point represents a 2D point.
type Point struct {
	X, Y float32
}

// Origin is the point at (0, 0).
var Origin = Point{0, 0}

// NewPoint creates a new point.
func NewPoint(x, y float32) Point {
	return Point{X: x, Y: y}
}

// Transform transforms the point by a matrix.
func (p Point) Transform(m Matrix) Point {
	return Point{
		X: p.X*m.A + p.Y*m.C + m.E,
		Y: p.X*m.B + p.Y*m.D + m.F,
	}
}

// Add adds another point.
func (p Point) Add(other Point) Point {
	return Point{X: p.X + other.X, Y: p.Y + other.Y}
}

// Sub subtracts another point.
func (p Point) Sub(other Point) Point {
	return Point{X: p.X - other.X, Y: p.Y - other.Y}
}

// Scale scales the point by a factor.
func (p Point) Scale(factor float32) Point {
	return Point{X: p.X * factor, Y: p.Y * factor}
}

// Distance calculates the distance to another point.
func (p Point) Distance(other Point) float32 {
	dx := p.X - other.X
	dy := p.Y - other.Y
	return float32(math.Sqrt(float64(dx*dx + dy*dy)))
}

// Equals checks if two points are equal.
func (p Point) Equals(other Point) bool {
	return p.X == other.X && p.Y == other.Y
}

// Rect represents a rectangle defined by two corner points.
type Rect struct {
	X0, Y0, X1, Y1 float32
}

// RectEmpty is an empty rectangle.
var RectEmpty = Rect{
	X0: float32(math.Inf(1)),
	Y0: float32(math.Inf(1)),
	X1: float32(math.Inf(-1)),
	Y1: float32(math.Inf(-1)),
}

// RectInfinite is an infinite rectangle.
var RectInfinite = Rect{
	X0: float32(math.Inf(-1)),
	Y0: float32(math.Inf(-1)),
	X1: float32(math.Inf(1)),
	Y1: float32(math.Inf(1)),
}

// RectUnit is the unit rectangle from (0,0) to (1,1).
var RectUnit = Rect{X0: 0, Y0: 0, X1: 1, Y1: 1}

// NewRect creates a new rectangle.
func NewRect(x0, y0, x1, y1 float32) Rect {
	return Rect{X0: x0, Y0: y0, X1: x1, Y1: y1}
}

// NewRectFromXYWH creates a rectangle from position and size.
func NewRectFromXYWH(x, y, w, h float32) Rect {
	return Rect{X0: x, Y0: y, X1: x + w, Y1: y + h}
}

// Width returns the width of the rectangle.
func (r Rect) Width() float32 {
	return r.X1 - r.X0
}

// Height returns the height of the rectangle.
func (r Rect) Height() float32 {
	return r.Y1 - r.Y0
}

// IsEmpty returns true if the rectangle is empty.
func (r Rect) IsEmpty() bool {
	return r.X0 >= r.X1 || r.Y0 >= r.Y1
}

// IsInfinite returns true if the rectangle is infinite.
func (r Rect) IsInfinite() bool {
	return math.IsInf(float64(r.X0), -1)
}

// Contains checks if a point is inside the rectangle.
func (r Rect) Contains(p Point) bool {
	return p.X >= r.X0 && p.X < r.X1 && p.Y >= r.Y0 && p.Y < r.Y1
}

// ContainsXY checks if coordinates are inside the rectangle.
func (r Rect) ContainsXY(x, y float32) bool {
	return x >= r.X0 && x < r.X1 && y >= r.Y0 && y < r.Y1
}

// Union returns the union of two rectangles.
func (r Rect) Union(other Rect) Rect {
	return Rect{
		X0: min32(r.X0, other.X0),
		Y0: min32(r.Y0, other.Y0),
		X1: max32(r.X1, other.X1),
		Y1: max32(r.Y1, other.Y1),
	}
}

// Intersect returns the intersection of two rectangles.
func (r Rect) Intersect(other Rect) Rect {
	return Rect{
		X0: max32(r.X0, other.X0),
		Y0: max32(r.Y0, other.Y0),
		X1: min32(r.X1, other.X1),
		Y1: min32(r.Y1, other.Y1),
	}
}

// IncludePoint expands the rectangle to include a point.
func (r Rect) IncludePoint(p Point) Rect {
	return Rect{
		X0: min32(r.X0, p.X),
		Y0: min32(r.Y0, p.Y),
		X1: max32(r.X1, p.X),
		Y1: max32(r.Y1, p.Y),
	}
}

// Translate moves the rectangle by an offset.
func (r Rect) Translate(dx, dy float32) Rect {
	return Rect{
		X0: r.X0 + dx,
		Y0: r.Y0 + dy,
		X1: r.X1 + dx,
		Y1: r.Y1 + dy,
	}
}

// Scale scales the rectangle.
func (r Rect) Scale(sx, sy float32) Rect {
	return Rect{
		X0: r.X0 * sx,
		Y0: r.Y0 * sy,
		X1: r.X1 * sx,
		Y1: r.Y1 * sy,
	}
}

// IRect represents an integer rectangle.
type IRect struct {
	X0, Y0, X1, Y1 int32
}

// NewIRect creates a new integer rectangle.
func NewIRect(x0, y0, x1, y1 int32) IRect {
	return IRect{X0: x0, Y0: y0, X1: x1, Y1: y1}
}

// FromRect converts a Rect to an IRect by rounding.
func (r Rect) ToIRect() IRect {
	return IRect{
		X0: int32(math.Floor(float64(r.X0))),
		Y0: int32(math.Floor(float64(r.Y0))),
		X1: int32(math.Ceil(float64(r.X1))),
		Y1: int32(math.Ceil(float64(r.Y1))),
	}
}

// Width returns the width.
func (r IRect) Width() int32 {
	return r.X1 - r.X0
}

// Height returns the height.
func (r IRect) Height() int32 {
	return r.Y1 - r.Y0
}

// IsEmpty returns true if empty.
func (r IRect) IsEmpty() bool {
	return r.X0 >= r.X1 || r.Y0 >= r.Y1
}

// Matrix represents a 2D transformation matrix.
// The matrix is represented as:
//
//	| a  b  0 |
//	| c  d  0 |
//	| e  f  1 |
type Matrix struct {
	A, B, C, D, E, F float32
}

// Identity is the identity matrix.
var Identity = Matrix{A: 1, B: 0, C: 0, D: 1, E: 0, F: 0}

// MatrixIdentity returns the identity matrix.
func MatrixIdentity() Matrix {
	return Identity
}

// NewMatrix creates a new matrix.
func NewMatrix(a, b, c, d, e, f float32) Matrix {
	return Matrix{A: a, B: b, C: c, D: d, E: e, F: f}
}

// MatrixTranslate creates a translation matrix.
func MatrixTranslate(tx, ty float32) Matrix {
	return Matrix{A: 1, B: 0, C: 0, D: 1, E: tx, F: ty}
}

// MatrixScale creates a scaling matrix.
func MatrixScale(sx, sy float32) Matrix {
	return Matrix{A: sx, B: 0, C: 0, D: sy, E: 0, F: 0}
}

// MatrixRotate creates a rotation matrix (degrees).
func MatrixRotate(degrees float32) Matrix {
	rad := float64(degrees) * math.Pi / 180.0
	c := float32(math.Cos(rad))
	s := float32(math.Sin(rad))
	return Matrix{A: c, B: s, C: -s, D: c, E: 0, F: 0}
}

// MatrixShear creates a shearing matrix.
func MatrixShear(sx, sy float32) Matrix {
	return Matrix{A: 1, B: sy, C: sx, D: 1, E: 0, F: 0}
}

// Concat concatenates two matrices.
func (m Matrix) Concat(other Matrix) Matrix {
	return Matrix{
		A: m.A*other.A + m.B*other.C,
		B: m.A*other.B + m.B*other.D,
		C: m.C*other.A + m.D*other.C,
		D: m.C*other.B + m.D*other.D,
		E: m.E*other.A + m.F*other.C + other.E,
		F: m.E*other.B + m.F*other.D + other.F,
	}
}

// PreTranslate pre-multiplies a translation.
func (m Matrix) PreTranslate(tx, ty float32) Matrix {
	return MatrixTranslate(tx, ty).Concat(m)
}

// PostTranslate post-multiplies a translation.
func (m Matrix) PostTranslate(tx, ty float32) Matrix {
	return m.Concat(MatrixTranslate(tx, ty))
}

// PreScale pre-multiplies a scaling.
func (m Matrix) PreScale(sx, sy float32) Matrix {
	return MatrixScale(sx, sy).Concat(m)
}

// PostScale post-multiplies a scaling.
func (m Matrix) PostScale(sx, sy float32) Matrix {
	return m.Concat(MatrixScale(sx, sy))
}

// PreRotate pre-multiplies a rotation.
func (m Matrix) PreRotate(degrees float32) Matrix {
	return MatrixRotate(degrees).Concat(m)
}

// PostRotate post-multiplies a rotation.
func (m Matrix) PostRotate(degrees float32) Matrix {
	return m.Concat(MatrixRotate(degrees))
}

// TransformPoint transforms a point by this matrix.
func (m Matrix) TransformPoint(p Point) Point {
	return p.Transform(m)
}

// TransformRect transforms a rectangle by this matrix.
func (m Matrix) TransformRect(r Rect) Rect {
	// Transform all four corners and compute bounding box
	p1 := Point{r.X0, r.Y0}.Transform(m)
	p2 := Point{r.X1, r.Y0}.Transform(m)
	p3 := Point{r.X0, r.Y1}.Transform(m)
	p4 := Point{r.X1, r.Y1}.Transform(m)

	return Rect{
		X0: min32(min32(p1.X, p2.X), min32(p3.X, p4.X)),
		Y0: min32(min32(p1.Y, p2.Y), min32(p3.Y, p4.Y)),
		X1: max32(max32(p1.X, p2.X), max32(p3.X, p4.X)),
		Y1: max32(max32(p1.Y, p2.Y), max32(p3.Y, p4.Y)),
	}
}

// Quad represents a quadrilateral defined by four corners.
type Quad struct {
	UL, UR, LL, LR Point // Upper-left, upper-right, lower-left, lower-right
}

// NewQuad creates a new quad.
func NewQuad(ul, ur, ll, lr Point) Quad {
	return Quad{UL: ul, UR: ur, LL: ll, LR: lr}
}

// QuadFromRect creates a quad from a rectangle.
func QuadFromRect(r Rect) Quad {
	return Quad{
		UL: Point{r.X0, r.Y0},
		UR: Point{r.X1, r.Y0},
		LL: Point{r.X0, r.Y1},
		LR: Point{r.X1, r.Y1},
	}
}

// Transform transforms the quad by a matrix.
func (q Quad) Transform(m Matrix) Quad {
	return Quad{
		UL: q.UL.Transform(m),
		UR: q.UR.Transform(m),
		LL: q.LL.Transform(m),
		LR: q.LR.Transform(m),
	}
}

// Bounds returns the bounding rectangle of the quad.
func (q Quad) Bounds() Rect {
	r := RectEmpty
	r = r.IncludePoint(q.UL)
	r = r.IncludePoint(q.UR)
	r = r.IncludePoint(q.LL)
	r = r.IncludePoint(q.LR)
	return r
}

// Helper functions
func min32(a, b float32) float32 {
	if a < b {
		return a
	}
	return b
}

func max32(a, b float32) float32 {
	if a > b {
		return a
	}
	return b
}
