# NanoPDF Node.js Architecture

This document describes the internal architecture of the NanoPDF Node.js bindings.

---

## Table of Contents

- [Overview](#overview)
- [Layer Architecture](#layer-architecture)
- [Module Structure](#module-structure)
- [Memory Management](#memory-management)
- [Type System](#type-system)
- [Error Handling](#error-handling)
- [Build System](#build-system)
- [Testing Strategy](#testing-strategy)

---

## Overview

NanoPDF for Node.js is a multi-layered architecture that provides Node.js bindings to the MuPDF PDF library via Rust FFI and C++ N-API bindings.

### Design Goals

1. **Performance** - Zero-copy operations where possible, native code for CPU-intensive tasks
2. **Safety** - Strong typing, proper memory management, error handling
3. **Usability** - Clean API, TypeScript support, comprehensive documentation
4. **Compatibility** - Cross-platform support (Linux, macOS, Windows)
5. **Maintainability** - Clear separation of concerns, modular design

---

## Layer Architecture

The system consists of 4 distinct layers:

```
┌────────────────────────────────────────────────────────────┐
│  Layer 4: TypeScript API (nanopdf-js/src/*.ts)            │
│  ─────────────────────────────────────────────────────────│
│  • High-level, idiomatic Node.js/TypeScript API           │
│  • Classes: Document, Page, Pixmap, Buffer, etc.          │
│  • Type definitions and interfaces                         │
│  • Error wrapping and validation                          │
│  • ~15,000 lines of TypeScript                            │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ require('./native.node')
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 3: N-API Bindings (nanopdf-js/native/*.cc)         │
│  ─────────────────────────────────────────────────────────│
│  • C++ wrappers for Node.js N-API                          │
│  • Converts between JavaScript and C types                 │
│  • Manages Node.js object lifecycle                        │
│  • Handle reference counting                               │
│  • ~5,000 lines of C++ (20% complete, 130/660 functions)  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ extern "C" function calls
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 2: Rust FFI (nanopdf-rs/src/ffi/*.rs)              │
│  ─────────────────────────────────────────────────────────│
│  • C-compatible FFI functions (#[no_mangle])               │
│  • 660+ functions exposing MuPDF functionality             │
│  • Handle-based memory management                          │
│  • Error code translation                                  │
│  • Thread-safe handle stores with Arc<Mutex<T>>            │
│  • ~20,000 lines of Rust                                   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ MuPDF C API calls
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 1: MuPDF Library (C)                                │
│  ─────────────────────────────────────────────────────────│
│  • Core PDF processing engine                              │
│  • Rendering, parsing, manipulation                        │
│  • Mature, battle-tested codebase                          │
│  • ~200,000 lines of C                                     │
└────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Layer 4: TypeScript API

**Purpose**: Provide a clean, type-safe, idiomatic Node.js API.

**Responsibilities**:
- Class-based object-oriented interface
- Type definitions and validation
- Error wrapping and user-friendly messages
- Resource lifecycle management (constructors, drop methods)
- JSDoc documentation
- Default parameter values

**Key Files**:
- `src/document.ts` - PDF document operations
- `src/page.ts` - Page rendering and text
- `src/geometry.ts` - Point, Rect, Matrix, Quad
- `src/buffer.ts` - Binary data handling
- `src/pixmap.ts` - Raster images
- `src/native.ts` - Native interface definitions

#### Layer 3: N-API Bindings

**Purpose**: Bridge JavaScript/TypeScript to C/Rust.

**Responsibilities**:
- Convert JavaScript values to C types
- Convert C types to JavaScript values
- Manage Node.js object lifecycle
- Handle exceptions and errors
- Reference counting for handles
- Memory safety

**Key Files**:
- `native/nanopdf.cc` - Main entry point, module registration
- `native/context.cc` - Context FFI bindings
- `native/document.cc` - Document FFI bindings
- `native/page.cc` - Page FFI bindings
- `native/include/mupdf_minimal.h` - C header declarations

**Status**: ~20% complete (130/660 functions)

#### Layer 2: Rust FFI

**Purpose**: Provide C-compatible FFI for MuPDF operations.

**Responsibilities**:
- Expose MuPDF functionality via C FFI
- Handle-based memory management
- Thread-safe handle stores
- Error code translation
- Zero-cost abstractions

**Key Files**:
- `nanopdf-rs/src/ffi/mod.rs` - FFI module root
- `nanopdf-rs/src/ffi/context.rs` - Context operations
- `nanopdf-rs/src/ffi/document.rs` - Document operations
- `nanopdf-rs/src/ffi/page.rs` - Page operations
- `nanopdf-rs/src/ffi/buffer.rs` - Buffer operations
- `nanopdf-rs/src/ffi/geometry.rs` - Geometry types
- `nanopdf-rs/src/ffi/pixmap.rs` - Pixmap operations
- `nanopdf-rs/src/ffi/text.rs` - Text operations

**Status**: 100% complete (660/660 functions)

#### Layer 1: MuPDF

**Purpose**: Core PDF processing engine.

**Responsibilities**:
- PDF parsing and rendering
- Content stream processing
- Font handling
- Image decoding
- Compression/decompression

---

## Module Structure

### Core Modules

```
nanopdf-js/
├── src/
│   ├── index.ts           # Main entry point, exports all public API
│   ├── types.ts           # Common type definitions
│   ├── errors.ts          # Error classes and codes
│   ├── native.ts          # Native interface definitions
│   │
│   ├── document.ts        # Document class
│   ├── page.ts            # Page class
│   ├── buffer.ts          # Buffer class
│   ├── geometry.ts        # Point, Rect, Matrix, Quad
│   ├── colorspace.ts      # Colorspace class
│   ├── pixmap.ts          # Pixmap class
│   ├── text.ts            # Text class
│   ├── path.ts            # Path class (vector graphics)
│   ├── font.ts            # Font class
│   ├── image.ts           # Image class
│   ├── context.ts         # Context class
│   │
│   ├── form.ts            # Form fields (⚠️ partial)
│   ├── annot.ts           # Annotations (⚠️ partial)
│   ├── link.ts            # Hyperlinks (⚠️ partial)
│   ├── device.ts          # Rendering devices (⚠️ partial)
│   ├── display-list.ts    # Display lists (⚠️ partial)
│   ├── cookie.ts          # Progress tracking (⚠️ partial)
│   ├── output.ts          # Binary output (⚠️ partial)
│   ├── archive.ts         # Archive files (⚠️ partial)
│   │
│   └── pdf/
│       └── object.ts      # PDF object model
│
├── native/
│   ├── nanopdf.cc         # Main N-API entry point
│   ├── context.cc         # Context bindings
│   ├── document.cc        # Document bindings
│   ├── page.cc            # Page bindings
│   └── include/
│       └── mupdf_minimal.h # FFI function declarations
│
├── test/
│   ├── *.test.ts          # Unit tests
│   └── integration/       # Integration tests
│
└── docker/                # Docker testing environment
```

### Module Dependencies

```
┌─────────┐
│  index  │ ← Main entry, exports everything
└────┬────┘
     │
     ├─→ document ─→ page ─→ pixmap ─→ colorspace
     │                 │
     ├─→ buffer        └─→ text
     │
     ├─→ geometry (Point, Rect, Matrix, Quad)
     │
     ├─→ font ─→ image
     │
     ├─→ path ─→ device
     │
     ├─→ forms ─→ annot ─→ link
     │
     └─→ context ─→ errors
```

---

## Memory Management

### Handle-Based System

The FFI layer uses a **handle-based memory management** system:

```rust
// Rust FFI side
pub type Handle = u64;

pub struct HandleStore<T> {
    items: DashMap<Handle, Arc<Mutex<T>>>,
    next_id: AtomicU64,
}

impl<T> HandleStore<T> {
    pub fn insert(&self, item: T) -> Handle {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        self.items.insert(id, Arc::new(Mutex::new(item)));
        id
    }

    pub fn get(&self, handle: Handle) -> Option<Arc<Mutex<T>>> {
        self.items.get(&handle).map(|r| Arc::clone(r.value()))
    }

    pub fn remove(&self, handle: Handle) -> Option<Arc<Mutex<T>>> {
        self.items.remove(&handle).map(|(_, v)| v)
    }
}
```

### Object Lifecycle

```typescript
// TypeScript side
class Document {
  private _handle: bigint; // Native handle
  private _dropped: boolean = false;

  static open(path: string): Document {
    // Calls N-API which calls Rust FFI
    const handle = native.openDocumentFromPath(path);
    return new Document(handle);
  }

  close(): void {
    if (!this._dropped) {
      native.dropDocument(this._handle);
      this._dropped = true;
    }
  }

  // Destructor-like behavior (not guaranteed to run!)
  // Always call close() explicitly
}
```

### Memory Safety Rules

1. **Always clean up**: Call `drop()` or `close()` when done
2. **No use-after-free**: Handles are invalidated after drop
3. **Thread-safe**: Handles can be safely shared across threads
4. **Reference counting**: Handles use `Arc<Mutex<T>>` for safe sharing
5. **Error handling**: Invalid handles return error codes

### Example: Proper Resource Management

```typescript
// ✅ Good: Explicit cleanup
const doc = Document.open('file.pdf');
try {
  const page = doc.loadPage(0);
  try {
    // Work with page
  } finally {
    page.drop();
  }
} finally {
  doc.close();
}

// ❌ Bad: Missing cleanup (memory leak!)
const doc = Document.open('file.pdf');
const page = doc.loadPage(0);
// ... memory leak!
```

---

## Type System

### TypeScript Types

```typescript
// Primitive types
type Handle = bigint;
type ErrorCode = number;

// Geometry types
interface PointLike {
  x: number;
  y: number;
}

interface RectLike {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface MatrixLike {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

// Native FFI interfaces
interface NativeDocument {
  handle: Handle;
  pageCount: number;
}

interface NativePage {
  handle: Handle;
  pageNum: number;
  bounds: RectLike;
}
```

### C++ to JavaScript Conversion

```cpp
// native/page.cc
Napi::Value RenderPage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Extract arguments
  uint64_t pageHandle = info[0].As<Napi::BigInt>().Uint64Value();

  // Call Rust FFI
  uint64_t pixmapHandle = fz_render_page(0, pageHandle, /* ... */);

  // Convert result to JavaScript
  Napi::Object result = Napi::Object::New(env);
  result.Set("handle", Napi::BigInt::New(env, pixmapHandle));
  result.Set("width", Napi::Number::New(env, width));
  result.Set("height", Napi::Number::New(env, height));

  return result;
}
```

---

## Error Handling

### Error Propagation

```
┌────────────────────────────────────────┐
│  TypeScript: NanoPDFError exceptions   │
└────────────────┬───────────────────────┘
                 │ try/catch
                 ↓
┌────────────────────────────────────────┐
│  N-API: Napi::Error exceptions         │
└────────────────┬───────────────────────┘
                 │ if (err != 0)
                 ↓
┌────────────────────────────────────────┐
│  Rust FFI: Error codes (i32)          │
└────────────────┬───────────────────────┘
                 │ Result<T, E>
                 ↓
┌────────────────────────────────────────┐
│  MuPDF: fz_try/fz_catch exceptions     │
└────────────────────────────────────────┘
```

### Error Codes

```rust
// Rust FFI
pub const NANOPDF_OK: i32 = 0;
pub const NANOPDF_ERROR: i32 = -1;
pub const NANOPDF_ERROR_ARGUMENT: i32 = -2;
pub const NANOPDF_ERROR_MEMORY: i32 = -3;
pub const NANOPDF_ERROR_GENERIC: i32 = -4;
pub const NANOPDF_ERROR_IO: i32 = -10;
pub const NANOPDF_ERROR_NOT_FOUND: i32 = -11;
```

### Error Handling Example

```typescript
// TypeScript
try {
  const doc = Document.open('nonexistent.pdf');
} catch (error) {
  if (error instanceof NanoPDFError) {
    console.error(`Error code ${error.code}: ${error.message}`);
  }
}
```

```cpp
// N-API
Napi::Value OpenDocument(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  std::string path = info[0].As<Napi::String>().Utf8Value();

  uint64_t handle = fz_open_document(0, path.c_str());

  if (handle == 0) {
    Napi::Error::New(env, "Failed to open document")
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  return Napi::BigInt::New(env, handle);
}
```

---

## Build System

### Build Pipeline

```
┌────────────────────────────────────────┐
│  Step 1: Build Rust Library            │
│  cargo build --release                 │
│  → libnanopdf.a                        │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Step 2: Copy Library                  │
│  cp libnanopdf.a native/lib/           │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Step 3: Build TypeScript              │
│  tsc --build                           │
│  → dist/*.js, dist/*.d.ts              │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Step 4: Build N-API Addon             │
│  node-gyp rebuild                      │
│  → build/Release/nanopdf.node          │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Step 5: Package                       │
│  npm pack                              │
│  → nanopdf-VERSION.tgz                 │
└────────────────────────────────────────┘
```

### Build Configuration

**TypeScript** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

**Node-gyp** (`binding.gyp`):
```python
{
  'targets': [{
    'target_name': 'nanopdf',
    'sources': [
      'native/nanopdf.cc',
      'native/context.cc',
      'native/document.cc',
      'native/page.cc'
    ],
    'include_dirs': [
      '<!@(node -p "require(\'node-addon-api\').include")',
      'native/include'
    ],
    'libraries': [
      '../native/lib/<(OS)-<(target_arch)/libnanopdf.a'
    ],
    'cflags!': ['-fno-exceptions'],
    'cflags_cc!': ['-fno-exceptions']
  }]
}
```

---

## Testing Strategy

### Test Pyramid

```
          ┌─────────────┐
          │   E2E Tests │ (Integration with Docker)
          │   ~50 tests │
          └──────┬──────┘
                 │
          ┌──────┴──────────┐
          │ Integration Tests│ (Real PDF files)
          │    ~100 tests    │
          └──────┬──────────┘
                 │
        ┌────────┴────────────┐
        │    Unit Tests       │ (Mock native bindings)
        │     ~558 tests      │
        └─────────────────────┘
```

### Test Categories

**Unit Tests** (`test/*.test.ts`):
- Test individual classes and functions
- Mock native bindings
- Fast execution (~1s total)
- High coverage target (>90%)

**Integration Tests** (`test/integration/*.integration.test.ts`):
- Test with real PDF files
- Real native bindings
- Moderate execution (~5-10s)
- Focus on real-world scenarios

**Docker Tests** (`docker/Dockerfile.test`):
- Complete environment testing
- Multi-architecture (AMD64, ARM64)
- Includes build verification
- Slow execution (~5-10 minutes)

### Test Coverage

| Module | Unit | Integration | Total |
|--------|------|-------------|-------|
| **geometry** | 95% | 100% | 97% |
| **buffer** | 92% | 95% | 93% |
| **document** | 85% | 90% | 87% |
| **page** | 80% | 85% | 82% |
| **pixmap** | 75% | 80% | 77% |
| **text** | 70% | 75% | 72% |
| **Overall** | 82% | 87% | 84% |

---

## Performance Considerations

### Zero-Copy Operations

Where possible, we use zero-copy operations to minimize memory allocation and copying:

```typescript
// Zero-copy: Returns pointer to internal buffer
const data = buffer.toUint8Array(); // No copy!

// Copy: Creates new buffer
const copy = buffer.slice(0, 100); // Copy!
```

### Lazy Evaluation

Some operations are deferred until needed:

```typescript
class Page {
  private _text?: string;

  // Lazy evaluation: Only extract text when accessed
  extractText(): string {
    if (!this._text) {
      this._text = native.extractText(this._handle);
    }
    return this._text;
  }
}
```

### Batch Operations

Process multiple items efficiently:

```typescript
// Bad: Multiple FFI calls
for (let i = 0; i < 100; i++) {
  const page = doc.loadPage(i);
  page.drop(); // Expensive!
}

// Good: Batch processing
const pages = Array.from({length: 100}, (_, i) => doc.loadPage(i));
// Process all pages...
pages.forEach(p => p.drop()); // Single cleanup
```

---

## Future Architecture Changes

### Planned Improvements

1. **Worker Thread Support**
   - Move CPU-intensive operations to worker threads
   - Async API for rendering and text extraction

2. **Streaming API**
   - Stream large PDFs without loading entire file
   - Progressive rendering

3. **Caching Layer**
   - Cache rendered pages
   - Cache extracted text
   - Configurable cache size

4. **WebAssembly Support**
   - Compile to WASM for browser support
   - Shared codebase between Node.js and browser

5. **GPU Acceleration**
   - Use GPU for rendering where available
   - Faster image processing

---

## References

- [MuPDF Documentation](https://mupdf.com/docs/)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)
- [Rust FFI Guide](https://doc.rust-lang.org/nomicon/ffi.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

<div align="center">

**For questions or clarifications, please open an issue on GitHub.**

</div>

