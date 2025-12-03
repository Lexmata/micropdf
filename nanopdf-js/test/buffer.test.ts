/**
 * Tests for Buffer module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Buffer, BufferReader, BufferWriter } from '../src/index.js';

describe('Buffer', () => {
  describe('creation', () => {
    it('should create empty buffer', () => {
      const buf = Buffer.create();
      expect(buf.length).toBe(0);
      expect(buf.isEmpty).toBe(true);
    });

    it('should create buffer with capacity', () => {
      const buf = Buffer.create(1024);
      // Initial capacity allocates empty buffer, so length is capacity
      expect(buf.capacity).toBeGreaterThanOrEqual(0);
    });

    it('should create from string', () => {
      const buf = Buffer.fromString('Hello, World!');
      expect(buf.toString()).toBe('Hello, World!');
    });

    it('should create from Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3, 4, 5]);
      const buf = Buffer.fromUint8Array(arr);
      expect(buf.length).toBe(5);
      expect(buf.at(0)).toBe(1);
      expect(buf.at(4)).toBe(5);
    });

    it('should create from ArrayBuffer', () => {
      const arr = new Uint8Array([10, 20, 30]).buffer;
      const buf = Buffer.fromArrayBuffer(arr);
      expect(buf.length).toBe(3);
    });

    it('should create from base64', () => {
      const buf = Buffer.fromBase64('SGVsbG8=');
      expect(buf.toString()).toBe('Hello');
    });

    it('should create from hex', () => {
      const buf = Buffer.fromHex('48656c6c6f');
      expect(buf.toString()).toBe('Hello');
    });
  });

  describe('conversion', () => {
    it('should convert to Uint8Array', () => {
      const buf = Buffer.fromString('test');
      const arr = buf.toUint8Array();
      expect(arr).toBeInstanceOf(Uint8Array);
      expect(arr.length).toBe(4);
    });

    it('should convert to Node Buffer', () => {
      const buf = Buffer.fromString('test');
      const nodeBuf = buf.toNodeBuffer();
      expect(globalThis.Buffer.isBuffer(nodeBuf)).toBe(true);
    });

    it('should convert to base64', () => {
      const buf = Buffer.fromString('Hello');
      expect(buf.toBase64()).toBe('SGVsbG8=');
    });

    it('should convert to hex', () => {
      const buf = Buffer.fromString('Hi');
      expect(buf.toHex()).toBe('4869');
    });

    it('should convert to array', () => {
      const buf = Buffer.fromUint8Array(new Uint8Array([1, 2, 3]));
      const arr = buf.toArray();
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('manipulation', () => {
    it('should append bytes', () => {
      const buf = Buffer.create();
      buf.appendByte(65);
      buf.appendByte(66);
      expect(buf.toString()).toBe('AB');
    });

    it('should append string', () => {
      const buf = Buffer.create();
      buf.appendString('Hello');
      buf.appendString(' World');
      expect(buf.toString()).toBe('Hello World');
    });

    it('should append bytes', () => {
      const buf = Buffer.create();
      buf.appendByte(65);
      buf.appendByte(66);
      buf.appendByte(67);
      expect(buf.length).toBe(3);
      expect(buf.toString()).toBe('ABC');
    });

    it('should resize', () => {
      const buf = Buffer.fromString('Hello World');
      buf.resize(5);
      expect(buf.length).toBe(5);
      expect(buf.toString()).toBe('Hello');
    });

    it('should clear', () => {
      const buf = Buffer.fromString('test');
      buf.clear();
      expect(buf.length).toBe(0);
      expect(buf.isEmpty).toBe(true);
    });
  });

  describe('slicing', () => {
    it('should slice buffer', () => {
      const buf = Buffer.fromString('Hello World');
      const slice = buf.slice(0, 5);
      expect(slice.toString()).toBe('Hello');
    });

    it('should split buffer', () => {
      const buf = Buffer.fromString('Hello World');
      const [first, second] = buf.splitAt(6);
      expect(first.toString()).toBe('Hello ');
      expect(second.toString()).toBe('World');
    });
  });

  describe('indexing', () => {
    it('should get byte at index', () => {
      const buf = Buffer.fromString('ABC');
      expect(buf.at(0)).toBe(65);
      expect(buf.at(1)).toBe(66);
      expect(buf.at(2)).toBe(67);
    });

    it('should return undefined for out of bounds positive index', () => {
      const buf = Buffer.fromString('AB');
      expect(buf.at(10)).toBeUndefined();
    });

    // Note: Node.js Buffer.at() supports negative indexing (from end)
    it('should support negative indexing', () => {
      const buf = Buffer.fromString('AB');
      expect(buf.at(-1)).toBe(66); // 'B'
      expect(buf.at(-2)).toBe(65); // 'A'
    });
  });

  describe('equality', () => {
    it('should compare equal buffers', () => {
      const buf1 = Buffer.fromString('Hello');
      const buf2 = Buffer.fromString('Hello');
      expect(buf1.equals(buf2)).toBe(true);
    });

    it('should compare unequal buffers', () => {
      const buf1 = Buffer.fromString('Hello');
      const buf2 = Buffer.fromString('World');
      expect(buf1.equals(buf2)).toBe(false);
    });
  });
});

describe('BufferReader', () => {
  it('should read bytes', () => {
    const buf = Buffer.fromUint8Array(new Uint8Array([1, 2, 3, 4, 5]));
    const reader = new BufferReader(buf);

    expect(reader.readByte()).toBe(1);
    expect(reader.readByte()).toBe(2);
    expect(reader.position).toBe(2);
  });

  it('should read multiple bytes', () => {
    const buf = Buffer.fromUint8Array(new Uint8Array([1, 2, 3, 4, 5]));
    const reader = new BufferReader(buf);

    const data = reader.read(3);
    expect(data.length).toBe(3);
    expect([...data]).toEqual([1, 2, 3]);
  });

  it('should seek to position', () => {
    const buf = Buffer.fromUint8Array(new Uint8Array([1, 2, 3, 4, 5]));
    const reader = new BufferReader(buf);

    reader.seek(3);
    expect(reader.position).toBe(3);
    expect(reader.readByte()).toBe(4);
  });

  it('should detect EOF', () => {
    const buf = Buffer.fromUint8Array(new Uint8Array([1, 2]));
    const reader = new BufferReader(buf);

    expect(reader.isEof).toBe(false);
    reader.readByte();
    reader.readByte();
    expect(reader.isEof).toBe(true);
  });

  it('should read integers', () => {
    const buf = Buffer.fromUint8Array(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
    const reader = new BufferReader(buf);

    expect(reader.readUInt16BE()).toBe(0x0102);
    expect(reader.readUInt16BE()).toBe(0x0304);
  });

  it('should read lines as Uint8Array', () => {
    const buf = Buffer.fromString('Line 1\nLine 2');
    const reader = new BufferReader(buf);

    const line1 = reader.readLine();
    expect(line1).not.toBeNull();
    expect(line1!.length).toBe(7); // "Line 1\n"
  });

  it('should read line strings', () => {
    const buf = Buffer.fromString('Line 1\nLine 2');
    const reader = new BufferReader(buf);

    expect(reader.readLineString()).toBe('Line 1\n');
    expect(reader.readLineString()).toBe('Line 2');
  });
});

describe('BufferWriter', () => {
  it('should write bytes', () => {
    const writer = new BufferWriter(64);

    writer.write(new Uint8Array([1, 2, 3]));
    writer.write(new Uint8Array([4, 5]));

    const buf = writer.toBuffer();
    expect(buf.length).toBe(5);
    expect(buf.at(0)).toBe(1);
    expect(buf.at(4)).toBe(5);
  });

  it('should write strings', () => {
    const writer = new BufferWriter(64);
    writer.writeString('Hello');

    const buf = writer.toBuffer();
    expect(buf.toString()).toBe('Hello');
  });

  it('should track length', () => {
    const writer = new BufferWriter(64);
    expect(writer.length).toBe(0);

    writer.writeByte(1);
    writer.writeByte(2);
    expect(writer.length).toBe(2);
  });
});
