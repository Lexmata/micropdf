# NanoPDF for Node.js

Node.js bindings for the NanoPDF PDF library.

## Installation

```bash
pnpm add nanopdf
```

Or with npm/yarn:

```bash
npm install nanopdf
yarn add nanopdf
```

The package will automatically download prebuilt binaries for your platform. If prebuilt binaries are not available, it will attempt to build from Rust source (requires Rust to be installed).

## Requirements

- Node.js >= 18.0.0
- For building from source: Rust toolchain (https://rustup.rs)

## Usage

```typescript
import { Buffer, Point, Rect, Matrix, getVersion } from 'nanopdf';

// Check version
console.log(`NanoPDF version: ${getVersion()}`);

// Work with buffers
const buffer = Buffer.fromString('Hello, PDF!');
console.log(`Buffer length: ${buffer.length}`);

// Geometry operations
const point = new Point(100, 200);
const matrix = Matrix.translate(50, 50);
const transformed = point.transform(matrix);
console.log(`Transformed: ${transformed}`);

// Rectangle operations
const rect = new Rect(0, 0, 612, 792); // US Letter size
console.log(`Width: ${rect.width}, Height: ${rect.height}`);
console.log(`Contains (300, 400): ${rect.contains(300, 400)}`);
```

## API

### Buffer

```typescript
// Create buffers
const buf1 = Buffer.create(1024); // With capacity
const buf2 = Buffer.fromString('text'); // From string
const buf3 = Buffer.fromBuffer(nodeBuffer); // From Node.js Buffer
const buf4 = Buffer.from(data); // Auto-detect type

// Properties and methods
buf1.length; // Number of bytes
buf1.isEmpty; // Check if empty
buf1.append(data); // Append data
buf1.toNodeBuffer(); // Convert to Node.js Buffer
buf1.toString(); // Convert to string (UTF-8)
buf1.slice(start, end); // Get a slice
```

### Point

```typescript
const p = new Point(x, y);
p.transform(matrix); // Transform by matrix
p.distanceTo(other); // Calculate distance
p.add(other); // Add points
p.subtract(other); // Subtract points
p.scale(factor); // Scale
```

### Rect

```typescript
const r = new Rect(x0, y0, x1, y1);
Rect.fromXYWH(x, y, width, height); // From position and size
r.width; // Width
r.height; // Height
r.isEmpty; // Check if empty
r.contains(point); // Check if point is inside
r.union(other); // Union with another rect
r.intersect(other); // Intersection
```

### Matrix

```typescript
Matrix.IDENTITY; // Identity matrix
Matrix.translate(tx, ty); // Translation matrix
Matrix.scale(sx, sy); // Scaling matrix
Matrix.rotate(degrees); // Rotation matrix
m1.concat(m2); // Concatenate matrices
m.preTranslate(tx, ty); // Pre-multiply translate
m.postRotate(degrees); // Post-multiply rotate
```

### Quad

```typescript
const quad = Quad.fromRect(rect); // Create from rectangle
quad.transform(matrix); // Transform all corners
quad.bounds; // Get bounding rectangle
```

## Building from Source

If prebuilt binaries are not available for your platform:

```bash
# Make sure Rust is installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build
cd nanopdf-js
pnpm run build:from-rust
pnpm run build:native
```

## Development

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build:ts

# Run tests
pnpm test

# Build everything from Rust
pnpm run build:from-rust
pnpm run build
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
