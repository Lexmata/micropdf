/**
 * Quick test to verify the merge functionality works with native library using Enhanced API
 */

import { Context, Enhanced } from './micropdf-js/dist/index.js';
import { existsSync } from 'fs';
import { join } from 'path';

async function testMerge() {
  console.log('Testing PDF Merge with Native Library (Enhanced API)\n');
  console.log('='.repeat(60));

  // Find some test PDFs
  const testPdfDir = './test-pdfs/simple';
  const files = ['hello-world.pdf', 'multi-page.pdf'];

  const availableFiles = files
    .map(f => join(testPdfDir, f))
    .filter(f => existsSync(f));

  if (availableFiles.length < 2) {
    console.log('Not enough test PDFs found in', testPdfDir);
    console.log('Available:', availableFiles);
    return;
  }

  console.log('Input files:');
  availableFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log();

  const outputPath = '/tmp/test-merged-enhanced.pdf';

  const ctx = new Context();
  const enhanced = new Enhanced(ctx);

  try {
    console.log('Merging PDFs...');
    const pageCount = await enhanced.mergePDF(availableFiles, outputPath);

    console.log('✓ Success!');
    console.log(`  Total pages: ${pageCount}`);
    console.log(`  Output: ${outputPath}`);

    if (existsSync(outputPath)) {
      const fs = await import('fs');
      const stats = fs.statSync(outputPath);
      console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test PASSED ✓');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    console.log('\n' + '='.repeat(60));
    console.log('Test FAILED ✗');
    process.exit(1);
  }
}

testMerge().catch(console.error);

