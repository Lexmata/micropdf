# MicroPDF Test Files

This directory contains PDF files of varying complexity for integration testing across all MicroPDF projects (Rust, Node.js, Go).

All PDF files are tracked with **Git LFS** (Large File Storage) to keep the repository size manageable.

---

## Directory Structure

```
test-pdfs/
├── minimal/         # Minimal PDFs (< 1 KB)
├── simple/          # Simple PDFs with basic content (< 10 KB)
├── medium/          # Medium complexity (10-100 KB)
├── complex/         # Complex PDFs with advanced features (100 KB - 1 MB)
└── large/           # Large PDFs for stress testing (> 1 MB)
```

---

## Test Files

### Minimal (< 1 KB)

Minimal valid PDF structures for basic parsing tests.

#### `minimal/empty.pdf`
- **Size**: ~200 bytes
- **Features**:
  - Minimal valid PDF 1.4
  - Single empty page
  - No content
  - No resources
- **Use Cases**:
  - Basic PDF parsing
  - Page count validation
  - Minimal structure testing
  - Error handling (empty content)

#### `minimal/corrupted.pdf`
- **Size**: ~230 bytes
- **Features**:
  - Intentionally malformed PDF structure
  - Incomplete object definitions
  - Missing xref table
  - Invalid object references (999 0 R)
  - Truncated content
- **Use Cases**:
  - Error handling testing
  - Robust parser validation
  - Graceful degradation
  - Recovery from corrupt data
  - Error message generation

---

### Simple (< 10 KB)

Simple PDFs with basic text content.

#### `simple/hello-world.pdf`
- **Size**: ~430 bytes
- **Features**:
  - Single page with text
  - Basic font (Helvetica)
  - Simple text rendering
  - Standard page size (Letter: 612x792 pt)
- **Use Cases**:
  - Text extraction
  - Font handling
  - Basic rendering
  - Page bounds validation

#### `simple/multi-page.pdf`
- **Size**: ~850 bytes
- **Features**:
  - 3 pages
  - Text on each page
  - Page navigation
  - Consistent formatting
- **Use Cases**:
  - Multi-page document handling
  - Page iteration
  - Page-specific operations
  - Text extraction across pages

---

### Medium (10-100 KB)

PDFs with metadata, links, and more advanced features.

#### `medium/with-metadata.pdf`
- **Size**: ~920 bytes
- **Features**:
  - Document metadata (Title, Author, Subject, Keywords)
  - Creation date
  - Multiple fonts (Helvetica, Helvetica-Bold)
  - Outlines/Bookmarks structure
  - PageMode setting
- **Use Cases**:
  - Metadata extraction
  - Author/Title/Subject retrieval
  - Creation date parsing
  - Outline/bookmark handling
  - Font enumeration

#### `medium/with-links.pdf`
- **Size**: ~920 bytes
- **Features**:
  - 2 pages with navigation
  - Internal link annotation
  - Link from page 1 to page 2
  - Named destinations
  - Border styling
- **Use Cases**:
  - Link extraction
  - Annotation parsing
  - Internal navigation
  - Destination resolution
  - Interactive element handling

#### `medium/with-outline.pdf`
- **Size**: ~1.1 KB
- **Features**:
  - 3 pages with content
  - Document outline (bookmarks)
  - Hierarchical bookmark structure
  - Two top-level outline entries
  - Destination links to pages
  - Chapter organization
- **Use Cases**:
  - Outline/bookmark extraction
  - Table of contents handling
  - Navigation tree parsing
  - Hierarchical structure traversal
  - Destination resolution from bookmarks

#### `medium/with-attachments.pdf`
- **Size**: ~720 bytes
- **Features**:
  - PDF 1.7 with embedded files
  - File attachment (data.txt)
  - EmbeddedFiles name tree
  - File specification dictionary
  - Embedded file stream
  - MIME type specification
- **Use Cases**:
  - File attachment extraction
  - Embedded file handling
  - Name tree traversal
  - File specification parsing
  - Attachment metadata access

---

### Complex (100 KB - 1 MB)

Advanced PDFs with forms, annotations, and complex structures.

#### `complex/with-forms.pdf`
- **Size**: ~1 KB
- **Features**:
  - AcroForm fields
  - Text input fields (name, email)
  - Checkbox (subscribe)
  - Form widget annotations
  - Field dictionaries
- **Use Cases**:
  - Form field extraction
  - Widget annotation handling
  - Form data retrieval
  - Interactive form testing
  - Field type identification

#### `complex/with-images.pdf`
- **Size**: ~1.2 KB
- **Features**:
  - Embedded JPEG and grayscale images
  - Image XObjects with DCT (JPEG) compression
  - 32x32 color image (RGB) and 16x16 grayscale image
  - Image placement with transformation matrices
  - Resource dictionary with multiple images
- **Use Cases**:
  - Image extraction from PDFs
  - DCT/JPEG image decoding
  - Multiple image format handling
  - Image XObject parsing
  - Color space handling (RGB, Grayscale)

#### `complex/with-annotations.pdf`
- **Size**: ~1 KB
- **Features**:
  - Text highlight annotation (yellow highlight)
  - Square and circle shape annotations
  - Text/sticky note annotation (comment)
  - Annotation properties (color, border, author, timestamp)
  - Multiple annotation types on single page
- **Use Cases**:
  - Annotation extraction
  - Markup annotation handling
  - Shape annotation parsing
  - Comment/note annotation support
  - Annotation property access

#### `complex/encrypted.pdf`
- **Size**: ~650 bytes
- **Features**:
  - Standard PDF encryption (V2, R3, 128-bit)
  - Password protection (password: test123)
  - Owner and user passwords
  - Permission flags
  - Encrypted content
- **Use Cases**:
  - Password authentication testing
  - Encryption handling
  - Permission checking
  - Secured PDF access
  - Decryption workflows

#### `complex/linearized.pdf`
- **Size**: ~570 bytes
- **Features**:
  - Linearized PDF structure (web-optimized)
  - Hint streams for fast web viewing
  - Page-at-a-time access
  - Optimized object ordering
  - Fast first page display
- **Use Cases**:
  - Linearization detection
  - Web-optimized PDF handling
  - Incremental loading testing
  - Fast display optimization
  - Streaming PDF support

---

### Large (> 1 MB)

Large PDFs for performance and stress testing.

#### `large/multi-page-100.pdf`
- **Size**: ~25 KB
- **Features**:
  - Exactly 100 pages
  - Page numbering on each page
  - Large page tree structure
  - Extensive cross-reference table
  - Sequential page access
- **Use Cases**:
  - Multi-page performance testing
  - Page iteration benchmarks
  - Memory management with many pages
  - Large xref table handling
  - Page tree traversal optimization

#### `large/high-resolution-images.pdf`
- **Size**: ~1.2 KB
- **Features**:
  - High-resolution image specification (1920x1080)
  - JPEG/DCT compressed image
  - Large image dimensions
  - DeviceRGB color space
  - 8-bit color depth
- **Use Cases**:
  - High-resolution image handling
  - Large image memory management
  - Image rendering performance
  - JPEG decompression testing
  - High-DPI image support

---

## Git LFS Configuration

All PDF files in this directory are tracked using Git LFS.

### Setup

If you haven't set up Git LFS yet:

```bash
# Install Git LFS (if not already installed)
# macOS
brew install git-lfs

# Ubuntu/Debian
sudo apt-get install git-lfs

# Initialize Git LFS
git lfs install

# Track PDF files
git lfs track "*.pdf"
```

### Verification

Check if PDF files are tracked by LFS:

```bash
# Show LFS-tracked files
git lfs ls-files

# Show LFS status
git lfs status

# Show LFS storage info
git lfs env
```

### Cloning

When cloning the repository, Git LFS will automatically download the PDF files:

```bash
git clone https://github.com/your-org/micropdf.git
cd micropdf/test-pdfs
ls -lh  # PDF files should be fully downloaded
```

If LFS files weren't downloaded:

```bash
git lfs pull
```

---

## Usage in Tests

### Rust (micropdf-rs)

```rust
use std::fs;
use micropdf::Document;

#[test]
fn test_hello_world_pdf() {
    let bytes = fs::read("test-pdfs/simple/hello-world.pdf").unwrap();
    let doc = Document::from_bytes(&bytes).unwrap();

    assert_eq!(doc.page_count(), 1);

    let page = doc.load_page(0).unwrap();
    let text = page.extract_text().unwrap();
    assert!(text.contains("Hello, World!"));
}
```

### Node.js (micropdf-js)

```javascript
import { Document } from 'micropdf';
import { readFileSync } from 'fs';

describe('Hello World PDF', () => {
  it('should extract text', async () => {
    const buffer = readFileSync('test-pdfs/simple/hello-world.pdf');
    const doc = Document.fromBuffer(buffer);

    expect(doc.pageCount).toBe(1);

    const page = doc.loadPage(0);
    const text = page.extractText();
    expect(text).toContain('Hello, World!');
  });
});
```

### Go (go-micropdf)

```go
package micropdf_test

import (
    "os"
    "testing"
    "github.com/lexmata/micropdf/go-micropdf"
)

func TestHelloWorldPDF(t *testing.T) {
    data, err := os.ReadFile("test-pdfs/simple/hello-world.pdf")
    if err != nil {
        t.Fatal(err)
    }

    ctx := micropdf.NewContext()
    defer ctx.Drop()

    doc, err := micropdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
    if err != nil {
        t.Fatal(err)
    }
    defer doc.Drop()

    count, _ := doc.PageCount()
    if count != 1 {
        t.Errorf("Expected 1 page, got %d", count)
    }
}
```

---

## Creating New Test Files

### Manual Creation

You can create PDFs manually and add them to the appropriate directory:

```bash
# Add your PDF
cp my-test.pdf test-pdfs/complex/

# Stage and commit (LFS will handle it)
git add test-pdfs/complex/my-test.pdf
git commit -m "test: add my-test.pdf for complex scenario"
```

### Programmatic Creation

Use PDF libraries to generate test files:

**Python (ReportLab):**

```python
from reportlab.pdfgen import canvas

c = canvas.Canvas("test-pdfs/simple/generated.pdf")
c.drawString(100, 750, "Generated PDF")
c.save()
```

**Node.js (PDFKit):**

```javascript
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-pdfs/simple/generated.pdf'));
doc.text('Generated PDF', 100, 100);
doc.end();
```

---

## Test Coverage Matrix

| Feature | Minimal | Simple | Medium | Complex | Large |
|---------|---------|--------|--------|---------|-------|
| **Parsing** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Page Count** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Text Extraction** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Multi-Page** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Metadata** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Links** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Outlines** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Forms** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Images** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Annotations** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Attachments** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Encryption** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Linearization** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Error Handling** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Performance** | ❌ | ❌ | ❌ | ❌ | ✅ |

✅ = Covered | ❌ = Not applicable

---

## Best Practices

1. **Name files descriptively** - Use clear names that indicate the test purpose
2. **Keep files small** - Only include features being tested
3. **Document test cases** - Update this README when adding new files
4. **Version PDF format** - Specify PDF version in filename if relevant (e.g., `pdf1.7-feature.pdf`)
5. **Test across projects** - Ensure files work in Rust, Node.js, and Go tests
6. **Avoid copyrighted content** - Only use generated or public domain content
7. **Track with LFS** - All PDFs should be in Git LFS, not directly in Git

---

## File Summary

All core test files are implemented and tracked with Git LFS:

**Minimal** (2 files):
- `empty.pdf` - Minimal valid PDF structure
- `corrupted.pdf` - Intentionally malformed for error handling

**Simple** (2 files):
- `hello-world.pdf` - Single page with text
- `multi-page.pdf` - 3 pages with content

**Medium** (4 files):
- `with-metadata.pdf` - Document metadata and properties
- `with-links.pdf` - Internal navigation links
- `with-outline.pdf` - Document outline/bookmarks
- `with-attachments.pdf` - File attachments/embedded files

**Complex** (5 files):
- `with-forms.pdf` - AcroForm fields and widgets
- `with-images.pdf` - Embedded JPEG/PNG images
- `with-annotations.pdf` - Text markup and shape annotations
- `encrypted.pdf` - Password-protected PDF
- `linearized.pdf` - Web-optimized PDF

**Large** (2 files):
- `multi-page-100.pdf` - 100+ pages for performance testing
- `high-resolution-images.pdf` - Large embedded images

**Total**: 15 test PDF files covering all core PDF features

---

## Contributing

When adding new test PDFs:

1. Choose the appropriate complexity directory
2. Create/add the PDF file
3. Update this README with file details
4. Add test cases in relevant projects
5. Commit with Git LFS

```bash
# Add and commit
git add test-pdfs/medium/my-test.pdf
git commit -m "test: add my-test.pdf for XYZ feature testing"

# Verify LFS tracking
git lfs ls-files | grep my-test.pdf
```

---

## File Size Guidelines

| Category | Size Range | Purpose |
|----------|------------|---------|
| Minimal | < 1 KB | Basic structure validation |
| Simple | < 10 KB | Basic feature testing |
| Medium | 10-100 KB | Moderate complexity testing |
| Complex | 100 KB - 1 MB | Advanced feature testing |
| Large | > 1 MB | Performance and stress testing |

---

For more information on MicroPDF testing, see the main [README.md](../README.md).

