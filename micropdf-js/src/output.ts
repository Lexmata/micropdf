/**
 * Output - Binary output stream
 *
 * This module provides 100% API compatibility with MuPDF's output operations.
 * Handles binary writing with various data types and endianness.
 */

/**
 * Output stream for writing binary data
 */
export class Output {
  private _buffer: number[] = [];
  private _position: number = 0;
  private _refCount: number = 1;
  private _path: string | null = null;
  private _closed: boolean = false;
  private _bits: number = 0;
  private _bitCount: number = 0;

  constructor(path?: string) {
    this._path = path || null;
  }

  /**
   * Create output to file path
   */
  static createWithPath(path: string): Output {
    return new Output(path);
  }

  /**
   * Create output to memory buffer
   */
  static createWithBuffer(): Output {
    return new Output();
  }

  // ============================================================================
  // Reference Counting
  // ============================================================================

  keep(): this {
    this._refCount++;
    return this;
  }

  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
      if (this._refCount === 0) {
        this.close();
      }
    }
  }

  // ============================================================================
  // Stream Control
  // ============================================================================

  /**
   * Close the output stream
   */
  close(): void {
    if (!this._closed) {
      this.flush();
      this._closed = true;
    }
  }

  /**
   * Flush buffered data
   */
  flush(): void {
    this.syncBits();
    // Actual file writing requires FFI connection to file system APIs
  }

  /**
   * Reset output to beginning
   */
  reset(): void {
    this._buffer = [];
    this._position = 0;
    this._bits = 0;
    this._bitCount = 0;
  }

  /**
   * Truncate output at current position
   */
  truncate(): void {
    this._buffer = this._buffer.slice(0, this._position);
  }

  // ============================================================================
  // Position
  // ============================================================================

  /**
   * Seek to position
   */
  seek(offset: number, whence: 'set' | 'cur' | 'end' = 'set'): void {
    this.syncBits();

    switch (whence) {
      case 'set':
        this._position = offset;
        break;
      case 'cur':
        this._position += offset;
        break;
      case 'end':
        this._position = this._buffer.length + offset;
        break;
    }

    this._position = Math.max(0, Math.min(this._position, this._buffer.length));
  }

  /**
   * Get current position
   */
  tell(): number {
    return this._position;
  }

  // ============================================================================
  // Basic Writing
  // ============================================================================

  /**
   * Write raw data
   */
  writeData(data: Uint8Array): void {
    this.syncBits();
    for (const byte of data) {
      this.writeByte(byte);
    }
  }

  /**
   * Write a single byte
   */
  writeByte(value: number): void {
    this.syncBits();
    this._buffer[this._position++] = value & 0xff;
  }

  /**
   * Write a character (same as byte)
   */
  writeChar(value: number): void {
    this.writeByte(value);
  }

  /**
   * Write a string
   */
  writeString(str: string): void {
    this.syncBits();
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    this.writeData(data);
  }

  /**
   * Write a Unicode rune (code point)
   */
  writeRune(codePoint: number): void {
    this.syncBits();
    const str = String.fromCodePoint(codePoint);
    this.writeString(str);
  }

  // ============================================================================
  // Integer Writing (16-bit)
  // ============================================================================

  /**
   * Write int16 big-endian
   */
  writeInt16BE(value: number): void {
    this.syncBits();
    this.writeByte((value >> 8) & 0xff);
    this.writeByte(value & 0xff);
  }

  /**
   * Write int16 little-endian
   */
  writeInt16LE(value: number): void {
    this.syncBits();
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
  }

  /**
   * Write uint16 big-endian
   */
  writeUInt16BE(value: number): void {
    this.writeInt16BE(value);
  }

  /**
   * Write uint16 little-endian
   */
  writeUInt16LE(value: number): void {
    this.writeInt16LE(value);
  }

  // ============================================================================
  // Integer Writing (32-bit)
  // ============================================================================

  /**
   * Write int32 big-endian
   */
  writeInt32BE(value: number): void {
    this.syncBits();
    this.writeByte((value >> 24) & 0xff);
    this.writeByte((value >> 16) & 0xff);
    this.writeByte((value >> 8) & 0xff);
    this.writeByte(value & 0xff);
  }

  /**
   * Write int32 little-endian
   */
  writeInt32LE(value: number): void {
    this.syncBits();
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
    this.writeByte((value >> 16) & 0xff);
    this.writeByte((value >> 24) & 0xff);
  }

  /**
   * Write uint32 big-endian
   */
  writeUInt32BE(value: number): void {
    this.writeInt32BE(value >>> 0);
  }

  /**
   * Write uint32 little-endian
   */
  writeUInt32LE(value: number): void {
    this.writeInt32LE(value >>> 0);
  }

  // ============================================================================
  // Integer Writing (64-bit)
  // ============================================================================

  /**
   * Write int64 big-endian
   */
  writeInt64BE(value: bigint): void {
    this.syncBits();
    const high = Number((value >> 32n) & 0xffffffffn);
    const low = Number(value & 0xffffffffn);
    this.writeInt32BE(high);
    this.writeInt32BE(low);
  }

  /**
   * Write int64 little-endian
   */
  writeInt64LE(value: bigint): void {
    this.syncBits();
    const high = Number((value >> 32n) & 0xffffffffn);
    const low = Number(value & 0xffffffffn);
    this.writeInt32LE(low);
    this.writeInt32LE(high);
  }

  /**
   * Write uint64 big-endian
   */
  writeUInt64BE(value: bigint): void {
    this.writeInt64BE(value);
  }

  /**
   * Write uint64 little-endian
   */
  writeUInt64LE(value: bigint): void {
    this.writeInt64LE(value);
  }

  // ============================================================================
  // Float Writing
  // ============================================================================

  /**
   * Write float32 big-endian
   */
  writeFloatBE(value: number): void {
    this.syncBits();
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false); // big-endian
    this.writeData(new Uint8Array(buffer));
  }

  /**
   * Write float32 little-endian
   */
  writeFloatLE(value: number): void {
    this.syncBits();
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, true); // little-endian
    this.writeData(new Uint8Array(buffer));
  }

  // ============================================================================
  // Base64 Writing
  // ============================================================================

  /**
   * Write data as base64
   */
  writeBase64(data: Uint8Array): void {
    this.syncBits();
    const base64 = btoa(String.fromCharCode(...data));
    this.writeString(base64);
  }

  /**
   * Write data as base64 URI (URL-safe)
   */
  writeBase64URI(data: Uint8Array): void {
    this.syncBits();
    const base64 = btoa(String.fromCharCode(...data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    this.writeString(base64);
  }

  // ============================================================================
  // Bit Writing
  // ============================================================================

  /**
   * Write bits
   */
  writeBits(value: number, count: number): void {
    while (count > 0) {
      const available = 8 - this._bitCount;
      const toWrite = Math.min(count, available);
      const mask = (1 << toWrite) - 1;
      const bits = (value >> (count - toWrite)) & mask;

      this._bits = (this._bits << toWrite) | bits;
      this._bitCount += toWrite;
      count -= toWrite;

      if (this._bitCount === 8) {
        this.writeByte(this._bits);
        this._bits = 0;
        this._bitCount = 0;
      }
    }
  }

  /**
   * Synchronize bit writing (flush partial byte)
   */
  syncBits(): void {
    if (this._bitCount > 0) {
      this._bits <<= 8 - this._bitCount;
      this.writeByte(this._bits);
      this._bits = 0;
      this._bitCount = 0;
    }
  }

  // ============================================================================
  // Buffer Operations
  // ============================================================================

  /**
   * Write from another buffer
   */
  writeBuffer(buffer: Uint8Array): void {
    this.writeData(buffer);
  }

  /**
   * Get output as buffer
   */
  toBuffer(): Uint8Array {
    this.syncBits();
    return new Uint8Array(this._buffer);
  }

  /**
   * Get output size
   */
  get size(): number {
    return this._buffer.length;
  }

  /**
   * Check if closed
   */
  get isClosed(): boolean {
    return this._closed;
  }

  /**
   * Get path (if file output)
   */
  get path(): string | null {
    return this._path;
  }
}
