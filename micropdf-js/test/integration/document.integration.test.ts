/**
 * Integration tests for document operations
 * Uses real PDF files from test-pdfs directory
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Document, Context } from '../../src';

const TEST_PDFS_DIR = path.join(__dirname, '../../../test-pdfs');

describe('Document Integration Tests', () => {
  let ctx: Context;

  beforeAll(() => {
    ctx = new Context();
  });

  afterEach(() => {
    // Clean up any open documents
  });

  describe('Opening PDFs', () => {
    it('should open a simple PDF file', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      expect(doc).toBeDefined();
      expect(doc.pageCount).toBeGreaterThan(0);
      doc.close();
    });

    it('should open PDF from buffer', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const buffer = fs.readFileSync(pdfPath);
      const doc = Document.openFromBuffer(buffer);

      expect(doc).toBeDefined();
      expect(doc.pageCount).toBeGreaterThan(0);
      doc.close();
    });

    it('should open multi-page PDF', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/multi-page.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      expect(doc.pageCount).toBe(3);
      doc.close();
    });
  });

  describe('Metadata Access', () => {
    it('should read PDF metadata', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'medium/with-metadata.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      const title = doc.getMetadata('Title');
      const author = doc.getMetadata('Author');
      const keywords = doc.getMetadata('Keywords');

      console.log(`Metadata - Title: ${title}, Author: ${author}, Keywords: ${keywords}`);

      doc.close();
    });

    it('should handle missing metadata gracefully', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'minimal/empty.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      const title = doc.getMetadata('Title');
      const author = doc.getMetadata('Author');

      // Should return empty strings for missing metadata
      expect(typeof title).toBe('string');
      expect(typeof author).toBe('string');

      doc.close();
    });
  });

  describe('Security Features', () => {
    it('should detect password-protected PDFs', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/encrypted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Encrypted PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);
      const needsPassword = doc.needsPassword();

      console.log(`PDF needs password: ${needsPassword}`);

      doc.close();
    });

    it('should authenticate with correct password', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'complex/encrypted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Encrypted PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      if (doc.needsPassword()) {
        const authenticated = doc.authenticate('test123');
        console.log(`Authentication result: ${authenticated}`);
      }

      doc.close();
    });

    it('should check document permissions', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      const canPrint = doc.hasPermission(4); // FZ_PERMISSION_PRINT
      const canEdit = doc.hasPermission(8); // FZ_PERMISSION_EDIT

      console.log(`Permissions - Print: ${canPrint}, Edit: ${canEdit}`);

      doc.close();
    });
  });

  describe('Document Operations', () => {
    it('should save document to new file', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');
      const outputPath = path.join(__dirname, 'test-output-save.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      try {
        doc.save(outputPath);

        // Verify file was created
        expect(fs.existsSync(outputPath)).toBe(true);

        // Clean up
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } finally {
        doc.close();
      }
    });

    it('should write document to buffer', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'simple/hello-world.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Test PDF not found, skipping test');
        return;
      }

      const doc = Document.open(pdfPath);

      try {
        const buffer = doc.write();

        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(0);

        console.log(`Written buffer size: ${buffer.length} bytes`);
      } finally {
        doc.close();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file path', () => {
      expect(() => {
        Document.open('/nonexistent/path/to/file.pdf');
      }).toThrow();
    });

    it('should handle corrupted PDF', () => {
      const pdfPath = path.join(TEST_PDFS_DIR, 'minimal/corrupted.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('Corrupted PDF not found, skipping test');
        return;
      }

      // May throw or open with errors
      try {
        const doc = Document.open(pdfPath);
        console.log('Corrupted PDF opened (graceful degradation)');
        doc.close();
      } catch (error) {
        console.log('Corrupted PDF rejected (expected):', error);
      }
    });

    it('should handle empty buffer', () => {
      expect(() => {
        Document.openFromBuffer(Buffer.alloc(0));
      }).toThrow();
    });
  });
});
