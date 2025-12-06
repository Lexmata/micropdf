# NanoPDF Examples

This directory contains practical examples demonstrating various features of the NanoPDF library.

---

## Running Examples

### Prerequisites

```bash
# Install dependencies
cd nanopdf-js
pnpm install

# Build the project
pnpm run build
```

### Run an Example

```bash
# Using ts-node
pnpm exec ts-node examples/01-basic-reading.ts

# Or compile and run
pnpm run build:ts
node dist/examples/01-basic-reading.js
```

---

## Available Examples

### 1. Basic PDF Reading (`01-basic-reading.ts`)

**What it demonstrates:**
- Opening PDF documents
- Reading basic properties (page count, format)
- Accessing document metadata
- Loading and inspecting pages
- Getting page dimensions

**Usage:**
```bash
pnpm exec ts-node examples/01-basic-reading.ts
```

**Output:**
```
=== Basic PDF Information ===
File: /path/to/hello-world.pdf
Format: PDF 1.4
Pages: 1
Needs Password: false
Is Authenticated: true

=== Metadata ===
Title: Hello World
Author: Example Author

=== First Page ===
Page Number: 0
Bounds: [0, 0, 612, 792]
Width: 612 points
Height: 792 points
Rotation: 0 degrees
Size: 8.50" × 11.00"
```

---

### 2. Text Extraction (`02-text-extraction.ts`)

**What it demonstrates:**
- Extracting text from all pages
- Searching for specific text
- Getting text with layout information (blocks, lines, spans)
- Saving extracted text to file

**Usage:**
```bash
pnpm exec ts-node examples/02-text-extraction.ts
```

**Functions:**
- `extractAllText()` - Extract and save all text
- `searchText()` - Search for specific keywords
- `extractTextBlocks()` - Get structured text with layout

**Output:**
- `extracted-text.txt` - All extracted text
- Console output showing search results and text blocks

---

### 3. Page Rendering (`03-rendering.ts`)

**What it demonstrates:**
- Rendering pages to images at different resolutions
- Creating thumbnails
- Using different colorspaces (RGB, Gray, CMYK)
- Rendering with alpha channel (transparency)
- Saving as PNG files

**Usage:**
```bash
pnpm exec ts-node examples/03-rendering.ts
```

**Functions:**
- `renderSinglePage()` - Render at multiple DPIs
- `createThumbnails()` - Generate thumbnail images
- `renderWithColorspace()` - Render in different colorspaces
- `renderWithAlpha()` - Render with transparency

**Output:**
- `output-thumbnail.png` - 36 DPI thumbnail
- `output-screen.png` - 96 DPI screen quality
- `output-print.png` - 300 DPI print quality
- `output-rgb.png`, `output-gray.png`, `output-cmyk.png` - Different colorspaces
- `output-with-alpha.png` - With transparency

---

### 4. Batch Processing (`04-batch-processing.ts`)

**What it demonstrates:**
- Processing multiple PDF files in a directory
- Extracting metadata from all files
- Generating reports (Markdown format)
- Searching across multiple PDFs
- Error handling for corrupted/invalid files

**Usage:**
```bash
pnpm exec ts-node examples/04-batch-processing.ts
```

**Functions:**
- `processPDFDirectory()` - Scan directory and collect info
- `generateReport()` - Create formatted report
- `extractAllTextFromDirectory()` - Extract text from all PDFs
- `searchInMultiplePDFs()` - Search term across files

**Output:**
- `pdf-report.md` - Markdown report with statistics
- `all-text.txt` - Combined text from all PDFs
- Console output with search results

---

## Example Output

### PDF Processing Report

```markdown
# PDF Processing Report

Generated: 2024-01-15T10:30:00.000Z

## Summary

- Total Files: 5
- Successful: 5
- Errors: 0
- Total Pages: 12
- Encrypted: 1

## Files

| Filename | Pages | Size | Title | Author | Encrypted | Status |
|----------|-------|------|-------|--------|-----------|--------|
| hello-world.pdf | 1 | 612×792 | Hello World | John Doe | - | ✅ |
| multi-page.pdf | 3 | 612×792 | Multi-Page | Jane Smith | - | ✅ |
| with-metadata.pdf | 2 | 612×792 | Metadata Example | Bob Johnson | - | ✅ |
| with-links.pdf | 2 | 612×792 | Links Demo | Alice Brown | - | ✅ |
| encrypted.pdf | 4 | 612×792 | Secure Document | Security Team | 🔒 | ✅ |
```

---

## Common Patterns

### Pattern 1: Safe Resource Management

```typescript
const doc = Document.open('file.pdf');
try {
  const page = doc.loadPage(0);
  try {
    // Work with page
  } finally {
    page.drop(); // Always clean up!
  }
} finally {
  doc.close(); // Always clean up!
}
```

### Pattern 2: Processing All Pages

```typescript
const doc = Document.open('file.pdf');

for (let i = 0; i < doc.pageCount; i++) {
  const page = doc.loadPage(i);
  
  // Process page...
  
  page.drop();
}

doc.close();
```

### Pattern 3: Error Handling

```typescript
try {
  const doc = Document.open('file.pdf');
  
  if (doc.needsPassword()) {
    const success = doc.authenticate('password');
    if (!success) {
      throw new Error('Invalid password');
    }
  }
  
  // Work with document...
  
  doc.close();
} catch (error) {
  if (error instanceof NanoPDFError) {
    console.error(`PDF Error ${error.code}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Pattern 4: Rendering at Specific DPI

```typescript
// Calculate scale factor for target DPI
const targetDPI = 300;
const scale = targetDPI / 72; // 72 points per inch

const matrix = Matrix.scale(scale, scale);
const pixmap = page.toPixmap(matrix);

// Or use the convenience method
const pngData = page.toPNG(targetDPI);
```

---

## Tips and Best Practices

### Performance

1. **Always clean up resources**:
   ```typescript
   page.drop();
   doc.close();
   ```

2. **Process pages one at a time** for large documents:
   ```typescript
   // Good: Process and release
   for (let i = 0; i < doc.pageCount; i++) {
     const page = doc.loadPage(i);
     // Process...
     page.drop(); // Free memory immediately
   }
   
   // Bad: Load all pages at once
   const pages = Array.from({length: doc.pageCount}, (_, i) => doc.loadPage(i));
   // ... uses too much memory!
   ```

3. **Use appropriate resolution**:
   - Thumbnails: 36-72 DPI
   - Screen display: 96-144 DPI
   - Print quality: 300+ DPI

### Memory Management

```typescript
// Monitor memory usage
const before = process.memoryUsage().heapUsed;

// ... PDF operations ...

const after = process.memoryUsage().heapUsed;
console.log(`Memory used: ${((after - before) / 1024 / 1024).toFixed(2)} MB`);
```

### Error Handling

```typescript
// Check if file exists
if (!fs.existsSync(pdfPath)) {
  throw new Error(`File not found: ${pdfPath}`);
}

// Check if password is needed
if (doc.needsPassword()) {
  // Handle password prompt
}

// Validate page numbers
if (pageNum < 0 || pageNum >= doc.pageCount) {
  throw new Error(`Page ${pageNum} out of range`);
}
```

---

## Advanced Examples

### Custom Page Processing

```typescript
interface PageProcessor {
  process(page: Page): void;
}

class TextExtractor implements PageProcessor {
  private texts: string[] = [];
  
  process(page: Page): void {
    this.texts.push(page.extractText());
  }
  
  getAllText(): string {
    return this.texts.join('\n\n');
  }
}

function processDocument(doc: Document, processor: PageProcessor) {
  for (let i = 0; i < doc.pageCount; i++) {
    const page = doc.loadPage(i);
    processor.process(page);
    page.drop();
  }
}

// Usage
const doc = Document.open('file.pdf');
const extractor = new TextExtractor();
processDocument(doc, extractor);
console.log(extractor.getAllText());
doc.close();
```

### Parallel Processing (with Worker Threads)

```typescript
import { Worker } from 'worker_threads';

function processPageInWorker(pdfPath: string, pageNum: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./page-worker.js', {
      workerData: { pdfPath, pageNum }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// Process all pages in parallel
const doc = Document.open('file.pdf');
const promises = Array.from({length: doc.pageCount}, (_, i) =>
  processPageInWorker('file.pdf', i)
);

const results = await Promise.all(promises);
console.log('All pages processed:', results.length);
```

---

## Troubleshooting

### Example Doesn't Run

**Error**: `Cannot find module 'nanopdf'`

**Solution**:
```bash
cd nanopdf-js
pnpm install
pnpm run build
```

### Test PDFs Not Found

**Error**: `ENOENT: no such file or directory`

**Solution**:
```bash
# Install Git LFS
git lfs install

# Pull LFS files
git lfs pull

# Or manually download test PDFs
cd test-pdfs
# ... download files ...
```

### Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm exec ts-node examples/04-batch-processing.ts

# Or process fewer files at once
```

---

## Contributing

Have a useful example? Please contribute!

1. Create a new example file: `05-your-example.ts`
2. Follow the existing format
3. Include JSDoc comments
4. Add entry to this README
5. Submit a pull request

---

## Additional Resources

- [Main README](../README.md)
- [API Documentation](../ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [FFI Implementation Status](../FFI_IMPLEMENTATION_STATUS.md)

---

<div align="center">

**Happy Coding! 🚀**

</div>

