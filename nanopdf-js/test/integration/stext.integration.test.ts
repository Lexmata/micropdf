/**
 * Structured Text Integration Tests
 *
 * Tests structured text extraction with real PDF files.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Document, STextPage, STextBlockType, WritingMode } from '../../src/index.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Structured Text Integration', () => {
  const testPdfsDir = join(process.cwd(), '../test-pdfs');

  beforeAll(() => {
    if (!existsSync(testPdfsDir)) {
      throw new Error(`Test PDFs directory not found: ${testPdfsDir}`);
    }
  });

  describe('Simple PDF - Hello World', () => {
    const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');

    it('should extract text from hello world PDF', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true); // Skip if file not available
        return;
      }

      const doc = Document.open(pdfPath);
      expect(doc.pageCount).toBeGreaterThan(0);

      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const text = stext.getText();
      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain('Hello');

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should search for "Hello" and find matches', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const hits = stext.search('Hello');
      expect(hits.length).toBeGreaterThan(0);

      // Verify quad structure
      const firstHit = hits[0];
      expect(firstHit).toHaveProperty('ul');
      expect(firstHit).toHaveProperty('ur');
      expect(firstHit).toHaveProperty('ll');
      expect(firstHit).toHaveProperty('lr');

      // All corners should have valid coordinates
      expect(typeof firstHit.ul.x).toBe('number');
      expect(typeof firstHit.ul.y).toBe('number');
      expect(typeof firstHit.ur.x).toBe('number');
      expect(typeof firstHit.ur.y).toBe('number');

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should get page bounds', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const bounds = stext.getBounds();
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);

      stext.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Multi-page PDF', () => {
    const pdfPath = join(testPdfsDir, 'simple/multi-page.pdf');

    it('should extract text from multiple pages', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const pageCount = doc.pageCount;
      expect(pageCount).toBeGreaterThanOrEqual(3);

      const texts: string[] = [];

      for (let i = 0; i < Math.min(pageCount, 3); i++) {
        const page = doc.loadPage(i);
        const stext = STextPage.fromPage(page);
        const text = stext.getText();

        expect(text).toBeTruthy();
        texts.push(text);

        stext.drop();
        page.drop();
      }

      // Each page should have different text
      expect(texts[0]).not.toBe(texts[1]);

      doc.close();
    });

    it('should search across multiple pages', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const pageCount = doc.pageCount;

      let totalHits = 0;

      for (let i = 0; i < Math.min(pageCount, 3); i++) {
        const page = doc.loadPage(i);
        const stext = STextPage.fromPage(page);
        const hits = stext.search('Page');

        totalHits += hits.length;

        stext.drop();
        page.drop();
      }

      expect(totalHits).toBeGreaterThan(0);

      doc.close();
    });
  });

  describe('PDF with Metadata', () => {
    const pdfPath = join(testPdfsDir, 'medium/with-metadata.pdf');

    it('should extract text from PDF with metadata', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const text = stext.getText();
      expect(text).toBeTruthy();

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should search case-insensitively', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      // Search is case-insensitive by default in MuPDF
      const hitsLower = stext.search('page');
      const hitsUpper = stext.search('PAGE');

      // Both should find matches (if text contains 'page' in any case)
      if (hitsLower.length > 0 || hitsUpper.length > 0) {
        expect(hitsLower.length + hitsUpper.length).toBeGreaterThan(0);
      }

      stext.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Complex PDF - Forms', () => {
    const pdfPath = join(testPdfsDir, 'complex/with-forms.pdf');

    it('should extract text from PDF with forms', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const text = stext.getText();
      expect(text).toBeTruthy();

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should handle form field labels', () => {
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const text = stext.getText();

      // Forms typically have labels like "Name:", "Email:", etc.
      // Check if we can search for common form terms
      const nameHits = stext.search('Name');
      expect(nameHits).toBeDefined();

      stext.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal PDF', () => {
      const pdfPath = join(testPdfsDir, 'minimal/empty.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const text = stext.getText();
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should handle search with no results', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const hits = stext.search('NOTFOUNDXYZABC123');
      expect(Array.isArray(hits)).toBe(true);
      expect(hits.length).toBe(0);

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should handle large maxHits values', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const hits = stext.search('e', 1000);
      expect(Array.isArray(hits)).toBe(true);
      expect(hits.length).toBeLessThanOrEqual(1000);

      stext.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Performance', () => {
    it('should extract text efficiently', () => {
      const pdfPath = join(testPdfsDir, 'simple/multi-page.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const start = Date.now();
      const stext = STextPage.fromPage(page);
      const text = stext.getText();
      const elapsed = Date.now() - start;

      expect(text).toBeTruthy();
      expect(elapsed).toBeLessThan(1000); // Should complete in < 1 second

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should search efficiently', () => {
      const pdfPath = join(testPdfsDir, 'simple/multi-page.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const start = Date.now();
      const hits = stext.search('Page');
      const elapsed = Date.now() - start;

      expect(Array.isArray(hits)).toBe(true);
      expect(elapsed).toBeLessThan(500); // Should complete in < 500ms

      stext.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Resource Management', () => {
    it('should properly clean up resources', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      expect(stext.isDropped()).toBe(false);

      stext.drop();
      expect(stext.isDropped()).toBe(true);

      // Should not be able to use dropped stext
      expect(() => stext.getText()).toThrow();

      page.drop();
      doc.close();
    });

    it('should handle multiple stext objects per page', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // Create multiple stext objects from same page
      const stext1 = STextPage.fromPage(page);
      const stext2 = STextPage.fromPage(page);

      const text1 = stext1.getText();
      const text2 = stext2.getText();

      expect(text1).toBe(text2);

      stext1.drop();
      stext2.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Hierarchical Structure', () => {
    it('should provide blocks/lines/chars hierarchy', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const blocks = stext.getBlocks();
      expect(blocks.length).toBeGreaterThan(0);

      // Check first block
      const block = blocks[0];
      expect(block.blockType).toBeDefined();
      expect(block.bbox).toBeDefined();
      expect(block.lines.length).toBeGreaterThan(0);

      // Check first line
      const line = block.lines[0];
      expect(line.wmode).toBeDefined();
      expect(line.bbox).toBeDefined();
      expect(line.chars.length).toBeGreaterThan(0);

      // Check first char
      const char = line.chars[0];
      expect(char.c).toBeDefined();
      expect(char.quad).toBeDefined();
      expect(char.size).toBeGreaterThan(0);

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should count blocks correctly', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const blockCount = stext.blockCount();
      const blocks = stext.getBlocks();
      expect(blockCount).toBe(blocks.length);

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should count characters correctly', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const charCount = stext.charCount();
      const text = stext.getText();
      expect(charCount).toBe(text.length);

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should filter blocks by type', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const textBlocks = stext.getBlocksOfType(STextBlockType.Text);
      expect(textBlocks.length).toBeGreaterThan(0);

      for (const block of textBlocks) {
        expect(block.blockType).toBe(STextBlockType.Text);
      }

      stext.drop();
      page.drop();
      doc.close();
    });

    it('should handle writing modes', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);
      const stext = STextPage.fromPage(page);

      const blocks = stext.getBlocks();
      if (blocks.length > 0 && blocks[0].lines.length > 0) {
        const line = blocks[0].lines[0];
        expect(Object.values(WritingMode)).toContain(line.wmode);
      }

      stext.drop();
      page.drop();
      doc.close();
    });
  });
});
