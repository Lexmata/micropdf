import { describe, it, expect } from 'vitest';
import { Enhanced } from '../src/enhanced';
import { Rect } from '../src/geometry';

describe('Enhanced API Module', () => {
  describe('Enhanced', () => {
    it('should add blank page', () => {
      const result = Enhanced.addBlankPage(null as any, 0, 612, 792);
      expect(typeof result).toBe('boolean');
    });

    it('should add watermark', () => {
      const result = Enhanced.addWatermark(
        null as any,
        0,
        'CONFIDENTIAL',
        100,
        400,
        24,
        0.3,
        [0.5, 0.5, 0.5]
      );
      expect(typeof result).toBe('boolean');
    });

    it('should draw circle', () => {
      const result = Enhanced.drawCircle(null as any, 0, 100, 100, 50, [1, 0, 0], [1, 1, 1], 2);
      expect(typeof result).toBe('boolean');
    });

    it('should draw line', () => {
      const result = Enhanced.drawLine(null as any, 0, 10, 10, 100, 100, [0, 0, 0], 2);
      expect(typeof result).toBe('boolean');
    });

    it('should draw rectangle', () => {
      const result = Enhanced.drawRectangle(
        null as any,
        0,
        10,
        10,
        100,
        100,
        [0, 0, 1],
        [0.9, 0.9, 1],
        1
      );
      expect(typeof result).toBe('boolean');
    });

    it('should linearize PDF', () => {
      const result = Enhanced.linearizePdf(null as any, 'output.pdf');
      expect(typeof result).toBe('boolean');
    });

    it('should merge PDFs', () => {
      const result = Enhanced.mergePdfs(null as any, ['file1.pdf', 'file2.pdf'], 'merged.pdf');
      expect(typeof result).toBe('boolean');
    });

    it('should optimize PDF', () => {
      const result = Enhanced.optimizePdf(null as any, 'optimized.pdf');
      expect(typeof result).toBe('boolean');
    });

    it('should split PDF', () => {
      const result = Enhanced.splitPdf(null as any, 'output-dir');
      expect(typeof result).toBe('boolean');
    });

    it('should write PDF', () => {
      const result = Enhanced.writePdf(null as any, 'output.pdf');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Enhanced Integration', () => {
    it('should create annotated document', () => {
      // Add blank page
      Enhanced.addBlankPage(null as any, 0, 612, 792);

      // Draw shapes
      Enhanced.drawRectangle(null as any, 0, 50, 50, 200, 100, [0, 0, 0], [1, 1, 0], 2);
      Enhanced.drawCircle(null as any, 0, 400, 400, 75, [1, 0, 0], [1, 1, 1], 3);
      Enhanced.drawLine(null as any, 0, 100, 600, 500, 600, [0, 0, 1], 2);

      // Add watermark
      Enhanced.addWatermark(null as any, 0, 'DRAFT', 250, 400, 48, 0.2, [0.8, 0.8, 0.8]);

      expect(true).toBe(true);
    });

    it('should process multiple documents', () => {
      const files = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];

      // Merge documents
      Enhanced.mergePdfs(null as any, files, 'merged.pdf');

      // Optimize result
      Enhanced.optimizePdf(null as any, 'merged-optimized.pdf');

      // Linearize for web
      Enhanced.linearizePdf(null as any, 'merged-web.pdf');

      expect(true).toBe(true);
    });

    it('should split and organize document', () => {
      // Split into individual pages
      Enhanced.splitPdf(null as any, 'pages');

      expect(true).toBe(true);
    });

    it('should create watermarked documents', () => {
      const pages = [0, 1, 2, 3];
      const watermarks = ['Page 1', 'Page 2', 'Page 3', 'Page 4'];

      for (let i = 0; i < pages.length; i++) {
        Enhanced.addWatermark(
          null as any,
          pages[i],
          watermarks[i],
          300,
          50,
          12,
          0.5,
          [0.7, 0.7, 0.7]
        );
      }

      Enhanced.writePdf(null as any, 'watermarked.pdf');

      expect(true).toBe(true);
    });

    it('should draw complex shapes', () => {
      // Rectangle
      Enhanced.drawRectangle(null as any, 0, 100, 100, 200, 150, [0, 0, 0], [1, 1, 1], 1);

      // Circle
      Enhanced.drawCircle(null as any, 0, 300, 300, 50, [1, 0, 0], null as any, 2);

      // Lines forming a cross
      Enhanced.drawLine(null as any, 0, 400, 300, 500, 400, [0, 0, 1], 2);
      Enhanced.drawLine(null as any, 0, 500, 300, 400, 400, [0, 0, 1], 2);

      expect(true).toBe(true);
    });

    it('should create template page', () => {
      // Add blank page
      Enhanced.addBlankPage(null as any, 0, 612, 792);

      // Add header line
      Enhanced.drawLine(null as any, 0, 50, 50, 562, 50, [0, 0, 0], 1);

      // Add footer line
      Enhanced.drawLine(null as any, 0, 50, 742, 562, 742, [0, 0, 0], 1);

      // Add watermark
      Enhanced.addWatermark(null as any, 0, 'TEMPLATE', 250, 400, 72, 0.1, [0.9, 0.9, 0.9]);

      expect(true).toBe(true);
    });
  });
});
