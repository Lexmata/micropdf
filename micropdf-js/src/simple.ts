/**
 * Simple API - Ultra-simplified functions for common PDF tasks
 *
 * This module provides the simplest possible API for basic PDF operations.
 * Perfect for beginners or quick scripts.
 *
 * @example
 * ```typescript
 * import * as pdf from 'micropdf/simple';
 *
 * // Extract all text
 * const text = await pdf.extractText('document.pdf');
 *
 * // Render first page to PNG
 * await pdf.renderToPNG('document.pdf', 'output.png');
 *
 * // Get page count
 * const pages = await pdf.getPageCount('document.pdf');
 * ```
 */

import { EasyPDF, type PdfMetadata, type DocumentInfo } from './easy.js';
import { Context } from './context.js';
import { Enhanced } from './enhanced.js';
import * as fs from 'fs/promises';

/**
 * Extract all text from a PDF
 *
 * @param pdfPath - Path to PDF file
 * @param password - Optional password for encrypted PDFs
 * @returns All text from the PDF
 *
 * @example
 * ```typescript
 * const text = await extractText('document.pdf');
 * console.log(text);
 * ```
 */
export async function extractText(pdfPath: string, password?: string): Promise<string> {
  return EasyPDF.open(pdfPath, password).use((pdf) => pdf.extractAllText());
}

/**
 * Extract text from a specific page
 *
 * @param pdfPath - Path to PDF file
 * @param pageNumber - Page number (0-indexed)
 * @param password - Optional password for encrypted PDFs
 * @returns Text from the specified page
 *
 * @example
 * ```typescript
 * const text = await extractPageText('document.pdf', 0);
 * console.log(text);
 * ```
 */
export async function extractPageText(
  pdfPath: string,
  pageNumber: number,
  password?: string
): Promise<string> {
  return EasyPDF.open(pdfPath, password).use((pdf) => pdf.extractPageText(pageNumber));
}

/**
 * Get the number of pages in a PDF
 *
 * @param pdfPath - Path to PDF file
 * @param password - Optional password for encrypted PDFs
 * @returns Number of pages
 *
 * @example
 * ```typescript
 * const count = await getPageCount('document.pdf');
 * console.log(`Document has ${count} pages`);
 * ```
 */
export async function getPageCount(pdfPath: string, password?: string): Promise<number> {
  return EasyPDF.open(pdfPath, password).use((pdf) => pdf.pageCount);
}

/**
 * Get PDF metadata (title, author, etc.)
 *
 * @param pdfPath - Path to PDF file
 * @param password - Optional password for encrypted PDFs
 * @returns PDF metadata
 *
 * @example
 * ```typescript
 * const meta = await getMetadata('document.pdf');
 * console.log(meta.title);
 * console.log(meta.author);
 * ```
 */
export async function getMetadata(pdfPath: string, password?: string): Promise<PdfMetadata> {
  return EasyPDF.open(pdfPath, password).use((pdf) => pdf.getMetadata());
}

/**
 * Get complete document information
 *
 * @param pdfPath - Path to PDF file
 * @param password - Optional password for encrypted PDFs
 * @returns Document information including metadata and page details
 *
 * @example
 * ```typescript
 * const info = await getInfo('document.pdf');
 * console.log(`Pages: ${info.pageCount}`);
 * console.log(`Title: ${info.metadata.title}`);
 * info.pages.forEach((page, i) => {
 *   console.log(`Page ${i}: ${page.width}x${page.height}`);
 * });
 * ```
 */
export async function getInfo(pdfPath: string, password?: string): Promise<DocumentInfo> {
  return EasyPDF.open(pdfPath, password).use((pdf) => pdf.getInfo());
}

/**
 * Render a page to PNG
 *
 * @param pdfPath - Path to PDF file
 * @param outputPath - Output PNG file path
 * @param pageNumber - Page number (0-indexed, default: 0)
 * @param dpi - DPI for rendering (default: 150)
 * @param password - Optional password for encrypted PDFs
 *
 * @example
 * ```typescript
 * // Render first page at 150 DPI
 * await renderToPNG('document.pdf', 'output.png');
 *
 * // Render second page at 300 DPI
 * await renderToPNG('document.pdf', 'output.png', 1, 300);
 * ```
 */
export async function renderToPNG(
  pdfPath: string,
  outputPath: string,
  pageNumber = 0,
  dpi = 150,
  password?: string
): Promise<void> {
  await EasyPDF.open(pdfPath, password).useAsync(async (pdf) => {
    await pdf.renderToFile(pageNumber, outputPath, { dpi, format: 'png' });
  });
}

/**
 * Render all pages to PNG files
 *
 * @param pdfPath - Path to PDF file
 * @param outputPattern - Output file pattern (use {page} for page number)
 * @param dpi - DPI for rendering (default: 150)
 * @param password - Optional password for encrypted PDFs
 *
 * @example
 * ```typescript
 * // Render all pages
 * await renderAllToPNG('document.pdf', 'output/page-{page}.png');
 *
 * // High quality rendering
 * await renderAllToPNG('document.pdf', 'output/page-{page}.png', 300);
 * ```
 */
export async function renderAllToPNG(
  pdfPath: string,
  outputPattern: string,
  dpi = 150,
  password?: string
): Promise<void> {
  await EasyPDF.open(pdfPath, password).useAsync(async (pdf) => {
    await pdf.renderAllToFiles(outputPattern, { dpi, format: 'png' });
  });
}

/**
 * Get a page as a PNG buffer
 *
 * @param pdfPath - Path to PDF file
 * @param pageNumber - Page number (0-indexed, default: 0)
 * @param dpi - DPI for rendering (default: 150)
 * @param password - Optional password for encrypted PDFs
 * @returns PNG buffer
 *
 * @example
 * ```typescript
 * const buffer = await getPageAsPNG('document.pdf', 0, 300);
 * await fs.writeFile('output.png', buffer);
 * ```
 */
export async function getPageAsPNG(
  pdfPath: string,
  pageNumber = 0,
  dpi = 150,
  password?: string
): Promise<Buffer> {
  return EasyPDF.open(pdfPath, password).use((pdf) =>
    pdf.renderToBuffer(pageNumber, { dpi, format: 'png' })
  );
}

/**
 * Search for text in a PDF
 *
 * @param pdfPath - Path to PDF file
 * @param query - Text to search for
 * @param password - Optional password for encrypted PDFs
 * @returns Array of page numbers where text was found
 *
 * @example
 * ```typescript
 * const pages = await searchText('document.pdf', 'important');
 * console.log(`Found on pages: ${pages.join(', ')}`);
 * ```
 */
export async function searchText(
  pdfPath: string,
  query: string,
  password?: string
): Promise<number[]> {
  return EasyPDF.open(pdfPath, password).use((pdf) => {
    const results = pdf.search(query);
    // Return unique page numbers
    return [...new Set(results.map((r) => r.pageNumber))];
  });
}

/**
 * Check if a PDF is encrypted
 *
 * @param pdfPath - Path to PDF file
 * @returns True if the PDF is encrypted
 *
 * @example
 * ```typescript
 * if (await isEncrypted('document.pdf')) {
 *   console.log('This PDF requires a password');
 * }
 * ```
 */
export async function isEncrypted(pdfPath: string): Promise<boolean> {
  return EasyPDF.open(pdfPath).use((pdf) => pdf.isEncrypted);
}

/**
 * Save text extraction to a file
 *
 * @param pdfPath - Path to PDF file
 * @param outputPath - Output text file path
 * @param password - Optional password for encrypted PDFs
 *
 * @example
 * ```typescript
 * await saveTextToFile('document.pdf', 'output.txt');
 * ```
 */
export async function saveTextToFile(
  pdfPath: string,
  outputPath: string,
  password?: string
): Promise<void> {
  const text = await extractText(pdfPath, password);
  await fs.writeFile(outputPath, text, 'utf-8');
}

/**
 * Convert PDF to images (one per page)
 *
 * @param pdfPath - Path to PDF file
 * @param outputDir - Output directory for images
 * @param options - Rendering options
 * @returns Array of output file paths
 *
 * @example
 * ```typescript
 * const files = await convertToImages('document.pdf', 'output/', {
 *   dpi: 300,
 *   format: 'png'
 * });
 * console.log(`Created ${files.length} images`);
 * ```
 */
export async function convertToImages(
  pdfPath: string,
  outputDir: string,
  options: { dpi?: number; format?: 'png' | 'pnm' | 'pam'; password?: string } = {}
): Promise<string[]> {
  const { dpi = 150, format = 'png', password } = options;

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  return EasyPDF.open(pdfPath, password).useAsync(async (pdf) => {
    const files: string[] = [];
    const pageCount = pdf.pageCount;

    for (let i = 0; i < pageCount; i++) {
      const outputPath = `${outputDir}/page-${String(i + 1).padStart(4, '0')}.${format}`;
      await pdf.renderToFile(i, outputPath, { dpi, format });
      files.push(outputPath);
    }

    return files;
  });
}

/**
 * Quick info summary for a PDF
 *
 * @param pdfPath - Path to PDF file
 * @param password - Optional password for encrypted PDFs
 * @returns Human-readable summary string
 *
 * @example
 * ```typescript
 * const summary = await quickSummary('document.pdf');
 * console.log(summary);
 * // Output:
 * // Document: document.pdf
 * // Pages: 42
 * // Title: My Document
 * // Author: John Doe
 * // Encrypted: No
 * ```
 */
export async function quickSummary(pdfPath: string, password?: string): Promise<string> {
  return EasyPDF.open(pdfPath, password).use((pdf) => {
    const info = pdf.getInfo();
    const lines = [
      `Document: ${pdfPath}`,
      `Pages: ${info.pageCount}`,
      info.metadata.title ? `Title: ${info.metadata.title}` : null,
      info.metadata.author ? `Author: ${info.metadata.author}` : null,
      info.metadata.subject ? `Subject: ${info.metadata.subject}` : null,
      `Encrypted: ${info.isEncrypted ? 'Yes' : 'No'}`,
      `Has XFA: ${info.hasXfa ? 'Yes' : 'No'}`
    ];

    return lines.filter((l) => l !== null).join('\n');
  });
}

/**
 * Merge multiple PDF files into a single output file
 *
 * This is the simplest way to merge PDFs - just provide the input paths and output path.
 * Handles large documents (5000+ pages) and corrupted PDFs robustly.
 *
 * @param inputPaths - Array of PDF file paths to merge (in order)
 * @param outputPath - Path where the merged PDF will be saved
 * @returns Promise that resolves to the number of pages in the merged PDF
 * @throws Error if any input file is invalid, not found, or merge fails
 *
 * @example Basic merge
 * ```typescript
 * import { mergePDF } from 'micropdf/simple';
 *
 * const pageCount = await mergePDF(
 *   ['document1.pdf', 'document2.pdf', 'document3.pdf'],
 *   'merged.pdf'
 * );
 * console.log(`Merged ${pageCount} pages`);
 * ```
 *
 * @example Large documents
 * ```typescript
 * // Works with large documents (5000+ pages)
 * const pageCount = await mergePDF(
 *   ['large_doc1.pdf', 'large_doc2.pdf'],
 *   'combined.pdf'
 * );
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   await mergePDF(['doc1.pdf', 'doc2.pdf'], 'output.pdf');
 * } catch (error) {
 *   console.error('Merge failed:', error.message);
 * }
 * ```
 */
export async function mergePDF(inputPaths: string[], outputPath: string): Promise<number> {
  const ctx = new Context();
  const enhanced = new Enhanced(ctx);

  try {
    return await enhanced.mergePDF(inputPaths, outputPath);
  } finally {
    ctx.free();
  }
}
