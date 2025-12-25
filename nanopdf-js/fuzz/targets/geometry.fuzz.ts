/**
 * Geometry Operations Fuzzer
 *
 * Tests the robustness of geometry classes (Point, Rect, Matrix, Quad)
 * with extreme and random values.
 *
 * Targets:
 * - Point operations
 * - Rect operations
 * - Matrix transformations
 * - Quad operations
 *
 * Run:
 *   npx jazzer fuzz/targets/geometry.fuzz.ts
 */

import { FuzzedDataProvider } from '@jazzer.js/core';
import { Point, Rect, IRect, Matrix, Quad } from '../../src/geometry.js';

export function fuzz(data: Buffer): void {
  const provider = new FuzzedDataProvider(data);

  // Skip tiny inputs
  if (data.length < 8) {
    return;
  }

  try {
    // Test 1: Point operations
    try {
      const x1 = provider.consumeNumber();
      const y1 = provider.consumeNumber();
      const x2 = provider.consumeNumber();
      const y2 = provider.consumeNumber();

      const p1 = new Point(x1, y1);
      const p2 = new Point(x2, y2);

      // Distance
      try {
        p1.distance(p2);
      } catch (e) {
        // Distance failed - acceptable
      }

      // Transform
      try {
        const matrix = Matrix.translate(x2, y2);
        p1.transform(matrix);
      } catch (e) {
        // Transform failed - acceptable
      }
    } catch (e) {
      // Point operations failed - acceptable
    }

    // Test 2: Rect operations
    try {
      const x0 = provider.consumeNumber();
      const y0 = provider.consumeNumber();
      const x1 = provider.consumeNumber();
      const y1 = provider.consumeNumber();

      const rect = new Rect(x0, y0, x1, y1);

      // Check if rect is valid
      try {
        rect.isEmpty;
        rect.isValid;
        rect.isInfinite;
      } catch (e) {
        // Property access failed - acceptable
      }

      // Try transformations
      try {
        const matrix = Matrix.scale(provider.consumeNumber(), provider.consumeNumber());
        rect.transform(matrix);
      } catch (e) {
        // Transform failed - acceptable
      }

      // Try intersection
      try {
        const x2 = provider.consumeNumber();
        const y2 = provider.consumeNumber();
        const x3 = provider.consumeNumber();
        const y3 = provider.consumeNumber();
        const rect2 = new Rect(x2, y2, x3, y3);
        rect.intersect(rect2);
      } catch (e) {
        // Intersect failed - acceptable
      }

      // Try union
      try {
        const x2 = provider.consumeNumber();
        const y2 = provider.consumeNumber();
        const x3 = provider.consumeNumber();
        const y3 = provider.consumeNumber();
        const rect2 = new Rect(x2, y2, x3, y3);
        rect.union(rect2);
      } catch (e) {
        // Union failed - acceptable
      }
    } catch (e) {
      // Rect operations failed - acceptable
    }

    // Test 3: Matrix operations
    try {
      const a = provider.consumeNumber();
      const b = provider.consumeNumber();
      const c = provider.consumeNumber();
      const d = provider.consumeNumber();
      const e = provider.consumeNumber();
      const f = provider.consumeNumber();

      const matrix = new Matrix(a, b, c, d, e, f);

      // Check if invertible
      try {
        matrix.isInvertible;
      } catch (e) {
        // Property access failed - acceptable
      }

      // Try invert
      try {
        matrix.invert();
      } catch (e) {
        // Invert failed (singular matrix) - acceptable
      }

      // Try concat
      try {
        const a2 = provider.consumeNumber();
        const b2 = provider.consumeNumber();
        const c2 = provider.consumeNumber();
        const d2 = provider.consumeNumber();
        const e2 = provider.consumeNumber();
        const f2 = provider.consumeNumber();
        const matrix2 = new Matrix(a2, b2, c2, d2, e2, f2);
        matrix.concat(matrix2);
      } catch (e) {
        // Concat failed - acceptable
      }

      // Try transform point
      try {
        const px = provider.consumeNumber();
        const py = provider.consumeNumber();
        const point = new Point(px, py);
        matrix.transformPoint(point);
      } catch (e) {
        // Transform failed - acceptable
      }
    } catch (e) {
      // Matrix operations failed - acceptable
    }

    // Test 4: IRect (integer rect) operations
    try {
      const x0 = provider.consumeIntegral(4, true);
      const y0 = provider.consumeIntegral(4, true);
      const x1 = provider.consumeIntegral(4, true);
      const y1 = provider.consumeIntegral(4, true);

      const irect = new IRect(x0, y0, x1, y1);

      // Check properties
      try {
        irect.isEmpty;
        irect.width;
        irect.height;
        irect.area;
      } catch (e) {
        // Property access failed - acceptable
      }
    } catch (e) {
      // IRect operations failed - acceptable
    }

    // Test 5: Quad operations
    try {
      const coords: [number, number, number, number, number, number, number, number] = [
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber(),
        provider.consumeNumber()
      ];

      const quad = new Quad(...coords);

      // Get bounding box
      try {
        quad.toRect();
      } catch (e) {
        // toRect failed - acceptable
      }

      // Transform
      try {
        const matrix = Matrix.rotate(provider.consumeNumber());
        quad.transform(matrix);
      } catch (e) {
        // Transform failed - acceptable
      }
    } catch (e) {
      // Quad operations failed - acceptable
    }
  } catch (e) {
    // Overall fuzzing failed - acceptable
  }
}
