/**
 * NanoPDF - High-performance PDF manipulation library for Node.js
 *
 * NanoPDF provides comprehensive PDF manipulation capabilities with a clean, type-safe
 * API. Built on top of MuPDF, it offers excellent performance and extensive PDF support.
 *
 * This library provides 100% API compatibility with the Rust NanoPDF library and includes
 * native N-API bindings for optimal performance.
 *
 * ## Features
 *
 * - **PDF Reading & Writing**: Open, modify, and save PDF documents
 * - **Page Rendering**: Render pages to images with custom resolution and colorspace
 * - **Text Extraction**: Extract text with layout information, search capabilities
 * - **Annotations**: Read and modify PDF annotations
 * - **Forms**: Interactive form field support
 * - **Security**: Password protection and permission checking
 * - **Metadata**: Read and write document metadata
 * - **Vector Graphics**: Path construction and manipulation
 * - **Image Processing**: Pixmap manipulation and colorspace conversion
 *
 * ## Quick Start
 *
 * ```typescript
 * import { Document, Matrix } from 'nanopdf';
 *
 * // Open a PDF
 * const doc = Document.open('document.pdf');
 *
 * // Get basic info
 * console.log(`Pages: ${doc.pageCount}`);
 * console.log(`Title: ${doc.getMetadata('Title')}`);
 *
 * // Render first page
 * const page = doc.loadPage(0);
 * const matrix = Matrix.scale(2, 2); // 2x zoom
 * const pixmap = page.toPixmap(matrix);
 *
 * // Extract text
 * const text = page.extractText();
 * console.log(text);
 *
 * // Search for text
 * const hits = page.searchText('hello');
 * console.log(`Found ${hits.length} occurrences`);
 *
 * // Clean up
 * page.drop();
 * doc.close();
 * ```
 *
 * ## Core Modules
 *
 * - {@link document} - PDF document handling and page access
 * - {@link geometry} - 2D geometry primitives (Point, Rect, Matrix)
 * - {@link buffer} - Binary data handling
 * - {@link path} - Vector graphics path construction
 * - {@link pixmap} - Raster image manipulation
 * - {@link text} - Text layout and glyph rendering
 * - {@link colorspace} - Color space management
 *
 * ## Resource Management
 *
 * NanoPDF uses manual resource management for optimal performance. Objects that
 * allocate native resources (Document, Page, Pixmap, etc.) must be explicitly
 * freed using `drop()` or `close()` methods.
 *
 * ```typescript
 * // Always clean up resources
 * const doc = Document.open('document.pdf');
 * try {
 *   // Work with document
 * } finally {
 *   doc.close();
 * }
 * ```
 *
 * ## Type Safety
 *
 * NanoPDF is written in TypeScript and provides comprehensive type definitions
 * for excellent IDE support and compile-time type checking.
 *
 * ## Performance
 *
 * - Native C bindings to MuPDF for optimal performance
 * - Zero-copy operations where possible
 * - Efficient memory management
 * - Suitable for production workloads
 *
 * @packageDocumentation
 * @module nanopdf
 * @preferred
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
  type AnnotationLike,

  // Form types
  FormFieldType,
  type FormFieldLike
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
// Colorspace and Pixmap (basic exports)
// ============================================================================
// Note: Full implementations exported later in this file

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
  // Factory functions
  pdfNull,
  pdfBool,
  pdfInt,
  pdfReal,
  pdfString,
  pdfName,
  pdfArray,
  pdfDict,
  // Utility functions
  pdfObjectCompare,
  pdfNameEquals,
  pdfDeepCopy,
  pdfCopyArray,
  pdfCopyDict,
  // Type checking
  isNull,
  isBool,
  isInt,
  isReal,
  isNumber,
  isName,
  isString,
  isArray,
  isDict,
  isStream,
  isIndirect,
  // Value extraction with defaults
  toBoolDefault,
  toIntDefault,
  toRealDefault,
  toObjNum,
  toGenNum,
  // Reference counting
  pdfKeepObj,
  pdfDropObj,
  pdfObjRefs,
  // Object marking
  pdfObjMarked,
  pdfMarkObj,
  pdfUnmarkObj,
  pdfSetObjParent,
  pdfObjParentNum,
  // Geometry utilities
  pdfNewPoint,
  pdfNewRect,
  pdfNewMatrix,
  pdfNewDate,
  // Dictionary utilities
  pdfDictGetKey,
  pdfDictGetVal,
  // Indirect reference utilities
  pdfObjIsResolved,
  pdfResolveIndirect,
  pdfLoadObject
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
  encodeFilter
} from './filter.js';

// ============================================================================
// Path
// ============================================================================

export { Path, StrokeState, LineCap, LineJoin, type PathWalker } from './path.js';

// ============================================================================
// Form
// ============================================================================

export {
  Form,
  FormField,
  FieldType,
  FieldAlignment,
  FieldFlags,
  type ChoiceOption
} from './form.js';

// ============================================================================
// Annotations
// ============================================================================

export {
  Annotation,
  AnnotationList,
  AnnotationType,
  AnnotationFlags,
  LineEndingStyle
} from './annot.js';

// ============================================================================
// Device (Rendering)
// ============================================================================

export {
  Device,
  DrawDevice,
  BBoxDevice,
  TraceDevice,
  ListDevice,
  DeviceType,
  DeviceHint,
  BlendMode
} from './device.js';

// ============================================================================
// Colorspace (Full Implementation)
// ============================================================================

export { Colorspace, ColorspaceType } from './colorspace.js';

// ============================================================================
// Rendering Options
// ============================================================================

export {
  type ExtendedRenderOptions,
  type RenderProgressCallback,
  type RenderErrorCallback,
  AntiAliasLevel,
  getDefaultRenderOptions,
  dpiToScale,
  scaleToDpi,
  validateRenderOptions,
  mergeRenderOptions
} from './render-options.js';

// ============================================================================
// Pixmap (Full Implementation)
// ============================================================================

export { Pixmap, type PixmapInfo } from './pixmap.js';

// ============================================================================
// Text
// ============================================================================

export { Text, Language, type TextSpan, type TextItem, type TextWalker } from './text.js';

// ============================================================================
// Structured Text
// ============================================================================

export {
  STextPage,
  STextBlockType,
  WritingMode,
  type STextCharData,
  type STextLineData,
  type STextBlockData,
  quadToRect,
  quadsOverlap
} from './stext.js';

// ============================================================================
// Display List
// ============================================================================

export { DisplayList } from './display-list.js';

// ============================================================================
// Link
// ============================================================================

export { Link, LinkList, LinkDestinationType } from './link.js';

// ============================================================================
// Cookie (Progress Tracking)
// ============================================================================

export { Cookie, CookieOperation } from './cookie.js';

// ============================================================================
// Font
// ============================================================================

export { Font, FontManager, FontFlags, StandardFonts, type GlyphInfo } from './font.js';

// ============================================================================
// Image
// ============================================================================

export { Image, ImageDecoder, ImageFormat, ImageOrientation, type ImageInfo } from './image.js';

// ============================================================================
// Output (Binary Writer)
// ============================================================================

export { Output } from './output.js';

// ============================================================================
// Archive (ZIP, TAR)
// ============================================================================

export { Archive, ArchiveFormat, type ArchiveEntry } from './archive.js';

// ============================================================================
// Context (Error & Memory Management)
// ============================================================================

export {
  Context,
  getDefaultContext,
  setDefaultContext,
  resetDefaultContext,
  type ErrorCallback,
  type WarningCallback,
  type ContextInfo
} from './context.js';

// ============================================================================
// Enhanced API (High-level convenience functions)
// ============================================================================

export {
  Enhanced,
  getEnhanced,
  addWatermark,
  mergePDFs,
  splitPDF,
  optimizePDF,
  linearizePDF,
  createBlankDocument,
  createTextPDF
} from './enhanced.js';

// ============================================================================
// Main API
// ============================================================================

export { NanoPDF, getVersion, type NanoPDFOptions } from './nanopdf.js';

// ============================================================================
// Resource Tracking and Memory Optimization
// ============================================================================

/**
 * Resource tracking utilities for leak detection and memory optimization.
 *
 * @example
 * ```typescript
 * import {
 *   enableTracking,
 *   handleRegistry,
 *   generateLeakReport,
 *   getPoolStats
 * } from 'nanopdf';
 *
 * // Enable tracking in development
 * enableTracking(true);
 *
 * // ... use NanoPDF ...
 *
 * // Check for leaks
 * console.log(generateLeakReport());
 * ```
 */
export {
  ResourceType,
  handleRegistry,
  enableTracking,
  enableStackTraces,
  isTrackingEnabled,
  acquirePoint,
  releasePoint,
  acquireRect,
  releaseRect,
  acquireMatrix,
  releaseMatrix,
  acquireQuad,
  releaseQuad,
  getPoolStats,
  clearPools,
  byteArrayPool,
  uint8ArrayToString,
  bufferToString,
  numberArrayPool,
  generateLeakReport,
  printLeakReport,
  type AllocationInfo,
  type TypeStats,
  type GlobalStats
} from './resource-tracking.js';

// ============================================================================
// Easy API - Simplified PDF Operations
// ============================================================================

// Temporarily disabled due to API mismatch
// export {
//   EasyPDF,
//   PDFUtils,
//   type EasyRenderOptions,
//   type PdfMetadata,
//   type PageInfo,
//   type DocumentInfo,
//   type ExtractedText,
//   type SearchResult
// } from './easy.js';

// ============================================================================
// Simple API - Ultra-Simple Function API
// ============================================================================

// Temporarily disabled due to API mismatch
// export {
//   extractText,
//   extractPageText,
//   getPageCount,
//   getMetadata,
//   getInfo as getPdfInfo,
//   renderToPNG,
//   renderAllToPNG,
//   getPageAsPNG,
//   searchText,
//   isEncrypted,
//   saveTextToFile,
//   convertToImages,
//   quickSummary
// } from './simple.js';

// ============================================================================
// TypedArray Utilities - High-Performance Numeric Operations
// ============================================================================

/**
 * TypedArray utilities for batch numeric operations.
 *
 * Use these functions for performance-critical code that processes
 * large amounts of coordinate, color, or pixel data.
 *
 * @example
 * ```typescript
 * import {
 *   pointsFromCoords,
 *   transformPointsInPlace,
 *   colorFromRGB,
 *   matrixRotate
 * } from 'nanopdf';
 *
 * // Create points as Float32Array
 * const points = pointsFromCoords(0, 0, 100, 0, 100, 100, 0, 100);
 *
 * // Transform in-place (no allocation)
 * const m = matrixRotate(45);
 * transformPointsInPlace(points, m[0], m[1], m[2], m[3], m[4], m[5]);
 *
 * // Create colors as Float32Array
 * const red = colorFromRGB(255, 0, 0);  // Normalized to [1, 0, 0]
 * ```
 */
export {
  // Color arrays
  colorFromRGB,
  colorFromRGBA,
  colorFromGray,
  colorFromCMYK,
  // Point arrays
  pointsFromCoords,
  pointsFromObjects,
  transformPointsInPlace,
  transformPoints,
  // Rectangle arrays
  rectsFromCoords,
  rectsFromObjects,
  transformRectsInPlace,
  // Matrix operations
  matrixIdentity,
  matrixTranslate,
  matrixScale,
  matrixRotate,
  matrixConcatInPlace,
  matrixConcat,
  // Distance calculations
  pointDistances,
  pointDistancesSquared,
  // Containment tests
  rectContainsPoints,
  countPointsInRect,
  // Pixel operations
  convertPixelFormat,
  premultiplyAlpha,
  unpremultiplyAlpha
} from './typed-arrays.js';

// ============================================================================
// Version
// ============================================================================

/** Library version */
export const VERSION = '0.2.0';
