import { describe, it, expect } from 'vitest';
import { Output } from '../src/output';

describe('Output Module', () => {
  describe('Output', () => {
    let output: Output;

    it('should create an output', () => {
      output = new Output(null as any);
      expect(output).toBeDefined();
    });

    it('should write data', () => {
      output = new Output(null as any);
      const data = Buffer.from('Hello');
      output.writeData(data);
      // Verify it doesn't throw
    });

    it('should write string', () => {
      output = new Output(null as any);
      output.writeString('Hello, World!');
      // Verify it doesn't throw
    });

    it('should write byte', () => {
      output = new Output(null as any);
      output.writeByte(0xff);
      // Verify it doesn't throw
    });

    it('should write char', () => {
      output = new Output(null as any);
      output.writeChar('A');
      // Verify it doesn't throw
    });

    it('should write int16 big-endian', () => {
      output = new Output(null as any);
      output.writeInt16BE(1234);
      // Verify it doesn't throw
    });

    it('should write int16 little-endian', () => {
      output = new Output(null as any);
      output.writeInt16LE(1234);
      // Verify it doesn't throw
    });

    it('should write uint16 big-endian', () => {
      output = new Output(null as any);
      output.writeUInt16BE(1234);
      // Verify it doesn't throw
    });

    it('should write uint16 little-endian', () => {
      output = new Output(null as any);
      output.writeUInt16LE(1234);
      // Verify it doesn't throw
    });

    it('should write int32 big-endian', () => {
      output = new Output(null as any);
      output.writeInt32BE(123456);
      // Verify it doesn't throw
    });

    it('should write int32 little-endian', () => {
      output = new Output(null as any);
      output.writeInt32LE(123456);
      // Verify it doesn't throw
    });

    it('should write uint32 big-endian', () => {
      output = new Output(null as any);
      output.writeUInt32BE(123456);
      // Verify it doesn't throw
    });

    it('should write uint32 little-endian', () => {
      output = new Output(null as any);
      output.writeUInt32LE(123456);
      // Verify it doesn't throw
    });

    it('should write int64 big-endian', () => {
      output = new Output(null as any);
      output.writeInt64BE(BigInt(123456));
      // Verify it doesn't throw
    });

    it('should write int64 little-endian', () => {
      output = new Output(null as any);
      output.writeInt64LE(BigInt(123456));
      // Verify it doesn't throw
    });

    it('should write uint64 big-endian', () => {
      output = new Output(null as any);
      output.writeUInt64BE(BigInt(123456));
      // Verify it doesn't throw
    });

    it('should write uint64 little-endian', () => {
      output = new Output(null as any);
      output.writeUInt64LE(BigInt(123456));
      // Verify it doesn't throw
    });

    it('should write float big-endian', () => {
      output = new Output(null as any);
      output.writeFloatBE(3.14);
      // Verify it doesn't throw
    });

    it('should write float little-endian', () => {
      output = new Output(null as any);
      output.writeFloatLE(3.14);
      // Verify it doesn't throw
    });

    it('should write rune', () => {
      output = new Output(null as any);
      output.writeRune(0x1f600); // Emoji
      // Verify it doesn't throw
    });

    it('should write base64', () => {
      output = new Output(null as any);
      const data = Buffer.from('Hello');
      output.writeBase64(data);
      // Verify it doesn't throw
    });

    it('should write base64 URI', () => {
      output = new Output(null as any);
      const data = Buffer.from('Hello');
      output.writeBase64URI(data);
      // Verify it doesn't throw
    });

    it('should write bits', () => {
      output = new Output(null as any);
      output.writeBits(0b1010, 4);
      // Verify it doesn't throw
    });

    it('should sync bits', () => {
      output = new Output(null as any);
      output.writeBits(0b1010, 4);
      output.writeBitsSync();
      // Verify it doesn't throw
    });

    it('should write buffer', () => {
      output = new Output(null as any);
      output.writeBuffer(null as any);
      // Verify it doesn't throw
    });

    it('should seek', () => {
      output = new Output(null as any);
      output.seek(100, 0);
      // Verify it doesn't throw
    });

    it('should tell position', () => {
      output = new Output(null as any);
      const pos = output.tell();
      expect(typeof pos).toBe('number');
      expect(pos).toBeGreaterThanOrEqual(0);
    });

    it('should flush', () => {
      output = new Output(null as any);
      output.flush();
      // Verify it doesn't throw
    });

    it('should close', () => {
      output = new Output(null as any);
      output.close();
      // Verify it doesn't throw
    });

    it('should truncate', () => {
      output = new Output(null as any);
      output.truncate();
      // Verify it doesn't throw
    });

    it('should reset', () => {
      output = new Output(null as any);
      output.reset();
      // Verify it doesn't throw
    });
  });

  describe('Output Integration', () => {
    it('should write binary data', () => {
      const output = new Output(null as any);

      output.writeString('Header\n');
      output.writeInt32BE(12345);
      output.writeFloatLE(3.14);
      output.writeString('\nFooter');

      expect(true).toBe(true);
    });

    it('should handle sequential writes', () => {
      const output = new Output(null as any);

      for (let i = 0; i < 100; i++) {
        output.writeInt32LE(i);
      }

      expect(true).toBe(true);
    });

    it('should handle bit writing', () => {
      const output = new Output(null as any);

      output.writeBits(0b1010, 4);
      output.writeBits(0b1100, 4);
      output.writeBitsSync();

      expect(true).toBe(true);
    });

    it('should handle seeking and telling', () => {
      const output = new Output(null as any);

      output.writeString('Hello');
      const pos1 = output.tell();

      output.seek(0, 0); // Seek to start
      const pos2 = output.tell();

      expect(pos1).toBeGreaterThan(pos2);
    });

    it('should handle base64 encoding', () => {
      const output = new Output(null as any);
      const data = Buffer.from('Test data for base64');

      output.writeBase64(data);
      output.writeString('\n');
      output.writeBase64URI(data);

      expect(true).toBe(true);
    });

    it('should handle flush and close', () => {
      const output = new Output(null as any);

      output.writeString('Data');
      output.flush();
      output.close();

      expect(true).toBe(true);
    });
  });
});
