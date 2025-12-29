/**
 * Structured Text Extraction Example
 *
 * Demonstrates layout-aware text extraction with blocks, lines, and characters.
 */

import { Document, STextPage, STextBlockType, WritingMode } from '../src/index.js';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

// Example 1: Basic text extraction
function basicTextExtraction() {
  console.log('\n=== Example 1: Basic Text Extraction ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  // Create structured text page
  const stext = STextPage.fromPage(page);

  // Extract all text
  const text = stext.getText();
  console.log('Extracted text:');
  console.log(text);

  // Get page bounds
  const bounds = stext.getBounds();
  console.log(`\nPage dimensions: ${bounds.width} x ${bounds.height}`);

  // Clean up
  stext.drop();
  page.drop();
  doc.close();
}

// Example 2: Text search with precise positions
function textSearchWithPositions() {
  console.log('\n=== Example 2: Text Search with Positions ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);
  const stext = STextPage.fromPage(page);

  // Search for text
  const keyword = 'Hello';
  const hits = stext.search(keyword);

  console.log(`Found ${hits.length} occurrences of "${keyword}":\n`);

  for (let i = 0; i < hits.length; i++) {
    const quad = hits[i];
    console.log(`Match ${i + 1}:`);
    console.log(`  Upper-left:  (${quad.ul.x.toFixed(2)}, ${quad.ul.y.toFixed(2)})`);
    console.log(`  Upper-right: (${quad.ur.x.toFixed(2)}, ${quad.ur.y.toFixed(2)})`);
    console.log(`  Lower-left:  (${quad.ll.x.toFixed(2)}, ${quad.ll.y.toFixed(2)})`);
    console.log(`  Lower-right: (${quad.lr.x.toFixed(2)}, ${quad.lr.y.toFixed(2)})`);
    console.log();
  }

  stext.drop();
  page.drop();
  doc.close();
}

// Example 3: Hierarchical text navigation
function hierarchicalTextNavigation() {
  console.log('\n=== Example 3: Hierarchical Text Navigation ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);
  const stext = STextPage.fromPage(page);

  // Get blocks
  const blocks = stext.getBlocks();
  console.log(`Document has ${blocks.length} block(s)\n`);

  // Navigate hierarchy
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`Block ${i + 1}:`);
    console.log(`  Type: ${STextBlockType[block.blockType]}`);
    console.log(
      `  Bounds: (${block.bbox.x0.toFixed(1)}, ${block.bbox.y0.toFixed(1)}) to (${block.bbox.x1.toFixed(1)}, ${block.bbox.y1.toFixed(1)})`
    );
    console.log(`  Lines: ${block.lines.length}`);

    // Show first few lines
    const linesToShow = Math.min(3, block.lines.length);
    for (let j = 0; j < linesToShow; j++) {
      const line = block.lines[j];
      const text = line.chars.map((c) => c.c).join('');
      console.log(`    Line ${j + 1}: "${text}"`);
      console.log(`      Writing mode: ${WritingMode[line.wmode]}`);
      console.log(`      Characters: ${line.chars.length}`);
    }

    if (block.lines.length > linesToShow) {
      console.log(`    ... and ${block.lines.length - linesToShow} more lines`);
    }
    console.log();
  }

  stext.drop();
  page.drop();
  doc.close();
}

// Example 4: Character-level analysis
function characterLevelAnalysis() {
  console.log('\n=== Example 4: Character-Level Analysis ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);
  const stext = STextPage.fromPage(page);

  const blocks = stext.getBlocks();

  if (blocks.length > 0 && blocks[0].lines.length > 0) {
    const firstLine = blocks[0].lines[0];
    const charsToShow = Math.min(10, firstLine.chars.length);

    console.log(`Analyzing first ${charsToShow} characters:\n`);

    for (let i = 0; i < charsToShow; i++) {
      const char = firstLine.chars[i];
      console.log(`Character ${i + 1}: '${char.c}'`);
      console.log(`  Font: ${char.fontName}`);
      console.log(`  Size: ${char.size.toFixed(1)}pt`);
      console.log(`  Position: (${char.quad.ul.x.toFixed(1)}, ${char.quad.ul.y.toFixed(1)})`);
      console.log();
    }
  }

  stext.drop();
  page.drop();
  doc.close();
}

// Example 5: Filtering blocks by type
function filteringBlocksByType() {
  console.log('\n=== Example 5: Filtering Blocks by Type ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);
  const stext = STextPage.fromPage(page);

  // Get blocks by type
  const textBlocks = stext.getBlocksOfType(STextBlockType.Text);
  const imageBlocks = stext.getBlocksOfType(STextBlockType.Image);
  const listBlocks = stext.getBlocksOfType(STextBlockType.List);
  const tableBlocks = stext.getBlocksOfType(STextBlockType.Table);

  console.log('Block type statistics:');
  console.log(`  Text blocks:  ${textBlocks.length}`);
  console.log(`  Image blocks: ${imageBlocks.length}`);
  console.log(`  List blocks:  ${listBlocks.length}`);
  console.log(`  Table blocks: ${tableBlocks.length}`);

  stext.drop();
  page.drop();
  doc.close();
}

// Example 6: Export structured text as JSON
function exportStructuredTextAsJSON() {
  console.log('\n=== Example 6: Export Structured Text as JSON ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);
  const stext = STextPage.fromPage(page);

  // Build JSON structure
  const jsonData = {
    pageNumber: 0,
    bounds: {
      x: stext.getBounds().x0,
      y: stext.getBounds().y0,
      width: stext.getBounds().width,
      height: stext.getBounds().height
    },
    blockCount: stext.blockCount(),
    charCount: stext.charCount(),
    blocks: stext.getBlocks().map((block, blockIdx) => ({
      blockIndex: blockIdx,
      type: STextBlockType[block.blockType],
      bounds: {
        x0: block.bbox.x0,
        y0: block.bbox.y0,
        x1: block.bbox.x1,
        y1: block.bbox.y1
      },
      lines: block.lines.map((line, lineIdx) => ({
        lineIndex: lineIdx,
        writingMode: WritingMode[line.wmode],
        text: line.chars.map((c) => c.c).join(''),
        charCount: line.chars.length
      }))
    }))
  };

  const jsonString = JSON.stringify(jsonData, null, 2);
  console.log('Structured text JSON:');
  console.log(jsonString);

  // Optionally save to file
  const outputPath = join(__dirname, 'structured-text-output.json');
  writeFileSync(outputPath, jsonString);
  console.log(`\nSaved to: ${outputPath}`);

  stext.drop();
  page.drop();
  doc.close();
}

// Example 7: Multi-page text extraction
function multiPageTextExtraction() {
  console.log('\n=== Example 7: Multi-Page Text Extraction ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/multi-page.pdf'));
  console.log(`Document has ${doc.pageCount} pages\n`);

  const pagesToProcess = Math.min(3, doc.pageCount);

  for (let i = 0; i < pagesToProcess; i++) {
    const page = doc.loadPage(i);
    const stext = STextPage.fromPage(page);

    console.log(`Page ${i + 1}:`);
    console.log(`  Blocks: ${stext.blockCount()}`);
    console.log(`  Characters: ${stext.charCount()}`);
    console.log(`  Text preview: ${stext.getText().substring(0, 100)}...`);
    console.log();

    stext.drop();
    page.drop();
  }

  doc.close();
}

// Run all examples
function main() {
  console.log('='.repeat(70));
  console.log('Structured Text Extraction Examples');
  console.log('='.repeat(70));

  try {
    basicTextExtraction();
    textSearchWithPositions();
    hierarchicalTextNavigation();
    characterLevelAnalysis();
    filteringBlocksByType();
    exportStructuredTextAsJSON();
    multiPageTextExtraction();

    console.log('\n' + '='.repeat(70));
    console.log('All examples completed successfully!');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
