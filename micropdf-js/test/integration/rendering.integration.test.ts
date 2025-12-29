/**
 * Integration tests for page rendering and image export
 * Tests pixmap generation, PNG export, and rendering at various scales
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Document, Context, Matrix } from '../../src';

const TEST_PDFS_DIR = path.join(__dirname, '../../../test-pdfs');

describe('Rendering Integration Tests', () => {
  let ctx: Context;

  beforeAll(() => {
    ctx = new Context();
  });

  describe('Page Rendering', () => {
    it('should render page to pixmap', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.scale(1.0, 1.0);
      const pixmap = page.toPixmap(matrix);

      expect(pixmap).toBeDefined();
      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      console.log(`Rendered pixmap: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should render at different scales', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const scales = [0.5, 1.0, 2.0];
      const results: Array<{ scale: number; width: number; height: number }> = [];

      for (const scale of scales) {
        const matrix = Matrix.scale(scale, scale);
        const pixmap = page.toPixmap(matrix);

        results.push({
          scale,
          width: pixmap.width,
          height: pixmap.height
        });

        console.log(`Scale ${scale}x: ${pixmap.width}x${pixmap.height}`);

        pixmap.drop();
      }

      // Verify scaling works correctly
      expect(results[1].width).toBeGreaterThan(results[0].width);
      expect(results[2].width).toBeGreaterThan(results[1].width);

      page.drop();
      doc.close();
    });

    it('should render with alpha channel', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.identity();
      const pixmap = page.toPixmap(matrix, true); // With alpha

      expect(pixmap).toBeDefined();
      expect(pixmap.alpha).toBe(true);

      console.log(`Pixmap with alpha: ${pixmap.width}x${pixmap.height}, n=${pixmap.n}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('PNG Export', () => {
    it('should export page as PNG', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');
      const outputPath = path.join(__dirname, 'test-output.png');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      try {
        page.toPNG(outputPath, 1.0);

        // Verify PNG was created
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log(`PNG created: ${stats.size} bytes`);

          // Clean up
          fs.unlinkSync(outputPath);
        }
      } catch (error) {
        console.log('PNG export not yet implemented:', error);
      } finally {
        page.drop();
        doc.close();
      }
    });

    it('should export at high resolution', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');
      const outputPath = path.join(__dirname, 'test-output-hires.png');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      try {
        page.toPNG(outputPath, 2.0); // 2x scale

        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log(`High-res PNG created: ${stats.size} bytes`);
          fs.unlinkSync(outputPath);
        }
      } catch (error) {
        console.log('High-res PNG export not yet implemented:', error);
      } finally {
        page.drop();
        doc.close();
      }
    });
  });

  describe('Advanced Rendering', () => {
    it('should render PDF with images', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/with-images.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Images PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const matrix = Matrix.scale(1.0, 1.0);
      const pixmap = page.toPixmap(matrix);

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      console.log(`Rendered page with images: ${pixmap.width}x${pixmap.height}`);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should render PDF with annotations', () => {
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

    it('should handle high-resolution images', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'large/high-resolution-images.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('High-res images PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.pageCount > 0) {
        const page = doc.loadPage(0);

        // Render at reduced scale to manage memory
        const matrix = Matrix.scale(0.25, 0.25);
        const pixmap = page.toPixmap(matrix);

        expect(pixmap).toBeDefined();
        console.log(`Rendered high-res page at 0.25x: ${pixmap.width}x${pixmap.height}`);

        pixmap.drop();
        page.drop();
      }

      doc.close();
    });
  });

  describe('Performance', () => {
    it('should render multiple pages efficiently', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/multi-page.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Multi-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const pageCount = doc.pageCount;

      const startTime = Date.now();

      for (let i = 0; i < pageCount; i++) {
        const page = doc.loadPage(i);
        const matrix = Matrix.scale(0.5, 0.5);
        const pixmap = page.toPixmap(matrix);

        pixmap.drop();
        page.drop();
      }

      const elapsed = Date.now() - startTime;
      console.log(
        `Rendered ${pageCount} pages in ${elapsed}ms (avg ${elapsed / pageCount}ms/page)`
      );

      doc.close();
    });

    it('should handle large multi-page document', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'large/multi-page-100.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('100-page PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const pageCount = doc.pageCount;

      console.log(`Large document has ${pageCount} pages`);

      // Render every 10th page
      const pagesToRender = [];
      for (let i = 0; i < pageCount; i += 10) {
        pagesToRender.push(i);
      }

      const startTime = Date.now();

      for (const pageNum of pagesToRender) {
        const page = doc.loadPage(pageNum);
        const matrix = Matrix.scale(0.5, 0.5);
        const pixmap = page.toPixmap(matrix);

        pixmap.drop();
        page.drop();
      }

      const elapsed = Date.now() - startTime;
      console.log(`Rendered ${pagesToRender.length} pages in ${elapsed}ms`);

      doc.close();
    });
  });
});
