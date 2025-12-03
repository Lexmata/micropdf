/**
 * Buffer - Dynamic byte array wrapper
 */

import { native_addon } from './native.js';

/**
 * Types that can be converted to a Buffer
 */
export type BufferLike = Buffer | globalThis.Buffer | Uint8Array | string;

/**
 * Check if a value is BufferLike
 */
export function isBufferLike(value: unknown): value is BufferLike {
  return (
    value instanceof Buffer ||
    globalThis.Buffer.isBuffer(value) ||
    value instanceof Uint8Array ||
    typeof value === 'string'
  );
}

/**
 * A dynamic byte buffer for PDF data
 */
export class Buffer {
  private readonly _native: ReturnType<typeof native_addon.Buffer.fromBuffer>;

  private constructor(native: ReturnType<typeof native_addon.Buffer.fromBuffer>) {
    this._native = native;
  }

  /**
   * Create a new empty buffer with optional initial capacity
   */
  static create(capacity = 0): Buffer {
    return new Buffer(new native_addon.Buffer(capacity));
  }

  /**
   * Create a buffer from a Node.js Buffer
   */
  static fromBuffer(data: globalThis.Buffer): Buffer {
    return new Buffer(native_addon.Buffer.fromBuffer(data));
  }

  /**
   * Create a buffer from a Uint8Array
   */
  static fromUint8Array(data: Uint8Array): Buffer {
    return new Buffer(native_addon.Buffer.fromBuffer(globalThis.Buffer.from(data)));
  }

  /**
   * Create a buffer from a string (UTF-8 encoded)
   */
  static fromString(str: string): Buffer {
    return new Buffer(native_addon.Buffer.fromString(str));
  }

  /**
   * Create a buffer from various input types
   */
  static from(data: BufferLike): Buffer {
    if (data instanceof Buffer) {
      return Buffer.fromBuffer(data.toNodeBuffer());
    }
    if (globalThis.Buffer.isBuffer(data)) {
      return Buffer.fromBuffer(data);
    }
    if (data instanceof Uint8Array) {
      return Buffer.fromUint8Array(data);
    }
    if (typeof data === 'string') {
      return Buffer.fromString(data);
    }
    throw new TypeError('Expected Buffer, Uint8Array, or string');
  }

  /**
   * Get the length of the buffer in bytes
   */
  get length(): number {
    return this._native.length();
  }

  /**
   * Check if the buffer is empty
   */
  get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Get the buffer data as a Node.js Buffer
   */
  toNodeBuffer(): globalThis.Buffer {
    return this._native.toBuffer();
  }

  /**
   * Get the buffer data as a Uint8Array
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this._native.toBuffer());
  }

  /**
   * Get the buffer data as a string (UTF-8 decoded)
   */
  toString(encoding: BufferEncoding = 'utf-8'): string {
    return this._native.toBuffer().toString(encoding);
  }

  /**
   * Append data to the buffer
   */
  append(data: BufferLike): this {
    if (data instanceof Buffer) {
      this._native.append(data.toNodeBuffer());
    } else if (globalThis.Buffer.isBuffer(data)) {
      this._native.append(data);
    } else if (data instanceof Uint8Array) {
      this._native.append(data);
    } else if (typeof data === 'string') {
      this._native.append(globalThis.Buffer.from(data, 'utf-8'));
    } else {
      throw new TypeError('Expected Buffer, Uint8Array, or string');
    }
    return this;
  }

  /**
   * Get a slice of the buffer
   */
  slice(start: number, end?: number): Buffer {
    const data = this.toNodeBuffer().subarray(start, end);
    return Buffer.fromBuffer(globalThis.Buffer.from(data));
  }

  /**
   * Get a byte at the specified index
   */
  at(index: number): number | undefined {
    const buf = this.toNodeBuffer();
    if (index < 0) {
      index = buf.length + index;
    }
    if (index < 0 || index >= buf.length) {
      return undefined;
    }
    return buf[index];
  }
}

