/**
 * Bun FFI bindings for NanoPDF
 *
 * This module uses Bun's native FFI to load the Rust library
 * and provides direct bindings to the native functions.
 */

import { dlopen, FFIType, suffix, ptr } from 'bun:ffi';
import { existsSync } from 'fs';
import { join } from 'path';

// Determine library extension
const LIBRARY_EXTENSION = suffix;
const LIBRARY_PREFIX = process.platform === 'win32' ? '' : 'lib';

// Find the native library
function findLibrary(): string {
  const possiblePaths = [
    // Relative to this file
    join(
      __dirname,
      '../../../nanopdf-rs/target/release',
      `${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`
    ),
    join(
      __dirname,
      '../../../nanopdf-rs/target/debug',
      `${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`
    ),
    // System paths
    `/usr/local/lib/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`,
    `/usr/lib/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    'Could not find libnanopdf library. ' +
      'Please build the Rust library first: cd nanopdf-rs && cargo build --release'
  );
}

// FFI symbols definition
const symbols = {
  // Context functions
  fz_new_context: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.u64
  },
  fz_drop_context: {
    args: [FFIType.u64],
    returns: FFIType.void
  },
  fz_clone_context: {
    args: [FFIType.u64],
    returns: FFIType.u64
  },

  // Document functions
  fz_open_document: {
    args: [FFIType.u64, FFIType.ptr],
    returns: FFIType.u64
  },
  fz_open_document_with_buffer: {
    args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.u64
  },
  fz_drop_document: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.void
  },
  fz_count_pages: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.i32
  },
  fz_needs_password: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.i32
  },
  fz_authenticate_password: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr],
    returns: FFIType.i32
  },
  fz_lookup_metadata: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32
  },

  // Page functions
  fz_load_page: {
    args: [FFIType.u64, FFIType.u64, FFIType.i32],
    returns: FFIType.u64
  },
  fz_drop_page: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.void
  },
  fz_bound_page: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.ptr // Returns pointer to fz_rect struct
  },

  // Pixmap functions
  fz_new_pixmap_from_page: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32],
    returns: FFIType.u64
  },
  fz_drop_pixmap: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.void
  },
  fz_pixmap_width: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.i32
  },
  fz_pixmap_height: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.i32
  },
  fz_pixmap_samples: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.ptr
  },
  fz_pixmap_stride: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.i32
  },

  // Buffer functions
  fz_new_buffer: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.u64
  },
  fz_drop_buffer: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.void
  },
  fz_buffer_data: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr],
    returns: FFIType.ptr
  },
  fz_new_buffer_from_pixmap_as_png: {
    args: [FFIType.u64, FFIType.u64, FFIType.i32],
    returns: FFIType.u64
  },

  // Text extraction
  fz_new_stext_page_from_page: {
    args: [FFIType.u64, FFIType.u64, FFIType.ptr],
    returns: FFIType.u64
  },
  fz_drop_stext_page: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.void
  },
  fz_new_buffer_from_stext_page: {
    args: [FFIType.u64, FFIType.u64],
    returns: FFIType.u64
  },

  // Matrix functions
  fz_identity: {
    args: [],
    returns: FFIType.ptr
  },
  fz_scale: {
    args: [FFIType.f32, FFIType.f32],
    returns: FFIType.ptr
  },
  fz_translate: {
    args: [FFIType.f32, FFIType.f32],
    returns: FFIType.ptr
  },
  fz_rotate: {
    args: [FFIType.f32],
    returns: FFIType.ptr
  },

  // Colorspace functions
  fz_device_rgb: {
    args: [FFIType.u64],
    returns: FFIType.u64
  },
  fz_device_gray: {
    args: [FFIType.u64],
    returns: FFIType.u64
  },
  fz_device_cmyk: {
    args: [FFIType.u64],
    returns: FFIType.u64
  }
} as const;

// Load the library
const libraryPath = findLibrary();
export const lib = dlopen(libraryPath, symbols);

// Export symbols for easy access
export const {
  fz_new_context,
  fz_drop_context,
  fz_clone_context,
  fz_open_document,
  fz_open_document_with_buffer,
  fz_drop_document,
  fz_count_pages,
  fz_needs_password,
  fz_authenticate_password,
  fz_lookup_metadata,
  fz_load_page,
  fz_drop_page,
  fz_bound_page,
  fz_new_pixmap_from_page,
  fz_drop_pixmap,
  fz_pixmap_width,
  fz_pixmap_height,
  fz_pixmap_samples,
  fz_pixmap_stride,
  fz_new_buffer,
  fz_drop_buffer,
  fz_buffer_data,
  fz_new_buffer_from_pixmap_as_png,
  fz_new_stext_page_from_page,
  fz_drop_stext_page,
  fz_new_buffer_from_stext_page,
  fz_identity,
  fz_scale,
  fz_translate,
  fz_rotate,
  fz_device_rgb,
  fz_device_gray,
  fz_device_cmyk
} = lib.symbols;

// Constants
export const FZ_STORE_DEFAULT = 256 * 1024 * 1024; // 256 MB

// Helper to create C strings
export function toCString(str: string): Buffer {
  return Buffer.from(str + '\0', 'utf-8');
}

// Helper to read C strings
export function fromCString(ptr: number): string {
  if (!ptr) return '';
  // Use Bun's ptr helper to read C string
  const cstr = new Uint8Array(ptr);
  let length = 0;
  while (cstr[length] !== 0) length++;
  return Buffer.from(cstr.slice(0, length)).toString('utf-8');
}

// Helper to read buffer data
export function readBuffer(pointer: number, length: number): Uint8Array {
  if (!pointer) return new Uint8Array(0);
  return new Uint8Array(ptr(pointer, length));
}

// Helper to read floats from pointer (for matrices and rects)
export function readFloats(pointer: number, count: number): Float32Array {
  if (!pointer) return new Float32Array(0);
  return new Float32Array(ptr(pointer, count * 4));
}
