/**
 * Tests for Stream module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Stream, Buffer, SeekOrigin } from '../src/index.js';

describe('Stream', () => {
  describe('creation', () => {
    it('should create from Buffer', () => {
      const buf = Buffer.fromString('Hello World');
      const stream = Stream.openBuffer(buf);
      expect(stream.tell()).toBe(0);
    });

    it('should create from Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const stream = Stream.openMemory(data);
      expect(stream.tell()).toBe(0);
    });
  });

  describe('reading', () => {
    it('should read bytes into buffer', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Hello'));
      const data = new Uint8Array(5);
      const n = stream.read(data);
      expect(n).toBe(5);
      expect(new TextDecoder().decode(data)).toBe('Hello');
    });

    it('should read single byte', () => {
      const stream = Stream.openMemory(new Uint8Array([65, 66, 67]));
      expect(stream.readByte()).toBe(65);
      expect(stream.readByte()).toBe(66);
      expect(stream.readByte()).toBe(67);
      expect(stream.readByte()).toBeNull();
    });

    it('should peek byte', () => {
      const stream = Stream.openMemory(new Uint8Array([10, 20, 30]));
      expect(stream.peekByte()).toBe(10);
      expect(stream.peekByte()).toBe(10);
      expect(stream.tell()).toBe(0);
    });

    it('should read line', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Line 1\nLine 2'));
      const line1 = stream.readLine();
      expect(line1).not.toBeNull();
      // Line includes the newline
      expect(line1!.length).toBe(7);
    });

    it('should skip bytes', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Hello World'));
      stream.skip(6);
      expect(stream.tell()).toBe(6);
    });

    it('should read 16-bit integers big-endian', () => {
      const stream = Stream.openMemory(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
      expect(stream.readUInt16()).toBe(0x0102);
      expect(stream.readUInt16()).toBe(0x0304);
    });

    it('should read 32-bit integers big-endian', () => {
      const stream = Stream.openMemory(new Uint8Array([0x00, 0x01, 0x02, 0x03]));
      expect(stream.readUInt32()).toBe(0x00010203);
    });
  });

  describe('position', () => {
    it('should track position', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Hello World'));
      expect(stream.tell()).toBe(0);
      const buf = new Uint8Array(5);
      stream.read(buf);
      expect(stream.tell()).toBe(5);
    });

    it('should seek to position', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Hello World'));
      stream.seek(6);
      expect(stream.tell()).toBe(6);
    });
  });

  describe('metadata', () => {
    it('should report length', () => {
      const stream = Stream.openMemory(new TextEncoder().encode('Hello World'));
      expect(stream.length).toBe(11);
    });
  });

  describe('bit reading', () => {
    it('should read bits', () => {
      const stream = Stream.openMemory(new Uint8Array([0b10110011]));
      // Read 4 bits at a time
      expect(stream.readBits(4)).toBe(0b1011);
      expect(stream.readBits(4)).toBe(0b0011);
    });

    it('should sync to byte boundary', () => {
      const stream = Stream.openMemory(new Uint8Array([0xff, 0x00]));
      stream.readBits(3);
      stream.syncBits();
      expect(stream.tell()).toBe(1);
      expect(stream.readByte()).toBe(0x00);
    });
  });
});
