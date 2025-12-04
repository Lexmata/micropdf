# FPDF Extension Opportunities for NanoPDF

## Executive Summary

**Date**: December 4, 2025
**FPDF2 Version**: 2.x (latest)
**NanoPDF Version**: 0.1.0
**Purpose**: Identify unique FPDF features not in pypdf/MuPDF for potential NanoPDF extensions

This document identifies features present in the FPDF/FPDF2 library that are **not available** in pypdf or MuPDF. These represent valuable additions that could differentiate NanoPDF as a comprehensive PDF solution combining the best of all worlds:
- **MuPDF**: High-performance rendering and reading
- **pypdf**: Comprehensive manipulation and editing
- **FPDF**: Document generation and flow layout

---

## Priority Matrix

| Priority | Category | Unique Value | Implementation Difficulty |
|----------|----------|--------------|--------------------------|
| 🔥 **CRITICAL** | Document Flow Layout | Core FPDF differentiator | Medium |
| 🔥 **CRITICAL** | Cell-Based Layout System | Unique to FPDF | Medium |
| 🔥 **CRITICAL** | Table Generation | Much better than pypdf | Medium-High |
| ⭐ **HIGH** | HTML-to-PDF Rendering | Limited in MuPDF/pypdf | High |
| ⭐ **HIGH** | Template System | Unique to FPDF | Medium |
| ⭐ **HIGH** | Auto Header/Footer System | Better than pypdf | Low-Medium |
| 📊 **MEDIUM** | Barcode Generation | Not in pypdf/MuPDF | Medium |
| 📊 **MEDIUM** | Enhanced Cell Styling | FPDF's strength | Low-Medium |
| 📊 **MEDIUM** | Section System | Unique to FPDF | Medium |
| 💡 **LOW** | SVG Import (basic) | Can use existing libs | High |

---

## 🔥 CRITICAL PRIORITY: Core Document Generation Features

### 1. Document Flow Layout System

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Automatic content flow with position tracking
**Value**: Essential for report generation

#### Key Capabilities:

**a) Current Position Tracking**
```python
# FPDF automatically tracks x, y position
pdf.get_x()  # Current X position
pdf.get_y()  # Current Y position
pdf.set_x(x)  # Set X position
pdf.set_y(y)  # Set Y position
pdf.set_xy(x, y)  # Set both
```

**NanoPDF Extension Needed**:
- `np_get_cursor_position()` - Get current content position
- `np_set_cursor_position(x, y)` - Set position for next content
- `np_advance_cursor(dx, dy)` - Move cursor relative
- `np_reset_cursor()` - Reset to left margin

**b) Automatic Line Breaks**
```python
# FPDF automatically wraps text to fit width
pdf.multi_cell(width, height, text)  # Auto wrap and flow
```

**NanoPDF Extension Needed**:
- `np_write_flowing_text(text, width, style)` - Auto-wrapping text
- `np_set_line_height(height)` - Configure line spacing
- `np_set_auto_page_break(enabled, margin)` - Auto add pages

**c) Content Flow Context**
```python
# FPDF tracks where content ends
pdf.ln()  # Line break
pdf.ln(h)  # Line break with height
```

**NanoPDF Extension Needed**:
- `np_line_break(height)` - Add line break
- `np_page_break()` - Force page break
- `np_get_remaining_page_height()` - Check space left

---

### 2. Cell-Based Layout System

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Structured cell-based content placement
**Value**: Critical for forms, tables, structured documents

#### Key Capabilities:

**a) Basic Cell API**
```python
# FPDF's signature feature
pdf.cell(
    width,           # Cell width (0 = to right margin)
    height,          # Cell height
    text,            # Cell content
    border=0,        # Border style (0, 1, or 'LRTB')
    ln=0,            # Line break (0=right, 1=below, 2=below+reset)
    align='',        # Alignment (L, C, R, J)
    fill=False,      # Fill background
    link=''          # Add hyperlink
)
```

**NanoPDF Extension Needed**:
- `np_cell(width, height, text, options)` - Core cell function
- `CellOptions` struct with:
  - `border: CellBorder` (None, All, LRTB flags)
  - `align: TextAlign` (Left, Center, Right, Justify)
  - `fill: bool` + `fill_color: Color`
  - `link: Option<String>` (URL or internal)
  - `line_break: CellBreak` (None, Right, Below, BelowReset)

**b) Multi-Cell (Word Wrapping)**
```python
# Auto-wrapping cell with height calculation
pdf.multi_cell(
    width,           # Cell width
    height,          # Line height
    text,            # Text (auto-wrapped)
    border=0,        # Border
    align='J',       # Alignment
    fill=False       # Fill
)
```

**NanoPDF Extension Needed**:
- `np_multi_cell(width, line_height, text, options)` - Wrapping cell
- Auto-calculate total height
- Support justified text
- Automatic page breaks if needed

**c) Advanced Cell Features**
```python
# FPDF cell enhancements
pdf.cell(w, h, text, border='LRTB')  # Individual borders
pdf.cell(w, h, text, border=1)        # All borders
pdf.set_fill_color(r, g, b)           # Cell background
pdf.set_text_color(r, g, b)           # Text color
```

**NanoPDF Extension Needed**:
- `np_set_cell_border_style(style, width, color)` - Per-side borders
- `np_set_cell_fill(color)` - Background color
- `np_set_cell_padding(left, top, right, bottom)` - Cell padding
- Border styles: solid, dashed, dotted

---

### 3. Table Generation System

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF
**FPDF Feature**: Rich table creation with auto-formatting
**Value**: Essential for reports, invoices, data display

#### Key Capabilities:

**a) Simple Table API**
```python
# FPDF2 modern table API
with pdf.table() as table:
    for data_row in data:
        row = table.row()
        for datum in data_row:
            row.cell(datum)
```

**NanoPDF Extension Needed**:
- `np_table_begin(columns, options)` - Start table
- `np_table_row_begin()` - Start row
- `np_table_cell(content, span, options)` - Add cell
- `np_table_row_end()` - End row
- `np_table_end()` - Complete table

**b) Table Configuration**
```python
# FPDF2 table options
pdf.table(
    borders_layout="MINIMAL",     # ALL, NONE, MINIMAL, etc.
    cell_fill_color=(240, 240, 240),  # Alternating rows
    cell_fill_mode="ROWS",        # ROWS, COLUMNS
    col_widths=(30, 50, 20),      # Column widths
    headings_style=FontFace(emphasis="BOLD"),
    line_height=6,
    text_align="CENTER",
    width=150,
)
```

**NanoPDF Extension Needed**:
- `TableOptions` struct:
  - `border_layout: BorderLayout` (All, None, Minimal, Horizontal, Vertical)
  - `alternating_fill: Option<Color>` - Zebra striping
  - `column_widths: Vec<f32>` - Fixed or relative widths
  - `header_style: TextStyle` - Header formatting
  - `row_height: f32` - Fixed or auto
  - `cell_padding: Padding`
  - `text_align: Align` - Per-column or global

**c) Advanced Table Features**
```python
# FPDF2 advanced table features
- Spanning cells (colspan, rowspan)
- Cell background colors
- Per-cell text alignment
- Automatic page breaks within tables
- Table headers repeated on new pages
- Padding and margins
```

**NanoPDF Extension Needed**:
- `np_table_cell_span(colspan, rowspan)` - Merged cells
- `np_table_set_header_rows(count)` - Repeat headers
- `np_table_auto_page_break(enabled)` - Split across pages
- `np_table_column_widths_auto()` - Calculate from content
- `np_table_freeze_header()` - Keep header on all pages

---

## ⭐ HIGH PRIORITY: Document Generation Enhancement

### 4. HTML to PDF Rendering

**Status**: ⚠️ Limited in MuPDF, ❌ Not in pypdf
**FPDF Feature**: Convert HTML to PDF with CSS support
**Value**: Web report generation, email templates

#### Key Capabilities:

```python
# FPDF2 HTML rendering
pdf.write_html("""
    <h1>Title</h1>
    <p style="color: blue; font-size: 12pt;">
        Paragraph with <b>bold</b> and <i>italic</i>.
    </p>
    <table border="1">
        <tr><th>Header</th></tr>
        <tr><td>Data</td></tr>
    </table>
    <img src="image.jpg" width="100">
""")
```

**Supported HTML Tags**:
- Text: `<p>`, `<h1>`-`<h6>`, `<br>`, `<hr>`
- Formatting: `<b>`, `<i>`, `<u>`, `<font>`, `<center>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Tables: `<table>`, `<tr>`, `<th>`, `<td>`
- Images: `<img>`
- Links: `<a>`
- Blocks: `<div>`, `<section>`

**CSS Support**:
- Colors: `color`, `background-color`
- Text: `font-size`, `font-family`, `font-weight`, `font-style`
- Spacing: `margin`, `padding`
- Alignment: `text-align`
- Dimensions: `width`, `height`

**NanoPDF Extension Needed**:
- `np_render_html(html_string, options)` - Convert HTML to PDF
- `HtmlOptions`:
  - `base_url: String` - For resolving relative URLs
  - `css: Option<String>` - Additional CSS
  - `image_map: HashMap<String, Image>` - Embedded images
  - `font_map: HashMap<String, Font>` - Font mapping
- Support subset of HTML5 + CSS3
- Auto-wrap and flow content
- Table rendering
- Image embedding

---

### 5. Template System

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Visual template designer and template fills
**Value**: Form filling, mail merge, branded documents

#### Key Capabilities:

**a) Template Definition**
```python
# FPDF template system (FlexTemplate)
template = FlexTemplate(pdf)
template.add_text(x=10, y=10, text="Name:", size=12)
template.add_field("name", x=30, y=10, width=50, height=10)
template.add_field("date", x=30, y=25, width=30, height=10)
```

**b) Template Filling**
```python
# Fill template with data
template["name"] = "John Doe"
template["date"] = "2025-12-04"
template.render()
```

**c) Template Features**
- Visual designer tool (FlexTemplate)
- Field placeholders
- Multi-page templates
- Repeating sections
- Conditional content
- Data binding

**NanoPDF Extension Needed**:
- `np_template_create(name)` - New template
- `np_template_add_field(name, x, y, width, height, options)` - Field
- `np_template_add_section(name, repeatable)` - Repeating section
- `np_template_set_value(field, value)` - Fill data
- `np_template_render(data)` - Render with data
- Template serialization (JSON/TOML)
- `TemplateField` types:
  - Text
  - Number
  - Date
  - Image
  - Checkbox
  - Signature

---

### 6. Header/Footer Auto-System

**Status**: ⚠️ Manual in pypdf, ❌ Not in MuPDF
**FPDF Feature**: Automatic header/footer on all pages
**Value**: Professional documents, reports

#### Key Capabilities:

```python
# FPDF override pattern
class MyPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'My Report', align='C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')
```

**Features**:
- Automatic execution on every page
- Access to page number
- Total page count (with `alias_nb_pages()`)
- Position control (header from top, footer from bottom)
- Can include images, lines, shapes
- Different header/footer for first page
- Different for odd/even pages

**NanoPDF Extension Needed**:
- `np_set_header_callback(callback)` - Register header function
- `np_set_footer_callback(callback)` - Register footer function
- `np_get_page_number()` - Current page in callback
- `np_get_total_pages()` - Total pages (2-pass)
- `np_set_header_margin(margin)` - Header space
- `np_set_footer_margin(margin)` - Footer space
- `HeaderOptions`:
  - `first_page_different: bool`
  - `odd_even_different: bool`
  - `height: f32`
  - `content: Box<dyn Fn(&mut Context)>`

---

## 📊 MEDIUM PRIORITY: Specialized Features

### 7. Barcode Generation

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Built-in barcode rendering
**Value**: Inventory, shipping labels, tickets

#### Supported Barcode Types:

- **Code 39**: Standard barcode
- **Code 128**: High-density barcode
- **Interleaved 2 of 5 (I2of5)**: Numeric only
- **EAN-13**: European Article Number
- **UPC-A**: Universal Product Code
- **QR Code**: 2D barcode (via extension)

```python
# FPDF barcode examples
pdf.code39("*ABC123*", x=10, y=10, w=1.5, h=10)
pdf.interleaved2of5("1234567890", x=10, y=30)
```

**NanoPDF Extension Needed**:
- `np_barcode_code39(data, x, y, options)` - Code 39
- `np_barcode_code128(data, x, y, options)` - Code 128
- `np_barcode_i2of5(data, x, y, options)` - I2of5
- `np_barcode_ean13(data, x, y, options)` - EAN-13
- `np_barcode_upca(data, x, y, options)` - UPC-A
- `np_qrcode(data, x, y, size, options)` - QR Code
- `BarcodeOptions`:
  - `width: f32` - Bar width
  - `height: f32` - Bar height
  - `show_text: bool` - Display human-readable
  - `text_position: Position` (Above, Below)
  - `checksum: bool` - Add checksum

---

### 8. Enhanced Cell Styling

**Status**: ⚠️ Basic in pypdf, ❌ Not in MuPDF
**FPDF Feature**: Rich cell styling beyond borders
**Value**: Professional document appearance

#### Key Features:

**a) Border Customization**
```python
# Per-side borders
pdf.cell(w, h, text, border='LTR')  # Left, Top, Right only
pdf.cell(w, h, text, border='B')     # Bottom only

# Border styling (FPDF2)
pdf.set_draw_color(r, g, b)   # Border color
pdf.set_line_width(width)      # Border thickness
```

**b) Fill and Background**
```python
# Cell background
pdf.set_fill_color(r, g, b)
pdf.cell(w, h, text, fill=True)

# Gradient fills (extensions)
pdf.gradient_fill(x, y, w, h, from_color, to_color, direction)
```

**c) Rounded Corners**
```python
# Rounded cell borders (FPDF2)
pdf.rounded_rect(x, y, w, h, radius, style='D')
```

**NanoPDF Extension Needed**:
- `np_cell_set_border_sides(sides)` - LRTB individual control
- `np_cell_set_border_width(width)` - Thickness
- `np_cell_set_border_color(color)` - Per-side colors
- `np_cell_set_border_radius(radius)` - Rounded corners
- `np_cell_set_gradient_fill(start, end, direction)` - Gradient
- `np_cell_set_shadow(offset, blur, color)` - Drop shadow

---

### 9. Section System

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Document sections with different settings
**Value**: Complex documents with mixed layouts

#### Key Capabilities:

```python
# FPDF section support
pdf.start_section(name, level=0)  # Start section
pdf.end_section()                 # End section

# Different page orientation per section
pdf.add_page(orientation='P')  # Portrait
# ... content ...
pdf.add_page(orientation='L')  # Landscape for wide tables
```

**Section Features**:
- Named sections
- Different page sizes per section
- Different margins per section
- Different header/footer per section
- Section bookmarks
- Automatic TOC generation from sections

**NanoPDF Extension Needed**:
- `np_section_begin(name, options)` - Start section
- `np_section_end()` - End section
- `np_section_set_page_size(size)` - Per-section size
- `np_section_set_orientation(orient)` - Per-section orientation
- `np_section_set_margins(margins)` - Per-section margins
- `np_generate_toc()` - Build TOC from sections
- `SectionOptions`:
  - `name: String`
  - `level: u32` - Hierarchy level
  - `page_size: PageSize`
  - `orientation: Orientation`
  - `margins: Margins`
  - `header: Option<HeaderCallback>`
  - `footer: Option<FooterCallback>`

---

### 10. Chart and Graph Embedding

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Embed charts directly
**Value**: Data visualization in reports

#### Capabilities:

```python
# FPDF2 chart support (via matplotlib integration)
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])

# Save to PDF
with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
    fig.savefig(tmp.name)
    pdf.image(tmp.name, x=10, y=10, w=100)
```

**Chart Types**:
- Line charts
- Bar charts
- Pie charts
- Scatter plots
- Histograms
- Box plots

**NanoPDF Extension Needed**:
- `np_chart_line(data, options)` - Line chart
- `np_chart_bar(data, options)` - Bar chart
- `np_chart_pie(data, options)` - Pie chart
- `np_chart_scatter(data, options)` - Scatter plot
- Or: Integration with `plotters` crate
- Or: SVG-based chart rendering

---

## 💡 LOW PRIORITY: Nice-to-Have Features

### 11. Basic SVG Import

**Status**: ❌ Not in pypdf or MuPDF
**FPDF Feature**: Import and render SVG graphics
**Value**: Vector graphics, logos, icons

```python
# FPDF2 SVG support
pdf.image("logo.svg", x=10, y=10, w=50)
```

**NanoPDF Extension Needed**:
- `np_render_svg(svg_data, x, y, width, height)` - Render SVG
- Use existing Rust SVG libraries (resvg, svg crate)
- Convert SVG paths to PDF paths
- Handle SVG styling

---

### 12. Emoji and Symbol Support

**Status**: ⚠️ Limited in all libraries
**FPDF Feature**: Easy emoji embedding
**Value**: Modern document styling

```python
# FPDF2 emoji support
pdf.set_font('DejaVu', '', 12)
pdf.cell(0, 10, '✅ Success! 🎉')
```

**NanoPDF Extension Needed**:
- Unicode emoji rendering
- Emoji font embedding (Noto Emoji, Apple Color Emoji)
- Color emoji support (using PNG fallback)
- Symbol dingbats (Zapf Dingbats, etc.)

---

## Implementation Roadmap

### Phase 1: Core Flow & Layout (Q1 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 3-4 weeks

- [x] Document flow system with position tracking
- [x] Cell-based layout API
- [x] Multi-cell with auto-wrapping
- [x] Line breaks and page breaks
- [x] Basic cell styling (borders, fill, align)

**Deliverables**:
- `np_cell()`, `np_multi_cell()`, `np_line_break()`
- `np_get_cursor()`, `np_set_cursor()`
- `CellOptions`, `BorderStyle` structs

---

### Phase 2: Table Generation (Q1-Q2 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 2-3 weeks

- [x] Table builder API
- [x] Auto-page breaks in tables
- [x] Column width calculation
- [x] Cell spanning
- [x] Header row repetition
- [x] Zebra striping

**Deliverables**:
- `np_table_begin()`, `np_table_row()`, `np_table_cell()`
- `TableOptions` struct
- Table rendering engine

---

### Phase 3: HTML Rendering (Q2 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 4-5 weeks

- [x] HTML parser integration
- [x] CSS subset support
- [x] HTML to PDF layout engine
- [x] Image embedding from HTML
- [x] Table rendering from HTML
- [x] List rendering

**Deliverables**:
- `np_render_html()` function
- HTML/CSS parser
- Layout engine

---

### Phase 4: Templates & Headers/Footers (Q2-Q3 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 2-3 weeks

- [x] Template system
- [x] Field binding
- [x] Header/footer callbacks
- [x] Page number system
- [x] Template serialization

**Deliverables**:
- `np_template_*()` API
- `np_set_header_callback()`, `np_set_footer_callback()`
- Template JSON format

---

### Phase 5: Barcode & Charts (Q3 2026)
**Priority**: 📊 MEDIUM
**Estimated Effort**: 2-3 weeks

- [x] Barcode generation library
- [x] Code 39, Code 128, I2of5
- [x] EAN-13, UPC-A
- [x] QR Code generation
- [x] Chart rendering (via plotters)

**Deliverables**:
- `np_barcode_*()` functions
- `np_chart_*()` functions (or plotters integration)

---

### Phase 6: Advanced Styling (Q4 2026)
**Priority**: 📊 MEDIUM
**Estimated Effort**: 2 weeks

- [x] Enhanced border styles
- [x] Gradient fills
- [x] Rounded corners
- [x] Drop shadows
- [x] Section system

**Deliverables**:
- `np_cell_set_border_*()` functions
- `np_section_*()` API

---

## Technical Considerations

### Architecture Integration

**FFI Layer** (`ffi/fpdf_extensions/`):
```
nanopdf-rs/src/ffi/fpdf_extensions/
  ├── cell.rs          - Cell layout system
  ├── table.rs         - Table generation
  ├── html.rs          - HTML rendering
  ├── template.rs      - Template system
  ├── header_footer.rs - Header/footer callbacks
  ├── barcode.rs       - Barcode generation
  ├── section.rs       - Section management
  └── mod.rs           - Module exports
```

**Core Rust** (`fitz/fpdf/`):
```
nanopdf-rs/src/fitz/fpdf/
  ├── flow.rs          - Document flow engine
  ├── cell.rs          - Cell layout
  ├── table.rs         - Table builder
  ├── html_parser.rs   - HTML parsing
  ├── html_renderer.rs - HTML to PDF
  ├── template.rs      - Template engine
  ├── barcode.rs       - Barcode rendering
  └── mod.rs
```

### Dependencies

**Rust Crates**:
- `html5ever` - HTML parsing
- `cssparser` - CSS parsing
- `resvg` - SVG rendering
- `qrcode` - QR code generation
- `barcoders` or `bar code` - Barcode generation
- `plotters` - Chart generation (optional)
- `serde` - Template serialization

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Cell rendering | <100µs | Per cell |
| Table (100 rows) | <10ms | Including layout |
| HTML page | <50ms | Simple page |
| Barcode | <1ms | Any type |
| Template fill | <20ms | 50 fields |

---

## API Examples

### Cell-Based Layout
```rust
// Rust API example
let mut pdf = PDF::new();
pdf.add_page();

// Simple cell
pdf.cell(50.0, 10.0, "Name:", CellOptions {
    border: BorderStyle::All,
    align: Align::Left,
    fill: Some(Color::rgb(240, 240, 240)),
    ..Default::default()
});

// Multi-cell with wrapping
pdf.multi_cell(100.0, 5.0, long_text, CellOptions {
    border: BorderStyle::Sides(vec![Side::Left, Side::Right]),
    align: Align::Justify,
    ..Default::default()
});
```

### Table Generation
```rust
// Rust table API
let mut table = pdf.table_begin(TableOptions {
    columns: vec![30.0, 70.0, 50.0],
    border: BorderLayout::Minimal,
    zebra_stripe: Some(Color::rgb(245, 245, 245)),
    ..Default::default()
});

// Header row
table.row_begin();
table.cell("ID", CellOptions::header());
table.cell("Name", CellOptions::header());
table.cell("Value", CellOptions::header());
table.row_end();

// Data rows
for record in data {
    table.row_begin();
    table.cell(&record.id.to_string(), CellOptions::default());
    table.cell(&record.name, CellOptions::default());
    table.cell(&record.value.to_string(), CellOptions::default());
    table.row_end();
}

table.end();
```

### HTML Rendering
```rust
// HTML to PDF
pdf.render_html(r#"
    <h1>Report Title</h1>
    <p style="color: blue;">Introduction paragraph.</p>
    <table border="1">
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Data 1</td><td>Data 2</td></tr>
    </table>
"#, HtmlOptions {
    base_url: Some("https://example.com".into()),
    css: Some("body { font-family: Arial; }".into()),
    ..Default::default()
})?;
```

### Template System
```rust
// Create template
let mut template = Template::new("invoice");
template.add_field("company_name", 10.0, 10.0, 100.0, 10.0);
template.add_field("invoice_number", 10.0, 25.0, 50.0, 10.0);
template.add_field("date", 70.0, 25.0, 50.0, 10.0);
template.add_section("items", true);  // Repeating section

// Fill template
template.set("company_name", "ACME Corp");
template.set("invoice_number", "INV-2025-001");
template.set("date", "2025-12-04");

for item in items {
    template.section("items").add_row(item);
}

template.render(&mut pdf)?;
```

---

## Competitive Advantage

By implementing these FPDF features, NanoPDF will:

1. ✅ **Be the ONLY library** with MuPDF performance + pypdf features + FPDF generation
2. ✅ **Support all use cases**: Read, Manipulate, Generate
3. ✅ **Offer best-in-class**:
   - Reading: MuPDF speed
   - Editing: pypdf capabilities
   - Generation: FPDF ease-of-use
4. ✅ **Differentiate from**: PyMuPDF (read-only focus), pypdf (slow), FPDF (Python-only)
5. ✅ **Enable new scenarios**:
   - Report servers in Rust
   - Fast invoice generation
   - Template-based documents
   - HTML-to-PDF microservices

---

## Conclusion

The FPDF feature set represents a **significant opportunity** to make NanoPDF the **most comprehensive PDF library** available in any language. The cell-based layout system, table generation, and HTML rendering are the **killer features** that will attract users who currently split their workflow between multiple libraries.

**Recommended Action**: Prioritize Phases 1-2 (Core Flow & Tables) for immediate value, then Phase 3 (HTML) for maximum market impact.

---

**Status**: 📋 Feature Planning
**Next Steps**: Review priorities with team, refine API designs, begin Phase 1 implementation
**Estimated Total Effort**: 16-20 weeks for complete implementation
**Target Release**: Q4 2026 (all phases)

