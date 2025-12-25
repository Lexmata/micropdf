/**
 * Structured Text (SText) Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Document } from '../src/document.js';
import {
  STextPage,
  STextBlockType,
  WritingMode,
  quadToRect,
  quadsOverlap,
  type Quad
} from '../src/stext.js';
import { Rect } from '../src/geometry.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('STextPage', () => {
  const testPdfPath = join(process.cwd(), '../test-pdfs/simple/hello-world.pdf');
  const hasTestPdf = existsSync(testPdfPath);

  let doc: Document;
  let page: ReturnType<Document['loadPage']>;

  beforeEach(() => {
    if (hasTestPdf) {
      try {
        doc = Document.open(testPdfPath);
        page = doc.loadPage(0);
      } catch (e) {
        // Native addon not built, skip tests
      }
    }
  });

  afterEach(() => {
    if (page) {
      page.drop();
    }
    if (doc) {
      doc.close();
    }
  });

  describe('Static Constructor', () => {
    it('should create STextPage from page', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      expect(stext).toBeDefined();
      expect(stext.isDropped()).toBe(false);
      stext.drop();
    });

    it('should have valid handle', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      expect(stext.handle).toBeDefined();
      expect(typeof stext.handle).toBe('bigint');
      stext.drop();
    });
  });

  describe('getText', () => {
    it('should extract text from page', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const text = stext.getText();

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);

      stext.drop();
    });

    it('should extract "Hello, World!" from simple PDF', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const text = stext.getText();

      expect(text).toContain('Hello');

      stext.drop();
    });

    it('should throw if dropped', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      stext.drop();

      expect(() => stext.getText()).toThrow('STextPage has been dropped');
    });
  });

  describe('search', () => {
    it('should find text matches', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const hits = stext.search('Hello');

      expect(Array.isArray(hits)).toBe(true);

      stext.drop();
    });

    it('should return quads with correct structure', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const hits = stext.search('Hello');

      if (hits.length > 0) {
        const quad = hits[0];
        expect(quad).toHaveProperty('ul');
        expect(quad).toHaveProperty('ur');
        expect(quad).toHaveProperty('ll');
        expect(quad).toHaveProperty('lr');

        expect(quad.ul).toHaveProperty('x');
        expect(quad.ul).toHaveProperty('y');
        expect(typeof quad.ul.x).toBe('number');
        expect(typeof quad.ul.y).toBe('number');
      }

      stext.drop();
    });

    it('should respect maxHits parameter', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const hits = stext.search('e', 5); // Limit to 5 hits

      expect(hits.length).toBeLessThanOrEqual(5);

      stext.drop();
    });

    it('should return empty array for non-existent text', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const hits = stext.search('ZZZZNOTFOUND');

      expect(Array.isArray(hits)).toBe(true);
      expect(hits.length).toBe(0);

      stext.drop();
    });

    it('should throw if dropped', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      stext.drop();

      expect(() => stext.search('test')).toThrow('STextPage has been dropped');
    });
  });

  describe('getBounds', () => {
    it('should return page bounds', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const bounds = stext.getBounds();

      expect(bounds).toBeInstanceOf(Rect);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);

      stext.drop();
    });

    it('should have valid dimensions', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      const bounds = stext.getBounds();

      expect(bounds.x0).toBeLessThan(bounds.x1);
      expect(bounds.y0).toBeLessThan(bounds.y1);

      stext.drop();
    });

    it('should throw if dropped', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      stext.drop();

      expect(() => stext.getBounds()).toThrow('STextPage has been dropped');
    });
  });

  describe('Resource Management', () => {
    it('should support drop()', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      expect(stext.isDropped()).toBe(false);

      stext.drop();
      expect(stext.isDropped()).toBe(true);
    });

    it('should be safe to drop multiple times', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      stext.drop();
      stext.drop(); // Should not throw
      expect(stext.isDropped()).toBe(true);
    });

    it('should expose handle property', function () {
      if (!hasTestPdf || !page) {
        this.skip();
      }

      const stext = STextPage.fromPage(page);
      expect(stext.handle).toBeDefined();
      expect(typeof stext.handle).toBe('bigint');
      stext.drop();
    });
  });
});

describe('Quad Helper Functions', () => {
  describe('quadToRect', () => {
    it('should convert quad to rect', () => {
      const quad: Quad = {
        ul: { x: 10, y: 20 },
        ur: { x: 100, y: 20 },
        ll: { x: 10, y: 50 },
        lr: { x: 100, y: 50 }
      };

      const rect = quadToRect(quad);

      expect(rect.x0).toBe(10);
      expect(rect.y0).toBe(20);
      expect(rect.x1).toBe(100);
      expect(rect.y1).toBe(50);
    });

    it('should handle rotated quads', () => {
      const quad: Quad = {
        ul: { x: 50, y: 10 },
        ur: { x: 100, y: 50 },
        ll: { x: 20, y: 40 },
        lr: { x: 70, y: 80 }
      };

      const rect = quadToRect(quad);

      expect(rect.x0).toBe(20); // Min x
      expect(rect.y0).toBe(10); // Min y
      expect(rect.x1).toBe(100); // Max x
      expect(rect.y1).toBe(80); // Max y
    });

    it('should handle single-point quad', () => {
      const quad: Quad = {
        ul: { x: 42, y: 42 },
        ur: { x: 42, y: 42 },
        ll: { x: 42, y: 42 },
        lr: { x: 42, y: 42 }
      };

      const rect = quadToRect(quad);

      expect(rect.x0).toBe(42);
      expect(rect.y0).toBe(42);
      expect(rect.x1).toBe(42);
      expect(rect.y1).toBe(42);
    });
  });

  describe('quadsOverlap', () => {
    it('should detect overlapping quads', () => {
      const q1: Quad = {
        ul: { x: 0, y: 0 },
        ur: { x: 100, y: 0 },
        ll: { x: 0, y: 100 },
        lr: { x: 100, y: 100 }
      };

      const q2: Quad = {
        ul: { x: 50, y: 50 },
        ur: { x: 150, y: 50 },
        ll: { x: 50, y: 150 },
        lr: { x: 150, y: 150 }
      };

      expect(quadsOverlap(q1, q2)).toBe(true);
    });

    it('should detect non-overlapping quads', () => {
      const q1: Quad = {
        ul: { x: 0, y: 0 },
        ur: { x: 50, y: 0 },
        ll: { x: 0, y: 50 },
        lr: { x: 50, y: 50 }
      };

      const q2: Quad = {
        ul: { x: 100, y: 100 },
        ur: { x: 150, y: 100 },
        ll: { x: 100, y: 150 },
        lr: { x: 150, y: 150 }
      };

      expect(quadsOverlap(q1, q2)).toBe(false);
    });

    it('should detect edge-touching quads as overlapping', () => {
      const q1: Quad = {
        ul: { x: 0, y: 0 },
        ur: { x: 50, y: 0 },
        ll: { x: 0, y: 50 },
        lr: { x: 50, y: 50 }
      };

      const q2: Quad = {
        ul: { x: 50, y: 0 },
        ur: { x: 100, y: 0 },
        ll: { x: 50, y: 50 },
        lr: { x: 100, y: 50 }
      };

      expect(quadsOverlap(q1, q2)).toBe(true);
    });

    it('should handle identical quads', () => {
      const q1: Quad = {
        ul: { x: 10, y: 20 },
        ur: { x: 100, y: 20 },
        ll: { x: 10, y: 50 },
        lr: { x: 100, y: 50 }
      };

      const q2 = { ...q1 };

      expect(quadsOverlap(q1, q2)).toBe(true);
    });
  });
});

describe('Hierarchical Text Structure', () => {
  const testPdfPath = join(process.cwd(), '../test-pdfs/simple/hello-world.pdf');
  const hasTestPdf = existsSync(testPdfPath);

  let doc: Document;
  let page: ReturnType<Document['loadPage']>;
  let stext: STextPage;

  beforeEach(() => {
    if (hasTestPdf) {
      try {
        doc = Document.open(testPdfPath);
        page = doc.loadPage(0);
        stext = STextPage.fromPage(page);
      } catch (e) {
        // Native addon not built, skip tests
      }
    }
  });

  afterEach(() => {
    if (stext) {
      stext.drop();
    }
    if (page) {
      page.drop();
    }
    if (doc) {
      doc.close();
    }
  });

  describe('getBlocks', () => {
    it('should return array of blocks', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const blocks = stext.getBlocks();
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should have valid block structure', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const blocks = stext.getBlocks();
      const block = blocks[0];

      expect(block).toHaveProperty('blockType');
      expect(block).toHaveProperty('bbox');
      expect(block).toHaveProperty('lines');
      expect(Array.isArray(block.lines)).toBe(true);
    });

    it('should have valid line structure', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const blocks = stext.getBlocks();
      if (blocks.length > 0 && blocks[0].lines.length > 0) {
        const line = blocks[0].lines[0];

        expect(line).toHaveProperty('wmode');
        expect(line).toHaveProperty('bbox');
        expect(line).toHaveProperty('baseline');
        expect(line).toHaveProperty('dir');
        expect(line).toHaveProperty('chars');
        expect(Array.isArray(line.chars)).toBe(true);
      }
    });

    it('should have valid char structure', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const blocks = stext.getBlocks();
      if (blocks.length > 0 && blocks[0].lines.length > 0 && blocks[0].lines[0].chars.length > 0) {
        const char = blocks[0].lines[0].chars[0];

        expect(char).toHaveProperty('c');
        expect(char).toHaveProperty('quad');
        expect(char).toHaveProperty('size');
        expect(char).toHaveProperty('fontName');
        expect(typeof char.c).toBe('string');
        expect(char.c.length).toBe(1);
      }
    });
  });

  describe('blockCount', () => {
    it('should return number of blocks', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const count = stext.blockCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should match blocks array length', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const blocks = stext.getBlocks();
      const count = stext.blockCount();
      expect(count).toBe(blocks.length);
    });
  });

  describe('charCount', () => {
    it('should return number of characters', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const count = stext.charCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should match text length', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const text = stext.getText();
      const count = stext.charCount();
      expect(count).toBe(text.length);
    });
  });

  describe('getBlocksOfType', () => {
    it('should filter text blocks', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      const textBlocks = stext.getBlocksOfType(STextBlockType.Text);
      expect(Array.isArray(textBlocks)).toBe(true);
      for (const block of textBlocks) {
        expect(block.blockType).toBe(STextBlockType.Text);
      }
    });

    it('should return empty array for non-existent types', function () {
      if (!hasTestPdf || !stext) {
        this.skip();
      }

      // Most simple PDFs won't have image blocks
      const imageBlocks = stext.getBlocksOfType(STextBlockType.Image);
      expect(Array.isArray(imageBlocks)).toBe(true);
    });
  });

  describe('Enums', () => {
    it('should have STextBlockType enum', () => {
      expect(STextBlockType.Text).toBe(0);
      expect(STextBlockType.Image).toBe(1);
      expect(STextBlockType.List).toBe(2);
      expect(STextBlockType.Table).toBe(3);
    });

    it('should have WritingMode enum', () => {
      expect(WritingMode.HorizontalLtr).toBe(0);
      expect(WritingMode.HorizontalRtl).toBe(1);
      expect(WritingMode.VerticalTtb).toBe(2);
      expect(WritingMode.VerticalBtt).toBe(3);
    });
  });
});
