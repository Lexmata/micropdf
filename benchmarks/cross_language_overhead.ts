/**
 * Cross-Language Overhead Measurement - Node.js Binding
 *
 * This measures FFI overhead for Node.js bindings compared to the Rust baseline.
 *
 * Run with: npx tsx benchmarks/cross_language_overhead.ts
 */

const ITERATIONS = 100_000;
const WARMUP_ITERATIONS = 1_000;

interface BenchResult {
  name: string;
  iterations: number;
  total_ns: number;
  avg_ns: number;
  throughput: number;
}

function newBenchResult(
  name: string,
  iterations: number,
  totalNs: number
): BenchResult {
  const avgNs = totalNs / iterations;
  const throughput = 1_000_000_000 / avgNs;
  return {
    name,
    iterations,
    total_ns: totalNs,
    avg_ns: avgNs,
    throughput,
  };
}

function printResult(r: BenchResult): void {
  console.log(
    `${r.name.padEnd(40)} ${r.iterations.toString().padStart(10)} iterations, ${r.avg_ns.toFixed(2).padStart(10)} ns/op, ${r.throughput.toFixed(0).padStart(12)} ops/sec`
  );
}

function warmup(f: () => void): void {
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    f();
  }
}

function bench(name: string, iterations: number, f: () => void): BenchResult {
  warmup(f);

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    f();
  }
  const elapsed = process.hrtime.bigint() - start;

  return newBenchResult(name, iterations, Number(elapsed));
}

// ============================================================================
// Geometry Types (Pure TypeScript implementation for baseline)
// ============================================================================

class Point {
  constructor(
    public x: number,
    public y: number
  ) {}

  transform(m: Matrix): Point {
    return new Point(
      this.x * m.a + this.y * m.c + m.e,
      this.x * m.b + this.y * m.d + m.f
    );
  }
}

class Rect {
  constructor(
    public x0: number,
    public y0: number,
    public x1: number,
    public y1: number
  ) {}

  contains(p: Point): boolean {
    return p.x >= this.x0 && p.x <= this.x1 && p.y >= this.y0 && p.y <= this.y1;
  }

  union(other: Rect): Rect {
    return new Rect(
      Math.min(this.x0, other.x0),
      Math.min(this.y0, other.y0),
      Math.max(this.x1, other.x1),
      Math.max(this.y1, other.y1)
    );
  }

  transform(m: Matrix): Rect {
    const p1x = this.x0 * m.a + this.y0 * m.c + m.e;
    const p1y = this.x0 * m.b + this.y0 * m.d + m.f;
    const p2x = this.x1 * m.a + this.y0 * m.c + m.e;
    const p2y = this.x1 * m.b + this.y0 * m.d + m.f;
    const p3x = this.x0 * m.a + this.y1 * m.c + m.e;
    const p3y = this.x0 * m.b + this.y1 * m.d + m.f;
    const p4x = this.x1 * m.a + this.y1 * m.c + m.e;
    const p4y = this.x1 * m.b + this.y1 * m.d + m.f;

    return new Rect(
      Math.min(p1x, p2x, p3x, p4x),
      Math.min(p1y, p2y, p3y, p4y),
      Math.max(p1x, p2x, p3x, p4x),
      Math.max(p1y, p2y, p3y, p4y)
    );
  }
}

class Matrix {
  constructor(
    public a: number,
    public b: number,
    public c: number,
    public d: number,
    public e: number,
    public f: number
  ) {}

  static identity(): Matrix {
    return new Matrix(1, 0, 0, 1, 0, 0);
  }

  static scale(sx: number, sy: number): Matrix {
    return new Matrix(sx, 0, 0, sy, 0, 0);
  }

  static rotate(degrees: number): Matrix {
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  }

  static translate(tx: number, ty: number): Matrix {
    return new Matrix(1, 0, 0, 1, tx, ty);
  }

  concat(other: Matrix): Matrix {
    return new Matrix(
      this.a * other.a + this.b * other.c,
      this.a * other.b + this.b * other.d,
      this.c * other.a + this.d * other.c,
      this.c * other.b + this.d * other.d,
      this.e * other.a + this.f * other.c + other.e,
      this.e * other.b + this.f * other.d + other.f
    );
  }

  invert(): Matrix | null {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-14) {
      return null;
    }
    const invDet = 1 / det;
    return new Matrix(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.f - this.d * this.e) * invDet,
      (this.b * this.e - this.a * this.f) * invDet
    );
  }
}

// Buffer simulation
class Buffer {
  private data: Uint8Array;
  private length: number;

  constructor(capacity: number) {
    this.data = new Uint8Array(capacity);
    this.length = 0;
  }

  static fromSlice(data: Uint8Array): Buffer {
    const buf = new Buffer(data.length);
    buf.data.set(data);
    buf.length = data.length;
    return buf;
  }

  appendData(chunk: Uint8Array): void {
    if (this.length + chunk.length > this.data.length) {
      const newData = new Uint8Array(
        Math.max(this.data.length * 2, this.length + chunk.length)
      );
      newData.set(this.data);
      this.data = newData;
    }
    this.data.set(chunk, this.length);
    this.length += chunk.length;
  }
}

// ============================================================================
// Main Benchmark
// ============================================================================

function main(): void {
  console.log('=== Cross-Language Overhead Benchmark (Node.js) ===\n');
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Warmup: ${WARMUP_ITERATIONS}`);
  console.log();

  const results: BenchResult[] = [];

  // ========================================================================
  // Geometry Operations
  // ========================================================================

  console.log('--- Geometry Operations ---\n');

  // Point creation
  results.push(
    bench('point_create', ITERATIONS, () => {
      new Point(10.0, 20.0);
    })
  );

  // Point transform
  const p = new Point(10.0, 20.0);
  let m = Matrix.scale(2.0, 2.0);
  results.push(
    bench('point_transform', ITERATIONS, () => {
      p.transform(m);
    })
  );

  // Rect creation
  results.push(
    bench('rect_create', ITERATIONS, () => {
      new Rect(0.0, 0.0, 100.0, 100.0);
    })
  );

  // Rect transform
  let r = new Rect(0.0, 0.0, 100.0, 100.0);
  m = Matrix.rotate(45.0);
  results.push(
    bench('rect_transform', ITERATIONS, () => {
      r.transform(m);
    })
  );

  // Rect contains point
  r = new Rect(0.0, 0.0, 100.0, 100.0);
  const testPoint = new Point(50.0, 50.0);
  results.push(
    bench('rect_contains_point', ITERATIONS, () => {
      r.contains(testPoint);
    })
  );

  // Matrix creation
  results.push(
    bench('matrix_identity', ITERATIONS, () => {
      Matrix.identity();
    })
  );

  results.push(
    bench('matrix_scale', ITERATIONS, () => {
      Matrix.scale(2.0, 2.0);
    })
  );

  results.push(
    bench('matrix_rotate', ITERATIONS, () => {
      Matrix.rotate(45.0);
    })
  );

  results.push(
    bench('matrix_translate', ITERATIONS, () => {
      Matrix.translate(100.0, 100.0);
    })
  );

  // Matrix concatenation
  const m1 = Matrix.scale(2.0, 2.0);
  const m2 = Matrix.rotate(45.0);
  results.push(
    bench('matrix_concat', ITERATIONS, () => {
      m1.concat(m2);
    })
  );

  // Matrix inversion
  m = Matrix.scale(2.0, 3.0);
  results.push(
    bench('matrix_invert', ITERATIONS, () => {
      m.invert();
    })
  );

  console.log();

  // ========================================================================
  // Buffer Operations
  // ========================================================================

  console.log('--- Buffer Operations ---\n');

  // Buffer creation
  results.push(
    bench('buffer_create_empty', ITERATIONS, () => {
      new Buffer(0);
    })
  );

  results.push(
    bench('buffer_create_1KB', ITERATIONS, () => {
      new Buffer(1024);
    })
  );

  // Buffer from data
  let data = new Uint8Array(256);
  results.push(
    bench('buffer_from_slice_256B', ITERATIONS, () => {
      Buffer.fromSlice(data);
    })
  );

  data = new Uint8Array(1024);
  results.push(
    bench('buffer_from_slice_1KB', ITERATIONS, () => {
      Buffer.fromSlice(data);
    })
  );

  // Buffer append
  const chunk = new Uint8Array(64);
  results.push(
    bench('buffer_append_64B', ITERATIONS / 10, () => {
      const buf = new Buffer(64);
      buf.appendData(chunk);
    })
  );

  console.log();

  // ========================================================================
  // Combined Operations
  // ========================================================================

  console.log('--- Combined Operations ---\n');

  // Simulate page rendering setup
  results.push(
    bench('page_render_setup', ITERATIONS / 10, () => {
      const dpi = 144.0;
      const scale = dpi / 72.0;
      const ctm = Matrix.scale(scale, scale);
      const pageBounds = new Rect(0.0, 0.0, 612.0, 792.0);
      pageBounds.transform(ctm);
    })
  );

  // Simulate text position calculation
  results.push(
    bench('text_position_calc', ITERATIONS, () => {
      const base = new Point(72.0, 700.0);
      const tm = Matrix.translate(0.0, -14.0);
      base.transform(tm);
    })
  );

  // Simulate bounding box calculation for 10 items
  results.push(
    bench('bbox_calc_10_items', ITERATIONS / 10, () => {
      let bbox = new Rect(1e30, 1e30, -1e30, -1e30);
      for (let i = 0; i < 10; i++) {
        const item = new Rect(i * 10, i * 10, 100 + i * 10, 20 + i * 10);
        bbox = bbox.union(item);
      }
    })
  );

  console.log();

  // ========================================================================
  // Summary
  // ========================================================================

  console.log('=== Summary ===\n');

  for (const result of results) {
    printResult(result);
  }

  console.log();

  // Output JSON for cross-language comparison
  console.log('--- JSON Output ---');
  console.log(JSON.stringify(results, null, 2));
}

main();

