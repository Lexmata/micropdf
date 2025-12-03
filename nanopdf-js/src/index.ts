/**
 * NanoPDF - Node.js bindings for the NanoPDF PDF library
 * @packageDocumentation
 */

export { Buffer, BufferLike, isBufferLike } from './buffer.js';
export { Point, Rect, Matrix, Quad } from './geometry.js';
export { NanoPDF, getVersion } from './nanopdf.js';
export type { NanoPDFOptions } from './nanopdf.js';

// Re-export types
export type {
  PointLike,
  RectLike,
  MatrixLike,
  QuadLike,
} from './geometry.js';

