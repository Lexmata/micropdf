/**
 * NanoPDF Easy API Examples
 *
 * This file demonstrates the ergonomic, user-friendly API for common PDF tasks.
 * Choose the API level that best fits your needs:
 *
 * 1. Simple API - Ultra-simple functions (best for beginners)
 * 2. Easy API - Fluent builder pattern (balance of power and simplicity)
 * 3. Core API - Full control (advanced users)
 */

import * as simple from '../src/simple.js';
import { EasyPDF, PDFUtils } from '../src/easy.js';
import { Document } from '../src/document.js';

// ============================================================================
// SIMPLE API - Ultra-Simple Functions
// ============================================================================

/**
 * Example 1: Extract text from a PDF (simplest way)
 */
async function example1_SimpleTextExtraction() {
  // Extract all text
  const text = await simple.extractText('document.pdf');
  console.log(text);

  // Extract from specific page
  const pageText = await simple.extractPageText('document.pdf', 0);
  console.log(pageText);

  // Save text to file
  await simple.saveTextToFile('document.pdf', 'output.txt');
}

/**
 * Example 2: Render PDF pages to PNG (simplest way)
 */
async function example2_SimpleRendering() {
  // Render first page at 150 DPI
  await simple.renderToPNG('document.pdf', 'output.png');

  // Render specific page at high DPI
  await simple.renderToPNG('document.pdf', 'output.png', 0, 300);

  // Render all pages
  await simple.renderAllToPNG('document.pdf', 'output/page-{page}.png', 150);

  // Get page as buffer
  const buffer = await simple.getPageAsPNG('document.pdf', 0, 300);
  // Do something with buffer...
}

/**
 * Example 3: Get PDF information (simplest way)
 */
async function example3_SimpleInfo() {
  // Get page count
  const pageCount = await simple.getPageCount('document.pdf');
  console.log(`Pages: ${pageCount}`);

  // Get metadata
  const metadata = await simple.getMetadata('document.pdf');
  console.log(`Title: ${metadata.title}`);
  console.log(`Author: ${metadata.author}`);

  // Get complete info
  const info = await simple.getPdfInfo('document.pdf');
  console.log(JSON.stringify(info, null, 2));

  // Quick summary
  const summary = await simple.quickSummary('document.pdf');
  console.log(summary);
}

/**
 * Example 4: Search text (simplest way)
 */
async function example4_SimpleSearch() {
  // Find pages containing text
  const pages = await simple.searchText('document.pdf', 'important');
  console.log(`Found on pages: ${pages.join(', ')}`);

  // Check if encrypted
  if (await simple.isEncrypted('document.pdf')) {
    console.log('PDF is password protected');
  }
}

/**
 * Example 5: Convert PDF to images (simplest way)
 */
async function example5_SimpleConversion() {
  // Convert all pages to PNG images
  const files = await simple.convertToImages('document.pdf', 'output/', {
    dpi: 300,
    format: 'png'
  });

  console.log(`Created ${files.length} images:`);
  files.forEach((file) => console.log(`  ${file}`));
}

// ============================================================================
// EASY API - Fluent Builder Pattern
// ============================================================================

/**
 * Example 6: Fluent API with automatic resource management
 */
async function example6_FluentAPI() {
  // Open and use with automatic cleanup
  await EasyPDF.open('document.pdf').useAsync(async (pdf) => {
    const pageCount = pdf.pageCount;
    const metadata = pdf.getMetadata();
    const text = pdf.extractAllText();

    console.log(`Pages: ${pageCount}`);
    console.log(`Title: ${metadata.title}`);
    console.log(`Text length: ${text.length} characters`);
  });
  // PDF is automatically closed here
}

/**
 * Example 7: Fluent API with manual resource management
 */
function example7_ManualResourceManagement() {
  const pdf = EasyPDF.open('document.pdf').keepOpen();

  try {
    // Extract text from multiple pages
    for (let i = 0; i < pdf.pageCount; i++) {
      const text = pdf.extractPageText(i);
      console.log(`Page ${i}:`, text.substring(0, 100));
    }

    // Search across document
    const results = pdf.search('important');
    console.log(`Found ${results.length} occurrences`);

    // Render pages
    const buffer = pdf.renderToBuffer(0, { dpi: 300 });
    // Do something with buffer...
  } finally {
    pdf.close();
  }
}

/**
 * Example 8: Advanced rendering options
 */
async function example8_AdvancedRendering() {
  await EasyPDF.open('document.pdf').useAsync(async (pdf) => {
    // Render at specific DPI
    await pdf.renderToFile(0, 'high-quality.png', {
      dpi: 300,
      format: 'png'
    });

    // Render with specific dimensions
    await pdf.renderToFile(0, 'thumbnail.png', {
      width: 200,
      height: 300,
      format: 'png'
    });

    // Render in grayscale
    await pdf.renderToFile(0, 'grayscale.png', {
      dpi: 150,
      colorspace: 'gray',
      format: 'png'
    });

    // Render with alpha channel
    await pdf.renderToFile(0, 'with-alpha.png', {
      dpi: 150,
      alpha: true,
      format: 'png'
    });
  });
}

/**
 * Example 9: Structured text extraction with bounding boxes
 */
async function example9_StructuredText() {
  await EasyPDF.open('document.pdf').useAsync(async (pdf) => {
    // Extract structured text from first page
    const structured = pdf.extractStructuredText(0);

    structured.forEach((item) => {
      console.log(`Page ${item.pageNumber}:`);
      console.log(`Text: ${item.text}`);

      if (item.blocks) {
        item.blocks.forEach((block, i) => {
          console.log(`  Block ${i}:`);
          console.log(`    Text: ${block.text}`);
          console.log(`    Position: (${block.bbox.x}, ${block.bbox.y})`);
          console.log(`    Size: ${block.bbox.width}x${block.bbox.height}`);
        });
      }
    });
  });
}

/**
 * Example 10: Search with detailed results
 */
async function example10_DetailedSearch() {
  await EasyPDF.open('document.pdf').useAsync(async (pdf) => {
    const results = pdf.search('important');

    console.log(`Found ${results.length} occurrences:`);
    results.forEach((result, i) => {
      console.log(`${i + 1}. Page ${result.pageNumber}:`);
      console.log(`   Text: "${result.text}"`);
      console.log(`   Position: (${result.bbox.x}, ${result.bbox.y})`);
      console.log(`   Size: ${result.bbox.width}x${result.bbox.height}`);
    });
  });
}

/**
 * Example 11: Extract complete document information
 */
async function example11_CompleteInfo() {
  await EasyPDF.open('document.pdf').useAsync(async (pdf) => {
    const info = pdf.getInfo();

    console.log('Document Information:');
    console.log(`  Pages: ${info.pageCount}`);
    console.log(`  Encrypted: ${info.isEncrypted}`);
    console.log(`  Has XFA: ${info.hasXfa}`);

    console.log('\nMetadata:');
    if (info.metadata.title) console.log(`  Title: ${info.metadata.title}`);
    if (info.metadata.author) console.log(`  Author: ${info.metadata.author}`);
    if (info.metadata.subject) console.log(`  Subject: ${info.metadata.subject}`);
    if (info.metadata.creator) console.log(`  Creator: ${info.metadata.creator}`);
    if (info.metadata.producer) console.log(`  Producer: ${info.metadata.producer}`);

    console.log('\nPages:');
    info.pages.forEach((page) => {
      console.log(
        `  Page ${page.pageNumber}: ${page.width}x${page.height} (rotation: ${page.rotation}°)`
      );
    });
  });
}

/**
 * Example 12: Batch processing multiple PDFs
 */
async function example12_BatchProcessing() {
  const pdfFiles = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];

  for (const file of pdfFiles) {
    console.log(`\nProcessing ${file}...`);

    // Extract text
    const text = await simple.extractText(file);
    await simple.saveTextToFile(file, `${file}.txt`);

    // Render first page
    await simple.renderToPNG(file, `${file}.png`, 0, 150);

    // Get info
    const pageCount = await simple.getPageCount(file);
    console.log(`  ${pageCount} pages processed`);
  }
}

/**
 * Example 13: Error handling
 */
async function example13_ErrorHandling() {
  try {
    // Try to open encrypted PDF without password
    const text = await simple.extractText('encrypted.pdf');
    console.log(text);
  } catch (error) {
    console.error('Error:', error.message);

    // Try again with password
    try {
      const text = await simple.extractText('encrypted.pdf', 'password123');
      console.log('Success with password!');
    } catch (error2) {
      console.error('Wrong password:', error2.message);
    }
  }
}

/**
 * Example 14: Using static helper functions
 */
async function example14_StaticHelpers() {
  // Static helper methods (same as simple API)
  const text = await EasyPDF.extractText('document.pdf');
  const buffer = await EasyPDF.renderPage('document.pdf', 0, { dpi: 300 });
  const info = await EasyPDF.getInfo('document.pdf');
  const results = await EasyPDF.search('document.pdf', 'important');

  console.log('Text length:', text.length);
  console.log('Buffer size:', buffer.length);
  console.log('Pages:', info.pageCount);
  console.log('Search results:', results.length);
}

/**
 * Example 15: Working with buffers (in-memory PDFs)
 */
async function example15_BufferOperations() {
  // Load PDF from buffer
  const fs = await import('fs/promises');
  const pdfBuffer = await fs.readFile('document.pdf');

  const pdf = EasyPDF.fromBuffer(pdfBuffer);
  try {
    const text = pdf.extractAllText();
    const pageCount = pdf.pageCount;

    console.log(`Loaded ${pageCount} pages from buffer`);
    console.log(`Extracted ${text.length} characters`);
  } finally {
    pdf.close();
  }
}

// ============================================================================
// CORE API - Full Control (for comparison)
// ============================================================================

/**
 * Example 16: Core API (traditional way, for comparison)
 */
function example16_CoreAPI() {
  // This is the traditional way - more verbose but maximum control
  const doc = Document.open('document.pdf');

  try {
    const pageCount = doc.pageCount;

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);

      try {
        const text = page.extractText();
        console.log(`Page ${i}:`, text.substring(0, 100));

        const bounds = page.bounds();
        console.log(`Size: ${bounds.width}x${bounds.height}`);
      } finally {
        page.drop();
      }
    }
  } finally {
    doc.close();
  }
}

// ============================================================================
// Run all examples
// ============================================================================

async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('NanoPDF Easy API Examples');
  console.log('='.repeat(80));

  // Note: Most examples are commented out to avoid requiring actual PDF files
  // Uncomment and modify paths as needed for your use case

  // await example1_SimpleTextExtraction();
  // await example2_SimpleRendering();
  // await example3_SimpleInfo();
  // await example4_SimpleSearch();
  // await example5_SimpleConversion();
  // await example6_FluentAPI();
  // await example7_ManualResourceManagement();
  // await example8_AdvancedRendering();
  // await example9_StructuredText();
  // await example10_DetailedSearch();
  // await example11_CompleteInfo();
  // await example12_BatchProcessing();
  // await example13_ErrorHandling();
  // await example14_StaticHelpers();
  // await example15_BufferOperations();
  // await example16_CoreAPI();

  console.log('\nAll examples completed!');
}

// Uncomment to run:
// runAllExamples().catch(console.error);

export {
  example1_SimpleTextExtraction,
  example2_SimpleRendering,
  example3_SimpleInfo,
  example4_SimpleSearch,
  example5_SimpleConversion,
  example6_FluentAPI,
  example7_ManualResourceManagement,
  example8_AdvancedRendering,
  example9_StructuredText,
  example10_DetailedSearch,
  example11_CompleteInfo,
  example12_BatchProcessing,
  example13_ErrorHandling,
  example14_StaticHelpers,
  example15_BufferOperations,
  example16_CoreAPI
};
