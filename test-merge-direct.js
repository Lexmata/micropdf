/**
 * Direct test of npMergePDFs native function
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

async function testMerge() {
  console.log('Testing npMergePDFs Native Function Directly\n');
  console.log('='.repeat(60));

  // Load the native addon
  let native;
  try {
    const addonPath = join(__dirname, 'micropdf-js/build/Release/micropdf.node');
    native = require(addonPath);
    console.log('✓ Native addon loaded from:', addonPath);
  } catch (error) {
    console.error('✗ Failed to load native addon:', error.message);
    process.exit(1);
  }

  // Check if npMergePDFs function exists
  if (typeof native.npMergePDFs !== 'function') {
    console.error('✗ npMergePDFs function not found in native addon');
    console.log('Available functions:', Object.keys(native));
    process.exit(1);
  }
  console.log('✓ npMergePDFs function found');
  console.log();

  // Create a native context
  const ctx = native.createContext();
  console.log('✓ Native context created:', ctx);
  console.log();

  // Find test PDFs
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

  const outputPath = '/tmp/test-merged-direct.pdf';

  try {
    console.log('Calling npMergePDFs...');
    const result = native.npMergePDFs(
      ctx,
      availableFiles,
      availableFiles.length,
      outputPath
    );

    if (result < 0) {
      throw new Error(`npMergePDFs returned error code: ${result}`);
    }

    console.log('✓ Success!');
    console.log(`  Return value: ${result} pages`);
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
  } finally {
    // Clean up context
    if (ctx) {
      native.dropContext(ctx);
      console.log('✓ Context cleaned up');
    }
  }
}

testMerge().catch(console.error);

