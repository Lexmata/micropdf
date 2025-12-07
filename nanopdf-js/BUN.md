# NanoPDF for Bun

High-performance PDF manipulation library for Bun using native Rust FFI.

## Features

- 🚀 **Fast** - Direct FFI bindings to Rust core
- 🥟 **Native Bun** - Uses Bun's FFI, no Node.js required
- 🎯 **Type-Safe** - Full TypeScript support
- 🔒 **Memory Safe** - Automatic cleanup with `using` keyword
- 📦 **Zero Dependencies** - Pure Bun with native library
- ⚡ **Ultra-Fast** - Bun's optimized runtime + native code

## Installation

### Prerequisites

1. Install Bun (if not already installed):

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Build the Rust library:

```bash
cd nanopdf-rs
cargo build --release
```

### Import

```typescript
import { Context, Document, Pixmap, MatrixHelper } from "./bun";
```

## Quick Start

### Extract Text

```typescript
import { Context, Document } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");

console.log(`Pages: ${doc.pageCount()}`);

using page = doc.loadPage(0);
const text = page.extractText();
console.log(text);
```

### Render to PNG

```typescript
import { Context, Document, Pixmap, MatrixHelper } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");
using page = doc.loadPage(0);

const matrix = MatrixHelper.dpi(300); // 300 DPI
using pixmap = Pixmap.fromPage(ctx, page, matrix);

await pixmap.savePng("output.png");
```

### Document Metadata

```typescript
import { Context, Document } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");

console.log("Title:", doc.getMetadata("Title"));
console.log("Author:", doc.getMetadata("Author"));
console.log("Pages:", doc.pageCount());
console.log("Encrypted:", doc.needsPassword());
```

## API Reference

### Context

Manages memory allocation and resources.

```typescript
const ctx = new Context();
// or with custom cache size
const ctx = new Context(512 * 1024 * 1024); // 512 MB
```

**Methods:**
- `getHandle(): bigint` - Get native handle
- `clone(): Context` - Clone context
- `drop(): void` - Free resources
- `[Symbol.dispose](): void` - Automatic cleanup

### Document

Represents a PDF document.

```typescript
// Open from file
const doc = Document.open(ctx, "file.pdf");

// Open from bytes
const data = await Bun.file("file.pdf").arrayBuffer();
const doc = Document.fromBytes(ctx, new Uint8Array(data));
```

**Methods:**
- `pageCount(): number` - Get number of pages
- `needsPassword(): boolean` - Check if encrypted
- `authenticate(password: string): boolean` - Authenticate
- `getMetadata(key: string): string` - Get metadata
- `loadPage(pageNum: number): Page` - Load a page
- `drop(): void` - Free resources

### Page

Represents a single PDF page.

```typescript
const page = doc.loadPage(0);
```

**Methods:**
- `bounds(): Rect` - Get page bounds
- `extractText(): string` - Extract text
- `drop(): void` - Free resources

**Types:**
```typescript
interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
```

### Pixmap

Rendered page as pixel buffer.

```typescript
const pixmap = Pixmap.fromPage(ctx, page, matrix);
```

**Methods:**
- `width(): number` - Get width in pixels
- `height(): number` - Get height in pixels
- `stride(): number` - Get stride (bytes per row)
- `samples(): Uint8Array` - Get raw pixel data
- `toPng(): Uint8Array` - Convert to PNG
- `savePng(path: string): Promise<void>` - Save as PNG
- `drop(): void` - Free resources

### MatrixHelper

Helper for transformation matrices.

```typescript
// Identity matrix
const m = MatrixHelper.identity();

// Scale matrix
const m = MatrixHelper.scale(2.0, 2.0);

// DPI-based scaling
const m = MatrixHelper.dpi(300);
```

**Types:**
```typescript
interface Matrix {
  a: number; b: number;
  c: number; d: number;
  e: number; f: number;
}
```

## Examples

### Extract Text from All Pages

```typescript
import { Context, Document } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");

for (let i = 0; i < doc.pageCount(); i++) {
  using page = doc.loadPage(i);
  const text = page.extractText();
  console.log(`--- Page ${i + 1} ---`);
  console.log(text);
}
```

### Render All Pages

```typescript
import { Context, Document, Pixmap, MatrixHelper } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");

const matrix = MatrixHelper.dpi(150);

for (let i = 0; i < doc.pageCount(); i++) {
  using page = doc.loadPage(i);
  using pixmap = Pixmap.fromPage(ctx, page, matrix);
  
  const filename = `page_${i + 1}.png`;
  await pixmap.savePng(filename);
  console.log(`Saved: ${filename}`);
}
```

### Password-Protected PDF

```typescript
import { Context, Document } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "secure.pdf");

if (doc.needsPassword()) {
  const success = doc.authenticate("password123");
  if (success) {
    console.log("Authenticated successfully!");
  } else {
    throw new Error("Invalid password");
  }
}
```

### Custom Rendering

```typescript
import { Context, Document, Pixmap } from "./bun";

using ctx = new Context();
using doc = Document.open(ctx, "document.pdf");
using page = doc.loadPage(0);

// Custom transformation matrix
const matrix = {
  a: 2.0,  // Scale X
  b: 0.0,
  c: 0.0,
  d: 2.0,  // Scale Y
  e: 0.0,  // Translate X
  f: 0.0,  // Translate Y
};

using pixmap = Pixmap.fromPage(ctx, page, matrix);

const samples = pixmap.samples();
console.log(`Raw pixel data: ${samples.length} bytes`);
```

## Running Examples

```bash
# Extract text
bun run examples/bun/basic.ts sample.pdf text

# Render to PNG
bun run examples/bun/basic.ts sample.pdf render

# Show metadata
bun run examples/bun/basic.ts sample.pdf metadata

# Render all pages
bun run examples/bun/basic.ts sample.pdf render-all
```

## Memory Management

NanoPDF for Bun supports automatic resource cleanup using the `using` keyword (TC39 Explicit Resource Management):

```typescript
// Automatic cleanup
using ctx = new Context();
using doc = Document.open(ctx, "file.pdf");
using page = doc.loadPage(0);
// Resources automatically freed at end of scope

// Or manual cleanup
const ctx = new Context();
try {
  const doc = Document.open(ctx, "file.pdf");
  try {
    // ... use doc ...
  } finally {
    doc.drop();
  }
} finally {
  ctx.drop();
}
```

## Performance

NanoPDF for Bun provides exceptional performance through:

1. **Bun's Optimized Runtime** - JavaScriptCore engine (Safari)
2. **Direct FFI** - No overhead of N-API or serialization
3. **Zero-Copy** - Direct memory access for pixel data
4. **Native Rust** - Leverages Rust's performance
5. **Efficient Memory** - Automatic cleanup prevents leaks

### Benchmarks

Bun is typically **2-3x faster** than Node.js for startup and overall execution:

| Runtime | Startup | Text Extract | Render |
|---------|---------|--------------|--------|
| Bun | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |
| Node.js | ⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |
| Deno | ⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |

## Comparison

| Feature | Bun | Node.js | Deno |
|---------|-----|---------|------|
| FFI Type | Bun.dlopen | N-API | Deno.dlopen |
| Build Step | No | Yes (node-gyp) | No |
| Dependencies | 0 | 2 | 0 |
| TypeScript | Native | Compiled | Native |
| Performance | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |
| Startup | **Fastest** | Slower | Medium |

## Why Bun?

1. **Fastest Startup** - Bun starts 3x faster than Node.js
2. **Native TypeScript** - No compilation needed
3. **Built-in Tools** - Bundler, test runner, package manager
4. **Drop-in Replacement** - Compatible with Node.js APIs
5. **Modern APIs** - Latest JavaScript features

## Troubleshooting

### Library Not Found

If you get "Could not find libnanopdf library":

1. Build the Rust library:
   ```bash
   cd nanopdf-rs && cargo build --release
   ```

2. Verify the library exists:
   ```bash
   ls -la nanopdf-rs/target/release/libnanopdf.*
   ```

### FFI Errors

If you get FFI-related errors:

1. Ensure you have the latest Bun version:
   ```bash
   bun upgrade
   ```

2. Check Bun version:
   ```bash
   bun --version
   ```

## Links

- **Repository**: https://github.com/lexmata/nanopdf
- **Documentation**: https://lexmata.github.io/nanopdf/api/nodejs/
- **Rust Core**: https://docs.rs/nanopdf
- **Issues**: https://github.com/lexmata/nanopdf/issues
- **Bun**: https://bun.sh

## License

Apache 2.0

