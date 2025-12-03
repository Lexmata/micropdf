# NanoPDF Go Bindings

Go bindings for the NanoPDF PDF library.

## Installation

```bash
go get github.com/lexmata/nanopdf/go-nanopdf
```

## Requirements

### With Native Library (CGO)

For full native performance, you need the compiled NanoPDF library:

1. Build the Rust library:
   ```bash
   cd nanopdf-rs
   cargo build --release
   ```

2. Copy the static library to the appropriate directory:
   ```bash
   # Linux (amd64)
   mkdir -p go-nanopdf/lib/linux_amd64
   cp nanopdf-rs/target/release/libnanopdf.a go-nanopdf/lib/linux_amd64/

   # macOS (arm64)
   mkdir -p go-nanopdf/lib/darwin_arm64
   cp nanopdf-rs/target/release/libnanopdf.a go-nanopdf/lib/darwin_arm64/

   # Windows (amd64)
   mkdir -p go-nanopdf/lib/windows_amd64
   cp nanopdf-rs/target/release/nanopdf.lib go-nanopdf/lib/windows_amd64/
   ```

### Without CGO (Mock Mode)

The library includes a pure Go mock implementation for environments where CGO is not available. Build with:

```bash
CGO_ENABLED=0 go build
# or
go build -tags mock
```

## Usage

```go
package main

import (
    "fmt"
    nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
    // Check version and mode
    fmt.Printf("NanoPDF version: %s\n", nanopdf.Version())
    fmt.Printf("Mock mode: %v\n", nanopdf.IsMock())

    // Work with buffers
    buf := nanopdf.NewBufferFromString("Hello, PDF!")
    defer buf.Free()
    fmt.Printf("Buffer length: %d\n", buf.Len())

    // Geometry operations
    p := nanopdf.NewPoint(100, 200)
    m := nanopdf.MatrixTranslate(50, 50)
    transformed := p.Transform(m)
    fmt.Printf("Transformed point: (%f, %f)\n", transformed.X, transformed.Y)

    // Rectangle operations
    rect := nanopdf.NewRect(0, 0, 612, 792) // US Letter size
    fmt.Printf("Page size: %fx%f\n", rect.Width(), rect.Height())
    fmt.Printf("Contains (300, 400): %v\n", rect.ContainsXY(300, 400))

    // Matrix transformations
    scale := nanopdf.MatrixScale(2, 2)
    rotate := nanopdf.MatrixRotate(45)
    combined := scale.Concat(rotate)

    // Quad (for text highlighting, etc.)
    quad := nanopdf.QuadFromRect(rect)
    transformedQuad := quad.Transform(combined)
    bounds := transformedQuad.Bounds()
    fmt.Printf("Transformed bounds: %fx%f\n", bounds.Width(), bounds.Height())
}
```

## API Reference

### Buffer

```go
// Create buffers
buf := nanopdf.NewBuffer(1024)           // With capacity
buf := nanopdf.NewBufferFromBytes(data)  // From bytes
buf := nanopdf.NewBufferFromString(s)    // From string

// Properties and methods
buf.Len()            // Number of bytes
buf.IsEmpty()        // Check if empty
buf.Bytes()          // Get data as []byte
buf.String()         // Get data as string
buf.Append(data)     // Append bytes
buf.AppendString(s)  // Append string
buf.AppendByte(b)    // Append single byte
buf.Clear()          // Remove all data
buf.Clone()          // Create a copy
buf.Free()           // Release resources (call in defer)
```

### Point

```go
p := nanopdf.NewPoint(x, y)
p.Transform(matrix)   // Transform by matrix
p.Distance(other)     // Calculate distance
p.Add(other)          // Add points
p.Sub(other)          // Subtract points
p.Scale(factor)       // Scale
p.Equals(other)       // Check equality
```

### Rect

```go
r := nanopdf.NewRect(x0, y0, x1, y1)
r := nanopdf.NewRectFromXYWH(x, y, w, h)  // From position and size
r.Width()             // Width
r.Height()            // Height
r.IsEmpty()           // Check if empty
r.IsInfinite()        // Check if infinite
r.Contains(point)     // Check if point inside
r.ContainsXY(x, y)    // Check coordinates
r.Union(other)        // Union with another rect
r.Intersect(other)    // Intersection
r.IncludePoint(p)     // Expand to include point
r.Translate(dx, dy)   // Move by offset
r.Scale(sx, sy)       // Scale
r.ToIRect()           // Convert to integer rect
```

### Matrix

```go
nanopdf.Identity                          // Identity matrix
nanopdf.MatrixTranslate(tx, ty)           // Translation
nanopdf.MatrixScale(sx, sy)               // Scaling
nanopdf.MatrixRotate(degrees)             // Rotation
nanopdf.MatrixShear(sx, sy)               // Shearing

m.Concat(other)                           // Concatenate
m.PreTranslate(tx, ty)                    // Pre-multiply translate
m.PostTranslate(tx, ty)                   // Post-multiply translate
m.PreScale(sx, sy)                        // Pre-multiply scale
m.PostScale(sx, sy)                       // Post-multiply scale
m.PreRotate(degrees)                      // Pre-multiply rotate
m.PostRotate(degrees)                     // Post-multiply rotate
m.TransformPoint(p)                       // Transform a point
m.TransformRect(r)                        // Transform a rectangle
```

### Quad

```go
q := nanopdf.NewQuad(ul, ur, ll, lr)      // From four corners
q := nanopdf.QuadFromRect(r)              // From rectangle
q.Transform(matrix)                        // Transform all corners
q.Bounds()                                 // Get bounding rectangle
```

## Testing

```bash
# Run tests with mock implementation
CGO_ENABLED=0 go test ./...

# Run tests with native library (requires libnanopdf.a)
go test ./...
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

