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
// Pixmap (Full Implementation)
// ============================================================================

export { Pixmap, type PixmapInfo } from './pixmap.js';

// ============================================================================
// Text
// ============================================================================

export { Text, type TextSpan, type TextItem, type TextWalker } from './text.js';

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
// Version
// ============================================================================

/** Library version */
export const VERSION = '0.1.0';
