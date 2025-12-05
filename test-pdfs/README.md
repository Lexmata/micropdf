# NanoPDF Test Files

This directory contains PDF files of varying complexity for integration testing across all NanoPDF projects (Rust, Node.js, Go).

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

#### `complex/with-images.pdf` (TODO)
- **Size**: TBD
- **Features**:
  - Embedded images (JPEG, PNG)
  - Image XObjects
  - Image compression
  - Color spaces
  - Image masks
- **Use Cases**:
  - Image extraction
  - Image decoding
  - Compression handling
  - Color space conversion
  - Resource management

#### `complex/with-annotations.pdf` (TODO)
- **Size**: TBD
- **Features**:
  - Text annotations (comments)
  - Highlight annotations
  - Underline/strikeout
  - Shape annotations (rectangles, circles)
  - Popup annotations
- **Use Cases**:
  - Annotation extraction
  - Markup handling
  - Comment threading
  - Appearance streams
  - Annotation types

---

### Large (> 1 MB)

Large PDFs for performance and stress testing.

#### `large/multi-page-100.pdf` (TODO)
- **Size**: TBD
- **Features**:
  - 100+ pages
  - Mixed content (text, images, forms)
  - Large page tree
  - Cross-references
- **Use Cases**:
  - Performance testing
  - Memory management
  - Large file handling
  - Incremental loading
  - Page tree traversal

#### `large/high-resolution-images.pdf` (TODO)
- **Size**: TBD
- **Features**:
  - High-resolution images
  - Multiple image formats
  - Large embedded resources
  - Compression optimization
- **Use Cases**:
  - Large resource handling
  - Memory stress testing
  - Image processing performance
  - Compression benchmarking

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
git clone https://github.com/your-org/nanopdf.git
cd nanopdf/test-pdfs
ls -lh  # PDF files should be fully downloaded
```

If LFS files weren't downloaded:

```bash
git lfs pull
```

---

## Usage in Tests

### Rust (nanopdf-rs)

```rust
use std::fs;
use nanopdf::Document;

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

### Node.js (nanopdf-js)

```javascript
import { Document } from 'nanopdf';
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

### Go (go-nanopdf)

```go
package nanopdf_test

import (
    "os"
    "testing"
    "github.com/lexmata/nanopdf/go-nanopdf"
)

func TestHelloWorldPDF(t *testing.T) {
    data, err := os.ReadFile("test-pdfs/simple/hello-world.pdf")
    if err != nil {
        t.Fatal(err)
    }

    ctx := nanopdf.NewContext()
    defer ctx.Drop()

    doc, err := nanopdf.OpenDocumentFromBytes(ctx, data, "application/pdf")
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
| **Forms** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Images** | ❌ | ❌ | ❌ | 🚧 | 🚧 |
| **Annotations** | ❌ | ❌ | ❌ | 🚧 | ✅ |
| **Performance** | ❌ | ❌ | ❌ | ❌ | 🚧 |

✅ = Covered | ❌ = Not applicable | 🚧 = Planned

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

## TODO

- [ ] Add `complex/with-images.pdf` (embedded images)
- [ ] Add `complex/with-annotations.pdf` (markup annotations)
- [ ] Add `complex/encrypted.pdf` (password-protected)
- [ ] Add `large/multi-page-100.pdf` (100+ pages)
- [ ] Add `large/high-resolution-images.pdf` (large embedded images)
- [ ] Add `minimal/corrupted.pdf` (intentionally malformed for error handling)
- [ ] Add `medium/with-outline.pdf` (document outline/bookmarks)
- [ ] Add `medium/with-attachments.pdf` (file attachments)
- [ ] Add `complex/linearized.pdf` (web-optimized PDF)
- [ ] Add `complex/pdf2.0.pdf` (PDF 2.0 features)

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

For more information on NanoPDF testing, see the main [README.md](../README.md).

