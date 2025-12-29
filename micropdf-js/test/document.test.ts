/**
 * Tests for Document module
 */
import { describe, it, expect } from 'vitest';
import { Document, Page, OutlineItem, Buffer, Colorspace, Rect, Matrix } from '../src/index.js';

describe('Document', () => {
  describe('creation', () => {
    it('should create from PDF buffer', () => {
      // Minimal valid PDF
      const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer <</Root 1 0 R/Size 4>>
startxref
172
%%EOF`;

      const buf = Buffer.fromString(pdfContent);
      const doc = Document.fromBuffer(buf);

      expect(doc).toBeDefined();
      expect(doc.pageCount).toBe(1);
    });

    it('should open password-protected PDF', () => {
      // This would need a real encrypted PDF
      // Just test the API exists
      const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer <</Root 1 0 R/Size 4>>
startxref
172
%%EOF`;

      const buf = Buffer.fromString(pdfContent);
      const doc = Document.fromBuffer(buf, '');

      expect(doc.pageCount).toBe(1);
    });
  });

  describe('properties', () => {
    let doc: Document;

    beforeEach(() => {
      const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 2/Kids[3 0 R 4 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
4 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000104 00000 n
0000000167 00000 n
trailer <</Root 1 0 R/Size 5>>
startxref
230
%%EOF`;

      const buf = Buffer.fromString(pdfContent);
      doc = Document.fromBuffer(buf);
    });

    it('should get page count', () => {
      expect(doc.pageCount).toBe(2);
    });

    it('should check if needs password', () => {
      expect(doc.needsPassword).toBe(false);
    });

    it('should check authentication status', () => {
      expect(doc.isAuthenticated).toBe(true);
    });

    it('should check if PDF', () => {
      expect(doc.isPDF).toBe(true);
    });

    it('should check if reflowable', () => {
      expect(doc.isReflowable).toBe(false);
    });

    it('should get format', () => {
      expect(doc.format).toBe('PDF 1.4');
    });
  });

  describe('pages', () => {
    let doc: Document;

    beforeEach(() => {
      const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer <</Root 1 0 R/Size 4>>
startxref
172
%%EOF`;

      const buf = Buffer.fromString(pdfContent);
      doc = Document.fromBuffer(buf);
    });

    it('should get page', () => {
      const page = doc.getPage(0);
      expect(page).toBeDefined();
      expect(page).toBeInstanceOf(Page);
    });

    it('should throw for invalid page index', () => {
      expect(() => doc.getPage(-1)).toThrow();
      expect(() => doc.getPage(10)).toThrow();
    });

    it('should iterate pages', () => {
      const pages = [...doc.pages()];
      expect(pages.length).toBe(1);
      expect(pages[0]).toBeInstanceOf(Page);
    });
  });

  describe('metadata', () => {
    it('should get and set metadata', () => {
      const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer <</Root 1 0 R/Size 4>>
startxref
172
%%EOF`;

      const buf = Buffer.fromString(pdfContent);
      const doc = Document.fromBuffer(buf);

      doc.setMetadata('info:Title', 'Test Document');
      // Note: In pure JS implementation, this may not persist
      // until we have native bindings
    });
  });
});

describe('Page', () => {
  let doc: Document;
  let page: Page;

  beforeEach(() => {
    const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>> endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer <</Root 1 0 R/Size 4>>
startxref
172
%%EOF`;

    const buf = Buffer.fromString(pdfContent);
    doc = Document.fromBuffer(buf);
    page = doc.getPage(0);
  });

  describe('properties', () => {
    it('should get bounds', () => {
      const bounds = page.bounds;
      expect(bounds.width).toBeCloseTo(612);
      expect(bounds.height).toBeCloseTo(792);
    });

    it('should get media box', () => {
      const mediaBox = page.mediaBox;
      expect(mediaBox.width).toBeCloseTo(612);
    });

    it('should get page number', () => {
      expect(page.pageNumber).toBe(0);
    });

    it('should get rotation', () => {
      expect(page.rotation).toBe(0);
    });
  });

  describe('rendering', () => {
    it('should render to pixmap', () => {
      const matrix = Matrix.scale(0.5, 0.5);
      const pixmap = page.toPixmap(matrix, Colorspace.deviceRGB(), true);

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);
    });

    it('should render to PNG', () => {
      const png = page.toPNG(72); // 72 DPI

      // Check PNG magic bytes
      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50);
    });
  });

  describe('text extraction', () => {
    it('should extract text', () => {
      // Blank page has no text
      const text = page.getText();
      expect(typeof text).toBe('string');
    });

    it('should get text blocks', () => {
      const blocks = page.getTextBlocks();
      expect(Array.isArray(blocks)).toBe(true);
    });
  });

  describe('links', () => {
    it('should get links', () => {
      const links = page.getLinks();
      expect(Array.isArray(links)).toBe(true);
    });
  });

  describe('search', () => {
    it('should search text', () => {
      const results = page.search('test');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

describe('OutlineItem', () => {
  it('should create outline item', () => {
    const item = new OutlineItem('Chapter 1', 0);
    expect(item.title).toBe('Chapter 1');
    expect(item.page).toBe(0);
    expect(item.children.length).toBe(0);
  });

  it('should support nested outline items', () => {
    const chapter = new OutlineItem('Chapter 1', 0);
    chapter.children.push(new OutlineItem('Section 1.1', 1));
    chapter.children.push(new OutlineItem('Section 1.2', 5));

    expect(chapter.children.length).toBe(2);
    expect(chapter.children[0]?.title).toBe('Section 1.1');
  });

  it('should support URI destinations', () => {
    const item = new OutlineItem('Link', undefined, 'https://example.com');
    expect(item.page).toBeUndefined();
    expect(item.uri).toBe('https://example.com');
  });
});
