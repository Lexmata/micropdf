/**
 * Deno FFI bindings for NanoPDF
 *
 * This module uses Deno's native FFI to load the Rust library
 * and provides direct bindings to the native functions.
 */

const IS_WINDOWS = Deno.build.os === 'windows';
const IS_MACOS = Deno.build.os === 'darwin';
const IS_LINUX = Deno.build.os === 'linux';

// Determine library extension
const LIBRARY_EXTENSION = IS_WINDOWS ? '.dll' : IS_MACOS ? '.dylib' : '.so';
const LIBRARY_PREFIX = IS_WINDOWS ? '' : 'lib';

// Find the native library
function findLibrary(): string {
  const possiblePaths = [
    // Relative to this file
    `../../../nanopdf-rs/target/release/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`,
    `../../../nanopdf-rs/target/debug/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`,
    // System paths
    `/usr/local/lib/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`,
    `/usr/lib/${LIBRARY_PREFIX}nanopdf${LIBRARY_EXTENSION}`
  ];

  for (const path of possiblePaths) {
    try {
      const resolvedPath = new URL(path, import.meta.url).pathname;
      if (Deno.statSync(resolvedPath).isFile) {
        return resolvedPath;
      }
    } catch {
      // Continue to next path
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
    parameters: ['pointer', 'pointer', 'usize'],
    result: 'u64'
  },
  fz_drop_context: {
    parameters: ['u64'],
    result: 'void'
  },
  fz_clone_context: {
    parameters: ['u64'],
    result: 'u64'
  },

  // Document functions
  fz_open_document: {
    parameters: ['u64', 'pointer'],
    result: 'u64'
  },
  fz_open_document_with_buffer: {
    parameters: ['u64', 'pointer', 'pointer', 'usize'],
    result: 'u64'
  },
  fz_drop_document: {
    parameters: ['u64', 'u64'],
    result: 'void'
  },
  fz_count_pages: {
    parameters: ['u64', 'u64'],
    result: 'i32'
  },
  fz_needs_password: {
    parameters: ['u64', 'u64'],
    result: 'i32'
  },
  fz_authenticate_password: {
    parameters: ['u64', 'u64', 'pointer'],
    result: 'i32'
  },
  fz_lookup_metadata: {
    parameters: ['u64', 'u64', 'pointer', 'pointer', 'i32'],
    result: 'i32'
  },

  // Page functions
  fz_load_page: {
    parameters: ['u64', 'u64', 'i32'],
    result: 'u64'
  },
  fz_drop_page: {
    parameters: ['u64', 'u64'],
    result: 'void'
  },
  fz_bound_page: {
    parameters: ['u64', 'u64'],
    result: {
      struct: ['f32', 'f32', 'f32', 'f32']
    }
  },

  // Pixmap functions
  fz_new_pixmap_from_page: {
    parameters: [
      'u64',
      'u64',
      { struct: ['f32', 'f32', 'f32', 'f32', 'f32', 'f32'] },
      'u64',
      'i32'
    ],
    result: 'u64'
  },
  fz_drop_pixmap: {
    parameters: ['u64', 'u64'],
    result: 'void'
  },
  fz_pixmap_width: {
    parameters: ['u64', 'u64'],
    result: 'i32'
  },
  fz_pixmap_height: {
    parameters: ['u64', 'u64'],
    result: 'i32'
  },
  fz_pixmap_samples: {
    parameters: ['u64', 'u64'],
    result: 'pointer'
  },
  fz_pixmap_stride: {
    parameters: ['u64', 'u64'],
    result: 'i32'
  },

  // Buffer functions
  fz_new_buffer: {
    parameters: ['u64', 'usize'],
    result: 'u64'
  },
  fz_drop_buffer: {
    parameters: ['u64', 'u64'],
    result: 'void'
  },
  fz_buffer_data: {
    parameters: ['u64', 'u64', 'pointer'],
    result: 'pointer'
  },
  fz_new_buffer_from_pixmap_as_png: {
    parameters: ['u64', 'u64', 'i32'],
    result: 'u64'
  },

  // Text extraction
  fz_new_stext_page_from_page: {
    parameters: ['u64', 'u64', 'pointer'],
    result: 'u64'
  },
  fz_drop_stext_page: {
    parameters: ['u64', 'u64'],
    result: 'void'
  },
  fz_new_buffer_from_stext_page: {
    parameters: ['u64', 'u64'],
    result: 'u64'
  },

  // Matrix functions
  fz_identity: {
    parameters: [],
    result: {
      struct: ['f32', 'f32', 'f32', 'f32', 'f32', 'f32']
    }
  },
  fz_scale: {
    parameters: ['f32', 'f32'],
    result: {
      struct: ['f32', 'f32', 'f32', 'f32', 'f32', 'f32']
    }
  },
  fz_translate: {
    parameters: ['f32', 'f32'],
    result: {
      struct: ['f32', 'f32', 'f32', 'f32', 'f32', 'f32']
    }
  },
  fz_rotate: {
    parameters: ['f32'],
    result: {
      struct: ['f32', 'f32', 'f32', 'f32', 'f32', 'f32']
    }
  },

  // Colorspace functions
  fz_device_rgb: {
    parameters: ['u64'],
    result: 'u64'
  },
  fz_device_gray: {
    parameters: ['u64'],
    result: 'u64'
  },
  fz_device_cmyk: {
    parameters: ['u64'],
    result: 'u64'
  }
} as const;

// Load the library
const libraryPath = findLibrary();
export const lib = Deno.dlopen(libraryPath, symbols);

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
export function toCString(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  const buffer = new Uint8Array(encoded.length + 1);
  buffer.set(encoded);
  buffer[encoded.length] = 0; // Null terminator
  return buffer;
}

// Helper to read C strings
export function fromCString(ptr: Deno.PointerValue): string {
  if (!ptr) return '';
  const view = new Deno.UnsafePointerView(ptr);
  return view.getCString();
}

// Helper to read buffer data
export function readBuffer(ptr: Deno.PointerValue, length: number): Uint8Array {
  if (!ptr) return new Uint8Array(0);
  const view = new Deno.UnsafePointerView(ptr);
  return new Uint8Array(view.getArrayBuffer(length));
}
