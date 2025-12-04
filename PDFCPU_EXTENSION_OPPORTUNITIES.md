# pdfcpu Extension Opportunities for NanoPDF

## Executive Summary

**Date**: December 4, 2025
**pdfcpu Version**: Latest (v0.8+)
**NanoPDF Version**: 0.1.0
**Purpose**: Identify unique pdfcpu features not in pypdf/MuPDF/FPDF for potential NanoPDF extensions

This document identifies features present in the **pdfcpu** Go library that are **not available** (or not well-implemented) in pypdf, MuPDF, or FPDF. pdfcpu brings unique value through:
- **Professional Print Production**: Advanced page boxes, imposition, booklet creation
- **Page Layout Tools**: N-Up, Grid, Poster, Booklet layouts
- **Robust Validation**: Industry-grade PDF/A validation and repair
- **Form Processing**: CSV/JSON form data import/export
- **Advanced Stamping**: Multi-page stamps, dynamic positioning

---

## Priority Matrix

| Priority | Category | Unique Value | Implementation Difficulty |
|----------|----------|--------------|--------------------------|
| 🔥 **CRITICAL** | Page Box Management | Professional print prep | Medium |
| 🔥 **CRITICAL** | N-Up & Grid Layouts | Essential for imposition | Medium-High |
| 🔥 **CRITICAL** | PDF Validation & Repair | Production reliability | High |
| ⭐ **HIGH** | Booklet Creation | Print shop essential | Medium-High |
| ⭐ **HIGH** | Poster/Tiling | Large format printing | Medium |
| ⭐ **HIGH** | Form CSV/JSON Export | Data integration | Low-Medium |
| 📊 **MEDIUM** | Page Resize & Scaling | Layout flexibility | Medium |
| 📊 **MEDIUM** | Multi-page Stamps | Complex watermarking | Medium |
| 📊 **MEDIUM** | Collection/Portfolio | Multi-file PDFs | Medium |
| 💡 **LOW** | Advanced Annotations | Enhancement over basic | Medium |

---

## 🔥 CRITICAL PRIORITY: Print Production Features

### 1. Page Box Management (Crop/Trim/Bleed/Art/Media)

**Status**: ❌ Not in pypdf, ⚠️ Partial in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Full control over all 5 PDF page boxes
**Value**: Essential for professional print production

#### Background: PDF Page Boxes

PDFs define 5 different page boxes for print production:

1. **MediaBox**: Physical page size (paper)
2. **CropBox**: Visible page area
3. **BleedBox**: Area including bleed (for printing)
4. **TrimBox**: Final trimmed size
5. **ArtBox**: Meaningful content area

```
┌─────────────────────────────┐
│       MediaBox (Paper)      │
│  ┌────────────────────────┐ │
│  │   BleedBox (+ bleed)   │ │
│  │  ┌──────────────────┐  │ │
│  │  │  TrimBox (Cut)   │  │ │
│  │  │ ┌──────────────┐ │  │ │
│  │  │ │  ArtBox      │ │  │ │
│  │  │ │ (Content)    │ │  │ │
│  │  │ └──────────────┘ │  │ │
│  │  └──────────────────┘  │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

#### pdfcpu Commands:

```bash
# List all boxes
pdfcpu box list input.pdf

# Set specific box
pdfcpu box add -box "CropBox" "10 10 200 200" input.pdf

# Remove box
pdfcpu box remove -box "TrimBox" input.pdf

# Add bleed (expand TrimBox to create BleedBox)
pdfcpu box add -box "BleedBox" -bleed 9 input.pdf
```

**NanoPDF Extension Needed**:

```rust
// Core API
pub enum PageBox {
    Media,
    Crop,
    Bleed,
    Trim,
    Art,
}

pub struct BoxDimensions {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

// FFI Functions
np_page_box_get(page: Handle, box_type: PageBox) -> BoxDimensions
np_page_box_set(page: Handle, box_type: PageBox, dims: BoxDimensions)
np_page_box_remove(page: Handle, box_type: PageBox)
np_page_box_list(page: Handle) -> Vec<(PageBox, BoxDimensions)>
np_page_box_add_bleed(page: Handle, bleed: f32)  // Expand TrimBox
```

**Use Cases**:
- ✅ Print shop PDF preparation
- ✅ Adding bleeds for commercial printing
- ✅ Setting crop areas for viewing
- ✅ Defining trim lines for cutting
- ✅ Marking meaningful content regions

---

### 2. N-Up & Grid Page Layouts

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Professional page imposition with grids
**Value**: Critical for booklet printing, handouts, proofing

#### N-Up Layout

Arrange multiple pages on a single sheet:

```bash
# 2-up layout (2 pages per sheet)
pdfcpu nup input.pdf 2 output.pdf

# 4-up layout with custom margins
pdfcpu nup -m 10 input.pdf 4 output.pdf

# 6-up with specific grid (2 columns × 3 rows)
pdfcpu nup -g "2x3" input.pdf output.pdf
```

**Layout Examples**:
```
┌────────────────────────┐  ┌────────────────────────┐
│  2-Up (1×2)            │  │  4-Up (2×2)            │
│  ┌─────┐  ┌─────┐     │  │  ┌────┐  ┌────┐       │
│  │ P1  │  │ P2  │     │  │  │ P1 │  │ P2 │       │
│  └─────┘  └─────┘     │  │  └────┘  └────┘       │
│                        │  │  ┌────┐  ┌────┐       │
└────────────────────────┘  │  │ P3 │  │ P4 │       │
                            │  └────┘  └────┘       │
┌────────────────────────┐  └────────────────────────┘
│  6-Up (2×3)            │
│  ┌───┐  ┌───┐         │  ┌────────────────────────┐
│  │P1 │  │P2 │         │  │  9-Up (3×3)            │
│  └───┘  └───┘         │  │  ┌──┐  ┌──┐  ┌──┐    │
│  ┌───┐  ┌───┐         │  │  │P1│  │P2│  │P3│    │
│  │P3 │  │P4 │         │  │  └──┘  └──┘  └──┘    │
│  └───┘  └───┘         │  │  ┌──┐  ┌──┐  ┌──┐    │
│  ┌───┐  ┌───┐         │  │  │P4│  │P5│  │P6│    │
│  │P5 │  │P6 │         │  │  └──┘  └──┘  └──┘    │
│  └───┘  └───┘         │  │  ┌──┐  ┌──┐  ┌──┐    │
└────────────────────────┘  │  │P7│  │P8│  │P9│    │
                            │  └──┘  └──┘  └──┘    │
                            └────────────────────────┘
```

**Features**:
- Custom grid dimensions (MxN)
- Page ordering (left-to-right, right-to-left)
- Borders around each page
- Margins and spacing
- Page rotation options
- Different page sizes in grid

#### Grid Layout

More flexible than N-Up, allows arbitrary positioning:

```bash
# Create custom grid
pdfcpu grid -dimensions "[2 2]" -grid "2x2" input.pdf output.pdf
```

**NanoPDF Extension Needed**:

```rust
pub struct NUpOptions {
    pub grid: (u32, u32),        // (columns, rows)
    pub page_size: PageSize,      // Output page size
    pub margins: Margins,         // Outer margins
    pub spacing: f32,             // Space between pages
    pub border: Option<Border>,   // Border around each page
    pub order: PageOrder,         // LTR, RTL, TTB, BTT
}

pub enum PageOrder {
    LeftToRightTopToBottom,
    RightToLeftTopToBottom,
    TopToBottomLeftToRight,
    DownAndOver,
}

// FFI Functions
np_nup_create(doc: Handle, nup: u32, options: NUpOptions) -> Handle
np_grid_create(doc: Handle, grid: (u32, u32), options: GridOptions) -> Handle
np_nup_with_booklet_order(doc: Handle, options: NUpOptions) -> Handle
```

**Use Cases**:
- ✅ Create handouts (4-up, 6-up, 9-up)
- ✅ Print multiple pages per sheet to save paper
- ✅ Create proof sheets
- ✅ Generate contact sheets from images
- ✅ Booklet imposition

---

### 3. PDF Validation & Repair

**Status**: ⚠️ Basic in MuPDF, ❌ Not comprehensive in pypdf/FPDF
**pdfcpu Feature**: Industry-grade validation and automatic repair
**Value**: Production reliability, PDF/A compliance

#### Validation Capabilities:

```bash
# Standard validation
pdfcpu validate input.pdf

# Strict validation
pdfcpu validate -mode strict input.pdf

# Detailed validation report
pdfcpu validate -verbose input.pdf
```

**Validation Checks**:
- ✅ PDF structure integrity
- ✅ Cross-reference table validity
- ✅ Object stream consistency
- ✅ Encryption correctness
- ✅ Font embedding completeness
- ✅ Image format validity
- ✅ Annotation structure
- ✅ Form field integrity
- ✅ Bookmark tree validity
- ✅ Metadata consistency
- ✅ PDF version compliance
- ✅ Linearization correctness

#### Repair Capabilities:

```bash
# Repair corrupted PDF
pdfcpu validate -repair input.pdf output.pdf
```

**Auto-Repair Features**:
- ✅ Rebuild cross-reference table
- ✅ Fix broken object references
- ✅ Repair invalid stream lengths
- ✅ Correct page tree structure
- ✅ Fix malformed dictionaries
- ✅ Repair broken encryption
- ✅ Reconstruct missing trailer
- ✅ Fix invalid PDF header

**NanoPDF Extension Needed**:

```rust
pub enum ValidationMode {
    Relaxed,    // Allow common violations
    Standard,   // ISO 32000-1 compliance
    Strict,     // Strict interpretation
    PdfA,       // PDF/A validation
}

pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
    pub info: ValidationInfo,
}

pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub location: String,  // Object reference
    pub severity: Severity,
}

pub struct RepairOptions {
    pub auto_fix_xref: bool,
    pub rebuild_structure: bool,
    pub fix_streams: bool,
    pub remove_invalid_objects: bool,
}

// FFI Functions
np_validate_pdf(doc: Handle, mode: ValidationMode) -> ValidationResult
np_repair_pdf(doc: Handle, options: RepairOptions) -> Result<Handle>
np_validate_pdf_a(doc: Handle, level: PdfALevel) -> ValidationResult
np_check_structure(doc: Handle) -> StructureReport
```

**Use Cases**:
- ✅ Pre-press validation before printing
- ✅ Quality assurance in PDF workflows
- ✅ Recover damaged PDF files
- ✅ PDF/A compliance checking
- ✅ Automated PDF health monitoring

---

## ⭐ HIGH PRIORITY: Layout & Production

### 4. Booklet Creation

**Status**: ❌ Not in pypdf, ❌ Not in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Professional booklet imposition
**Value**: Essential for print shops, self-publishing

#### Booklet Imposition

Rearrange pages for saddle-stitch or perfect binding:

```bash
# Create booklet (saddle-stitch)
pdfcpu booklet input.pdf output.pdf

# Booklet with specific page size
pdfcpu booklet -format A4 input.pdf output.pdf

# Booklet with margins for binding
pdfcpu booklet -margin 20 input.pdf output.pdf
```

**Page Ordering Example** (8 pages → 2 sheets):
```
Sheet 1 Front:  [Page 8] [Page 1]
Sheet 1 Back:   [Page 2] [Page 7]
Sheet 2 Front:  [Page 6] [Page 3]
Sheet 2 Back:   [Page 4] [Page 5]

Folded and stacked: Pages 1-8 in order
```

**Features**:
- Automatic page reordering
- Blank page insertion (for multiple of 4)
- Margin adjustment for binding
- Double-sided printing setup
- Multiple binding styles (saddle-stitch, perfect bind)

#### Booklet Types:

1. **Saddle-Stitch Booklet**: Folded and stapled at center
2. **Perfect Bound Booklet**: Glued spine
3. **Spiral Bound Layout**: Holes for spiral binding
4. **Signature-Based**: For traditional book printing

**NanoPDF Extension Needed**:

```rust
pub enum BookletType {
    SaddleStitch,    // Fold and staple
    PerfectBound,    // Glued spine
    SpiralBound,     // Holes for spiral
    Signature(u32),  // Pages per signature
}

pub struct BookletOptions {
    pub binding_type: BookletType,
    pub page_size: PageSize,
    pub margin: f32,              // Binding margin
    pub gutter: f32,              // Extra inner margin
    pub add_blank_pages: bool,    // Auto-add to multiple of 4
    pub double_sided: bool,
}

// FFI Functions
np_booklet_create(doc: Handle, options: BookletOptions) -> Handle
np_booklet_calculate_pages(page_count: u32, booklet_type: BookletType) -> Vec<PageLayout>
np_booklet_preview_layout(options: BookletOptions) -> PreviewData
```

**Use Cases**:
- ✅ Self-publishing books
- ✅ Magazine/newsletter production
- ✅ Print shop services
- ✅ Event programs
- ✅ Manual/documentation printing

---

### 5. Poster & Tiling

**Status**: ❌ Not in pypdf/MuPDF/FPDF
**pdfcpu Feature**: Split pages into tiles for large format printing
**Value**: Large format printing, wall posters

#### Poster/Tiling Operation:

```bash
# Create 2×2 poster (4 pages)
pdfcpu poster input.pdf 2 output.pdf

# 3×3 poster with overlap for joining
pdfcpu poster -overlap 20 input.pdf 3 output.pdf

# Custom poster dimensions
pdfcpu poster -dimensions "[2 3]" input.pdf output.pdf
```

**Tiling Example** (3×3):
```
Original Page:
┌──────────────────────┐
│                      │
│    Full Content      │
│                      │
└──────────────────────┘

After Tiling (9 pages):
┌────┬────┬────┐
│ 1  │ 2  │ 3  │  Page 1-3: Top row
├────┼────┼────┤
│ 4  │ 5  │ 6  │  Page 4-6: Middle row
├────┼────┼────┤
│ 7  │ 8  │ 9  │  Page 7-9: Bottom row
└────┴────┴────┘

Print each page on Letter/A4, then assemble
```

**Features**:
- Custom grid size (MxN)
- Overlap for alignment/gluing
- Cut marks for trimming
- Page numbers on tiles
- Assembly diagram
- Scale factor adjustment

**NanoPDF Extension Needed**:

```rust
pub struct PosterOptions {
    pub tiles: (u32, u32),        // (columns, rows)
    pub tile_size: PageSize,      // Size of each tile
    pub overlap: f32,             // Overlap in points
    pub cut_marks: bool,          // Add crop marks
    pub tile_numbers: bool,       // Number each tile
    pub assembly_guide: bool,     // Create guide page
}

// FFI Functions
np_poster_create(doc: Handle, options: PosterOptions) -> Handle
np_tile_page(page: Handle, tiles: (u32, u32), overlap: f32) -> Vec<Handle>
np_poster_add_cut_marks(page: Handle, mark_style: CutMarkStyle)
np_poster_generate_assembly_guide(poster: Handle) -> Handle
```

**Use Cases**:
- ✅ Large format posters from small printers
- ✅ Wall murals
- ✅ Engineering drawings
- ✅ Architectural plans
- ✅ Trade show displays
- ✅ Classroom posters

---

### 6. Form Data CSV/JSON Import/Export

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Batch form filling from structured data
**Value**: Data integration, mail merge for forms

#### Form Operations:

```bash
# List all form fields
pdfcpu form list input.pdf

# Fill form from JSON
pdfcpu form fill input.pdf data.json output.pdf

# Fill form from CSV (batch)
pdfcpu form fill input.pdf data.csv output_%d.pdf

# Export form data to JSON
pdfcpu form export input.pdf output.json

# Lock form after filling
pdfcpu form lock input.pdf output.pdf
```

**JSON Format**:
```json
{
  "fields": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Age": "35",
    "Subscribe": true,
    "Country": "USA"
  }
}
```

**CSV Format**:
```csv
Name,Email,Age,Subscribe,Country
John Doe,john@example.com,35,true,USA
Jane Smith,jane@example.com,28,false,Canada
```

**Features**:
- JSON import/export
- CSV batch processing
- Field validation
- Checkbox/radio button support
- Drop-down selection
- Date field formatting
- Lock forms after filling
- Flatten filled forms

**NanoPDF Extension Needed**:

```rust
pub struct FormData {
    pub fields: HashMap<String, FormValue>,
}

pub enum FormValue {
    Text(String),
    Boolean(bool),
    Number(f64),
    Date(String),
    Choice(Vec<String>),
}

// FFI Functions
np_form_fill_json(doc: Handle, json: &str) -> Result<Handle>
np_form_fill_csv_batch(template: Handle, csv: &str) -> Result<Vec<Handle>>
np_form_export_json(doc: Handle) -> String
np_form_export_csv(docs: Vec<Handle>) -> String
np_form_list_fields(doc: Handle) -> Vec<FormFieldInfo>
np_form_lock(doc: Handle) -> Handle  // Make read-only
```

**Use Cases**:
- ✅ Batch invoice generation
- ✅ Certificate generation from database
- ✅ Government form processing
- ✅ Tax form preparation
- ✅ Insurance claim forms
- ✅ Medical records forms

---

## 📊 MEDIUM PRIORITY: Layout Flexibility

### 7. Page Resize & Scaling

**Status**: ⚠️ Basic in pypdf, ⚠️ Basic in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Flexible page dimension adjustment
**Value**: Format conversion, print preparation

#### Resize Operations:

```bash
# Resize to specific dimensions
pdfcpu resize input.pdf "595 842" output.pdf  # A4

# Scale by percentage
pdfcpu resize -scale 150 input.pdf output.pdf

# Fit to page size
pdfcpu resize -format A4 -fit true input.pdf output.pdf

# Scale to fit with margins
pdfcpu resize -format Letter -margin 36 input.pdf output.pdf
```

**Resize Modes**:
- **Absolute**: Set exact dimensions
- **Scale**: Percentage scaling
- **Fit**: Fit to target size (maintain aspect)
- **Fill**: Fill target size (may crop)
- **Stretch**: Stretch to fill (distort)

**Features**:
- Preserve or scale content
- Maintain aspect ratio
- Center or position content
- Add margins/borders
- Handle different page sizes in doc

**NanoPDF Extension Needed**:

```rust
pub enum ResizeMode {
    Absolute { width: f32, height: f32 },
    Scale { factor: f32 },
    Fit { target: PageSize },
    Fill { target: PageSize },
    Stretch { target: PageSize },
}

pub struct ResizeOptions {
    pub mode: ResizeMode,
    pub preserve_aspect: bool,
    pub center_content: bool,
    pub margins: Margins,
}

// FFI Functions
np_page_resize(page: Handle, options: ResizeOptions) -> Handle
np_page_scale(page: Handle, scale: f32) -> Handle
np_page_fit_to_size(page: Handle, target: PageSize, maintain_aspect: bool) -> Handle
np_document_normalize_sizes(doc: Handle, target_size: PageSize) -> Handle
```

**Use Cases**:
- ✅ Convert between paper sizes (A4 ↔ Letter)
- ✅ Scale for different printers
- ✅ Create thumbnails
- ✅ Enlarge small documents
- ✅ Normalize mixed-size documents

---

### 8. Multi-Page Stamps & Advanced Watermarks

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF, ⚠️ Basic in FPDF
**pdfcpu Feature**: Complex stamping with multiple pages
**Value**: Professional branding, security marking

#### Advanced Stamping:

```bash
# Basic stamp
pdfcpu stamp add "CONFIDENTIAL" input.pdf output.pdf

# Image stamp
pdfcpu stamp add -image logo.png input.pdf output.pdf

# Multi-page stamp (different stamp per page)
pdfcpu stamp add -pdf stamps.pdf input.pdf output.pdf

# Dynamic positioning
pdfcpu stamp add -pos "tr" "Page %p" input.pdf output.pdf
```

**Stamp Positioning**:
```
tl (top-left)      tc (top-center)      tr (top-right)
   ┌────────────────────────────────────┐
   │                                    │
cl │               cc                   │ cr
   │          (center-center)           │
   │                                    │
   └────────────────────────────────────┘
bl (bottom-left)   bc (bottom-center)   br (bottom-right)
```

**Dynamic Variables**:
- `%p`: Current page number
- `%P`: Total pages
- `%d`: Current date
- `%t`: Current time
- `%f`: Filename

**Features**:
- Text stamps with fonts/colors
- Image stamps (PNG, JPG)
- PDF page stamps
- Multi-page stamp documents
- Rotation and scaling
- Opacity control
- Layer management (above/below content)
- Page-specific stamps
- Dynamic text replacement

**NanoPDF Extension Needed**:

```rust
pub enum StampContent {
    Text {
        text: String,
        font: String,
        size: f32,
        color: Color,
    },
    Image {
        path: String,
        scale: f32,
    },
    Pdf {
        doc: Handle,
        page: u32,
    },
}

pub struct StampOptions {
    pub content: StampContent,
    pub position: Position,
    pub rotation: f32,
    pub opacity: f32,
    pub layer: Layer,       // Above or Below content
    pub page_range: PageRange,
    pub dynamic_vars: bool,  // Enable %p, %d, etc.
}

// FFI Functions
np_stamp_add(doc: Handle, options: StampOptions) -> Handle
np_stamp_add_multi_page(doc: Handle, stamp_doc: Handle, mapping: PageMapping) -> Handle
np_watermark_add_tiled(doc: Handle, watermark: &str, options: TileOptions) -> Handle
np_stamp_parse_variables(text: &str, page: u32, total: u32, date: &str) -> String
```

**Use Cases**:
- ✅ "DRAFT" / "CONFIDENTIAL" marking
- ✅ Company logos on every page
- ✅ Page numbers with custom formatting
- ✅ Date/time stamps
- ✅ Security watermarks
- ✅ Approval stamps

---

### 9. PDF Collections/Portfolios

**Status**: ❌ Not in pypdf/MuPDF/FPDF
**pdfcpu Feature**: Multi-file PDF containers
**Value**: Document packaging, deliverables

#### Collection Operations:

```bash
# Create collection
pdfcpu collect file1.pdf file2.pdf file3.pdf output.pdf

# Add files to existing collection
pdfcpu collect add -files "doc.pdf,sheet.xlsx" collection.pdf

# List collection contents
pdfcpu collect list collection.pdf

# Extract from collection
pdfcpu collect extract collection.pdf output_dir/
```

**Collection Features**:
- Multiple PDFs in one file
- Preserve individual files
- Attachments of any type (not just PDF)
- Folder structure within PDF
- File descriptions and metadata
- Custom viewer layouts
- File relationships

**NanoPDF Extension Needed**:

```rust
pub struct Collection {
    pub files: Vec<CollectionFile>,
    pub folders: Vec<CollectionFolder>,
    pub schema: CollectionSchema,
}

pub struct CollectionFile {
    pub name: String,
    pub data: Vec<u8>,
    pub mime_type: String,
    pub description: Option<String>,
    pub metadata: HashMap<String, String>,
}

// FFI Functions
np_collection_create(name: &str) -> Handle
np_collection_add_file(collection: Handle, file: &str, description: &str) -> Result<()>
np_collection_add_folder(collection: Handle, folder: &str) -> Result<()>
np_collection_list_files(collection: Handle) -> Vec<CollectionFile>
np_collection_extract_file(collection: Handle, filename: &str) -> Vec<u8>
np_collection_set_layout(collection: Handle, layout: CollectionLayout) -> Result<()>
```

**Use Cases**:
- ✅ Project deliverables (multiple PDFs + supporting files)
- ✅ Portfolio presentations
- ✅ Legal case bundles
- ✅ Academic thesis with supplementary materials
- ✅ Product documentation packages

---

## 💡 LOW PRIORITY: Enhanced Capabilities

### 10. Keyword & Metadata Search

**Status**: ⚠️ Basic in pypdf/MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Advanced search and filter
**Value**: Document organization, batch processing

#### Search Operations:

```bash
# Search text content
pdfcpu find "keyword" input.pdf

# Search in metadata
pdfcpu info -filter "author=Smith" *.pdf

# Search and extract pages
pdfcpu extract -search "Chapter" input.pdf output.pdf
```

**NanoPDF Extension Needed**:
- `np_search_text(doc, query, options)` - Full-text search
- `np_filter_pages_by_content(doc, criteria)` - Filter pages
- `np_search_metadata(docs, query)` - Search across documents

---

### 11. Page Labels & Numbering

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF, ❌ Not in FPDF
**pdfcpu Feature**: Custom page numbering schemes
**Value**: Professional document navigation

#### Page Label Styles:

```bash
# Set page labels
pdfcpu pagelabels add -style "roman" -range "1-10" input.pdf
pdfcpu pagelabels add -style "decimal" -range "11-" -prefix "Chapter 1-" input.pdf
```

**Label Styles**:
- Roman numerals (i, ii, iii, iv)
- Decimal (1, 2, 3)
- Letters (a, b, c)
- Custom prefix (Appendix-1, Appendix-2)

**NanoPDF Extension Needed**:
- `np_page_labels_set(doc, range, style, prefix)` - Set labels
- `np_page_labels_get(doc, page)` - Get label for page
- `np_page_labels_reset(doc)` - Clear all labels

---

### 12. PDF/A Conversion

**Status**: ❌ Not comprehensively in pypdf/MuPDF/FPDF
**pdfcpu Feature**: Convert to PDF/A for archival
**Value**: Long-term document preservation

```bash
# Convert to PDF/A-1b
pdfcpu pdfa convert -level "1b" input.pdf output.pdf

# Validate PDF/A compliance
pdfcpu pdfa validate -level "2b" input.pdf
```

**NanoPDF Extension Needed**:
- `np_convert_to_pdfa(doc, level, options)` - PDF/A conversion
- `np_validate_pdfa(doc, level)` - Compliance check
- `np_pdfa_embed_fonts(doc)` - Ensure font embedding

---

## Implementation Roadmap

### Phase 1: Print Production Essentials (Q1 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 4-5 weeks

- [x] Page box management (Crop, Trim, Bleed, Art, Media)
- [x] Box manipulation API
- [x] Box visualization/inspection
- [x] Bleed addition utility

**Deliverables**:
- `np_page_box_*()` API
- `PageBox` enum, `BoxDimensions` struct
- Box validation and adjustment tools

---

### Phase 2: N-Up & Grid Layouts (Q2 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 3-4 weeks

- [x] N-Up page layout engine
- [x] Custom grid positioning
- [x] Page ordering algorithms
- [x] Margin and spacing control
- [x] Border rendering

**Deliverables**:
- `np_nup_create()`, `np_grid_create()`
- `NUpOptions`, `PageOrder` types
- Grid layout calculator

---

### Phase 3: Validation & Repair (Q2 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 5-6 weeks

- [x] PDF structure validation
- [x] Cross-reference checking
- [x] Object integrity verification
- [x] Automatic repair algorithms
- [x] PDF/A validation

**Deliverables**:
- `np_validate_pdf()`, `np_repair_pdf()`
- `ValidationResult` struct
- Repair engine

---

### Phase 4: Booklet & Poster (Q2-Q3 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 3-4 weeks

- [x] Booklet imposition algorithms
- [x] Page reordering for binding
- [x] Poster tiling engine
- [x] Cut marks and guides

**Deliverables**:
- `np_booklet_create()`, `np_poster_create()`
- `BookletOptions`, `PosterOptions`
- Imposition calculators

---

### Phase 5: Form Data Integration (Q3 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 2-3 weeks

- [x] JSON form data parser
- [x] CSV batch processing
- [x] Form field mapping
- [x] Data validation
- [x] Form locking

**Deliverables**:
- `np_form_fill_json()`, `np_form_fill_csv_batch()`
- `FormData` struct
- Batch processor

---

### Phase 6: Advanced Features (Q3-Q4 2026)
**Priority**: 📊 MEDIUM
**Estimated Effort**: 3-4 weeks

- [x] Page resize engine
- [x] Multi-page stamps
- [x] PDF collections
- [x] Advanced watermarking

**Deliverables**:
- `np_page_resize()`, `np_stamp_add_multi_page()`
- `np_collection_*()` API
- Resize and stamp engines

---

## Technical Considerations

### Architecture Integration

**FFI Layer** (`ffi/pdfcpu_extensions/`):
```
nanopdf-rs/src/ffi/pdfcpu_extensions/
  ├── boxes.rs         - Page box management
  ├── nup.rs           - N-Up and grid layouts
  ├── validation.rs    - PDF validation and repair
  ├── booklet.rs       - Booklet creation
  ├── poster.rs        - Poster/tiling
  ├── form_data.rs     - Form CSV/JSON processing
  ├── resize.rs        - Page resize and scale
  ├── stamp.rs         - Advanced stamping
  ├── collection.rs    - PDF portfolios
  └── mod.rs           - Module exports
```

**Core Rust** (`fitz/pdfcpu/`):
```
nanopdf-rs/src/fitz/pdfcpu/
  ├── boxes.rs         - Box calculations
  ├── imposition.rs    - N-Up, booklet, poster algorithms
  ├── validator.rs     - PDF validation engine
  ├── repair.rs        - Auto-repair algorithms
  ├── form_data.rs     - Form data parsing
  ├── resize.rs        - Resize calculations
  └── mod.rs
```

### Dependencies

**Rust Crates**:
- `serde_json` - JSON parsing for form data
- `csv` - CSV parsing for batch forms
- `regex` - Pattern matching for validation
- Potentially: `pdf-rs` - For low-level PDF parsing

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| N-Up (4-up, 100 pages) | <200ms | Layout calculation + rendering |
| Booklet (200 pages) | <300ms | Page reordering |
| Validation (1000-page PDF) | <2s | Complete structure check |
| Box manipulation | <10µs | Per page |
| Form fill (CSV, 100 records) | <1s | Batch processing |
| Poster (3×3, A4 to wall) | <150ms | Tiling calculation |

---

## API Examples

### Page Box Management
```rust
// Get all boxes for a page
let boxes = np_page_box_list(page);
for (box_type, dims) in boxes {
    println!("{:?}: {:?}", box_type, dims);
}

// Set crop box
np_page_box_set(page, PageBox::Crop, BoxDimensions {
    x: 10.0,
    y: 10.0,
    width: 575.0,
    height: 822.0,
});

// Add bleed (expand trim box by 9pt on all sides)
np_page_box_add_bleed(page, 9.0);
```

### N-Up Layout
```rust
// Create 4-up layout (2×2)
let nup_doc = np_nup_create(doc, NUpOptions {
    grid: (2, 2),
    page_size: PageSize::Letter,
    margins: Margins::uniform(36.0),
    spacing: 10.0,
    border: Some(Border::solid(1.0, Color::Black)),
    order: PageOrder::LeftToRightTopToBottom,
});
```

### Booklet Creation
```rust
// Create saddle-stitch booklet
let booklet = np_booklet_create(doc, BookletOptions {
    binding_type: BookletType::SaddleStitch,
    page_size: PageSize::Letter,
    margin: 36.0,
    gutter: 18.0,
    add_blank_pages: true,
    double_sided: true,
});
```

### Form Data Batch Processing
```rust
// Fill forms from CSV
let csv_data = r#"
Name,Email,Amount
John Doe,john@example.com,100.00
Jane Smith,jane@example.com,250.00
"#;

let filled_docs = np_form_fill_csv_batch(template, csv_data)?;
for (i, doc) in filled_docs.iter().enumerate() {
    np_save_pdf(doc, &format!("invoice_{}.pdf", i))?;
}
```

---

## Competitive Advantage

By implementing pdfcpu features, NanoPDF will:

1. ✅ **Dominate Print Production**: Only library with full box management + imposition
2. ✅ **Professional Grade**: Industry-standard validation and repair
3. ✅ **Batch Processing King**: CSV/JSON form filling beats all competitors
4. ✅ **Complete Toolchain**: Read + Edit + Generate + Prepare for Print
5. ✅ **Unique Positioning**:
   - pypdf: Good editing, weak production tools
   - MuPDF: Great reading, no production tools
   - pdfcpu: Great production tools, Go-only
   - **NanoPDF: ALL OF THE ABOVE in Rust**

---

## Conclusion

The **pdfcpu feature set** represents a massive opportunity in the **professional print production and PDF workflow** space. These features are **not well-covered** by existing Python/C libraries and would make NanoPDF the **go-to solution** for:

- 🖨️ **Print shops and pre-press workflows**
- 📊 **Document automation and batch processing**
- ✅ **PDF/A compliance and archival**
- 📑 **Professional publishing and imposition**

**Recommended Action**: Prioritize Phases 1-3 (Boxes, N-Up, Validation) for immediate differentiation in the print production market.

---

**Status**: 📋 Feature Planning
**Next Steps**: Review priorities, validate market need, begin Phase 1 implementation
**Estimated Total Effort**: 20-26 weeks for complete implementation
**Target Release**: Q4 2026 (all phases)
**Market Impact**: **HIGH** - Professional print production is underserved

