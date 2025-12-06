/**
 * Filter - PDF compression and decompression filters
 *
 * This implementation mirrors the Rust `pdf::filter` module for 100% API compatibility.
 */

import { deflateSync, inflateSync } from 'zlib';
import { NanoPDFError, type FilterType } from './types.js';

// ============================================================================
// FlateDecode (zlib/deflate)
// ============================================================================

/**
 * Compress data using FlateDecode (zlib deflate)
 */
export function flateEncode(data: Uint8Array): Uint8Array {
  try {
    const compressed = deflateSync(globalThis.Buffer.from(data));
    return new Uint8Array(compressed);
  } catch (e) {
    throw NanoPDFError.system('FlateDecode encoding failed', e instanceof Error ? e : undefined);
  }
}

/**
 * Decompress FlateDecode (zlib inflate) data
 */
export function flateDecode(data: Uint8Array): Uint8Array {
  try {
    const decompressed = inflateSync(globalThis.Buffer.from(data));
    return new Uint8Array(decompressed);
  } catch (e) {
    throw NanoPDFError.system('FlateDecode decoding failed', e instanceof Error ? e : undefined);
  }
}

// ============================================================================
// ASCIIHexDecode
// ============================================================================

/**
 * Encode data to ASCII hex
 */
export function asciiHexEncode(data: Uint8Array): Uint8Array {
  const hex = globalThis.Buffer.from(data).toString('hex').toUpperCase();
  return new TextEncoder().encode(hex);
}

/**
 * Decode ASCII hex data
 */
export function asciiHexDecode(data: Uint8Array): Uint8Array {
  const str = new TextDecoder().decode(data);

  // Remove whitespace and EOD marker
  let hex = str.replace(/[\s>]/g, '');

  // Handle odd length by appending 0
  if (hex.length % 2 !== 0) {
    hex += '0';
  }

  // Validate hex characters
  if (!/^[0-9A-Fa-f]*$/.test(hex)) {
    throw NanoPDFError.argument('Invalid ASCIIHex data');
  }

  return new Uint8Array(globalThis.Buffer.from(hex, 'hex'));
}

// ============================================================================
// ASCII85Decode
// ============================================================================

// ASCII85 constants (for potential future use in optimized encoding)
// const ASCII85_ENCODE_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// const POW85 = [85 * 85 * 85 * 85, 85 * 85 * 85, 85 * 85, 85, 1];

/**
 * Encode data to ASCII85
 */
export function ascii85Encode(data: Uint8Array): Uint8Array {
  const result: number[] = [];

  // Process 4 bytes at a time
  let i = 0;
  while (i < data.length) {
    const chunk = data.slice(i, i + 4);
    i += 4;

    // Pad with zeros if needed
    const padded = new Uint8Array(4);
    padded.set(chunk);

    // Convert to 32-bit value
    const value = (padded[0]! << 24) | (padded[1]! << 16) | (padded[2]! << 8) | padded[3]!;

    // Special case: all zeros -> 'z'
    if (value === 0 && chunk.length === 4) {
      result.push(122); // 'z'
    } else {
      // Convert to base-85
      const encoded: number[] = [];
      let v = value >>> 0; // Ensure unsigned
      for (let j = 4; j >= 0; j--) {
        encoded[j] = (v % 85) + 33;
        v = Math.floor(v / 85);
      }

      // Only output as many characters as needed
      const outLen = chunk.length + 1;
      for (let j = 0; j < outLen; j++) {
        result.push(encoded[j]!);
      }
    }
  }

  // Add EOD marker
  result.push(126); // '~'
  result.push(62); // '>'

  return new Uint8Array(result);
}

/**
 * Decode ASCII85 data
 */
export function ascii85Decode(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  const str = new TextDecoder().decode(data);

  // Remove whitespace
  const cleaned = str.replace(/\s/g, '');

  // Remove EOD marker if present
  const content = cleaned.replace(/~>$/, '');

  let i = 0;
  while (i < content.length) {
    // Handle 'z' abbreviation for all zeros
    if (content[i] === 'z') {
      result.push(0, 0, 0, 0);
      i++;
      continue;
    }

    // Get next group (up to 5 characters)
    let group = '';
    let j = 0;
    while (j < 5 && i + j < content.length && content[i + j] !== 'z') {
      group += content[i + j];
      j++;
    }

    if (group.length === 0) break;

    // Pad with 'u' if needed
    const padCount = 5 - group.length;
    const paddedGroup = group + 'u'.repeat(padCount);

    // Convert from base-85
    let value = 0;
    for (let k = 0; k < 5; k++) {
      const char = paddedGroup.charCodeAt(k);
      if (char < 33 || char > 117) {
        throw NanoPDFError.argument('Invalid ASCII85 character');
      }
      value = value * 85 + (char - 33);
    }

    // Convert to bytes
    const bytes = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ];

    // Output only the non-padded bytes
    const outCount = 4 - padCount;
    for (let k = 0; k < outCount; k++) {
      result.push(bytes[k]!);
    }

    i += group.length;
  }

  return new Uint8Array(result);
}

// ============================================================================
// RunLengthDecode
// ============================================================================

/**
 * Encode data using Run-Length Encoding
 */
export function runLengthEncode(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array([128]); // Just EOD
  }

  const result: number[] = [];
  let i = 0;

  while (i < data.length) {
    // Count consecutive identical bytes
    let runLength = 1;
    while (i + runLength < data.length && data[i] === data[i + runLength] && runLength < 128) {
      runLength++;
    }

    if (runLength > 1) {
      // Run of identical bytes
      result.push(257 - runLength); // Length byte
      result.push(data[i]!); // Value byte
      i += runLength;
    } else {
      // Count consecutive different bytes
      let litLength = 1;
      while (i + litLength < data.length && litLength < 128) {
        // Check if next bytes start a run
        if (i + litLength + 1 < data.length && data[i + litLength] === data[i + litLength + 1]) {
          break;
        }
        litLength++;
      }

      // Literal bytes
      result.push(litLength - 1); // Length byte
      for (let j = 0; j < litLength; j++) {
        result.push(data[i + j]!);
      }
      i += litLength;
    }
  }

  result.push(128); // EOD
  return new Uint8Array(result);
}

/**
 * Decode Run-Length encoded data
 */
export function runLengthDecode(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  let i = 0;

  while (i < data.length) {
    const length = data[i]!;
    i++;

    if (length === 128) {
      // EOD marker
      break;
    } else if (length < 128) {
      // Literal bytes: copy (length + 1) bytes
      const count = length + 1;
      for (let j = 0; j < count && i < data.length; j++) {
        result.push(data[i]!);
        i++;
      }
    } else {
      // Run: repeat next byte (257 - length) times
      const count = 257 - length;
      const byte = data[i]!;
      i++;
      for (let j = 0; j < count; j++) {
        result.push(byte);
      }
    }
  }

  return new Uint8Array(result);
}

// ============================================================================
// LZWDecode
// ============================================================================

/**
 * Decode LZW compressed data
 */
export function lzwDecode(data: Uint8Array, earlyChange: boolean = true): Uint8Array {
  // LZW implementation
  const CLEAR_CODE = 256;
  const EOD_CODE = 257;

  const result: number[] = [];
  const table: Uint8Array[] = [];

  // Initialize table with single-byte entries
  for (let i = 0; i < 256; i++) {
    table.push(new Uint8Array([i]));
  }
  table.push(new Uint8Array(0)); // CLEAR_CODE placeholder
  table.push(new Uint8Array(0)); // EOD_CODE placeholder

  let codeSize = 9;
  let bitPos = 0;
  let prevCode: number | null = null;

  function readCode(): number {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const bytePos = Math.floor(bitPos / 8);
      const bitOffset = bitPos % 8;
      if (bytePos < data.length) {
        code |= ((data[bytePos]! >> (7 - bitOffset)) & 1) << (codeSize - 1 - i);
      }
      bitPos++;
    }
    return code;
  }

  while (bitPos < data.length * 8) {
    const code = readCode();

    if (code === EOD_CODE) {
      break;
    }

    if (code === CLEAR_CODE) {
      // Reset table
      table.length = 258;
      codeSize = 9;
      prevCode = null;
      continue;
    }

    let entry: Uint8Array;
    if (code < table.length) {
      entry = table[code]!;
    } else if (code === table.length && prevCode !== null) {
      // Special case: code not yet in table
      const prev = table[prevCode]!;
      entry = new Uint8Array(prev.length + 1);
      entry.set(prev);
      entry[prev.length] = prev[0]!;
    } else {
      throw NanoPDFError.argument('Invalid LZW code');
    }

    // Output entry
    for (const byte of entry) {
      result.push(byte);
    }

    // Add to table
    if (prevCode !== null && table.length < 4096) {
      const prev = table[prevCode]!;
      const newEntry = new Uint8Array(prev.length + 1);
      newEntry.set(prev);
      newEntry[prev.length] = entry[0]!;
      table.push(newEntry);

      // Increase code size if needed
      const nextSize = table.length + (earlyChange ? 0 : 1);
      if (nextSize > 1 << codeSize && codeSize < 12) {
        codeSize++;
      }
    }

    prevCode = code;
  }

  return new Uint8Array(result);
}

// ============================================================================
// Generic Filter Interface
// ============================================================================

/**
 * Decode data using the specified filter
 */
export function decodeFilter(
  filter: FilterType,
  data: Uint8Array,
  params?: Record<string, unknown>
): Uint8Array {
  switch (filter) {
    case 'FlateDecode':
      return flateDecode(data);
    case 'ASCIIHexDecode':
      return asciiHexDecode(data);
    case 'ASCII85Decode':
      return ascii85Decode(data);
    case 'RunLengthDecode':
      return runLengthDecode(data);
    case 'LZWDecode':
      return lzwDecode(data, params?.['EarlyChange'] !== 0);
    case 'DCTDecode':
      throw NanoPDFError.notImplemented('DCTDecode filter');
    case 'JPXDecode':
      throw NanoPDFError.notImplemented('JPXDecode filter');
    case 'JBIG2Decode':
      throw NanoPDFError.notImplemented('JBIG2Decode filter');
    case 'CCITTFaxDecode':
      throw NanoPDFError.notImplemented('CCITTFaxDecode filter');
    case 'Crypt':
      throw NanoPDFError.notImplemented('Crypt filter');
    default:
      throw NanoPDFError.argument(`Unsupported filter: ${filter as string}`);
  }
}

/**
 * Encode data using the specified filter
 */
export function encodeFilter(
  filter: FilterType,
  data: Uint8Array,
  _params?: Record<string, unknown>
): Uint8Array {
  switch (filter) {
    case 'FlateDecode':
      return flateEncode(data);
    case 'ASCIIHexDecode':
      return asciiHexEncode(data);
    case 'ASCII85Decode':
      return ascii85Encode(data);
    case 'RunLengthDecode':
      return runLengthEncode(data);
    case 'LZWDecode':
      throw NanoPDFError.notImplemented('LZWEncode');
    case 'DCTDecode':
      throw NanoPDFError.notImplemented('DCTEncode filter');
    case 'JPXDecode':
      throw NanoPDFError.notImplemented('JPXEncode filter');
    case 'JBIG2Decode':
      throw NanoPDFError.notImplemented('JBIG2Encode filter');
    case 'CCITTFaxDecode':
      throw NanoPDFError.notImplemented('CCITTFaxEncode filter');
    case 'Crypt':
      throw NanoPDFError.notImplemented('Crypt filter');
    default:
      throw NanoPDFError.argument(`Unsupported filter: ${filter as string}`);
  }
}
