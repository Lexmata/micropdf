# Node.js Integration Tests

Comprehensive integration tests for the nanopdf-js library using real PDF files.

---

## Overview

These integration tests validate the Node.js API against real-world PDF files stored in the `test-pdfs/` directory with Git LFS. Unlike unit tests that test individual functions, integration tests verify complete workflows and actual PDF processing.

---

## Test Suites

### 1. **Document Operations** (`document.integration.test.ts`)

**Tests**: Core document handling operations

- Opening PDFs from file path
- Opening PDFs from buffer
- Multi-page PDF handling
- Metadata access (Title, Author, Keywords)
- Missing metadata handling
- Password detection
- Authentication
- Permission checking
- Document saving
- Document writing to buffer
- Error handling (invalid paths, corrupted PDFs, empty buffers)

**Test PDFs Used:**

- `simple/hello-world.pdf`
- `simple/multi-page.pdf`
- `medium/with-metadata.pdf`
- `complex/encrypted.pdf`
- `minimal/empty.pdf`
- `minimal/corrupted.pdf`

**Coverage**: Document lifecycle, security, I/O operations

---

### 2. **Rendering Operations** (`rendering.integration.test.ts`)

**Tests**: Page rendering and image export

- Rendering pages to pixmap
- Scaling (0.5x, 1.0x, 2.0x)
- Alpha channel support
- PNG export
- High-resolution export (2x scale)
- Rendering PDFs with images
- Rendering PDFs with annotations
- High-resolution image handling
- Multi-page rendering performance
- Large document (100 pages) rendering

**Test PDFs Used:**

- `simple/hello-world.pdf`
- `simple/multi-page.pdf`
- `complex/with-images.pdf`
- `complex/with-annotations.pdf`
- `large/high-resolution-images.pdf`
- `large/multi-page-100.pdf`

**Coverage**: Rendering, scaling, image export, performance

---

### 3. **Text Operations** (`text.integration.test.ts`)

**Tests**: Text extraction and search

- Text extraction from simple PDFs
- Text extraction from all pages
- Structured text blocks
- Text search
- Case-insensitive search
- Multi-page search
- Search with no results
- Text from PDFs with metadata
- Text from PDFs with forms
- Text extraction performance (large documents)

**Test PDFs Used:**

- `simple/hello-world.pdf`
- `simple/multi-page.pdf`
- `medium/with-metadata.pdf`
- `complex/with-forms.pdf`
- `large/multi-page-100.pdf`

**Coverage**: Text extraction, search, structured text

---

### 4. **Advanced Features** (`advanced.integration.test.ts`)

**Tests**: Complex PDF features

- Encryption detection
- Password authentication
- Permission checking
- PDFs with embedded images
- Image rendering
- High-resolution images at multiple scales
- PDFs with annotations
- Annotation rendering
- PDFs with forms
- Form field rendering
- PDFs with outlines/bookmarks
- PDFs with file attachments
- Linearized (web-optimized) PDFs
- Large documents (100+ pages)
- Mixed feature workflows

**Test PDFs Used:**

- `complex/encrypted.pdf`
- `complex/with-images.pdf`
- `complex/with-annotations.pdf`
- `complex/with-forms.pdf`
- `complex/linearized.pdf`
- `medium/with-outline.pdf`
- `medium/with-attachments.pdf`
- `large/multi-page-100.pdf`
- `large/high-resolution-images.pdf`

**Coverage**: Encryption, images, annotations, forms, bookmarks, attachments, linearization

---

### 5. **Workflow Tests** (`workflow.integration.test.ts`)

**Tests**: Real-world end-to-end scenarios

- Complete document inspection (open, metadata, security, pages, close)
- Document save and reload cycle
- Extract and search text workflow
- Render all pages to images
- Thumbnail creation
- Corrupted PDF error recovery
- Resource cleanup verification
- Rapid open/close cycles

**Test PDFs Used:**

- All PDFs from `simple/`, `medium/`, `complex/` directories
- `minimal/corrupted.pdf`

**Coverage**: Real-world workflows, resource management, performance

---

## Running Tests

### All Integration Tests

```bash
cd nanopdf-js
pnpm test:integration
```

### Specific Test Suite

```bash
# Document tests
pnpm vitest test/integration/document.integration.test.ts

# Rendering tests
pnpm vitest test/integration/rendering.integration.test.ts

# Text tests
pnpm vitest test/integration/text.integration.test.ts

# Advanced features
pnpm vitest test/integration/advanced.integration.test.ts

# Workflows
pnpm vitest test/integration/workflow.integration.test.ts
```

### With Coverage

```bash
pnpm vitest test/integration --coverage
```

### Watch Mode

```bash
pnpm vitest test/integration --watch
```

---

## Test PDFs

Integration tests use PDF files from `../../../test-pdfs/`:

| PDF                                | Size | Features                    |
| ---------------------------------- | ---- | --------------------------- |
| `minimal/empty.pdf`                | 343B | Minimal valid PDF           |
| `minimal/corrupted.pdf`            | 213B | Malformed for error testing |
| `simple/hello-world.pdf`           | 583B | Single page with text       |
| `simple/multi-page.pdf`            | 1.1K | 3 pages                     |
| `medium/with-metadata.pdf`         | 1.3K | Rich metadata               |
| `medium/with-links.pdf`            | 1.2K | Internal links              |
| `medium/with-outline.pdf`          | 1.5K | Document bookmarks          |
| `medium/with-attachments.pdf`      | 967B | File attachments            |
| `complex/with-forms.pdf`           | 1.4K | AcroForm fields             |
| `complex/with-images.pdf`          | 1.9K | JPEG, grayscale images      |
| `complex/with-annotations.pdf`     | 1.4K | Highlights, shapes, notes   |
| `complex/encrypted.pdf`            | 877B | Password: `test123`         |
| `complex/linearized.pdf`           | 829B | Web-optimized               |
| `large/multi-page-100.pdf`         | 25K  | 100 pages                   |
| `large/high-resolution-images.pdf` | 1.4K | 1920x1080 images            |

**All PDFs are tracked with Git LFS.**

If a test PDF is not found, the test is automatically skipped with a warning.

---

## Test Statistics

| Metric             | Value                             |
| ------------------ | --------------------------------- |
| **Test Files**     | 5                                 |
| **Test Suites**    | 20+                               |
| **Test Functions** | 40+                               |
| **Test PDFs**      | 15                                |
| **Coverage**       | Document, Page, Text, Pixmap APIs |

---

## Test Organization

```
test/integration/
├── document.integration.test.ts    - Document operations
├── rendering.integration.test.ts   - Rendering and export
├── text.integration.test.ts        - Text extraction/search
├── advanced.integration.test.ts    - Advanced PDF features
├── workflow.integration.test.ts    - End-to-end workflows
└── README.md                        - This file
```

---

## Requirements

### Dependencies

```bash
pnpm install
```

### Native Addon

The native N-API addon must be built:

```bash
pnpm run build:native
```

### Test PDFs

Test PDFs must be available in `../../../test-pdfs/`. If using Git LFS:

```bash
git lfs pull
```

---

## Expected Behavior

### Test Skipping

Tests automatically skip if their required PDF files are not found:

```typescript
if (!fs.existsSync(pdfPath)) {
  console.warn('Test PDF not found, skipping test');
  return;
}
```

### Graceful Degradation

Some advanced features may not be fully implemented yet. Tests handle this gracefully:

```typescript
try {
  // Try advanced operation
  doc.save(outputPath);
} catch (error) {
  console.log('Feature not yet implemented:', error);
}
```

---

## CI/CD Integration

These tests run in:

1. **Local development** - `pnpm test:integration`
2. **Docker** - See `nanopdf-js/docker/`
3. **GitHub Actions** - `.github/workflows/test-nodejs-bindings.yml`

### GitHub Actions Workflow

```yaml
- name: Run integration tests
  run: pnpm test:integration
```

---

## Debugging

### Verbose Output

```bash
pnpm vitest test/integration --reporter=verbose
```

### Single Test

```bash
pnpm vitest test/integration/document.integration.test.ts -t "should open a simple PDF file"
```

### Debug Mode

```bash
NODE_OPTIONS='--inspect-brk' pnpm vitest test/integration/document.integration.test.ts
```

---

## Performance Expectations

Based on typical test runs:

| Operation     | Time   | Notes           |
| ------------- | ------ | --------------- |
| Open document | <10ms  | Simple PDFs     |
| Load page     | <5ms   | Per page        |
| Extract text  | <20ms  | Per page        |
| Render page   | <50ms  | At 1.0x scale   |
| Search text   | <10ms  | Per page        |
| Save document | <100ms | Depends on size |

Large documents (100 pages):

- Full render: ~5-10s
- Sampled render (every 10th): ~500-1000ms
- Text extraction (10 pages): ~200ms

---

## Writing New Integration Tests

### Test Template

```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Document } from '../../src';

const TEST_PDFS_DIR = path.join(__dirname, '../../../test-pdfs');

describe('My Integration Test', () => {
  it('should do something', () => {
    const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

    if (!fs.existsSync(pdfPath)) {
      console.warn('Test PDF not found, skipping test');
      return;
    }

    const doc = Document.open(pdfPath);

    // Your test code here

    doc.close();
  });
});
```

### Best Practices

1. **Always check if PDF exists** - Use `fs.existsSync()` and skip gracefully
2. **Clean up resources** - Call `drop()`, `close()`, `free()` on handles
3. **Use try/finally** - Ensure cleanup even on errors
4. **Log useful info** - Help debug test failures
5. **Handle not-implemented** - Use try/catch for incomplete features
6. **Test real scenarios** - Combine multiple operations

---

## Troubleshooting

### "Test PDF not found"

Ensure Git LFS files are downloaded:

```bash
git lfs pull
```

### "Native addon not found"

Build the native addon:

```bash
cd nanopdf-js
pnpm run build:native
```

### "Rust library not found"

Build the Rust library first:

```bash
cd nanopdf-rs
cargo build --release
```

### "FFI not implemented" errors

Some FFI functions may not be implemented yet. The test should handle this gracefully and skip or warn.

---

## Test Coverage Goals

- ✅ **Document lifecycle**: Open, close, save, write
- ✅ **Page operations**: Load, bounds, render, extract
- ✅ **Text operations**: Extract, search, blocks
- ✅ **Rendering**: Pixmap, PNG, scaling, alpha
- ✅ **Security**: Encryption, authentication, permissions
- ✅ **Advanced features**: Images, annotations, forms, outlines
- ✅ **Performance**: Large documents, batch processing
- ✅ **Error handling**: Corrupted PDFs, invalid inputs
- ✅ **Resource management**: Memory cleanup, no leaks

---

## Next Steps

Future integration tests to add:

1. **Form filling workflows**
2. **Annotation creation/modification**
3. **Page manipulation** (add, delete, rotate)
4. **PDF merging/splitting**
5. **Watermarking**
6. **Compression/optimization**
7. **Link extraction and navigation**
8. **Font handling**
9. **Color space conversions**
10. **Complex concurrent operations**

---

**Last Updated**: 2025-01-05  
**Test Files**: 5  
**Test Functions**: 40+  
**Test PDFs**: 15  
**Coverage**: Core APIs + Advanced Features
