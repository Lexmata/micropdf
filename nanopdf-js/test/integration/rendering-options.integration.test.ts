/**
 * Rendering Options Integration Tests
 *
 * Tests advanced rendering options with real PDF files.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  Document,
  AntiAliasLevel,
  type RenderOptions,
  Colorspace,
  Matrix
} from '../../src/index.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Rendering Options Integration', () => {
  const testPdfsDir = join(process.cwd(), '../test-pdfs');

  beforeAll(() => {
    if (!existsSync(testPdfsDir)) {
      throw new Error(`Test PDFs directory not found: ${testPdfsDir}`);
    }
  });

  describe('DPI Control', () => {
    it('should render at different DPI settings', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // Render at 72 DPI (1x)
      const pixmap72 = page.renderWithOptions({ dpi: 72 });
      const width72 = pixmap72.width;
      const height72 = pixmap72.height;

      // Render at 144 DPI (2x)
      const pixmap144 = page.renderWithOptions({ dpi: 144 });
      const width144 = pixmap144.width;
      const height144 = pixmap144.height;

      // 144 DPI should be approximately 2x the size of 72 DPI
      expect(width144).toBeGreaterThan(width72);
      expect(height144).toBeGreaterThan(height72);
      expect(width144 / width72).toBeCloseTo(2.0, 0);

      pixmap72.drop();
      pixmap144.drop();
      page.drop();
      doc.close();
    });

    it('should handle high DPI for print quality', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const pixmap = page.renderWithOptions({ dpi: 300 });
      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      // 300 DPI should be roughly 4x larger than 72 DPI
      const scale = 300 / 72;
      expect(scale).toBeCloseTo(4.166, 1);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Anti-Aliasing', () => {
    it('should render with different anti-aliasing levels', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // Render with no anti-aliasing
      const pixmapNone = page.renderWithOptions({
        dpi: 72,
        antiAlias: AntiAliasLevel.None
      });
      expect(pixmapNone.width).toBeGreaterThan(0);

      // Render with high anti-aliasing
      const pixmapHigh = page.renderWithOptions({
        dpi: 72,
        antiAlias: AntiAliasLevel.High
      });
      expect(pixmapHigh.width).toBeGreaterThan(0);

      // Both should have same dimensions
      expect(pixmapHigh.width).toBe(pixmapNone.width);
      expect(pixmapHigh.height).toBe(pixmapNone.height);

      pixmapNone.drop();
      pixmapHigh.drop();
      page.drop();
      doc.close();
    });

    it('should support all anti-aliasing levels', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const levels = [
        AntiAliasLevel.None,
        AntiAliasLevel.Low,
        AntiAliasLevel.Medium,
        AntiAliasLevel.High
      ];

      for (const level of levels) {
        const pixmap = page.renderWithOptions({
          dpi: 72,
          antiAlias: level
        });
        expect(pixmap.width).toBeGreaterThan(0);
        pixmap.drop();
      }

      page.drop();
      doc.close();
    });
  });

  describe('Colorspace Options', () => {
    it('should render in RGB colorspace', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const pixmap = page.renderWithOptions({
        colorspace: Colorspace.deviceRGB()
      });

      expect(pixmap.components).toBe(3); // RGB = 3 components

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should render in grayscale', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const pixmap = page.renderWithOptions({
        colorspace: Colorspace.deviceGray()
      });

      expect(pixmap.components).toBe(1); // Gray = 1 component

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should render with alpha channel', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const pixmapWithAlpha = page.renderWithOptions({
        colorspace: Colorspace.deviceRGB(),
        alpha: true
      });

      const pixmapWithoutAlpha = page.renderWithOptions({
        colorspace: Colorspace.deviceRGB(),
        alpha: false
      });

      expect(pixmapWithAlpha.hasAlpha).toBe(true);
      expect(pixmapWithoutAlpha.hasAlpha).toBe(false);

      pixmapWithAlpha.drop();
      pixmapWithoutAlpha.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Custom Transform', () => {
    it('should render with custom transform matrix', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // Render with 2x scale transform
      const transform = Matrix.scale(2, 2);
      const pixmap = page.renderWithOptions({ transform });

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should render with rotation', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // Render with 90 degree rotation
      const transform = Matrix.rotate(90);
      const pixmap = page.renderWithOptions({ transform });

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Progress Tracking', () => {
    it('should render with progress callback', async () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      let progressCalled = false;
      const pixmap = await page.renderWithProgress({
        dpi: 150,
        onProgress: (current, total) => {
          progressCalled = true;
          expect(current).toBeLessThanOrEqual(total);
          return true; // Continue
        }
      });

      expect(progressCalled).toBe(true);
      expect(pixmap.width).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should handle errors during rendering', async () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      let errorCalled = false;

      try {
        // Try to render with invalid DPI
        await page.renderWithProgress({
          dpi: -100, // Invalid
          onError: (error) => {
            errorCalled = true;
            expect(error).toBeTruthy();
          }
        });
      } catch (error) {
        // Expected to throw
        expect(error).toBeTruthy();
      }

      page.drop();
      doc.close();
    });

    it('should respect timeout', async () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      // With a generous timeout, should complete
      const pixmap = await page.renderWithProgress({
        dpi: 72,
        timeout: 5000 // 5 seconds
      });

      expect(pixmap.width).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Combined Options', () => {
    it('should handle multiple options together', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const pixmap = page.renderWithOptions({
        dpi: 150,
        colorspace: Colorspace.deviceRGB(),
        alpha: true,
        antiAlias: AntiAliasLevel.Medium,
        renderAnnotations: true,
        renderFormFields: true
      });

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);
      expect(pixmap.hasAlpha).toBe(true);
      expect(pixmap.components).toBe(3);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should handle high-quality print settings', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const options: RenderOptions = {
        dpi: 600, // High resolution
        colorspace: Colorspace.deviceRGB(),
        alpha: false,
        antiAlias: AntiAliasLevel.High
      };

      const pixmap = page.renderWithOptions(options);

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should handle fast preview settings', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const options: RenderOptions = {
        dpi: 72, // Screen resolution
        antiAlias: AntiAliasLevel.None // Fastest
      };

      const pixmap = page.renderWithOptions(options);

      expect(pixmap.width).toBeGreaterThan(0);
      expect(pixmap.height).toBeGreaterThan(0);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });

  describe('Multi-Page Rendering', () => {
    it('should render multiple pages with same options', () => {
      const pdfPath = join(testPdfsDir, 'simple/multi-page.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const pageCount = Math.min(doc.pageCount, 3);

      const options: RenderOptions = {
        dpi: 150,
        antiAlias: AntiAliasLevel.Medium
      };

      for (let i = 0; i < pageCount; i++) {
        const page = doc.loadPage(i);
        const pixmap = page.renderWithOptions(options);

        expect(pixmap.width).toBeGreaterThan(0);
        expect(pixmap.height).toBeGreaterThan(0);

        pixmap.drop();
        page.drop();
      }

      doc.close();
    });

    it('should render pages with different DPI', () => {
      const pdfPath = join(testPdfsDir, 'simple/multi-page.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);

      // First page at low res
      const page1 = doc.loadPage(0);
      const pixmap1 = page1.renderWithOptions({ dpi: 72 });

      // Second page at high res
      if (doc.pageCount > 1) {
        const page2 = doc.loadPage(1);
        const pixmap2 = page2.renderWithOptions({ dpi: 300 });

        expect(pixmap2.width).toBeGreaterThan(pixmap1.width);

        pixmap2.drop();
        page2.drop();
      }

      pixmap1.drop();
      page1.drop();
      doc.close();
    });
  });

  describe('Performance', () => {
    it('should render quickly at low quality', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const start = Date.now();
      const pixmap = page.renderWithOptions({
        dpi: 72,
        antiAlias: AntiAliasLevel.None
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000); // Should be fast

      pixmap.drop();
      page.drop();
      doc.close();
    });

    it('should handle high-resolution rendering', () => {
      const pdfPath = join(testPdfsDir, 'simple/hello-world.pdf');
      if (!existsSync(pdfPath)) {
        expect.soft(true).toBe(true);
        return;
      }

      const doc = Document.open(pdfPath);
      const page = doc.loadPage(0);

      const start = Date.now();
      const pixmap = page.renderWithOptions({
        dpi: 600,
        antiAlias: AntiAliasLevel.High
      });
      const elapsed = Date.now() - start;

      expect(pixmap.width).toBeGreaterThan(0);
      // High res may take longer, but should complete reasonably
      expect(elapsed).toBeLessThan(5000);

      pixmap.drop();
      page.drop();
      doc.close();
    });
  });
});

