# NanoPDF Python Bindings

High-performance PDF manipulation library for Python with native Rust FFI bindings.

## Features

- 🚀 **Fast** - Powered by Rust and MuPDF
- 🐍 **Pythonic** - Clean, idiomatic Python API
- 🔧 **Easy to Use** - Simple API for common tasks
- 🎯 **Type-Safe** - Full type hints with mypy support
- 📦 **Zero Dependencies** - Only requires cffi
- 🔒 **Memory Safe** - Automatic resource management

## Installation

### From Source

```bash
# Build the Rust library first
cd ../nanopdf-rs
cargo build --release

# Install Python package
cd ../nanopdf-py
pip install -e .
```

### Requirements

- Python 3.8+
- cffi >= 1.16.0
- Compiled nanopdf-rs library

## Quick Start

### Easy API (Recommended for Beginners)

```python
from nanopdf import EasyPDF

# Extract text from all pages
text = EasyPDF.extract_text('document.pdf')
print(text)

# Extract text from specific page
text = EasyPDF.extract_text('document.pdf', page=0)

# Render page to PNG
EasyPDF.render_to_png('document.pdf', 'output.png', page=0, dpi=300)

# Get document info
info = EasyPDF.get_info('document.pdf')
print(f"Pages: {info.page_count}")
print(f"Title: {info.title}")
print(f"Author: {info.author}")
```

### Fluent API with Context Manager

```python
from nanopdf import EasyPDF

with EasyPDF.open('document.pdf') as pdf:
    # Get info
    print(f"Pages: {pdf.page_count()}")
    print(f"Metadata: {pdf.get_metadata()}")

    # Extract text from all pages
    all_text = pdf.extract_all_text()

    # Extract text from specific page
    page_text = pdf.extract_page_text(0)

    # Search across all pages
    results = pdf.search_all('keyword')
    for result in results:
        print(f"Found on page {result['page_num']}: {result['bbox']}")

    # Render pages
    pdf.render_page(0, 'page0.png', dpi=300)

    # Render all pages
    paths = pdf.render_all_pages('output_dir', dpi=150)
    print(f"Generated {len(paths)} images")
```

### Low-Level API (Advanced)

```python
from nanopdf import Context, Document, Pixmap, Colorspace, Matrix

# Create context
with Context() as ctx:
    # Open document
    with Document.open(ctx, 'document.pdf') as doc:
        print(f"Pages: {doc.page_count()}")
        print(f"Title: {doc.get_metadata('Title')}")

        # Load page
        with doc.load_page(0) as page:
            # Get page bounds
            bounds = page.bounds()
            print(f"Size: {bounds.width()} x {bounds.height()}")

            # Extract text
            text = page.extract_text()
            print(text[:100])

            # Render to pixmap
            matrix = Matrix.scale(2.0, 2.0)  # 2x scale = 144 DPI
            colorspace = Colorspace.device_rgb(ctx)

            with Pixmap.from_page(ctx, page, matrix, colorspace) as pix:
                print(f"Image: {pix.width()}x{pix.height()}")
                pix.save_png('output.png')
```

## API Reference

### Easy API

#### Static Methods

```python
# One-liner operations
text = EasyPDF.extract_text('file.pdf')
text = EasyPDF.extract_text('file.pdf', page=0)
EasyPDF.render_to_png('in.pdf', 'out.png', page=0, dpi=300)
count = EasyPDF.get_page_count('file.pdf')
info = EasyPDF.get_info('file.pdf')
```

#### Instance Methods

```python
with EasyPDF.open('file.pdf') as pdf:
    # Document info
    pages = pdf.page_count()
    encrypted = pdf.is_encrypted()
    metadata = pdf.get_metadata()
    info = pdf.get_info()

    # Text extraction
    all_text = pdf.extract_all_text()
    page_text = pdf.extract_page_text(0)

    # Search
    results = pdf.search_all('keyword')

    # Rendering
    pdf.render_page(0, 'page.png', dpi=300)
    paths = pdf.render_all_pages('output_dir', dpi=150)

    # Page info
    bounds = pdf.get_page_bounds(0)
```

### Core Classes

#### Context

```python
ctx = Context()  # Default 256 MB cache
ctx = Context(max_store=512 * 1024 * 1024)  # 512 MB

with Context() as ctx:
    # ... operations ...
    pass  # Auto-cleanup
```

#### Document

```python
# Open from file
doc = Document.open(ctx, 'file.pdf')

# Open from bytes
with open('file.pdf', 'rb') as f:
    data = f.read()
doc = Document.from_bytes(ctx, data)

# Operations
page_count = doc.page_count()
is_encrypted = doc.needs_password()
success = doc.authenticate('password')
title = doc.get_metadata('Title')
page = doc.load_page(0)
doc.save('output.pdf')
```

#### Page

```python
page = doc.load_page(0)

# Get bounds
bounds = page.bounds()  # Returns Rect

# Extract text
text = page.extract_text()

# Search
quads = page.search_text('keyword', max_hits=512)
```

#### Pixmap

```python
# Create pixmap
colorspace = Colorspace.device_rgb(ctx)
pix = Pixmap.create(ctx, colorspace, 100, 100, alpha=False)

# Render from page
matrix = Matrix.scale(2.0, 2.0)
pix = Pixmap.from_page(ctx, page, matrix, colorspace)

# Operations
width = pix.width()
height = pix.height()
components = pix.components()
raw_data = pix.samples()
png_data = pix.to_png()
pix.save_png('output.png')
```

### Geometry

```python
from nanopdf.geometry import Point, Rect, Matrix, Quad

# Point
p = Point(10, 20)
distance = p.distance(other_point)
p2 = p.transform(matrix)

# Rect
r = Rect(0, 0, 612, 792)  # US Letter size
width = r.width()
height = r.height()
area = r.area()
contains = r.contains(point)
intersection = r1.intersect(r2)
union = r1.union(r2)

# Matrix
m = Matrix.identity()
m = Matrix.scale(2.0, 2.0)
m = Matrix.translate(10, 20)
m = Matrix.rotate(90)
m3 = m1.concat(m2)
m3 = m1 @ m2  # Matrix multiplication

# Quad (for rotated text bounding boxes)
q = Quad.from_rect(rect)
r = q.to_rect()
```

### Colorspace

```python
gray = Colorspace.device_gray(ctx)
rgb = Colorspace.device_rgb(ctx)
bgr = Colorspace.device_bgr(ctx)
cmyk = Colorspace.device_cmyk(ctx)

n = colorspace.components()  # 1, 3, or 4
name = colorspace.name()  # "DeviceRGB", etc.
```

## Examples

### Extract Text from All Pages

```python
from nanopdf import EasyPDF

text = EasyPDF.extract_text('document.pdf')
print(text)
```

### Render All Pages to PNG

```python
from nanopdf import EasyPDF

with EasyPDF.open('document.pdf') as pdf:
    paths = pdf.render_all_pages(
        output_dir='pages',
        prefix='page',
        dpi=300
    )
    print(f"Generated {len(paths)} images")
```

### Search and Highlight

```python
from nanopdf import EasyPDF

with EasyPDF.open('document.pdf') as pdf:
    results = pdf.search_all('Python')

    for result in results:
        page_num = result['page_num']
        bbox = result['bbox']
        print(f"Found 'Python' on page {page_num} at {bbox}")
```

### Password-Protected PDFs

```python
from nanopdf import EasyPDF

with EasyPDF.open_with_password('secret.pdf', 'password') as pdf:
    text = pdf.extract_all_text()
    print(text)
```

### Custom DPI Rendering

```python
from nanopdf import Context, Document, Matrix, Pixmap, Colorspace

with Context() as ctx:
    with Document.open(ctx, 'document.pdf') as doc:
        with doc.load_page(0) as page:
            # 300 DPI = 300/72 scale factor
            dpi = 300
            scale = dpi / 72.0
            matrix = Matrix.scale(scale, scale)
            colorspace = Colorspace.device_rgb(ctx)

            with Pixmap.from_page(ctx, page, matrix, colorspace) as pix:
                pix.save_png('high_res.png')
```

## Development

### Setup Development Environment

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=nanopdf --cov-report=html

# Type checking
mypy src/nanopdf

# Linting
ruff check src/nanopdf

# Formatting
black src/nanopdf tests
```

### Building Documentation

```bash
cd docs
make html
open _build/html/index.html
```

## Architecture

- **FFI Layer** (`ffi.py`): Low-level cffi bindings to Rust library
- **Core Classes**: Pythonic wrappers around FFI handles
- **Easy API** (`easy.py`): High-level, simplified interface
- **Automatic Cleanup**: Context managers for resource management

## Performance

NanoPDF Python bindings provide near-native performance by:

1. Using cffi for efficient C interop
2. Minimizing Python/Rust boundary crossings
3. Leveraging Rust's zero-cost abstractions
4. Direct memory access for pixel data

## Comparison with Other Libraries

| Feature | NanoPDF | PyMuPDF | pdfplumber | PyPDF2 |
|---------|---------|---------|------------|--------|
| Speed | ⚡⚡⚡ | ⚡⚡⚡ | ⚡ | ⚡ |
| Memory | ✅ Low | ✅ Low | ⚠️ High | ⚠️ High |
| Type Hints | ✅ Full | ⚠️ Partial | ✅ Full | ⚠️ Partial |
| Easy API | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Rendering | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

## License

Apache 2.0

## Links

- **Documentation**: https://lexmata.github.io/nanopdf/api/python/
- **Repository**: https://github.com/lexmata/nanopdf
- **Issues**: https://github.com/lexmata/nanopdf/issues
- **Rust Core**: https://docs.rs/nanopdf
- **Node.js**: https://lexmata.github.io/nanopdf/api/nodejs/
- **Go**: https://pkg.go.dev/github.com/lexmata/nanopdf/go-nanopdf

