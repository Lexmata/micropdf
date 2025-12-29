#!/usr/bin/env tsx
/**
 * MicroPDF Node.js Benchmark Runner
 *
 * Runs all benchmarks and outputs results in a formatted table.
 * Usage: pnpm bench
 */
import { Bench } from 'tinybench';
import { Buffer as NanoBuffer, BufferReader, BufferWriter } from '../src/buffer.js';
import { Point, Rect, IRect, Matrix, Quad } from '../src/geometry.js';

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                     MicroPDF Node.js Benchmark Suite                        ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Date: ${new Date().toISOString()}`);

// ============================================================================
// Buffer Benchmarks
// ============================================================================

console.log(`\n${'='.repeat(80)}`);
console.log('  Buffer Benchmarks');
console.log(`${'='.repeat(80)}\n`);

const bufferBench = new Bench({ time: 500 });

// Pre-create test data
const smallData = new Uint8Array(1024);
const mediumData = new Uint8Array(16384);
for (let i = 0; i < smallData.length; i++) smallData[i] = i & 0xff;
for (let i = 0; i < mediumData.length; i++) mediumData[i] = i & 0xff;

const smallBuffer = NanoBuffer.fromUint8Array(smallData);
const mediumBuffer = NanoBuffer.fromUint8Array(mediumData);

bufferBench
  .add('Buffer.create() - empty', () => {
    NanoBuffer.create();
  })
  .add('Buffer.create(1024) - with capacity', () => {
    NanoBuffer.create(1024);
  })
  .add('Buffer.fromUint8Array - 1KB', () => {
    NanoBuffer.fromUint8Array(smallData);
  })
  .add('Buffer.fromUint8Array - 16KB', () => {
    NanoBuffer.fromUint8Array(mediumData);
  })
  .add('Buffer.fromString - short', () => {
    NanoBuffer.fromString('Hello, World!');
  })
  .add('Buffer.toUint8Array - 1KB', () => {
    smallBuffer.toUint8Array();
  })
  .add('Buffer.toUint8Array - 16KB', () => {
    mediumBuffer.toUint8Array();
  })
  .add('Buffer.toString - 1KB', () => {
    smallBuffer.toString();
  })
  .add('Buffer.toBase64 - 1KB', () => {
    smallBuffer.toBase64();
  })
  .add('Buffer.toHex - 1KB', () => {
    smallBuffer.toHex();
  })
  // Note: md5Digest and sha256Digest use require() which doesn't work in ESM
  // These would need to be updated to use import() or node:crypto
  .add('Buffer.slice - 1KB middle', () => {
    mediumBuffer.slice(1000, 2024);
  })
  .add('Buffer.equals - 1KB identical', () => {
    smallBuffer.equals(smallBuffer);
  })
  .add('Buffer.indexOf - byte in 1KB', () => {
    smallBuffer.indexOf(128);
  })
  .add('BufferReader - readUInt32BE x 64', () => {
    const reader = new BufferReader(smallBuffer);
    for (let i = 0; i < 64; i++) {
      reader.readUInt32BE();
    }
  })
  .add('BufferWriter - write 256 bytes', () => {
    const writer = new BufferWriter(256);
    for (let i = 0; i < 64; i++) {
      writer.writeUInt32BE(i);
    }
  });

await bufferBench.run();
console.table(bufferBench.table());

// ============================================================================
// Geometry Benchmarks
// ============================================================================

console.log(`\n${'='.repeat(80)}`);
console.log('  Geometry Benchmarks');
console.log(`${'='.repeat(80)}\n`);

const geomBench = new Bench({ time: 500 });

const point1 = new Point(100, 200);
const point2 = new Point(300, 400);
const rect1 = new Rect(0, 0, 100, 100);
const rect2 = new Rect(50, 50, 150, 150);
const matrix = Matrix.scale(2, 2);
const rotateMatrix = Matrix.rotate(45);
const complexMatrix = Matrix.translate(10, 20)
  .concat(Matrix.scale(1.5, 1.5))
  .concat(Matrix.rotate(30));
const quad = Quad.fromRect(rect1);

geomBench
  .add('Point - constructor', () => {
    new Point(100, 200);
  })
  .add('Point.from - object', () => {
    Point.from({ x: 100, y: 200 });
  })
  .add('Point.transform - scale', () => {
    point1.transform(matrix);
  })
  .add('Point.transform - complex', () => {
    point1.transform(complexMatrix);
  })
  .add('Point.distanceTo', () => {
    point1.distanceTo(point2);
  })
  .add('Point.add', () => {
    point1.add(point2);
  })
  .add('Point.normalize', () => {
    point1.normalize();
  })
  .add('Rect - constructor', () => {
    new Rect(0, 0, 100, 100);
  })
  .add('Rect.fromXYWH', () => {
    Rect.fromXYWH(0, 0, 100, 100);
  })
  .add('Rect.containsPoint', () => {
    rect1.containsPoint(50, 50);
  })
  .add('Rect.union', () => {
    rect1.union(rect2);
  })
  .add('Rect.intersect', () => {
    rect1.intersect(rect2);
  })
  .add('Rect.transform', () => {
    rect1.transform(matrix);
  })
  .add('Rect.transform - complex', () => {
    rect1.transform(complexMatrix);
  })
  .add('Rect.round', () => {
    new Rect(10.3, 20.7, 100.2, 200.9).round();
  })
  .add('IRect - constructor', () => {
    new IRect(0, 0, 100, 100);
  })
  .add('IRect.fromRect', () => {
    IRect.fromRect(rect1);
  })
  .add('Matrix - constructor', () => {
    new Matrix(1, 0, 0, 1, 0, 0);
  })
  .add('Matrix.translate', () => {
    Matrix.translate(10, 20);
  })
  .add('Matrix.scale', () => {
    Matrix.scale(2, 2);
  })
  .add('Matrix.rotate', () => {
    Matrix.rotate(45);
  })
  .add('Matrix.concat', () => {
    matrix.concat(rotateMatrix);
  })
  .add('Matrix.invert', () => {
    complexMatrix.invert();
  })
  .add('Matrix.transformPoint', () => {
    matrix.transformPoint(point1);
  })
  .add('Quad.fromRect', () => {
    Quad.fromRect(rect1);
  })
  .add('Quad.transform', () => {
    quad.transform(matrix);
  })
  .add('Quad.bounds', () => {
    const _ = quad.bounds;
  })
  .add('Quad.containsPoint', () => {
    quad.containsPoint({ x: 50, y: 50 });
  });

await geomBench.run();
console.table(geomBench.table());

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${'='.repeat(80)}`);
console.log('  Summary');
console.log(`${'='.repeat(80)}\n`);

function getSummary(bench: Bench, name: string) {
  const results = bench.tasks
    .filter((t) => t.result)
    .map((t) => ({
      name: t.name,
      hz: t.result!.hz,
      mean: t.result!.mean
    }));

  if (results.length === 0) return;

  const fastest = results.reduce((a, b) => (a.hz > b.hz ? a : b));
  const slowest = results.reduce((a, b) => (a.hz < b.hz ? a : b));

  console.log(`${name}:`);
  console.log(`  Fastest: ${fastest.name} (${(fastest.hz / 1e6).toFixed(2)}M ops/sec)`);
  console.log(`  Slowest: ${slowest.name} (${(slowest.hz / 1e6).toFixed(2)}M ops/sec)`);
  console.log(`  Total benchmarks: ${results.length}`);
  console.log('');
}

getSummary(bufferBench, 'Buffer');
getSummary(geomBench, 'Geometry');

console.log('\n✅ Benchmark suite completed successfully\n');
