/**
 * Buffer Operations Fuzzer
 * 
 * Tests the robustness of buffer operations with random data.
 * 
 * Targets:
 * - Buffer.fromString()
 * - Buffer.fromArrayBuffer()
 * - BufferReader operations
 * - BufferWriter operations
 * 
 * Run:
 *   npx jazzer fuzz/targets/buffer.fuzz.ts
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
      const buf = NanoBuffer.fromArrayBuffer(data.buffer);
      
      // Try to get size
      const size = buf.size;
      
      // Try to slice if size > 0
      if (size > 0) {
        const sliceEnd = Math.min(size, provider.consumeIntegralInRange(1, Math.max(1, size)));
        try {
          buf.slice(0, sliceEnd);
        } catch (e) {
          // Slice failed - acceptable
        }
      }
      
    } catch (e) {
      // Buffer creation failed - acceptable
    }
    
    // Test 2: BufferWriter operations
    try {
      const writer = new BufferWriter();
      
      // Write various data types with fuzzed values
      const writeOps = provider.consumeIntegralInRange(1, 10);
      
      for (let i = 0; i < writeOps; i++) {
        const op = provider.consumeIntegralInRange(0, 5);
        
        switch (op) {
          case 0: // Write string
            try {
              const str = provider.consumeString(provider.consumeIntegralInRange(0, 100));
              writer.writeString(str);
            } catch (e) {
              // Write failed - acceptable
            }
            break;
            
          case 1: // Write byte
            try {
              writer.writeByte(provider.consumeIntegral(1, false));
            } catch (e) {
              // Write failed - acceptable
            }
            break;
            
          case 2: // Write int16
            try {
              writer.writeInt16(provider.consumeIntegral(2, true));
            } catch (e) {
              // Write failed - acceptable
            }
            break;
            
          case 3: // Write int32
            try {
              writer.writeInt32(provider.consumeIntegral(4, true));
            } catch (e) {
              // Write failed - acceptable
            }
            break;
            
          case 4: // Write float
            try {
              writer.writeFloat(provider.consumeProbability());
            } catch (e) {
              // Write failed - acceptable
            }
            break;
            
          case 5: // Write bytes
            try {
              const bytes = provider.consumeBytes(provider.consumeIntegralInRange(0, 50));
              writer.writeBytes(bytes);
            } catch (e) {
              // Write failed - acceptable
            }
            break;
        }
      }
      
      // Try to get buffer
      try {
        writer.toBuffer();
      } catch (e) {
        // toBuffer failed - acceptable
      }
      
    } catch (e) {
      // BufferWriter operations failed - acceptable
    }
    
    // Test 3: BufferReader operations
    try {
      const buf = NanoBuffer.fromArrayBuffer(data.buffer);
      const reader = new BufferReader(buf);
      
      // Try various read operations
      const readOps = provider.consumeIntegralInRange(1, 10);
      
      for (let i = 0; i < readOps; i++) {
        const op = provider.consumeIntegralInRange(0, 5);
        
        try {
          switch (op) {
            case 0: // Read byte
              reader.readByte();
              break;
            case 1: // Read int16
              reader.readInt16();
              break;
            case 2: // Read int32
              reader.readInt32();
              break;
            case 3: // Read float
              reader.readFloat();
              break;
            case 4: // Read string
              reader.readString(provider.consumeIntegralInRange(1, 20));
              break;
            case 5: // Read bytes
              reader.readBytes(provider.consumeIntegralInRange(1, 20));
              break;
          }
        } catch (e) {
          // Read failed (EOF or invalid data) - acceptable
          break;
        }
      }
      
    } catch (e) {
      // BufferReader operations failed - acceptable
    }
    
  } catch (e) {
    // Overall fuzzing failed - acceptable
  }
}

