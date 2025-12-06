/**
 * Core type definitions for NanoPDF
 * These types mirror the Rust implementation for 100% API compatibility
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes matching Rust's error types
 */
export enum ErrorCode {
  Generic = 'GENERIC',
  System = 'SYSTEM',
  Format = 'FORMAT',
  Eof = 'EOF',
  Argument = 'ARGUMENT',
  Limit = 'LIMIT',
  Unsupported = 'UNSUPPORTED'
}

/**
 * NanoPDF error
 */
export class NanoPDFError extends Error {
  readonly code: ErrorCode;
  override readonly cause?: Error | undefined;

  constructor(code: ErrorCode, message: string, cause?: Error | undefined) {
    super(message);
    this.name = 'NanoPDFError';
    this.code = code;
    this.cause = cause;
  }

  static generic(message: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Generic, message);
  }

  static system(message: string, cause?: Error): NanoPDFError {
    return new NanoPDFError(ErrorCode.System, message, cause);
  }

  static format(message: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Format, message);
  }

  static eof(): NanoPDFError {
    return new NanoPDFError(ErrorCode.Eof, 'Unexpected end of file');
  }

  static argument(message: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Argument, message);
  }

  static limit(message: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Limit, message);
  }

  static unsupported(message: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Unsupported, message);
  }

  static notImplemented(feature: string): NanoPDFError {
    return new NanoPDFError(ErrorCode.Unsupported, `${feature} is not yet implemented`);
  }
}

// ============================================================================
// Geometry Types
// ============================================================================

/**
 * Point-like object
 */
export interface PointLike {
  readonly x: number;
  readonly y: number;
}

/**
 * Rectangle-like object
 */
export interface RectLike {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/**
 * Integer rectangle-like object
 */
export interface IRectLike {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/**
 * Matrix-like object (affine transformation)
 */
export interface MatrixLike {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/**
 * Quad-like object (four corner points)
 */
export interface QuadLike {
  readonly ul: PointLike;
  readonly ur: PointLike;
  readonly ll: PointLike;
  readonly lr: PointLike;
}

// ============================================================================
// Colorspace Types
// ============================================================================

/**
 * Colorspace type enumeration
 */
export enum ColorspaceType {
  None = 'NONE',
  Gray = 'GRAY',
  RGB = 'RGB',
  BGR = 'BGR',
  CMYK = 'CMYK',
  Lab = 'LAB',
  Indexed = 'INDEXED',
  Separation = 'SEPARATION'
}

/**
 * Colorspace-like object
 */
export interface ColorspaceLike {
  readonly name: string;
  readonly n: number;
  readonly type: ColorspaceType;
}

// ============================================================================
// Pixmap Types
// ============================================================================

/**
 * Pixmap-like object
 */
export interface PixmapLike {
  readonly width: number;
  readonly height: number;
  readonly n: number;
  readonly alpha: boolean;
  readonly stride: number;
  readonly samples: Uint8Array;
  readonly colorspace: ColorspaceLike | null;
}

// ============================================================================
// Stream Types
// ============================================================================

/**
 * Seek origin for stream operations
 */
export enum SeekOrigin {
  Start = 0,
  Current = 1,
  End = 2
}

/**
 * Stream-like object
 */
export interface StreamLike {
  read(buffer: Uint8Array): number;
  readByte(): number | null;
  peek(): number | null;
  seek(offset: number, origin: SeekOrigin): void;
  tell(): number;
  isEof(): boolean;
  readonly length: number | null;
}

// ============================================================================
// Buffer Types
// ============================================================================

/**
 * Types that can be converted to a Buffer
 */
export type BufferLike = globalThis.Buffer | Uint8Array | ArrayBuffer | string | number[];

/**
 * Check if a value is BufferLike
 */
export function isBufferLike(value: unknown): value is BufferLike {
  return (
    globalThis.Buffer.isBuffer(value) ||
    value instanceof Uint8Array ||
    value instanceof ArrayBuffer ||
    typeof value === 'string' ||
    (Array.isArray(value) && value.every((v) => typeof v === 'number'))
  );
}

// ============================================================================
// Document Types
// ============================================================================

/**
 * Document permission flags
 */
export enum DocumentPermission {
  Print = 1 << 2,
  Modify = 1 << 3,
  Copy = 1 << 4,
  Annotate = 1 << 5,
  Form = 1 << 8,
  Accessibility = 1 << 9,
  Assemble = 1 << 10,
  PrintHQ = 1 << 11
}

/**
 * Page location (chapter + page within chapter)
 */
export interface PageLocation {
  chapter: number;
  page: number;
}

/**
 * Link destination types
 */
export enum LinkDestType {
  None = 'NONE',
  Goto = 'GOTO',
  GotoR = 'GOTOR',
  URI = 'URI',
  Launch = 'LAUNCH',
  Named = 'NAMED'
}

/**
 * Link object
 */
export interface Link {
  readonly bounds: RectLike;
  readonly dest: LinkDestType;
  readonly uri?: string;
  readonly page?: number;
}

/**
 * Outline item (bookmark)
 */
export interface OutlineItem {
  readonly title: string;
  readonly uri?: string;
  readonly page?: number;
  readonly children: OutlineItem[];
  readonly isOpen: boolean;
}

// ============================================================================
// PDF Object Types
// ============================================================================

/**
 * PDF object type enumeration
 */
export enum PdfObjectType {
  Null = 'NULL',
  Bool = 'BOOL',
  Int = 'INT',
  Real = 'REAL',
  String = 'STRING',
  Name = 'NAME',
  Array = 'ARRAY',
  Dict = 'DICT',
  Indirect = 'INDIRECT',
  Stream = 'STREAM'
}

/**
 * PDF indirect reference
 */
export interface PdfIndirectRef {
  readonly num: number;
  readonly gen: number;
}

// ============================================================================
// Compression Filter Types
// ============================================================================

/**
 * PDF compression filter names
 */
export enum FilterName {
  FlateDecode = 'FlateDecode',
  LZWDecode = 'LZWDecode',
  ASCII85Decode = 'ASCII85Decode',
  ASCIIHexDecode = 'ASCIIHexDecode',
  RunLengthDecode = 'RunLengthDecode',
  CCITTFaxDecode = 'CCITTFaxDecode',
  DCTDecode = 'DCTDecode',
  JPXDecode = 'JPXDecode',
  JBIG2Decode = 'JBIG2Decode',
  Crypt = 'Crypt'
}

/**
 * Filter type as string literal union (for type safety)
 */
export type FilterType =
  | 'FlateDecode'
  | 'LZWDecode'
  | 'ASCII85Decode'
  | 'ASCIIHexDecode'
  | 'RunLengthDecode'
  | 'CCITTFaxDecode'
  | 'DCTDecode'
  | 'JPXDecode'
  | 'JBIG2Decode'
  | 'Crypt';

/**
 * Filter parameters for FlateDecode/LZWDecode
 */
export interface FlateDecodeParams {
  predictor?: number;
  colors?: number;
  bitsPerComponent?: number;
  columns?: number;
  earlyChange?: number;
}

/**
 * Filter parameters for CCITTFaxDecode
 */
export interface CCITTFaxDecodeParams {
  k?: number;
  endOfLine?: boolean;
  encodedByteAlign?: boolean;
  columns?: number;
  rows?: number;
  endOfBlock?: boolean;
  blackIs1?: boolean;
  damagedRowsBeforeError?: number;
}

/**
 * Filter parameters for DCTDecode
 */
export interface DCTDecodeParams {
  colorTransform?: number;
}

/**
 * Filter parameters for JBIG2Decode
 */
export interface JBIG2DecodeParams {
  globals?: Uint8Array;
}

// ============================================================================
// Rendering Types
// ============================================================================

/**
 * Rendering options
 */
export interface RenderOptions {
  /** Resolution in DPI (default: 72) */
  dpi?: number;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation?: number;
  /** Colorspace for rendering */
  colorspace?: ColorspaceType;
  /** Include alpha channel */
  alpha?: boolean;
  /** Clip rectangle */
  clip?: RectLike;
  /** Background color (default: white) */
  backgroundColor?: number[];
}

/**
 * Text extraction options
 */
export interface TextExtractionOptions {
  /** Preserve whitespace */
  preserveWhitespace?: boolean;
  /** Include ligatures */
  preserveLigatures?: boolean;
  /** Sort by reading order */
  sortByReadingOrder?: boolean;
}

// ============================================================================
// Annotation Types
// ============================================================================

/**
 * Annotation type enumeration
 */
export enum AnnotationType {
  Text = 'TEXT',
  Link = 'LINK',
  FreeText = 'FREE_TEXT',
  Line = 'LINE',
  Square = 'SQUARE',
  Circle = 'CIRCLE',
  Polygon = 'POLYGON',
  PolyLine = 'POLY_LINE',
  Highlight = 'HIGHLIGHT',
  Underline = 'UNDERLINE',
  Squiggly = 'SQUIGGLY',
  StrikeOut = 'STRIKE_OUT',
  Stamp = 'STAMP',
  Caret = 'CARET',
  Ink = 'INK',
  Popup = 'POPUP',
  FileAttachment = 'FILE_ATTACHMENT',
  Sound = 'SOUND',
  Movie = 'MOVIE',
  Widget = 'WIDGET',
  Screen = 'SCREEN',
  PrinterMark = 'PRINTER_MARK',
  TrapNet = 'TRAP_NET',
  Watermark = 'WATERMARK',
  ThreeD = 'THREE_D',
  Redact = 'REDACT'
}

/**
 * Annotation-like object
 */
export interface AnnotationLike {
  readonly type: AnnotationType;
  readonly rect: RectLike;
  readonly contents?: string;
  readonly author?: string;
  readonly modificationDate?: Date;
  readonly creationDate?: Date;
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Form field type enumeration
 */
export enum FormFieldType {
  Unknown = 'UNKNOWN',
  Button = 'BUTTON',
  CheckBox = 'CHECK_BOX',
  RadioButton = 'RADIO_BUTTON',
  Text = 'TEXT',
  ListBox = 'LIST_BOX',
  ComboBox = 'COMBO_BOX',
  Signature = 'SIGNATURE'
}

/**
 * Form field-like object
 */
export interface FormFieldLike {
  readonly type: FormFieldType;
  readonly name: string;
  readonly value: string | boolean | string[];
  readonly rect: RectLike;
  readonly flags: number;
}
