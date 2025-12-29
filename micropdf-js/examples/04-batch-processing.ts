/**
 * Example 4: Batch Processing
 *
 * This example demonstrates how to:
 * - Process multiple PDF files
 * - Extract information from a directory of PDFs
 * - Generate reports
 * - Handle errors gracefully
 */

import { Document } from 'micropdf';
import { resolve } from 'path';
import { readdirSync, existsSync, writeFileSync } from 'fs';

interface PDFInfo {
  filename: string;
  path: string;
  pages: number;
  title: string;
  author: string;
  size: { width: number; height: number };
  encrypted: boolean;
  error?: string;
}

function processPDFDirectory(directory: string): PDFInfo[] {
  console.log(`=== Processing PDFs in ${directory} ===\n`);

  if (!existsSync(directory)) {
    console.error(`Directory not found: ${directory}`);
    return [];
  }

  const files = readdirSync(directory)
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => resolve(directory, f));

  console.log(`Found ${files.length} PDF file(s)\n`);

  const results: PDFInfo[] = [];

  for (const file of files) {
    try {
      console.log(`Processing: ${file}`);

      const doc = Document.open(file);

      // Get first page dimensions
      let width = 0;
      let height = 0;
      if (doc.pageCount > 0) {
        const page = doc.loadPage(0);
        width = page.bounds.width;
        height = page.bounds.height;
        page.drop();
      }

      const info: PDFInfo = {
        filename: file.split('/').pop() || file,
        path: file,
        pages: doc.pageCount,
        title: doc.getMetadata('Title') || 'N/A',
        author: doc.getMetadata('Author') || 'N/A',
        size: { width, height },
        encrypted: doc.needsPassword()
      };

      results.push(info);
      console.log(`  ✅ ${info.pages} pages, ${width.toFixed(0)}×${height.toFixed(0)} pts`);

      doc.close();
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      results.push({
        filename: file.split('/').pop() || file,
        path: file,
        pages: 0,
        title: 'Error',
        author: 'Error',
        size: { width: 0, height: 0 },
        encrypted: false,
        error: String(error)
      });
    }
  }

  return results;
}

function generateReport(results: PDFInfo[]): string {
  let report = '# PDF Processing Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total Files: ${results.length}\n`;
  report += `- Successful: ${results.filter((r) => !r.error).length}\n`;
  report += `- Errors: ${results.filter((r) => r.error).length}\n`;
  report += `- Total Pages: ${results.reduce((sum, r) => sum + r.pages, 0)}\n`;
  report += `- Encrypted: ${results.filter((r) => r.encrypted).length}\n\n`;

  report += `## Files\n\n`;
  report += `| Filename | Pages | Size | Title | Author | Encrypted | Status |\n`;
  report += `|----------|-------|------|-------|--------|-----------|--------|\n`;

  for (const r of results) {
    const status = r.error ? `❌ ${r.error}` : '✅';
    const encrypted = r.encrypted ? '🔒' : '-';
    report += `| ${r.filename} | ${r.pages} | ${r.size.width.toFixed(0)}×${r.size.height.toFixed(0)} | ${r.title} | ${r.author} | ${encrypted} | ${status} |\n`;
  }

  return report;
}

function extractAllTextFromDirectory(directory: string, outputFile: string) {
  console.log(`\n=== Extracting Text from All PDFs ===\n`);

  const files = readdirSync(directory)
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => resolve(directory, f));

  let combinedText = '';

  for (const file of files) {
    try {
      const doc = Document.open(file);

      combinedText += `\n${'='.repeat(80)}\n`;
      combinedText += `FILE: ${file}\n`;
      combinedText += `${'='.repeat(80)}\n\n`;

      for (let i = 0; i < doc.pageCount; i++) {
        const page = doc.loadPage(i);
        const text = page.extractText();

        combinedText += `--- Page ${i + 1} ---\n${text}\n\n`;

        page.drop();
      }

      doc.close();
      console.log(`✅ Extracted text from: ${file}`);
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error}`);
      combinedText += `\nERROR: ${error}\n\n`;
    }
  }

  writeFileSync(outputFile, combinedText);
  console.log(`\n✅ Saved combined text to: ${outputFile}`);
}

function searchInMultiplePDFs(directory: string, searchTerm: string) {
  console.log(`\n=== Searching for "${searchTerm}" in PDFs ===\n`);

  const files = readdirSync(directory)
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => resolve(directory, f));

  const searchResults = [];

  for (const file of files) {
    try {
      const doc = Document.open(file);

      for (let i = 0; i < doc.pageCount; i++) {
        const page = doc.loadPage(i);
        const hits = page.searchText(searchTerm);

        if (hits.length > 0) {
          searchResults.push({
            file: file.split('/').pop(),
            page: i + 1,
            hits: hits.length
          });

          console.log(`Found in: ${file}`);
          console.log(`  Page ${i + 1}: ${hits.length} occurrence(s)`);
        }

        page.drop();
      }

      doc.close();
    } catch (error) {
      console.error(`Error searching ${file}: ${error}`);
    }
  }

  if (searchResults.length === 0) {
    console.log(`\n❌ "${searchTerm}" not found in any PDF`);
  } else {
    console.log(`\n✅ Found "${searchTerm}" in ${searchResults.length} location(s)`);
  }

  return searchResults;
}

// Run examples
if (require.main === module) {
  try {
    const testPDFDir = resolve(__dirname, '../../test-pdfs/simple');

    // Process all PDFs
    const results = processPDFDirectory(testPDFDir);

    // Generate report
    const report = generateReport(results);
    const reportPath = resolve(__dirname, 'pdf-report.md');
    writeFileSync(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}\n`);

    // Display report
    console.log(report);

    // Extract all text
    const textPath = resolve(__dirname, 'all-text.txt');
    extractAllTextFromDirectory(testPDFDir, textPath);

    // Search for text
    searchInMultiplePDFs(testPDFDir, 'Page');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { processPDFDirectory, generateReport, extractAllTextFromDirectory, searchInMultiplePDFs };
