/**
 * Buffer - Dynamic byte array wrapper for PDF data manipulation
 *
 * This module provides a flexible buffer implementation for working with binary PDF data.
 * Buffers are used throughout the library for reading, writing, and manipulating
 * PDF content, streams, and binary resources.
 *
 * This implementation mirrors the Rust `fitz::buffer::Buffer` for 100% API compatibility
 * and wraps Node.js Buffer for efficient memory management.
 *
 * @module buffer
 * @example
 * ```typescript
 * import { Buffer } from 'nanopdf';
 *
 * // Create from string
 * const buf = Buffer.fromString('Hello, PDF!');
 *
 * // Append data
 * buf.append(Buffer.fromString(' More text.'));
 *
 * // Get as string
 * console.log(buf.toString()); // "Hello, PDF! More text."
 *
 * // Get raw bytes
 * const bytes = buf.toUint8Array();
 *
 * // Get size
 * console.log(buf.length); // 24
 * ```
 */

import { NanoPDFError, type BufferLike, isBufferLike } from './types.js';

// Re-export for convenience
export { BufferLike, isBufferLike };

/**
 * A dynamic byte buffer for PDF data manipulation.
 *
 * Buffer provides efficient storage and manipulation of binary data. It's used
 * throughout the library for PDF streams, content, images, and other binary resources.
 *
 * **Key Features:**
 * - Dynamic resizing as data is appended
 * - Zero-copy conversion to/from Node.js Buffer
 * - String encoding/decoding support
 * - Slice and copy operations
 * - Compatible with standard Node.js Buffer operations
 *
 * Mirrors the Rust `Buffer` implementation with `bytes` crate semantics.
 *
 * @class Buffer
 * @example
 * ```typescript
 * // Create empty buffer
 * const buf1 = Buffer.create();
 *
 * // Create from string
 * const buf2 = Buffer.fromString('Hello');
 *
 * // Create from bytes
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
 * const buf3 = Buffer.fromUint8Array(bytes);
 *
 * // Append data
 * buf1.append(buf2);
 * buf1.append(Buffer.fromString(' World!'));
 *
 * // Extract data
 * console.log(buf1.toString()); // "Hello World!"
 * console.log(buf1.length); // 12
 *
 * // Slice
 * const hello = buf1.slice(0, 5);
 * console.log(hello.toString()); // "Hello"
 *
 * // Clear
 * buf1.clear();
 * console.log(buf1.length); // 0
 * ```
 */
export class Buffer {
  /**
   * The underlying Node.js Buffer containing the data.
   * @private
   * @type {globalThis.Buffer}
   */
  private _data: globalThis.Buffer;

  /**
   * Creates a new Buffer instance.
   *
   * **Note**: Use static factory methods instead of calling this constructor directly.
   *
   * @private
   * @param {globalThis.Buffer} data - The underlying Node.js Buffer
   */
  private constructor(data: globalThis.Buffer) {
    this._data = data;
  }

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /**
   * Creates a new empty buffer with optional initial capacity.
   *
   * The capacity parameter is a hint for initial memory allocation. The buffer
   * will automatically grow as needed when data is appended.
   *
   * @static
   * @param {number} [capacity=0] - Initial capacity in bytes (optional)
   * @returns {Buffer} A new empty buffer
   * @example
   * ```typescript
   * // Create empty buffer
   * const buf1 = Buffer.create();
   *
   * // Create with initial capacity
   * const buf2 = Buffer.create(1024); // Reserve 1KB
   * ```
   */
  static create(capacity = 0): Buffer {
    return new Buffer(globalThis.Buffer.alloc(capacity));
  }

  /**
   * Creates a buffer from a Node.js Buffer (zero-copy).
   *
   * This operation wraps the existing Buffer without copying data, making it
   * very efficient. Modifications to the original Buffer will be visible in
   * the NanoPDF Buffer and vice versa.
   *
   * @static
   * @param {globalThis.Buffer} data - The Node.js Buffer to wrap
   * @returns {Buffer} A new Buffer wrapping the provided data
   * @example
   * ```typescript
   * const nodeBuffer = Buffer.from('Hello');
   * const pdfBuffer = Buffer.fromBuffer(nodeBuffer);
   * console.log(pdfBuffer.toString()); // "Hello"
   * ```
   */
  static fromBuffer(data: globalThis.Buffer): Buffer {
    return new Buffer(data);
  }

  /**
   * Creates a buffer from a Uint8Array.
   *
   * The data is copied into a new Node.js Buffer.
   *
   * @static
   * @param {Uint8Array} data - The byte array to copy
   * @returns {Buffer} A new Buffer containing the data
   * @example
   * ```typescript
   * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
   * const buf = Buffer.fromUint8Array(bytes);
   * console.log(buf.toString()); // "Hello"
   * ```
   */
  static fromUint8Array(data: Uint8Array): Buffer {
    return new Buffer(globalThis.Buffer.from(data));
  }

  /**
   * Creates a buffer from an ArrayBuffer.
   *
   * Useful for working with binary data from various Web APIs and file operations.
   *
   * @static
   * @param {ArrayBuffer} data - The ArrayBuffer to convert
   * @returns {Buffer} A new Buffer containing the data
   * @example
   * ```typescript
   * const arrayBuffer = new ArrayBuffer(5);
   * const view = new Uint8Array(arrayBuffer);
   * view.set([72, 101, 108, 108, 111]);
   * const buf = Buffer.fromArrayBuffer(arrayBuffer);
   * console.log(buf.toString()); // "Hello"
   * ```
   */
  static fromArrayBuffer(data: ArrayBuffer): Buffer {
    return new Buffer(globalThis.Buffer.from(data));
  }

  /**
   * Creates a buffer from a string with specified encoding.
   *
   * Supports all standard Node.js buffer encodings including UTF-8, ASCII,
   * Base64, Hex, and more.
   *
   * @static
   * @param {string} str - The string to encode
   * @param {BufferEncoding} [encoding='utf-8'] - The character encoding to use
   * @returns {Buffer} A new Buffer containing the encoded string
   * @example
   * ```typescript
   * // UTF-8 (default)
   * const buf1 = Buffer.fromString('Hello');
   *
   * // ASCII
   * const buf2 = Buffer.fromString('Hello', 'ascii');
   *
   * // Base64
   * const buf3 = Buffer.fromString('SGVsbG8=', 'base64');
   * console.log(buf3.toString()); // "Hello"
   *
   * // Hex
   * const buf4 = Buffer.fromString('48656c6c6f', 'hex');
   * console.log(buf4.toString()); // "Hello"
   * ```
   */
  static fromString(str: string, encoding: BufferEncoding = 'utf-8'): Buffer {
    return new Buffer(globalThis.Buffer.from(str, encoding));
  }

  /**
   * Create a buffer from base64-encoded data
   */
  static fromBase64(data: string): Buffer {
    return new Buffer(globalThis.Buffer.from(data, 'base64'));
  }

  /**
   * Create a buffer from hex-encoded data
   */
  static fromHex(data: string): Buffer {
    return new Buffer(globalThis.Buffer.from(data, 'hex'));
  }

  /**
   * Create a buffer from various input types
   */
  static from(data: BufferLike): Buffer {
    if (data instanceof Buffer) {
      return Buffer.fromBuffer(data._data);
    }
    if (globalThis.Buffer.isBuffer(data)) {
      return Buffer.fromBuffer(data);
    }
    if (data instanceof Uint8Array) {
      return Buffer.fromUint8Array(data);
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.fromArrayBuffer(data);
    }
    if (typeof data === 'string') {
      return Buffer.fromString(data);
    }
    if (Array.isArray(data)) {
      return new Buffer(globalThis.Buffer.from(data));
    }
    throw NanoPDFError.argument('Expected Buffer, Uint8Array, ArrayBuffer, string, or number[]');
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Get the length of the buffer in bytes
   */
  get length(): number {
    return this._data.length;
  }

  /**
   * Check if the buffer is empty
   */
  get isEmpty(): boolean {
    return this._data.length === 0;
  }

  /**
   * Get the buffer capacity
   */
  get capacity(): number {
    return this._data.length;
  }

  // ============================================================================
  // Conversion Methods
  // ============================================================================

  /**
   * Get the buffer data as a Node.js Buffer
   */
  toNodeBuffer(): globalThis.Buffer {
    return this._data;
  }

  /**
   * Get the buffer data as a Uint8Array
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this._data);
  }

  /**
   * Get the buffer data as an ArrayBuffer
   */
  toArrayBuffer(): ArrayBuffer {
    const buf = this._data.buffer.slice(
      this._data.byteOffset,
      this._data.byteOffset + this._data.byteLength
    );
    // Handle SharedArrayBuffer case
    if (buf instanceof SharedArrayBuffer) {
      const ab = new ArrayBuffer(buf.byteLength);
      new Uint8Array(ab).set(new Uint8Array(buf));
      return ab;
    }
    return buf;
  }

  /**
   * Get the buffer data as a string
   */
  toString(encoding: BufferEncoding = 'utf-8'): string {
    return this._data.toString(encoding);
  }

  /**
   * Get the buffer data as base64-encoded string
   */
  toBase64(): string {
    return this._data.toString('base64');
  }

  /**
   * Get the buffer data as hex-encoded string
   */
  toHex(): string {
    return this._data.toString('hex');
  }

  /**
   * Get the buffer data as a number array
   */
  toArray(): number[] {
    return [...this._data];
  }

  // ============================================================================
  // Modification Methods
  // ============================================================================

  /**
   * Resize the buffer to the specified size
   */
  resize(newLength: number): this {
    if (newLength === this._data.length) {
      return this;
    }
    const newData = globalThis.Buffer.alloc(newLength);
    this._data.copy(newData, 0, 0, Math.min(this._data.length, newLength));
    this._data = newData;
    return this;
  }

  /**
   * Clear all data from the buffer
   */
  clear(): this {
    this._data = globalThis.Buffer.alloc(0);
    return this;
  }

  /**
   * Append data to the buffer
   */
  append(data: BufferLike): this {
    const other = Buffer.from(data);
    this._data = globalThis.Buffer.concat([this._data, other._data]);
    return this;
  }

  /**
   * Append a single byte to the buffer
   */
  appendByte(byte: number): this {
    const newData = globalThis.Buffer.alloc(this._data.length + 1);
    this._data.copy(newData);
    newData[this._data.length] = byte & 0xff;
    this._data = newData;
    return this;
  }

  /**
   * Append a string to the buffer (UTF-8 encoded)
   */
  appendString(str: string, encoding: BufferEncoding = 'utf-8'): this {
    return this.append(globalThis.Buffer.from(str, encoding));
  }

  /**
   * Append a 16-bit integer in little-endian format
   */
  appendInt16LE(value: number): this {
    const buf = globalThis.Buffer.alloc(2);
    buf.writeInt16LE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 32-bit integer in little-endian format
   */
  appendInt32LE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeInt32LE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 16-bit integer in big-endian format
   */
  appendInt16BE(value: number): this {
    const buf = globalThis.Buffer.alloc(2);
    buf.writeInt16BE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 32-bit integer in big-endian format
   */
  appendInt32BE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeInt32BE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 16-bit unsigned integer in little-endian format
   */
  appendUInt16LE(value: number): this {
    const buf = globalThis.Buffer.alloc(2);
    buf.writeUInt16LE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 32-bit unsigned integer in little-endian format
   */
  appendUInt32LE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeUInt32LE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 16-bit unsigned integer in big-endian format
   */
  appendUInt16BE(value: number): this {
    const buf = globalThis.Buffer.alloc(2);
    buf.writeUInt16BE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a 32-bit unsigned integer in big-endian format
   */
  appendUInt32BE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeUInt32BE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a float in little-endian format
   */
  appendFloatLE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeFloatLE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a float in big-endian format
   */
  appendFloatBE(value: number): this {
    const buf = globalThis.Buffer.alloc(4);
    buf.writeFloatBE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a double in little-endian format
   */
  appendDoubleLE(value: number): this {
    const buf = globalThis.Buffer.alloc(8);
    buf.writeDoubleLE(value, 0);
    return this.append(buf);
  }

  /**
   * Append a double in big-endian format
   */
  appendDoubleBE(value: number): this {
    const buf = globalThis.Buffer.alloc(8);
    buf.writeDoubleBE(value, 0);
    return this.append(buf);
  }

  // ============================================================================
  // Access Methods
  // ============================================================================

  /**
   * Get a slice of the buffer
   */
  slice(start: number, end?: number): Buffer {
    return new Buffer(globalThis.Buffer.from(this._data.subarray(start, end)));
  }

  /**
   * Split the buffer at the given index
   */
  splitAt(mid: number): [Buffer, Buffer] {
    const first = this.slice(0, mid);
    const second = this.slice(mid);
    return [first, second];
  }

  /**
   * Get a byte at the specified index
   */
  at(index: number): number | undefined {
    if (index < 0) {
      index = this._data.length + index;
    }
    if (index < 0 || index >= this._data.length) {
      return undefined;
    }
    return this._data[index];
  }

  /**
   * Set a byte at the specified index
   */
  set(index: number, value: number): this {
    if (index < 0) {
      index = this._data.length + index;
    }
    if (index >= 0 && index < this._data.length) {
      this._data[index] = value & 0xff;
    }
    return this;
  }

  /**
   * Read a 16-bit unsigned integer at offset (big-endian)
   */
  readUInt16BE(offset: number): number {
    return this._data.readUInt16BE(offset);
  }

  /**
   * Read a 32-bit unsigned integer at offset (big-endian)
   */
  readUInt32BE(offset: number): number {
    return this._data.readUInt32BE(offset);
  }

  /**
   * Read a 16-bit unsigned integer at offset (little-endian)
   */
  readUInt16LE(offset: number): number {
    return this._data.readUInt16LE(offset);
  }

  /**
   * Read a 32-bit unsigned integer at offset (little-endian)
   */
  readUInt32LE(offset: number): number {
    return this._data.readUInt32LE(offset);
  }

  /**
   * Read a 16-bit signed integer at offset (big-endian)
   */
  readInt16BE(offset: number): number {
    return this._data.readInt16BE(offset);
  }

  /**
   * Read a 32-bit signed integer at offset (big-endian)
   */
  readInt32BE(offset: number): number {
    return this._data.readInt32BE(offset);
  }

  /**
   * Read a 16-bit signed integer at offset (little-endian)
   */
  readInt16LE(offset: number): number {
    return this._data.readInt16LE(offset);
  }

  /**
   * Read a 32-bit signed integer at offset (little-endian)
   */
  readInt32LE(offset: number): number {
    return this._data.readInt32LE(offset);
  }

  /**
   * Read a float at offset (big-endian)
   */
  readFloatBE(offset: number): number {
    return this._data.readFloatBE(offset);
  }

  /**
   * Read a float at offset (little-endian)
   */
  readFloatLE(offset: number): number {
    return this._data.readFloatLE(offset);
  }

  /**
   * Read a double at offset (big-endian)
   */
  readDoubleBE(offset: number): number {
    return this._data.readDoubleBE(offset);
  }

  /**
   * Read a double at offset (little-endian)
   */
  readDoubleLE(offset: number): number {
    return this._data.readDoubleLE(offset);
  }

  // ============================================================================
  // Hashing Methods
  // ============================================================================

  /**
   * Compute MD5 digest of buffer contents
   */
  md5Digest(): Uint8Array {
    const crypto = require('node:crypto');
    const hash = crypto.createHash('md5');
    hash.update(this._data);
    return new Uint8Array(hash.digest());
  }

  /**
   * Compute SHA-256 digest of buffer contents
   */
  sha256Digest(): Uint8Array {
    const crypto = require('node:crypto');
    const hash = crypto.createHash('sha256');
    hash.update(this._data);
    return new Uint8Array(hash.digest());
  }

  // ============================================================================
  // Comparison Methods
  // ============================================================================

  /**
   * Check equality with another buffer
   */
  equals(other: Buffer | BufferLike): boolean {
    const otherBuf = other instanceof Buffer ? other : Buffer.from(other);
    return this._data.equals(otherBuf._data);
  }

  /**
   * Compare with another buffer
   * Returns -1, 0, or 1
   */
  compare(other: Buffer | BufferLike): number {
    const otherBuf = other instanceof Buffer ? other : Buffer.from(other);
    return this._data.compare(otherBuf._data);
  }

  /**
   * Find index of a byte or pattern
   */
  indexOf(value: number | BufferLike, start = 0): number {
    if (typeof value === 'number') {
      return this._data.indexOf(value, start);
    }
    const pattern = Buffer.from(value);
    return this._data.indexOf(pattern._data, start);
  }

  /**
   * Check if buffer includes a byte or pattern
   */
  includes(value: number | BufferLike, start = 0): boolean {
    return this.includes(value, start);
  }

  // ============================================================================
  // Iterator Support
  // ============================================================================

  /**
   * Iterate over bytes
   */
  *[Symbol.iterator](): Iterator<number> {
    for (const byte of this._data) {
      yield byte;
    }
  }

  /**
   * Get entries iterator
   */
  *entries(): IterableIterator<[number, number]> {
    for (let i = 0; i < this._data.length; i++) {
      yield [i, this._data[i]!];
    }
  }

  /**
   * Get keys iterator
   */
  *keys(): IterableIterator<number> {
    for (let i = 0; i < this._data.length; i++) {
      yield i;
    }
  }

  /**
   * Get values iterator
   */
  *values(): IterableIterator<number> {
    for (const byte of this._data) {
      yield byte;
    }
  }

  // ============================================================================
  // Clone
  // ============================================================================

  /**
   * Create a copy of the buffer
   */
  clone(): Buffer {
    return new Buffer(globalThis.Buffer.from(this._data));
  }
}

/**
 * A reader for consuming buffer contents
 */
export class BufferReader {
  private readonly data: globalThis.Buffer;
  private position: number;

  constructor(buffer: Buffer | BufferLike) {
    this.data =
      buffer instanceof Buffer ? buffer.toNodeBuffer() : Buffer.from(buffer).toNodeBuffer();
    this.position = 0;
  }

  /**
   * Get the current read position
   */
  get pos(): number {
    return this.position;
  }

  /**
   * Get the number of bytes remaining
   */
  get remaining(): number {
    return this.data.length - this.position;
  }

  /**
   * Check if we've reached the end
   */
  get isEof(): boolean {
    return this.position >= this.data.length;
  }

  /**
   * Peek at the next byte without consuming it
   */
  peek(): number | null {
    if (this.position >= this.data.length) {
      return null;
    }
    return this.data[this.position] ?? null;
  }

  /**
   * Read a single byte
   */
  readByte(): number | null {
    if (this.position >= this.data.length) {
      return null;
    }
    return this.data[this.position++] ?? null;
  }

  /**
   * Read bytes into a buffer
   */
  read(length: number): Uint8Array {
    const end = Math.min(this.position + length, this.data.length);
    const result = new Uint8Array(this.data.subarray(this.position, end));
    this.position = end;
    return result;
  }

  /**
   * Read exactly n bytes, or throw if not enough data
   */
  readExact(length: number): Uint8Array {
    if (this.remaining < length) {
      throw NanoPDFError.eof();
    }
    return this.read(length);
  }

  /**
   * Read a 16-bit unsigned integer (big-endian)
   */
  readUInt16BE(): number {
    if (this.remaining < 2) throw NanoPDFError.eof();
    const value = this.data.readUInt16BE(this.position);
    this.position += 2;
    return value;
  }

  /**
   * Read a 32-bit unsigned integer (big-endian)
   */
  readUInt32BE(): number {
    if (this.remaining < 4) throw NanoPDFError.eof();
    const value = this.data.readUInt32BE(this.position);
    this.position += 4;
    return value;
  }

  /**
   * Read a 16-bit unsigned integer (little-endian)
   */
  readUInt16LE(): number {
    if (this.remaining < 2) throw NanoPDFError.eof();
    const value = this.data.readUInt16LE(this.position);
    this.position += 2;
    return value;
  }

  /**
   * Read a 32-bit unsigned integer (little-endian)
   */
  readUInt32LE(): number {
    if (this.remaining < 4) throw NanoPDFError.eof();
    const value = this.data.readUInt32LE(this.position);
    this.position += 4;
    return value;
  }

  /**
   * Read a 24-bit unsigned integer (big-endian)
   */
  readUInt24BE(): number {
    if (this.remaining < 3) throw NanoPDFError.eof();
    const b0 = this.data[this.position++]!;
    const b1 = this.data[this.position++]!;
    const b2 = this.data[this.position++]!;
    return (b0 << 16) | (b1 << 8) | b2;
  }

  /**
   * Seek to a position
   */
  seek(pos: number): this {
    this.position = Math.max(0, Math.min(pos, this.data.length));
    return this;
  }

  /**
   * Skip n bytes
   */
  skip(n: number): this {
    this.position = Math.min(this.position + n, this.data.length);
    return this;
  }

  /**
   * Read a line (up to and including newline)
   */
  readLine(): Uint8Array | null {
    if (this.isEof) {
      return null;
    }
    const start = this.position;
    while (this.position < this.data.length) {
      if (this.data[this.position++] === 0x0a) {
        break;
      }
    }
    return new Uint8Array(this.data.subarray(start, this.position));
  }

  /**
   * Read a line as string
   */
  readLineString(encoding: BufferEncoding = 'utf-8'): string | null {
    const line = this.readLine();
    if (line === null) {
      return null;
    }
    return globalThis.Buffer.from(line).toString(encoding);
  }
}

/**
 * A writer that accumulates data into a buffer
 */
export class BufferWriter {
  private data: globalThis.Buffer;
  private position: number;

  constructor(capacity = 256) {
    this.data = globalThis.Buffer.alloc(capacity);
    this.position = 0;
  }

  /**
   * Get the current length
   */
  get length(): number {
    return this.position;
  }

  /**
   * Check if empty
   */
  get isEmpty(): boolean {
    return this.position === 0;
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(additional: number): void {
    const required = this.position + additional;
    if (required > this.data.length) {
      const newCapacity = Math.max(this.data.length * 2, required);
      const newData = globalThis.Buffer.alloc(newCapacity);
      this.data.copy(newData, 0, 0, this.position);
      this.data = newData;
    }
  }

  /**
   * Write bytes
   */
  write(data: BufferLike): this {
    const buf = Buffer.from(data).toNodeBuffer();
    this.ensureCapacity(buf.length);
    buf.copy(this.data, this.position);
    this.position += buf.length;
    return this;
  }

  /**
   * Write a single byte
   */
  writeByte(value: number): this {
    this.ensureCapacity(1);
    this.data[this.position++] = value & 0xff;
    return this;
  }

  /**
   * Write a 16-bit unsigned integer (big-endian)
   */
  writeUInt16BE(value: number): this {
    this.ensureCapacity(2);
    this.data.writeUInt16BE(value, this.position);
    this.position += 2;
    return this;
  }

  /**
   * Write a 32-bit unsigned integer (big-endian)
   */
  writeUInt32BE(value: number): this {
    this.ensureCapacity(4);
    this.data.writeUInt32BE(value, this.position);
    this.position += 4;
    return this;
  }

  /**
   * Write a 16-bit unsigned integer (little-endian)
   */
  writeUInt16LE(value: number): this {
    this.ensureCapacity(2);
    this.data.writeUInt16LE(value, this.position);
    this.position += 2;
    return this;
  }

  /**
   * Write a 32-bit unsigned integer (little-endian)
   */
  writeUInt32LE(value: number): this {
    this.ensureCapacity(4);
    this.data.writeUInt32LE(value, this.position);
    this.position += 4;
    return this;
  }

  /**
   * Write a string
   */
  writeString(str: string, encoding: BufferEncoding = 'utf-8'): this {
    return this.write(globalThis.Buffer.from(str, encoding));
  }

  /**
   * Get the accumulated data as a slice
   */
  toSlice(): Uint8Array {
    return new Uint8Array(this.data.subarray(0, this.position));
  }

  /**
   * Convert to Buffer
   */
  toBuffer(): Buffer {
    return Buffer.fromUint8Array(this.toSlice());
  }

  /**
   * Clear the writer
   */
  clear(): this {
    this.position = 0;
    return this;
  }
}
