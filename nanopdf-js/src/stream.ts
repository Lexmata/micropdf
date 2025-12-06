/**
 * Stream - Buffered I/O abstraction
 *
 * This implementation mirrors the Rust `fitz::stream::Stream` for 100% API compatibility.
 */

import { readFile, readFileSync } from 'fs';
import { promisify } from 'util';
import { Buffer } from './buffer.js';
import { NanoPDFError, SeekOrigin } from './types.js';

const readFileAsync = promisify(readFile);

/**
 * Stream source interface
 */
interface StreamSource {
  read(buffer: Uint8Array): number;
  seek(offset: number, origin: SeekOrigin): number;
  tell(): number;
  length: number | null;
}

/**
 * Memory-based stream source
 */
class MemorySource implements StreamSource {
  private readonly data: Uint8Array;
  private position: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.position = 0;
  }

  read(buffer: Uint8Array): number {
    const remaining = this.data.length - this.position;
    const toRead = Math.min(buffer.length, remaining);
    buffer.set(this.data.subarray(this.position, this.position + toRead));
    this.position += toRead;
    return toRead;
  }

  seek(offset: number, origin: SeekOrigin): number {
    let newPos: number;
    switch (origin) {
      case SeekOrigin.Start:
        newPos = offset;
        break;
      case SeekOrigin.Current:
        newPos = this.position + offset;
        break;
      case SeekOrigin.End:
        newPos = this.data.length + offset;
        break;
    }
    if (newPos < 0) {
      throw NanoPDFError.argument('Seek before start');
    }
    this.position = Math.min(newPos, this.data.length);
    return this.position;
  }

  tell(): number {
    return this.position;
  }

  get length(): number {
    return this.data.length;
  }
}

const STREAM_BUFFER_SIZE = 8192;

/**
 * A buffered stream for reading PDF data
 *
 * Mirrors the Rust `Stream` implementation.
 */
export class Stream {
  private readonly source: StreamSource;
  private readonly buffer: Uint8Array;
  private rp: number; // Read pointer
  private wp: number; // Write pointer
  private pos: number; // Source position
  private isEof: boolean;
  private bits: number;
  private bitsAvail: number;
  private readonly filename: string | null;

  private constructor(source: StreamSource, filename: string | null = null) {
    this.source = source;
    this.buffer = new Uint8Array(STREAM_BUFFER_SIZE);
    this.rp = 0;
    this.wp = 0;
    this.pos = 0;
    this.isEof = false;
    this.bits = 0;
    this.bitsAvail = 0;
    this.filename = filename;
  }

  // ============================================================================
  // Static Constructors
  // ============================================================================

  /**
   * Open a stream from a file path (synchronous)
   */
  static openFileSync(path: string): Stream {
    const data = readFileSync(path);
    return new Stream(new MemorySource(new Uint8Array(data)), path);
  }

  /**
   * Open a stream from a file path (asynchronous)
   */
  static async openFile(path: string): Promise<Stream> {
    const data = await readFileAsync(path);
    return new Stream(new MemorySource(new Uint8Array(data)), path);
  }

  /**
   * Open a stream from memory
   */
  static openMemory(data: Uint8Array | globalThis.Buffer): Stream {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return new Stream(new MemorySource(bytes));
  }

  /**
   * Open a stream from a Buffer
   */
  static openBuffer(buffer: Buffer): Stream {
    return Stream.openMemory(buffer.toUint8Array());
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Get the current read position
   */
  tell(): number {
    return this.pos - (this.wp - this.rp);
  }

  /**
   * Get the total length of the stream if known
   */
  get length(): number | null {
    return this.source.length;
  }

  /**
   * Check if the stream is empty
   */
  get isEmpty(): boolean {
    return this.source.length === 0;
  }

  /**
   * Check if we've reached EOF
   */
  get eof(): boolean {
    return this.isEof && this.rp >= this.wp;
  }

  /**
   * Get the filename if this is a file stream
   */
  getFilename(): string | null {
    return this.filename;
  }

  // ============================================================================
  // Buffer Management
  // ============================================================================

  /**
   * Fill the internal buffer
   */
  private fillBuffer(): number {
    if (this.isEof) {
      return 0;
    }

    // Compact the buffer
    if (this.rp > 0) {
      if (this.rp < this.wp) {
        this.buffer.copyWithin(0, this.rp, this.wp);
        this.wp -= this.rp;
      } else {
        this.wp = 0;
      }
      this.rp = 0;
    }

    // Read more data
    const tempBuf = new Uint8Array(STREAM_BUFFER_SIZE - this.wp);
    const n = this.source.read(tempBuf);
    if (n === 0) {
      this.isEof = true;
      return 0;
    }
    this.buffer.set(tempBuf.subarray(0, n), this.wp);
    this.wp += n;
    this.pos += n;
    return n;
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Read a single byte
   */
  readByte(): number | null {
    if (this.rp >= this.wp && this.fillBuffer() === 0) {
      return null;
    }
    return this.buffer[this.rp++] ?? null;
  }

  /**
   * Peek at the next byte without consuming it
   */
  peekByte(): number | null {
    if (this.rp >= this.wp && this.fillBuffer() === 0) {
      return null;
    }
    return this.buffer[this.rp] ?? null;
  }

  /**
   * Read bytes into a buffer
   */
  read(buf: Uint8Array): number {
    let total = 0;
    while (total < buf.length) {
      const buffered = this.wp - this.rp;
      if (buffered > 0) {
        const toCopy = Math.min(buffered, buf.length - total);
        buf.set(this.buffer.subarray(this.rp, this.rp + toCopy), total);
        this.rp += toCopy;
        total += toCopy;
      } else if (this.fillBuffer() === 0) {
        break;
      }
    }
    return total;
  }

  /**
   * Read exactly the specified number of bytes
   */
  readExact(buf: Uint8Array): void {
    if (this.read(buf) < buf.length) {
      throw NanoPDFError.eof();
    }
  }

  /**
   * Read all remaining data into a Buffer
   */
  readAll(_initialCapacity = 0): Buffer {
    const chunks: Uint8Array[] = [];
    while (true) {
      const buffered = this.wp - this.rp;
      if (buffered > 0) {
        chunks.push(this.buffer.slice(this.rp, this.wp));
        this.rp = this.wp;
      }
      if (this.fillBuffer() === 0) {
        break;
      }
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return Buffer.fromUint8Array(result);
  }

  /**
   * Read a line (up to and including newline)
   */
  readLine(): Uint8Array | null {
    const line: number[] = [];
    while (true) {
      const byte = this.readByte();
      if (byte === null) {
        if (line.length === 0) {
          return null;
        }
        break;
      }
      line.push(byte);
      if (byte === 0x0a) {
        break;
      }
    }
    return new Uint8Array(line);
  }

  /**
   * Skip n bytes
   */
  skip(n: number): number {
    let skipped = 0;
    while (n > 0) {
      const buffered = this.wp - this.rp;
      if (buffered > 0) {
        const toSkip = Math.min(buffered, n);
        this.rp += toSkip;
        skipped += toSkip;
        n -= toSkip;
      } else if (this.fillBuffer() === 0) {
        break;
      }
    }
    return skipped;
  }

  /**
   * Seek to a position in the stream
   */
  seek(offset: number, origin: SeekOrigin = SeekOrigin.Start): void {
    // Clear buffer and seek
    this.rp = 0;
    this.wp = 0;
    this.isEof = false;
    this.pos = this.source.seek(offset, origin);
  }

  // ============================================================================
  // Integer Read Methods
  // ============================================================================

  /**
   * Read a 16-bit unsigned integer (big-endian)
   */
  readUInt16(): number {
    const buf = new Uint8Array(2);
    this.readExact(buf);
    return ((buf[0] ?? 0) << 8) | (buf[1] ?? 0);
  }

  /**
   * Read a 24-bit unsigned integer (big-endian)
   */
  readUInt24(): number {
    const buf = new Uint8Array(3);
    this.readExact(buf);
    return ((buf[0] ?? 0) << 16) | ((buf[1] ?? 0) << 8) | (buf[2] ?? 0);
  }

  /**
   * Read a 32-bit unsigned integer (big-endian)
   */
  readUInt32(): number {
    const buf = new Uint8Array(4);
    this.readExact(buf);
    return (
      (((buf[0] ?? 0) << 24) | ((buf[1] ?? 0) << 16) | ((buf[2] ?? 0) << 8) | (buf[3] ?? 0)) >>> 0
    );
  }

  /**
   * Read a 16-bit signed integer (little-endian)
   */
  readInt16LE(): number {
    const buf = new Uint8Array(2);
    this.readExact(buf);
    const value = (buf[0] ?? 0) | ((buf[1] ?? 0) << 8);
    return value > 0x7fff ? value - 0x10000 : value;
  }

  /**
   * Read a 32-bit signed integer (little-endian)
   */
  readInt32LE(): number {
    const buf = new Uint8Array(4);
    this.readExact(buf);
    return (buf[0] ?? 0) | ((buf[1] ?? 0) << 8) | ((buf[2] ?? 0) << 16) | ((buf[3] ?? 0) << 24);
  }

  /**
   * Read a 16-bit unsigned integer (little-endian)
   */
  readUInt16LE(): number {
    const buf = new Uint8Array(2);
    this.readExact(buf);
    return (buf[0] ?? 0) | ((buf[1] ?? 0) << 8);
  }

  /**
   * Read a 32-bit unsigned integer (little-endian)
   */
  readUInt32LE(): number {
    const buf = new Uint8Array(4);
    this.readExact(buf);
    return (
      ((buf[0] ?? 0) | ((buf[1] ?? 0) << 8) | ((buf[2] ?? 0) << 16) | ((buf[3] ?? 0) << 24)) >>> 0
    );
  }

  // ============================================================================
  // Bit Read Methods
  // ============================================================================

  /**
   * Read n bits from the stream
   */
  readBits(n: number): number {
    while (this.bitsAvail < n) {
      const byte = this.readByte();
      if (byte === null) {
        throw NanoPDFError.eof();
      }
      this.bits = (this.bits << 8) | byte;
      this.bitsAvail += 8;
    }
    this.bitsAvail -= n;
    const mask = (1 << n) - 1;
    return (this.bits >> this.bitsAvail) & mask;
  }

  /**
   * Sync bits - discard any partial byte
   */
  syncBits(): void {
    this.bits = 0;
    this.bitsAvail = 0;
  }
}

/**
 * Async stream for non-blocking I/O
 */
export class AsyncStream {
  private readonly data: Uint8Array;
  private position: number;
  private isEof: boolean;

  private constructor(data: Uint8Array) {
    this.data = data;
    this.position = 0;
    this.isEof = false;
  }

  /**
   * Open a file asynchronously
   */
  static async openFile(path: string): Promise<AsyncStream> {
    const data = await readFileAsync(path);
    return new AsyncStream(new Uint8Array(data));
  }

  /**
   * Open from memory
   */
  static openMemory(data: Uint8Array | globalThis.Buffer): AsyncStream {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return new AsyncStream(bytes);
  }

  /**
   * Read bytes asynchronously
   */
  async read(buf: Uint8Array): Promise<number> {
    const remaining = this.data.length - this.position;
    const toRead = Math.min(buf.length, remaining);
    buf.set(this.data.subarray(this.position, this.position + toRead));
    this.position += toRead;
    if (toRead === 0) {
      this.isEof = true;
    }
    return toRead;
  }

  /**
   * Read all data asynchronously
   */
  async readAll(): Promise<Buffer> {
    const result = this.data.slice(this.position);
    this.position = this.data.length;
    this.isEof = true;
    return Buffer.fromUint8Array(result);
  }

  /**
   * Seek asynchronously
   */
  async seek(offset: number, origin: SeekOrigin = SeekOrigin.Start): Promise<number> {
    let newPos: number;
    switch (origin) {
      case SeekOrigin.Start:
        newPos = offset;
        break;
      case SeekOrigin.Current:
        newPos = this.position + offset;
        break;
      case SeekOrigin.End:
        newPos = this.data.length + offset;
        break;
    }
    if (newPos < 0) {
      throw NanoPDFError.argument('Seek before start');
    }
    this.position = Math.min(newPos, this.data.length);
    this.isEof = false;
    return this.position;
  }

  /**
   * Get current position
   */
  tell(): number {
    return this.position;
  }

  /**
   * Check if EOF
   */
  get eof(): boolean {
    return this.isEof;
  }

  /**
   * Get length
   */
  get length(): number {
    return this.data.length;
  }
}
