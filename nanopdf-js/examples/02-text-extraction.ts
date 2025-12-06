/**
 * Example 2: Text Extraction
 *
 * This example demonstrates how to:
 * - Extract text from all pages
 * - Search for specific text
 * - Extract text with layout information
 * - Export text to file
 */

import { Document } from 'nanopdf';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

function extractAllText() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/multi-page.pdf');
  const doc = Document.open(pdfPath);

  console.log('=== Extracting Text from All Pages ===\n');

  let allText = '';

  for (let i = 0; i < doc.pageCount; i++) {
    const page = doc.loadPage(i);
    const text = page.extractText();

    console.log(`Page ${i + 1}:`);
    console.log('-'.repeat(50));
    console.log(text);
    console.log('\n');

    allText += `\n=== Page ${i + 1} ===\n${text}\n`;

    page.drop();
  }

  // Save to file
  const outputPath = resolve(__dirname, 'extracted-text.txt');
  writeFileSync(outputPath, allText);
  console.log(`✅ Saved to: ${outputPath}`);

  doc.close();
}

function searchText() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/multi-page.pdf');
  const doc = Document.open(pdfPath);

  console.log('\n=== Searching for Text ===\n');

  const searchTerm = 'Page';

  for (let i = 0; i < doc.pageCount; i++) {
    const page = doc.loadPage(i);
    const hits = page.searchText(searchTerm);

    if (hits.length > 0) {
      console.log(`Page ${i + 1}: Found ${hits.length} occurrence(s)`);

      hits.forEach((rect, index) => {
        console.log(`  Hit ${index + 1}: [${rect.x0.toFixed(1)}, ${rect.y0.toFixed(1)}, ${rect.x1.toFixed(1)}, ${rect.y1.toFixed(1)}]`);
      });
    }

    page.drop();
  }

  doc.close();
  console.log('\n✅ Done!');
}

function extractTextBlocks() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/medium/with-metadata.pdf');
  const doc = Document.open(pdfPath);

  console.log('\n=== Extracting Text Blocks with Layout ===\n');

  const page = doc.loadPage(0);
  const blocks = page.extractTextBlocks();

  console.log(`Found ${blocks.length} text block(s)\n`);

  blocks.forEach((block, index) => {
    console.log(`Block ${index + 1}:`);
    console.log(`  Bounds: [${block.bbox[0].toFixed(1)}, ${block.bbox[1].toFixed(1)}, ${block.bbox[2].toFixed(1)}, ${block.bbox[3].toFixed(1)}]`);
    console.log(`  Lines: ${block.lines.length}`);

    block.lines.forEach((line, lineIdx) => {
      const text = line.spans.map(s => s.text).join('');
      console.log(`    Line ${lineIdx + 1}: "${text}"`);
    });

    console.log('');
  });

  page.drop();
  doc.close();

  console.log('✅ Done!');
}

// Run examples
if (require.main === module) {
  try {
    extractAllText();
    searchText();
    extractTextBlocks();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { extractAllText, searchText, extractTextBlocks };

