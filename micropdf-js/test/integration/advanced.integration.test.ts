/**
 * Integration tests for advanced PDF features
 * Tests encryption, images, annotations, forms, and complex documents
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Document, Context, Matrix } from '../../src';

const TEST_PDFS_DIR = path.join(__dirname, '../../../test-pdfs');

describe('Advanced Features Integration Tests', () => {
  let ctx: Context;

  beforeAll(() => {
    ctx = new Context();
  });

  describe('Encrypted PDFs', () => {
    it('should detect encryption', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/encrypted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Encrypted PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const needsPassword = doc.needsPassword();

      console.log(`PDF encryption detected: ${needsPassword}`);
      expect(typeof needsPassword).toBe('boolean');

      doc.close();
    });

    it('should authenticate with password', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/encrypted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Encrypted PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.needsPassword()) {
        // Try wrong password
        const wrongAuth = doc.authenticate('wrongpassword');
        console.log(`Wrong password result: ${wrongAuth}`);

        // Try correct password
        const correctAuth = doc.authenticate('test123');
        console.log(`Correct password result: ${correctAuth}`);

        if (correctAuth) {
          // Should now be able to access content
          const pageCount = doc.pageCount;
          console.log(`  Unlocked document has ${pageCount} page(s)`);
        }
      }

      doc.close();
    });

    it('should check permissions on encrypted PDF', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/encrypted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Encrypted PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.needsPassword()) {
        doc.authenticate('test123');
      }

      const canPrint = doc.hasPermission(4);
      const canModify = doc.hasPermission(8);
      const canCopy = doc.hasPermission(16);

      console.log(`Permissions - Print: ${canPrint}, Modify: ${canModify}, Copy: ${canCopy}`);

      doc.close();
    });
  });

  describe('PDFs with Images', () => {
    it('should open PDF with embedded images', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-images.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Images PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`PDF with images has ${doc.pageCount} page(s)`);

      doc.close();
    });

    it('should render page with images', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-images.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Images PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.identity();
      const pixmap = page.toPixmap(matrix);

      expect(pixmap).toBeDefined();
      console.log(`Rendered page with images: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should handle high-resolution images', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'large/high-resolution-images.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('High-res PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.pageCount > 0) {
        const page = doc.loadPage(0);

        // Test at multiple scales
        const scales = [0.1, 0.5, 1.0];

        for (const scale of scales) {
          const matrix = Matrix.scale(scale, scale);
          const pixmap = page.toPixmap(matrix);

          console.log(
            `  Scale ${scale}x: ${pixmap.width}x${pixmap.height} (${pixmap.n} components)`
          );

          pixmap.drop();
        }

        page.drop();
      }

      doc.close();
    });
  });

  describe('PDFs with Annotations', () => {
    it('should open PDF with annotations', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-annotations.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Annotations PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`PDF with annotations has ${doc.pageCount} page(s)`);

      doc.close();
    });

    it('should render annotations', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-annotations.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Annotations PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.identity();
      const pixmap = page.toPixmap(matrix);

      expect(pixmap).toBeDefined();
      console.log(`Rendered page with annotations: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('PDFs with Forms', () => {
    it('should open PDF with form fields', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-forms.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Forms PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`PDF with forms has ${doc.pageCount} page(s)`);

      doc.close();
    });

    it('should render form fields', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-forms.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Forms PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.identity();
      const pixmap = page.toPixmap(matrix);

      expect(pixmap).toBeDefined();
      console.log(`Rendered page with forms: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('PDFs with Outlines', () => {
    it('should open PDF with document outline', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'medium/with-outline.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Outline PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`PDF with outline has ${doc.pageCount} page(s)`);

      doc.close();
    });
  });

  describe('PDFs with Attachments', () => {
    it('should open PDF with file attachments', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'medium/with-attachments.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Attachments PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`PDF with attachments has ${doc.pageCount} page(s)`);

      doc.close();
    });
  });

  describe('Linearized PDFs', () => {
    it('should open linearized (web-optimized) PDF', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/linearized.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Linearized PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      expect(doc.pageCount).toBeGreaterThan(0);
      console.log(`Linearized PDF has ${doc.pageCount} page(s)`);

      doc.close();
    });

    it('should render linearized PDF normally', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/linearized.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Linearized PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.identity();
      const pixmap = page.toPixmap(matrix);

      expect(pixmap).toBeDefined();
      console.log(`Rendered linearized PDF: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Large Documents', () => {
    it('should handle 100-page document', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'large/multi-page-100.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('100-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      console.log(`Large document has ${doc.pageCount} pages`);
      expect(doc.pageCount).toBeGreaterThan(50);

      // Load and render every 20th page
      const sampled = [];
      for (let i = 0; i < doc.pageCount; i += 20) {
        sampled.push(i);
      }

      const startTime = Date.now();

      for (const pageNum of sampled) {
        const page = doc.loadPage(pageNum);
        const matrix = Matrix.scale(0.5, 0.5);
        const pixmap = page.toPixmap(matrix);

        pixmap.drop();
        page.drop();
      }

      const elapsed = Date.now() - startTime;
      console.log(`  Sampled ${sampled.length} pages in ${elapsed}ms`);

      doc.close();
    });
  });

  describe('Complex Workflows', () => {
    it('should process multiple PDFs in sequence', () => {
      const pdfs = ['simple/hello-world.pdf', 'simple/multi-page.pdf', 'medium/with-metadata.pdf'];

      let processed = 0;
      let totalPages = 0;

      for (const pdfFile of pdfs) {
        const pdfPath = path.join(TEST_PDFS_DIR, pdfFile);

        if (!fs.existsSync(pdfPath)) {
          console.warn(`Skipping ${pdfFile} (not found)`);
          continue;
        }

        const doc = Document.open(pdfPath);
        totalPages += doc.pageCount;
        processed++;
        doc.close();
      }

      console.log(`Processed ${processed} PDFs with ${totalPages} total pages`);
      expect(processed).toBeGreaterThan(0);
    });

    it('should handle mixed feature PDFs', () => {
      const featurePdfs = [
        'complex/with-images.pdf',
        'complex/with-annotations.pdf',
        'complex/with-forms.pdf'
      ];

      for (const pdfFile of featurePdfs) {
        const pdfPath = path.join(TEST_PDFS_DIR, pdfFile);

        if (!fs.existsSync(pdfPath)) {
          continue;
        }

        const doc = Document.open(pdfPath);

        if (doc.pageCount > 0) {
          const page = doc.loadPage(0);
          const text = page.extractText();
          const matrix = Matrix.scale(0.5, 0.5);
          const pixmap = page.toPixmap(matrix);

          console.log(`${pdfFile}: ${text.length} chars, ${pixmap.width}x${pixmap.height} px`);

          pixmap.drop();
          page.drop();
        }

        doc.close();
      }
    });
  });
});
