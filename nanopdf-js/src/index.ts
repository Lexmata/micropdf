/**
 * NanoPDF - Node.js bindings for the NanoPDF PDF library
 *
 * This library provides 100% API compatibility with the Rust NanoPDF library.
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

export {
  // Error types
  ErrorCode,
  NanoPDFError,

  // Geometry types
  type PointLike,
  type RectLike,
  type IRectLike,
  type MatrixLike,
  type QuadLike,

  // Colorspace types
  ColorspaceType,
  type ColorspaceLike,

  // Pixmap types
  type PixmapLike,

  // Stream types
  SeekOrigin,
  type StreamLike,

  // Buffer types
  type BufferLike,
  isBufferLike,

  // Document types
  DocumentPermission,
  type PageLocation,
  LinkDestType,
  type Link,
  type OutlineItem as OutlineItemType,

  // PDF object types
  PdfObjectType,
  type PdfIndirectRef as PdfIndirectRefType,

  // Filter types
  FilterName,
  type FilterType,
  type FlateDecodeParams,
  type CCITTFaxDecodeParams,
  type DCTDecodeParams,
  type JBIG2DecodeParams,

  // Rendering types
  type RenderOptions,
  type TextExtractionOptions,

  // Annotation types
  AnnotationType,
  type AnnotationLike,

  // Form types
  FormFieldType,
  type FormFieldLike,
} from './types.js';

// ============================================================================
// Geometry
// ============================================================================

export { Point, Rect, IRect, Matrix, Quad } from './geometry.js';

// ============================================================================
// Buffer
// ============================================================================

export { Buffer, BufferReader, BufferWriter } from './buffer.js';

// ============================================================================
// Stream
// ============================================================================

export { Stream, AsyncStream } from './stream.js';

// ============================================================================
// Colorspace
// ============================================================================

export { Colorspace, convertColor } from './colorspace.js';

// ============================================================================
// Pixmap
// ============================================================================

export { Pixmap } from './pixmap.js';

// ============================================================================
// Document
// ============================================================================

export { Document, Page, OutlineItem } from './document.js';

// ============================================================================
// PDF Objects
// ============================================================================

export {
  PdfObject,
  PdfArray,
  PdfDict,
  PdfStream,
  PdfIndirectRef,
  pdfNull,
  pdfBool,
  pdfInt,
  pdfReal,
  pdfString,
  pdfName,
  pdfArray,
  pdfDict,
} from './pdf/object.js';

// ============================================================================
// Filters
// ============================================================================

export {
  flateEncode,
  flateDecode,
  asciiHexEncode,
  asciiHexDecode,
  ascii85Encode,
  ascii85Decode,
  runLengthEncode,
  runLengthDecode,
  lzwDecode,
  decodeFilter,
  encodeFilter,
} from './filter.js';

// ============================================================================
// Main API
// ============================================================================

export { NanoPDF, getVersion, type NanoPDFOptions } from './nanopdf.js';

// ============================================================================
// Version
// ============================================================================

/** Library version */
export const VERSION = '0.1.0';
