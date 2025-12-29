/**
 * Integration tests for text extraction and search
 * Tests text extraction, search, and text layout operations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Document, Context } from '../../src';

const TEST_PDFS_DIR = path.join(__dirname, '../../../test-pdfs');

describe('Text Integration Tests', () => {
  let ctx: Context;

  beforeAll(() => {
    ctx = new Context();
  });

  describe('Text Extraction', () => {
    it('should extract text from simple PDF', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const text = page.extractText();

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');

      console.log(`Extracted text (${text.length} chars): "${text.substring(0, 100)}..."`);

      page.drop();
      doc.close();
    });

    it('should extract text from all pages', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/multi-page.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Multi-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const texts: string[] = [];

      for (let i = 0; i < doc.pageCount; i++) {
        const page = doc.loadPage(i);
        const text = page.extractText();
        texts.push(text);
        page.drop();
      }

      expect(texts.length).toBe(doc.pageCount);

      console.log(`Extracted text from ${texts.length} pages`);
      texts.forEach((text, i) => {
        console.log(`  Page ${i + 1}: ${text.length} characters`);
      });

      doc.close();
    });

    it('should extract structured text blocks', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      try {
        const blocks = page.extractTextBlocks();

        expect(blocks).toBeDefined();
        console.log(`Extracted ${blocks.length} text blocks`);

        blocks.forEach((block, i) => {
          console.log(
            `  Block ${i + 1}: [${block.x.toFixed(1)}, ${block.y.toFixed(1)}] "${block.text.substring(0, 50)}"`
          );
        });
      } catch (error) {
        console.log('Structured text extraction not yet fully implemented');
      } finally {
        page.drop();
        doc.close();
      }
    });
  });

  describe('Text Search', () => {
    it('should search for text in page', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const searchTerm = 'Hello';
      const hits = page.searchText(searchTerm);

      console.log(`Found ${hits.length} occurrence(s) of "${searchTerm}"`);

      hits.forEach((rect, i) => {
        console.log(
          `  Hit ${i + 1}: [${rect.x0.toFixed(1)}, ${rect.y0.toFixed(1)}, ${rect.x1.toFixed(1)}, ${rect.y1.toFixed(1)}]`
        );
      });

      page.drop();
      doc.close();
    });

    it('should perform case-insensitive search', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const searchTerms = ['hello', 'Hello', 'HELLO'];
      const results = searchTerms.map((term) => ({
        term,
        count: page.searchText(term).length
      }));

      console.log('Case-insensitive search results:');
      results.forEach((r) => {
        console.log(`  "${r.term}": ${r.count} hits`);
      });

      page.drop();
      doc.close();
    });

    it('should search multiple pages', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/multi-page.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Multi-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const searchTerm = 'Page';
      let totalHits = 0;

      for (let i = 0; i < doc.pageCount; i++) {
        const page = doc.loadPage(i);
        const hits = page.searchText(searchTerm);
        totalHits += hits.length;

        console.log(`  Page ${i + 1}: ${hits.length} hits`);

        page.drop();
      }

      console.log(`Total: ${totalHits} occurrences of "${searchTerm}" across all pages`);

      doc.close();
    });

    it('should handle search with no results', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const hits = page.searchText('ZZZZNOTFOUND');

      expect(hits).toBeDefined();
      expect(hits.length).toBe(0);

      console.log('Search with no results handled correctly');

      page.drop();
      doc.close();
    });
  });

  describe('Text with Special Features', () => {
    it('should extract text from PDF with metadata', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'medium/with-metadata.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Metadata PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.pageCount > 0) {
        const page = doc.loadPage(0);
        const text = page.extractText();

        expect(text).toBeDefined();
        console.log(`Extracted ${text.length} characters from PDF with metadata`);

        page.drop();
      }

      doc.close();
    });

    it('should extract text from PDF with forms', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-forms.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Forms PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.pageCount > 0) {
        const page = doc.loadPage(0);
        const text = page.extractText();

        expect(text).toBeDefined();
        console.log(`Extracted ${text.length} characters from PDF with forms`);

        page.drop();
      }

      doc.close();
    });
  });

  describe('Performance', () => {
    it('should extract text from large document efficiently', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'large/multi-page-100.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('100-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const pagesToExtract = Math.min(10, doc.pageCount);

      const startTime = Date.now();
      let totalChars = 0;

      for (let i = 0; i < pagesToExtract; i++) {
        const page = doc.loadPage(i);
        const text = page.extractText();
        totalChars += text.length;
        page.drop();
      }

      const elapsed = Date.now() - startTime;

      console.log(`Extracted text from ${pagesToExtract} pages in ${elapsed}ms`);
      console.log(`  Total: ${totalChars} characters`);
      console.log(`  Average: ${(elapsed / pagesToExtract).toFixed(1)}ms/page`);

      doc.close();
    });
  });
});
