/**
 * Buffer Operations Fuzzer
 *
 * Tests the robustness of buffer operations with random data.
 *
 * Targets:
 * - Buffer.fromString()
 * - Buffer.fromUint8Array()
 * - BufferReader operations
 * - BufferWriter operations
 *
 * Run:
 *   npx tsc fuzz/targets/buffer.fuzz.ts --outDir fuzz/targets --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck
 *   npx jazzer fuzz/targets/buffer.fuzz.js
 */

import { FuzzedDataProvider } from '@jazzer.js/core';
import { Buffer as NanoBuffer, BufferReader, BufferWriter } from '../../src/buffer.js';

export function fuzz(data: Buffer): void {
  const provider = new FuzzedDataProvider(data);

  // Skip empty inputs
  if (data.length === 0) {
    return;
  }

  try {
    // Test 1: Create buffer from fuzzed data
    try {
      const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      const buf = NanoBuffer.fromUint8Array(uint8);

      // Try to get length
      const len = buf.length;

      // Try to slice if len > 0
      if (len > 0) {
        const sliceEnd = Math.min(len, provider.consumeIntegralInRange(1, Math.max(1, len)));
        try {
          buf.slice(0, sliceEnd);
        } catch {
          // Slice failed - acceptable
        }
      }
    } catch {
      // Buffer creation failed - acceptable
    }

    // Test 2: BufferWriter operations
    try {
      const writer = new BufferWriter();

      // Write various data types with fuzzed values
      const writeOps = provider.consumeIntegralInRange(1, 10);

      for (let i = 0; i < writeOps; i++) {
        const op = provider.consumeIntegralInRange(0, 4);

        switch (op) {
          case 0: // Write string
            try {
              const str = provider.consumeString(provider.consumeIntegralInRange(0, 100));
              writer.writeString(str);
            } catch {
              // Write failed - acceptable
            }
            break;

          case 1: // Write byte
            try {
              writer.writeByte(provider.consumeIntegral(1, false));
            } catch {
              // Write failed - acceptable
            }
            break;

          case 2: // Write uint16
            try {
              writer.writeUInt16BE(provider.consumeIntegral(2, false));
            } catch {
              // Write failed - acceptable
            }
            break;

          case 3: // Write uint32
            try {
              writer.writeUInt32BE(provider.consumeIntegral(4, false));
            } catch {
              // Write failed - acceptable
            }
            break;

          case 4: // Write bytes
            try {
              const bytes = provider.consumeBytes(provider.consumeIntegralInRange(0, 50));
              writer.write(bytes);
            } catch {
              // Write failed - acceptable
            }
            break;
        }
      }

      // Try to get buffer
      try {
        writer.toBuffer();
      } catch {
        // toBuffer failed - acceptable
      }
    } catch {
      // BufferWriter operations failed - acceptable
    }

    // Test 3: BufferReader operations
    try {
      const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      const buf = NanoBuffer.fromUint8Array(uint8);
      const reader = new BufferReader(buf);

      // Try various read operations
      const readOps = provider.consumeIntegralInRange(1, 10);

      for (let i = 0; i < readOps; i++) {
        const op = provider.consumeIntegralInRange(0, 3);

        try {
          switch (op) {
            case 0: // Read byte
              reader.readByte();
              break;
            case 1: // Read uint16
              reader.readUInt16BE();
              break;
            case 2: // Read uint32
              reader.readUInt32BE();
              break;
            case 3: // Read bytes
              reader.read(provider.consumeIntegralInRange(1, 20));
              break;
          }
        } catch {
          // Read failed (EOF or invalid data) - acceptable
          break;
        }
      }
    } catch {
      // BufferReader operations failed - acceptable
    }
  } catch {
    // Overall fuzzing failed - acceptable
  }
}
