# ReportLab Extension Opportunities for NanoPDF

## Executive Summary

**Date**: December 4, 2025
**ReportLab Version**: 4.x (latest)
**NanoPDF Version**: 0.1.0
**Purpose**: Identify unique ReportLab features not in pypdf/MuPDF/FPDF/pdfcpu for potential NanoPDF extensions

This document identifies features present in **ReportLab** that are **not available** (or not well-implemented) in pypdf, MuPDF, FPDF, or pdfcpu. ReportLab brings unique value through:
- **Platypus Framework**: High-level document layout with flowables
- **Professional Typography**: Advanced text styling and paragraph formatting
- **Component Architecture**: Reusable document components
- **Automatic Layout**: Smart page breaks, keep-together, widow/orphan control
- **Business Graphics**: Integrated charting library

ReportLab is the **gold standard** for programmatic PDF generation in the enterprise, used by companies like NASA, FedEx, and many Fortune 500 companies.

---

## Priority Matrix

| Priority | Category | Unique Value | Implementation Difficulty |
|----------|----------|--------------|--------------------------|
| 🔥 **CRITICAL** | Platypus Framework | Core architecture | High |
| 🔥 **CRITICAL** | Flowables System | Document components | High |
| 🔥 **CRITICAL** | Paragraph Styles | Professional typography | Medium-High |
| ⭐ **HIGH** | TableStyle System | Rich table formatting | Medium |
| ⭐ **HIGH** | PageTemplates | Layout templates | Medium-High |
| ⭐ **HIGH** | Automatic TOC | Document navigation | Medium |
| ⭐ **HIGH** | Charts & Graphics | Data visualization | High |
| 📊 **MEDIUM** | Keep-Together/With-Next | Smart pagination | Medium |
| 📊 **MEDIUM** | Conditional Breaks | Layout control | Medium |
| 📊 **MEDIUM** | Multi-Column Layouts | Magazine-style | Medium |
| 💡 **LOW** | Drawing Primitives | Vector graphics | Low-Medium |

---

## 🔥 CRITICAL PRIORITY: Platypus Document Framework

### 1. Platypus: Page Layout and Typography Using Scripts

**Status**: ❌ Not in any other library
**ReportLab Feature**: High-level document composition framework
**Value**: Professional document generation with automatic layout

#### What is Platypus?

Platypus is ReportLab's **document composition framework** that handles:
- Automatic page breaks
- Multi-page content flow
- Smart pagination
- Header/footer management
- Table of contents generation
- Multi-column layouts

**Traditional Approach (FPDF-style)**:
```python
# Manual position tracking
pdf.set_xy(10, 10)
pdf.cell(100, 10, "Text")
pdf.ln()
pdf.cell(100, 10, "More text")
# Must manually handle page breaks!
```

**Platypus Approach (ReportLab)**:
```python
# Automatic layout
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

doc = SimpleDocTemplate("output.pdf")
story = []

# Add content - Platypus handles layout automatically
story.append(Paragraph("Title", styles['Title']))
story.append(Spacer(1, 12))
story.append(Paragraph("Content...", styles['Normal']))

# Build - automatic page breaks, flowing, etc.
doc.build(story)
```

#### Core Platypus Components:

1. **DocTemplate**: Document container with page templates
2. **Story**: List of flowable elements
3. **Frame**: Rectangular region for content
4. **PageTemplate**: Page layout definition
5. **Flowables**: Content elements (Paragraph, Table, Image, etc.)

**Architecture**:
```
┌─────────────────────────────────────┐
│       DocTemplate                   │
│  ┌───────────────────────────────┐  │
│  │    PageTemplate (First Page)  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Frame (Header)         │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Frame (Main Content)   │  │  │
│  │  │  [Flowables flow here]  │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Frame (Footer)         │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │    PageTemplate (Later Pages) │  │
│  │  ...                          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**NanoPDF Extension Needed**:

```rust
pub struct DocTemplate {
    pub filename: String,
    pub page_size: PageSize,
    pub margins: Margins,
    pub page_templates: Vec<PageTemplate>,
    pub show_boundary: bool,  // Debug mode
}

pub struct PageTemplate {
    pub id: String,
    pub frames: Vec<Frame>,
    pub on_page: Option<Box<dyn Fn(&mut Canvas, &DocTemplate)>>,
    pub on_page_end: Option<Box<dyn Fn(&mut Canvas, &DocTemplate)>>,
}

pub struct Frame {
    pub x1: f32,
    pub y1: f32,
    pub width: f32,
    pub height: f32,
    pub left_padding: f32,
    pub bottom_padding: f32,
    pub right_padding: f32,
    pub top_padding: f32,
    pub show_boundary: bool,
}

pub struct Story {
    pub flowables: Vec<Box<dyn Flowable>>,
}

pub trait Flowable {
    fn wrap(&mut self, available_width: f32, available_height: f32) -> (f32, f32);
    fn draw(&self, canvas: &mut Canvas, x: f32, y: f32);
    fn split(&self, available_height: f32) -> Vec<Box<dyn Flowable>>;
}

// FFI Functions
np_doc_template_create(filename: &str, options: DocTemplateOptions) -> Handle
np_doc_template_add_page_template(doc: Handle, template: PageTemplate)
np_doc_template_build(doc: Handle, story: Story) -> Result<()>
np_frame_create(x1: f32, y1: f32, width: f32, height: f32) -> Frame
```

**Use Cases**:
- ✅ Automatic multi-page reports
- ✅ Books and documentation
- ✅ Invoices with variable content
- ✅ Letters with headers/footers
- ✅ Any document where content length varies

---

### 2. Flowables: Reusable Document Components

**Status**: ❌ Not in other libraries
**ReportLab Feature**: Self-contained, reusable document elements
**Value**: Modular, composable document construction

#### Core Flowables:

1. **Paragraph**: Rich text with inline styling
2. **Spacer**: Vertical/horizontal space
3. **PageBreak**: Force page break
4. **CondPageBreak**: Conditional page break
5. **KeepTogether**: Keep multiple flowables on same page
6. **Table**: Advanced tables
7. **Image**: Images with auto-sizing
8. **FrameBreak**: Move to next frame
9. **IndentedBlock**: Indented content group
10. **ListFlowable**: Bulleted/numbered lists

**Flowable Lifecycle**:
```python
# 1. Create flowable
para = Paragraph("Content", style)

# 2. Platypus calls wrap() to determine size
width, height = para.wrap(available_width, available_height)

# 3. If fits, Platypus calls draw()
para.draw(canvas, x, y)

# 4. If doesn't fit, Platypus calls split()
parts = para.split(available_height)
# parts[0] on current page, parts[1:] on next pages
```

**Example: Custom Flowable**:
```python
class Signature(Flowable):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)

    def draw(self):
        self.canv.line(0, 0, self.width, 0)
        self.canv.drawString(0, -10, "Signature: ___________")
        self.canv.drawString(self.width - 50, -10, "Date: _____")
```

**NanoPDF Extension Needed**:

```rust
pub trait Flowable: Send + Sync {
    /// Calculate required width and height
    fn wrap(&mut self, available_width: f32, available_height: f32) -> (f32, f32);

    /// Draw the flowable
    fn draw(&self, canvas: &mut Canvas, x: f32, y: f32);

    /// Split if doesn't fit (returns Vec of parts)
    fn split(&self, available_height: f32) -> Vec<Box<dyn Flowable>>;

    /// Get spacing before (for widow/orphan control)
    fn get_space_before(&self) -> f32 { 0.0 }

    /// Get spacing after
    fn get_space_after(&self) -> f32 { 0.0 }

    /// Can this flowable be split?
    fn is_splittable(&self) -> bool { false }
}

// Standard Flowables
pub struct ParagraphFlowable {
    pub text: String,
    pub style: ParagraphStyle,
}

pub struct SpacerFlowable {
    pub width: f32,
    pub height: f32,
}

pub struct PageBreakFlowable;

pub struct CondPageBreakFlowable {
    pub height: f32,  // Break if less than this space
}

pub struct KeepTogetherFlowable {
    pub flowables: Vec<Box<dyn Flowable>>,
    pub max_height: Option<f32>,
}

pub struct TableFlowable {
    pub data: Vec<Vec<String>>,
    pub style: TableStyle,
    pub col_widths: Vec<f32>,
    pub row_heights: Vec<f32>,
}

pub struct ImageFlowable {
    pub image: Image,
    pub width: f32,
    pub height: f32,
    pub lazy_loading: bool,
}

// FFI Functions
np_paragraph_create(text: &str, style: ParagraphStyle) -> Handle
np_spacer_create(width: f32, height: f32) -> Handle
np_page_break_create() -> Handle
np_keep_together_create(flowables: Vec<Handle>) -> Handle
np_table_flowable_create(data: Vec<Vec<String>>, style: TableStyle) -> Handle
np_image_flowable_create(image: Handle, width: f32, height: f32) -> Handle
```

**Use Cases**:
- ✅ Modular document construction
- ✅ Reusable document components
- ✅ Template-based generation
- ✅ Custom document elements
- ✅ Dynamic content assembly

---

### 3. Paragraph Styles: Professional Typography

**Status**: ⚠️ Basic in FPDF, ❌ Not comprehensive in others
**ReportLab Feature**: CSS-like paragraph styling system
**Value**: Professional typography control

#### ParagraphStyle Attributes:

```python
from reportlab.lib.styles import ParagraphStyle

style = ParagraphStyle(
    name='CustomStyle',
    fontName='Helvetica',
    fontSize=12,
    leading=14,              # Line height
    leftIndent=0,
    rightIndent=0,
    firstLineIndent=0,
    alignment=0,             # LEFT, CENTER, RIGHT, JUSTIFY
    spaceBefore=0,
    spaceAfter=0,
    bulletFontName='Helvetica',
    bulletFontSize=12,
    bulletIndent=0,
    textColor=colors.black,
    backColor=None,
    wordWrap='LTR',
    borderWidth=0,
    borderPadding=0,
    borderColor=None,
    borderRadius=0,
    allowWidows=1,           # Widow/orphan control
    allowOrphans=0,
    textTransform=None,      # uppercase, lowercase, capitalize
    endDots=None,
    splitLongWords=1,
    underlineWidth=0,
    bulletAnchor='start',
    justifyLastLine=0,
    justifyBreaks=0,
    spaceShrinkage=0.05,
    strikeWidth=0,
    underlineOffset=-0.125,
    underlineGap=1,
    strikeOffset=0.25,
    strikeGap=1,
    linkUnderline=0,
)
```

#### Style Inheritance:

```python
# Base style
base = ParagraphStyle('Base',
    fontName='Times-Roman',
    fontSize=10,
    leading=12
)

# Derived styles
heading1 = ParagraphStyle('Heading1',
    parent=base,
    fontSize=18,
    leading=22,
    spaceAfter=12
)

heading2 = ParagraphStyle('Heading2',
    parent=heading1,
    fontSize=14,
    leading=16
)
```

#### Rich Text with Inline Tags:

```python
text = """
<para>
Regular text, <b>bold text</b>, <i>italic text</i>,
<font color="red">red text</font>,
<font size="14">larger text</font>,
<link href="http://example.com">link text</link>,
<super>superscript</super>, <sub>subscript</sub>,
<u>underlined</u>, <strike>strikethrough</strike>.
</para>
"""

para = Paragraph(text, style)
```

**Supported Inline Tags**:
- `<b>` - Bold
- `<i>` - Italic
- `<u>` - Underline
- `<strike>` - Strikethrough
- `<super>` - Superscript
- `<sub>` - Subscript
- `<font>` - Font attributes (color, size, face)
- `<br/>` - Line break
- `<link>` - Hyperlink
- `<a>` - Anchor
- `<bullet>` - Bullet point
- `<seq>` - Sequence (for numbering)
- `<img>` - Inline image

**NanoPDF Extension Needed**:

```rust
pub struct ParagraphStyle {
    pub name: String,
    pub parent: Option<Box<ParagraphStyle>>,

    // Font
    pub font_name: String,
    pub font_size: f32,
    pub leading: f32,  // Line height
    pub text_color: Color,
    pub back_color: Option<Color>,

    // Indentation
    pub left_indent: f32,
    pub right_indent: f32,
    pub first_line_indent: f32,

    // Alignment
    pub alignment: TextAlign,  // Left, Center, Right, Justify
    pub justify_last_line: bool,
    pub justify_breaks: bool,

    // Spacing
    pub space_before: f32,
    pub space_after: f32,

    // Bullets
    pub bullet_font_name: String,
    pub bullet_font_size: f32,
    pub bullet_indent: f32,
    pub bullet_anchor: String,

    // Borders
    pub border_width: f32,
    pub border_padding: f32,
    pub border_color: Option<Color>,
    pub border_radius: f32,

    // Widows and Orphans
    pub allow_widows: u32,
    pub allow_orphans: u32,

    // Text decoration
    pub underline_width: f32,
    pub underline_offset: f32,
    pub strike_width: f32,
    pub strike_offset: f32,

    // Word wrapping
    pub word_wrap: WordWrap,
    pub split_long_words: bool,
    pub space_shrinkage: f32,
}

pub enum TextAlign {
    Left,
    Center,
    Right,
    Justify,
}

pub enum WordWrap {
    LTR,  // Left-to-right
    RTL,  // Right-to-left
}

// FFI Functions
np_paragraph_style_create(name: &str) -> Handle
np_paragraph_style_set_parent(style: Handle, parent: Handle)
np_paragraph_style_set_font(style: Handle, name: &str, size: f32)
np_paragraph_style_set_alignment(style: Handle, align: TextAlign)
np_paragraph_style_set_spacing(style: Handle, before: f32, after: f32)
np_paragraph_style_set_indent(style: Handle, left: f32, right: f32, first: f32)
np_paragraph_parse_rich_text(text: &str, style: Handle) -> Handle
```

**Use Cases**:
- ✅ Professional document typography
- ✅ Style inheritance and theming
- ✅ Rich text with inline formatting
- ✅ Consistent document appearance
- ✅ Hyperlinks and cross-references

---

## ⭐ HIGH PRIORITY: Advanced Components

### 4. TableStyle: Rich Table Formatting

**Status**: ⚠️ Basic in FPDF, ⚠️ Basic in pypdf, ❌ Not in others
**ReportLab Feature**: Comprehensive table styling system
**Value**: Professional table formatting

#### TableStyle Commands:

```python
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

data = [
    ['Item', 'Qty', 'Price', 'Total'],
    ['Widget A', '5', '$10.00', '$50.00'],
    ['Widget B', '3', '$15.00', '$45.00'],
]

table = Table(data)
table.setStyle(TableStyle([
    # Header formatting
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

    # Body formatting
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
    ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('TOPPADDING', (0, 1), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),

    # Grid
    ('GRID', (0, 0), (-1, -1), 1, colors.black),

    # Alternating rows
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),

    # Spanning cells
    ('SPAN', (0, 0), (1, 0)),  # Merge cells

    # Conditional formatting
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
```

**TableStyle Commands** (40+ commands):
- **Background**: `BACKGROUND`, `ROWBACKGROUNDS`, `COLBACKGROUNDS`
- **Grid**: `GRID`, `BOX`, `OUTLINE`, `INNERGRID`, `LINEBELOW`, `LINEABOVE`, `LINEBEFORE`, `LINEAFTER`
- **Text**: `FONT`, `FONTNAME`, `FONTSIZE`, `TEXTCOLOR`, `LEADING`
- **Alignment**: `ALIGN`, `VALIGN`, `LEFTPADDING`, `RIGHTPADDING`, `TOPPADDING`, `BOTTOMPADDING`
- **Special**: `SPAN`, `NOSPLIT`, `SPLITFIRST`, `SPLITLAST`

**Cell Addressing**:
```python
(0, 0)     # Single cell (col, row)
(0, 0), (2, 1)  # Rectangle from (0,0) to (2,1)
(-1, -1)   # Last cell
(0, 0), (-1, -1)  # Entire table
```

**NanoPDF Extension Needed**:

```rust
pub struct TableStyle {
    pub commands: Vec<TableStyleCommand>,
}

pub enum TableStyleCommand {
    // Background
    Background { start: (i32, i32), end: (i32, i32), color: Color },
    RowBackgrounds { start: (i32, i32), end: (i32, i32), colors: Vec<Color> },

    // Grid
    Grid { start: (i32, i32), end: (i32, i32), width: f32, color: Color },
    Box { start: (i32, i32), end: (i32, i32), width: f32, color: Color },
    LineBelow { start: (i32, i32), end: (i32, i32), width: f32, color: Color },
    LineAbove { start: (i32, i32), end: (i32, i32), width: f32, color: Color },

    // Text
    Font { start: (i32, i32), end: (i32, i32), name: String },
    FontSize { start: (i32, i32), end: (i32, i32), size: f32 },
    TextColor { start: (i32, i32), end: (i32, i32), color: Color },

    // Alignment
    Align { start: (i32, i32), end: (i32, i32), align: TextAlign },
    VAlign { start: (i32, i32), end: (i32, i32), valign: VAlign },

    // Padding
    LeftPadding { start: (i32, i32), end: (i32, i32), padding: f32 },
    RightPadding { start: (i32, i32), end: (i32, i32), padding: f32 },
    TopPadding { start: (i32, i32), end: (i32, i32), padding: f32 },
    BottomPadding { start: (i32, i32), end: (i32, i32), padding: f32 },

    // Special
    Span { start: (i32, i32), end: (i32, i32) },
    NoSplit { start: (i32, i32), end: (i32, i32) },
}

pub enum VAlign {
    Top,
    Middle,
    Bottom,
}

// FFI Functions
np_table_style_create() -> Handle
np_table_style_add_command(style: Handle, command: TableStyleCommand)
np_table_set_style(table: Handle, style: Handle)
np_table_set_col_widths(table: Handle, widths: Vec<f32>)
np_table_set_row_heights(table: Handle, heights: Vec<f32>)
np_table_set_repeat_rows(table: Handle, count: u32)  // Header rows to repeat
```

**Use Cases**:
- ✅ Financial reports with alternating rows
- ✅ Data tables with conditional formatting
- ✅ Complex layouts with spanning cells
- ✅ Professional invoices and statements
- ✅ Scientific papers with formatted tables

---

### 5. PageTemplates: Layout Templates

**Status**: ⚠️ Basic in FPDF (callbacks), ❌ Not in others
**ReportLab Feature**: Frame-based page layouts with multiple templates
**Value**: Complex page layouts with headers/footers/sidebars

#### PageTemplate Example:

```python
from reportlab.platypus import PageTemplate, Frame
from reportlab.lib.pagesizes import letter

def header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('Helvetica-Bold', 16)
    canvas.drawString(72, letter[1] - 50, "My Report")
    # Footer
    canvas.setFont('Helvetica', 9)
    canvas.drawString(72, 50, f"Page {doc.page}")
    canvas.restoreState()

# Define frames
header_frame = Frame(
    72, letter[1] - 100, letter[0] - 144, 50,
    id='header'
)

main_frame = Frame(
    72, 100, letter[0] - 144, letter[1] - 250,
    id='main',
    showBoundary=0
)

# Two-column layout
left_frame = Frame(
    72, 100, (letter[0] - 144) / 2 - 6, letter[1] - 250,
    id='left'
)

right_frame = Frame(
    72 + (letter[0] - 144) / 2 + 6, 100,
    (letter[0] - 144) / 2 - 6, letter[1] - 250,
    id='right'
)

# Create templates
first_page = PageTemplate(
    id='First',
    frames=[header_frame, main_frame],
    onPage=header_footer
)

later_pages = PageTemplate(
    id='Later',
    frames=[left_frame, right_frame],
    onPage=header_footer
)

doc = BaseDocTemplate('output.pdf',
    pageTemplates=[first_page, later_pages]
)
```

**Features**:
- Multiple frames per page
- Different templates for different pages
- Callback functions for dynamic content
- Frame chaining and flow control
- Switchable templates mid-document

**NanoPDF Extension Needed**:

```rust
pub struct PageTemplate {
    pub id: String,
    pub frames: Vec<Frame>,
    pub page_size: PageSize,
    pub on_page: Option<Box<dyn Fn(&mut Canvas, &Document)>>,
    pub on_page_end: Option<Box<dyn Fn(&mut Canvas, &Document)>>,
}

pub struct Frame {
    pub id: String,
    pub x1: f32,
    pub y1: f32,
    pub width: f32,
    pub height: f32,
    pub left_padding: f32,
    pub bottom_padding: f32,
    pub right_padding: f32,
    pub top_padding: f32,
    pub show_boundary: bool,
}

// FFI Functions
np_page_template_create(id: &str, frames: Vec<Frame>) -> Handle
np_page_template_set_callback(template: Handle, callback: extern "C" fn(*mut Canvas, *const Document))
np_doc_add_page_template(doc: Handle, template: Handle)
np_doc_switch_template(doc: Handle, template_id: &str)
np_frame_create(id: &str, x: f32, y: f32, width: f32, height: f32) -> Frame
```

**Use Cases**:
- ✅ First page different from rest
- ✅ Multi-column magazines/newsletters
- ✅ Sidebar layouts
- ✅ Complex page structures
- ✅ Dynamic headers/footers

---

### 6. Automatic Table of Contents

**Status**: ❌ Not in other libraries
**ReportLab Feature**: Auto-generated TOC with page numbers
**Value**: Professional documentation

#### TOC Generation:

```python
from reportlab.platypus import TableOfContents, Paragraph
from reportlab.lib.styles import ParagraphStyle

# 1. Create TOC
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOC1', fontSize=14, leftIndent=20),
    ParagraphStyle(name='TOC2', fontSize=12, leftIndent=40),
    ParagraphStyle(name='TOC3', fontSize=10, leftIndent=60),
]

story = [toc]

# 2. Add content with bookmarks
story.append(Paragraph('Chapter 1', styles['Heading1']))
toc.addEntry(0, 'Chapter 1', 1)  # Level 0, text, page number

story.append(Paragraph('Section 1.1', styles['Heading2']))
toc.addEntry(1, 'Section 1.1', 1)

# 3. Build - TOC is populated automatically
doc.build(story)
```

**Features**:
- Multi-level TOC (h1, h2, h3, etc.)
- Auto page number detection
- Clickable links
- Custom styling per level
- Leader dots (.......)
- Right-aligned page numbers

**NanoPDF Extension Needed**:

```rust
pub struct TableOfContents {
    pub entries: Vec<TocEntry>,
    pub level_styles: Vec<ParagraphStyle>,
    pub show_page_numbers: bool,
    pub use_dots: bool,  // Leader dots
    pub dot_separator: String,
}

pub struct TocEntry {
    pub level: u32,
    pub text: String,
    pub page_number: u32,
    pub bookmark: String,
}

// FFI Functions
np_toc_create() -> Handle
np_toc_add_entry(toc: Handle, level: u32, text: &str, page: u32)
np_toc_set_level_style(toc: Handle, level: u32, style: ParagraphStyle)
np_toc_generate(toc: Handle) -> Vec<Handle>  // Returns flowables
```

**Use Cases**:
- ✅ Books and manuals
- ✅ Technical documentation
- ✅ Reports with navigation
- ✅ Legal documents
- ✅ Academic papers

---

### 7. Charts & Graphics: ReportLab Graphics

**Status**: ❌ Not in other libraries (or very basic)
**ReportLab Feature**: Integrated charting and graphics library
**Value**: Professional data visualization in PDFs

#### Chart Types:

```python
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing

# Line Chart
drawing = Drawing(400, 200)
lc = HorizontalLineChart()
lc.x = 50
lc.y = 50
lc.height = 125
lc.width = 300
lc.data = [
    [13, 5, 20, 22, 37, 45, 19, 4],
    [5, 20, 46, 38, 23, 21, 6, 14]
]
lc.categoryAxis.categoryNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']
lc.valueAxis.valueMin = 0
lc.valueAxis.valueMax = 60
lc.valueAxis.valueStep = 15
lc.lines[0].strokeColor = colors.blue
lc.lines[1].strokeColor = colors.red
drawing.add(lc)

# Add to document
story.append(drawing)
```

**Available Charts**:
1. **Line Charts**: Single/multi-line, with markers
2. **Bar Charts**: Vertical/horizontal, stacked, grouped
3. **Pie Charts**: 2D/3D, exploded slices, labels
4. **Area Charts**: Filled line charts
5. **Spider/Radar Charts**: Multi-axis comparisons
6. **Scatter Plots**: X-Y plots
7. **Candlestick Charts**: Financial data
8. **Box Plots**: Statistical distributions

**Chart Customization**:
- Colors, fonts, sizes
- Axes labels and ticks
- Legends
- Grid lines
- Data labels
- Annotations
- Multiple data series

**NanoPDF Extension Needed**:

```rust
pub struct Chart {
    pub chart_type: ChartType,
    pub width: f32,
    pub height: f32,
    pub data: ChartData,
    pub style: ChartStyle,
}

pub enum ChartType {
    Line,
    Bar,
    Pie,
    Area,
    Scatter,
    Spider,
    Candlestick,
    BoxPlot,
}

pub struct ChartData {
    pub series: Vec<DataSeries>,
    pub categories: Vec<String>,
}

pub struct DataSeries {
    pub name: String,
    pub values: Vec<f64>,
    pub color: Color,
}

pub struct ChartStyle {
    pub title: Option<String>,
    pub x_label: Option<String>,
    pub y_label: Option<String>,
    pub legend_position: LegendPosition,
    pub grid_lines: bool,
    pub colors: Vec<Color>,
}

// FFI Functions
np_chart_create(chart_type: ChartType, width: f32, height: f32) -> Handle
np_chart_add_series(chart: Handle, series: DataSeries)
np_chart_set_categories(chart: Handle, categories: Vec<String>)
np_chart_set_style(chart: Handle, style: ChartStyle)
np_chart_to_flowable(chart: Handle) -> Handle
```

**Use Cases**:
- ✅ Business reports with charts
- ✅ Financial statements
- ✅ Scientific papers with graphs
- ✅ Dashboard reports
- ✅ Data analysis documents

---

## 📊 MEDIUM PRIORITY: Layout Control

### 8. Keep-Together & Keep-With-Next

**Status**: ❌ Not in other libraries
**ReportLab Feature**: Widow/orphan control and smart pagination
**Value**: Professional page breaks

#### Keep-Together:

```python
from reportlab.platypus import KeepTogether

# Keep multiple flowables on same page
invoice_header = [
    Paragraph("INVOICE", styles['Title']),
    Paragraph(f"Invoice #: {invoice_num}", styles['Normal']),
    Paragraph(f"Date: {date}", styles['Normal']),
]

story.append(KeepTogether(invoice_header))
```

#### Keep-With-Next:

```python
# Heading stays with following paragraph
heading = Paragraph("Section Title", styles['Heading'])
heading.keepWithNext = True
story.append(heading)
story.append(Paragraph("Content...", styles['Normal']))
```

**NanoPDF Extension Needed**:

```rust
pub struct KeepTogether {
    pub flowables: Vec<Box<dyn Flowable>>,
    pub max_height: Option<f32>,
}

impl Flowable for KeepTogether {
    fn wrap(&mut self, aw: f32, ah: f32) -> (f32, f32) {
        // Calculate total height
        let total_height: f32 = self.flowables.iter()
            .map(|f| f.wrap(aw, ah).1)
            .sum();
        (aw, total_height)
    }

    fn split(&self, ah: f32) -> Vec<Box<dyn Flowable>> {
        // If doesn't fit, move all to next page
        vec![]  // Don't split
    }
}

// FFI Functions
np_keep_together_create(flowables: Vec<Handle>) -> Handle
np_flowable_set_keep_with_next(flowable: Handle, keep: bool)
np_flowable_set_space_before(flowable: Handle, space: f32)
np_flowable_set_space_after(flowable: Handle, space: f32)
```

**Use Cases**:
- ✅ Keep headings with content
- ✅ Invoice headers on one page
- ✅ Signature blocks together
- ✅ Table rows together
- ✅ Professional pagination

---

### 9. Conditional Page Breaks

**Status**: ❌ Not in other libraries
**ReportLab Feature**: Smart conditional breaks
**Value**: Control when breaks occur

```python
from reportlab.platypus import CondPageBreak

# Break only if less than 2 inches remaining
story.append(CondPageBreak(2 * inch))
story.append(Paragraph("Important section", styles['Heading']))
```

**NanoPDF Extension Needed**:

```rust
pub struct CondPageBreak {
    pub min_space: f32,  // Break if less than this
}

// FFI Functions
np_cond_page_break_create(min_space: f32) -> Handle
```

---

### 10. Multi-Column Layouts

**Status**: ❌ Not comprehensively in other libraries
**ReportLab Feature**: True multi-column flow with balancing
**Value**: Magazine/newsletter layouts

```python
# Two-column layout
left_frame = Frame(72, 72, 2.5*inch, 9*inch, id='left')
right_frame = Frame(3*inch + 72, 72, 2.5*inch, 9*inch, id='right')

template = PageTemplate(
    id='TwoColumn',
    frames=[left_frame, right_frame]
)

# Content flows left column, then right, then next page
```

**Features**:
- Auto column balancing
- Different column counts per page
- Spanning content across columns
- Column rules (vertical lines)

**NanoPDF Extension Needed**:

```rust
// Already covered by Frame system in PageTemplate
// But add convenience functions
np_create_multi_column_template(columns: u32, gutter: f32) -> Handle
np_create_balanced_columns(flowables: Vec<Handle>, columns: u32) -> Handle
```

---

## 💡 LOW PRIORITY: Enhanced Features

### 11. Drawing Primitives on Canvas

**Status**: ⚠️ Basic in most libraries
**ReportLab Feature**: Rich canvas drawing API
**Value**: Vector graphics control

```python
from reportlab.pdfgen import canvas

c = canvas.Canvas("output.pdf")

# Shapes
c.rect(100, 100, 200, 100)
c.circle(200, 200, 50)
c.ellipse(100, 100, 300, 200)

# Paths
c.moveTo(100, 100)
c.lineTo(200, 200)
c.bezier(100, 100, 150, 200, 200, 200, 250, 100)

# Text
c.setFont("Helvetica", 12)
c.drawString(100, 500, "Hello")
c.drawCentredString(300, 500, "Centered")
c.drawRightString(500, 500, "Right-aligned")

# Advanced
c.rotate(45)
c.scale(1.5, 1.5)
c.translate(50, 50)
c.skew(30, 45)

c.save()
```

**Note**: This is already well-covered by MuPDF/existing FFI

---

## Implementation Roadmap

### Phase 1: Platypus Core (Q1 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 6-8 weeks

- [x] DocTemplate architecture
- [x] Frame system
- [x] Flowable trait
- [x] Story building engine
- [x] Automatic pagination

**Deliverables**:
- `DocTemplate`, `Frame`, `PageTemplate` structs
- `Flowable` trait
- Layout engine with auto page breaks

---

### Phase 2: Core Flowables (Q1-Q2 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 4-5 weeks

- [x] Paragraph flowable with rich text
- [x] Spacer, PageBreak, CondPageBreak
- [x] KeepTogether
- [x] Table flowable
- [x] Image flowable

**Deliverables**:
- All core flowable types
- Wrap/draw/split implementations

---

### Phase 3: Paragraph Styles (Q2 2026)
**Priority**: 🔥 CRITICAL
**Estimated Effort**: 3-4 weeks

- [x] ParagraphStyle system
- [x] Style inheritance
- [x] Rich text parser (inline tags)
- [x] Widow/orphan control
- [x] Justification and hyphenation

**Deliverables**:
- `ParagraphStyle` struct with all attributes
- Rich text parser
- Typography engine

---

### Phase 4: TableStyle & Advanced Tables (Q2-Q3 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 3-4 weeks

- [x] TableStyle commands (40+)
- [x] Cell spanning
- [x] Alternating row colors
- [x] Conditional formatting
- [x] Table splitting across pages

**Deliverables**:
- `TableStyle` system
- Advanced table renderer

---

### Phase 5: PageTemplates & TOC (Q3 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 3-4 weeks

- [x] Multiple page templates
- [x] Template switching
- [x] Callback system
- [x] Automatic TOC generation
- [x] Bookmark system

**Deliverables**:
- PageTemplate system
- TOC generator

---

### Phase 6: Charts & Graphics (Q3-Q4 2026)
**Priority**: ⭐ HIGH
**Estimated Effort**: 5-6 weeks

- [x] Chart abstraction layer
- [x] Line/Bar/Pie charts
- [x] Chart styling
- [x] Legend system
- [x] Integration with plotters crate

**Deliverables**:
- Chart API
- Multiple chart types
- Graphics rendering

---

### Phase 7: Layout Control (Q4 2026)
**Priority**: 📊 MEDIUM
**Estimated Effort**: 2-3 weeks

- [x] Keep-together/with-next
- [x] Conditional breaks
- [x] Multi-column balancing
- [x] Frame chaining

**Deliverables**:
- Advanced layout controls
- Smart pagination

---

## Technical Considerations

### Architecture Integration

**FFI Layer** (`ffi/reportlab_extensions/`):
```
nanopdf-rs/src/ffi/reportlab_extensions/
  ├── doctemplate.rs   - Document templates
  ├── flowables.rs     - Flowable system
  ├── paragraph.rs     - Paragraph and styles
  ├── table.rs         - Table and styles
  ├── charts.rs        - Charts and graphics
  ├── toc.rs           - Table of contents
  └── mod.rs
```

**Core Rust** (`fitz/reportlab/`):
```
nanopdf-rs/src/fitz/reportlab/
  ├── platypus/
  │   ├── doctemplate.rs
  │   ├── flowables.rs
  │   ├── frames.rs
  │   └── mod.rs
  ├── styles/
  │   ├── paragraph_style.rs
  │   ├── table_style.rs
  │   └── mod.rs
  ├── typography/
  │   ├── rich_text.rs
  │   ├── justification.rs
  │   └── mod.rs
  ├── charts/
  │   ├── line.rs
  │   ├── bar.rs
  │   ├── pie.rs
  │   └── mod.rs
  └── mod.rs
```

### Dependencies

**Rust Crates**:
- `xml-rs` or `roxmltree` - Rich text parsing
- `unicode-segmentation` - Text segmentation
- `hyphenation` - Word hyphenation
- `plotters` - Chart generation (optional)
- `tiny-skia` - Graphics rendering
- `rusttype` or `ab_glyph` - Font rendering

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Build 100-page doc | <500ms | With Platypus |
| Paragraph wrap | <1ms | Per paragraph |
| Table render (50 rows) | <50ms | With styles |
| Chart generation | <100ms | Simple chart |
| TOC generation | <50ms | 100 entries |
| Rich text parse | <5ms | Per paragraph |

---

## Competitive Advantage

By implementing ReportLab features, NanoPDF becomes:

1. ✅ **The ONLY comprehensive PDF library** combining:
   - MuPDF: Reading/rendering
   - pypdf: Manipulation
   - FPDF: Basic generation
   - pdfcpu: Print production
   - **ReportLab: Professional document composition**

2. ✅ **Enterprise-grade document generation**:
   - Automatic layout and pagination
   - Professional typography
   - Modular, reusable components
   - Complex page layouts

3. ✅ **Best-in-class for**:
   - Reports and documentation
   - Books and manuals
   - Invoices and statements
   - Technical documentation
   - Any multi-page generated document

4. ✅ **Market positioning**:
   - **ReportLab (Python)**: $3,000+/year commercial license
   - **NanoPDF (Rust)**: Open source + performance
   - **Gap filled**: Enterprise PDF generation in Rust

---

## Conclusion

ReportLab represents the **highest value** addition to NanoPDF:

- **Critical Market Gap**: No comprehensive document generation in Rust
- **Enterprise Need**: Companies pay thousands for ReportLab licenses
- **Unique Features**: Platypus, flowables, automatic layout not in any other library
- **Complete Solution**: With FPDF + pdfcpu + ReportLab features, NanoPDF is **unmatched**

**Combined Value** (all three extensions):

| Library | Category | Added Value |
|---------|----------|-------------|
| **FPDF** | Document Generation | Cell layouts, tables, HTML, templates |
| **pdfcpu** | Print Production | Page boxes, N-Up, validation, booklets |
| **ReportLab** | Professional Composition | Platypus, flowables, auto-layout, typography |

**Result**: **The world's most complete PDF library** 🚀

---

**Status**: 📋 Feature Planning
**Next Steps**: Prioritize Phases 1-3 (Platypus, Flowables, Styles) for foundation
**Estimated Total Effort**: 26-34 weeks for complete implementation
**Target Release**: Q4 2026 (all phases)
**Market Impact**: **CRITICAL** - Enterprise document generation is a massive market
**ROI**: Highest of all three extension opportunities

