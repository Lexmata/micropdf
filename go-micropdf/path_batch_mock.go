//go:build !cgo || mock
// +build !cgo mock

package micropdf

// ============================================================================
// Batch Path Operations (Mock Implementation)
//
// Mock implementation for when CGO is not available.
// ============================================================================

// PathOp represents a single path operation type
type PathOp int

const (
	PathOpMoveTo PathOp = iota
	PathOpLineTo
	PathOpCurveTo
	PathOpClosePath
	PathOpRectTo
)

// PathCommand represents a single path command with its data
type PathCommand struct {
	Op   PathOp
	X, Y float32 // For MoveTo, LineTo
	X1   float32 // For CurveTo
	Y1   float32 // For CurveTo
	X2   float32 // For CurveTo, RectTo (width)
	Y2   float32 // For CurveTo, RectTo (height)
	X3   float32 // For CurveTo
	Y3   float32 // For CurveTo
}

// NewMoveToCmd creates a MoveTo command
func NewMoveToCmd(x, y float32) PathCommand {
	return PathCommand{Op: PathOpMoveTo, X: x, Y: y}
}

// NewLineToCmd creates a LineTo command
func NewLineToCmd(x, y float32) PathCommand {
	return PathCommand{Op: PathOpLineTo, X: x, Y: y}
}

// NewCurveToCmd creates a CurveTo command
func NewCurveToCmd(x1, y1, x2, y2, x3, y3 float32) PathCommand {
	return PathCommand{Op: PathOpCurveTo, X1: x1, Y1: y1, X2: x2, Y2: y2, X3: x3, Y3: y3}
}

// NewClosePathCmd creates a ClosePath command
func NewClosePathCmd() PathCommand {
	return PathCommand{Op: PathOpClosePath}
}

// NewRectToCmd creates a RectTo command
func NewRectToCmd(x, y, w, h float32) PathCommand {
	return PathCommand{Op: PathOpRectTo, X: x, Y: y, X2: w, Y2: h}
}

// Path is a mock implementation for when CGO is disabled
type Path struct {
	commands []PathCommand
	ctx      *Context
}

// NewPath creates a new mock path
func NewPath(ctx *Context) *Path {
	return &Path{
		commands: make([]PathCommand, 0),
		ctx:      ctx,
	}
}

// Drop releases mock path resources
func (p *Path) Drop() {
	p.commands = nil
}

// MoveTo moves the current point to (x, y)
func (p *Path) MoveTo(x, y float32) *Path {
	p.commands = append(p.commands, NewMoveToCmd(x, y))
	return p
}

// LineTo adds a line from the current point to (x, y)
func (p *Path) LineTo(x, y float32) *Path {
	p.commands = append(p.commands, NewLineToCmd(x, y))
	return p
}

// CurveTo adds a cubic Bezier curve
func (p *Path) CurveTo(x1, y1, x2, y2, x3, y3 float32) *Path {
	p.commands = append(p.commands, NewCurveToCmd(x1, y1, x2, y2, x3, y3))
	return p
}

// ClosePath closes the current subpath
func (p *Path) ClosePath() *Path {
	p.commands = append(p.commands, NewClosePathCmd())
	return p
}

// RectTo adds a rectangle to the path
func (p *Path) RectTo(x, y, w, h float32) *Path {
	p.commands = append(p.commands, NewRectToCmd(x, y, w, h))
	return p
}

// Bounds returns a mock bounding box
func (p *Path) Bounds(_ Matrix) Rect {
	return Rect{X0: 0, Y0: 0, X1: 100, Y1: 100}
}

// AddCommands adds multiple path commands in a single batch.
func (p *Path) AddCommands(commands []PathCommand) *Path {
	for _, cmd := range commands {
		switch cmd.Op {
		case PathOpMoveTo:
			p.MoveTo(cmd.X, cmd.Y)
		case PathOpLineTo:
			p.LineTo(cmd.X, cmd.Y)
		case PathOpCurveTo:
			p.CurveTo(cmd.X1, cmd.Y1, cmd.X2, cmd.Y2, cmd.X3, cmd.Y3)
		case PathOpClosePath:
			p.ClosePath()
		case PathOpRectTo:
			p.RectTo(cmd.X, cmd.Y, cmd.X2, cmd.Y2)
		}
	}
	return p
}

// AddLines adds a series of connected line segments from coordinate pairs.
// points should alternate: [x0, y0, x1, y1, x2, y2, ...]
// The first point is a MoveTo, subsequent points are LineTo.
func (p *Path) AddLines(points []float32) *Path {
	if len(points) < 2 {
		return p
	}

	// First point is MoveTo
	p.MoveTo(points[0], points[1])

	// Rest are LineTo
	for i := 2; i+1 < len(points); i += 2 {
		p.LineTo(points[i], points[i+1])
	}

	return p
}

// AddPolygon adds a closed polygon efficiently.
// points should alternate: [x0, y0, x1, y1, x2, y2, ...]
func (p *Path) AddPolygon(points []float32) *Path {
	if len(points) < 4 {
		return p
	}

	p.AddLines(points)
	p.ClosePath()

	return p
}

// AddRects adds multiple rectangles efficiently.
// rects should be: [x0, y0, w0, h0, x1, y1, w1, h1, ...]
func (p *Path) AddRects(rects []float32) *Path {
	for i := 0; i+3 < len(rects); i += 4 {
		p.RectTo(rects[i], rects[i+1], rects[i+2], rects[i+3])
	}
	return p
}

// AddRectsFromSlice adds rectangles from a slice of Rect structs
func (p *Path) AddRectsFromSlice(rects []Rect) *Path {
	for _, r := range rects {
		p.RectTo(r.X0, r.Y0, r.Width(), r.Height())
	}
	return p
}

// AddPolyline adds a series of connected line segments without closing.
// points is a slice of Point structs.
func (p *Path) AddPolyline(points []Point) *Path {
	if len(points) < 1 {
		return p
	}

	p.MoveTo(points[0].X, points[0].Y)
	for i := 1; i < len(points); i++ {
		p.LineTo(points[i].X, points[i].Y)
	}

	return p
}

// AddClosedPolyline adds a closed polygon from Point structs.
func (p *Path) AddClosedPolyline(points []Point) *Path {
	if len(points) < 2 {
		return p
	}

	p.AddPolyline(points)
	p.ClosePath()

	return p
}

// ============================================================================
// PathBuilder - Fluent API for batch path construction
// ============================================================================

// PathBuilder provides a fluent interface for building paths with deferred execution.
// Commands are accumulated and can be applied to a path in a single batch.
type PathBuilder struct {
	commands []PathCommand
}

// NewPathBuilder creates a new path builder
func NewPathBuilder() *PathBuilder {
	return &PathBuilder{
		commands: make([]PathCommand, 0, 16),
	}
}

// MoveTo adds a MoveTo command to the builder
func (b *PathBuilder) MoveTo(x, y float32) *PathBuilder {
	b.commands = append(b.commands, NewMoveToCmd(x, y))
	return b
}

// LineTo adds a LineTo command to the builder
func (b *PathBuilder) LineTo(x, y float32) *PathBuilder {
	b.commands = append(b.commands, NewLineToCmd(x, y))
	return b
}

// CurveTo adds a CurveTo command to the builder
func (b *PathBuilder) CurveTo(x1, y1, x2, y2, x3, y3 float32) *PathBuilder {
	b.commands = append(b.commands, NewCurveToCmd(x1, y1, x2, y2, x3, y3))
	return b
}

// Close adds a ClosePath command to the builder
func (b *PathBuilder) Close() *PathBuilder {
	b.commands = append(b.commands, NewClosePathCmd())
	return b
}

// Rect adds a RectTo command to the builder
func (b *PathBuilder) Rect(x, y, w, h float32) *PathBuilder {
	b.commands = append(b.commands, NewRectToCmd(x, y, w, h))
	return b
}

// Build applies all accumulated commands to a path
func (b *PathBuilder) Build(p *Path) *Path {
	return p.AddCommands(b.commands)
}

// BuildNew creates a new path with all accumulated commands
func (b *PathBuilder) BuildNew(ctx *Context) *Path {
	p := NewPath(ctx)
	return p.AddCommands(b.commands)
}

// Reset clears all accumulated commands
func (b *PathBuilder) Reset() *PathBuilder {
	b.commands = b.commands[:0]
	return b
}

// Commands returns a copy of accumulated commands
func (b *PathBuilder) Commands() []PathCommand {
	result := make([]PathCommand, len(b.commands))
	copy(result, b.commands)
	return result
}

// Len returns the number of accumulated commands
func (b *PathBuilder) Len() int {
	return len(b.commands)
}
