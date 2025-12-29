/**
 * PDF Merging Example
 *
 * Demonstrates how to merge multiple PDF files into a single output file.
 * Supports large documents (5000+ pages) and handles corrupted PDFs robustly.
 */

import { mergePDF } from '../src/simple.js';
import { Enhanced } from '../src/enhanced.js';
import { Context } from '../src/context.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Example 1: Simple merge using the simple API
 */
async function simpleMerge() {
  console.log('Example 1: Simple PDF Merge\n');

  const inputs = [
    '../test-pdfs/sample1.pdf',
    '../test-pdfs/sample2.pdf',
    '../test-pdfs/sample3.pdf'
  ];

  const output = '/tmp/merged-simple.pdf';

  try {
    const pageCount = await mergePDF(inputs, output);
    console.log(`✓ Successfully merged ${inputs.length} PDFs`);
    console.log(`✓ Total pages: ${pageCount}`);
    console.log(`✓ Output: ${output}\n`);
  } catch (error) {
    console.error('✗ Merge failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Merge with Enhanced API (more control)
 */
async function enhancedMerge() {
  console.log('Example 2: Enhanced API Merge\n');

  const ctx = new Context();
  const enhanced = new Enhanced(ctx);

  try {
    const inputs = ['../test-pdfs/sample1.pdf', '../test-pdfs/sample2.pdf'];

    const output = '/tmp/merged-enhanced.pdf';

    const pageCount = await enhanced.mergePDF(inputs, output);
    console.log(`✓ Merged ${inputs.length} documents`);
    console.log(`✓ Total pages: ${pageCount}`);
    console.log(`✓ Output: ${output}\n`);
  } catch (error) {
    console.error('✗ Merge failed:', error instanceof Error ? error.message : error);
  } finally {
    ctx.free();
  }
}

/**
 * Example 3: Merge with error handling and validation
 */
async function mergeWithValidation() {
  console.log('Example 3: Merge with Validation\n');

  const inputs = [
    '../test-pdfs/sample1.pdf',
    '../test-pdfs/sample2.pdf',
    '../test-pdfs/nonexistent.pdf' // This will cause an error
  ];

  const output = '/tmp/merged-validated.pdf';

  // Validate all inputs exist before merging
  const missing: string[] = [];
  for (const path of inputs) {
    if (!existsSync(path)) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    console.error(`✗ Missing files:`);
    missing.forEach((f) => console.error(`  - ${f}`));
    return;
  }

  try {
    const pageCount = await mergePDF(inputs, output);
    console.log(`✓ Successfully merged ${inputs.length} PDFs`);
    console.log(`✓ Total pages: ${pageCount}\n`);
  } catch (error) {
    console.error('✗ Merge failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 4: Merge large documents (5000+ pages)
 */
async function mergeLargeDocuments() {
  console.log('Example 4: Merge Large Documents\n');

  // Note: This example assumes you have large test PDFs
  const inputs = ['../test-pdfs/large-doc-1.pdf', '../test-pdfs/large-doc-2.pdf'];

  // Check if test files exist
  const allExist = inputs.every((path) => existsSync(path));
  if (!allExist) {
    console.log('⚠ Skipping: Large test PDFs not found');
    console.log('  Create test PDFs with 5000+ pages to test this example\n');
    return;
  }

  const output = '/tmp/merged-large.pdf';

  try {
    console.log('⏳ Merging large documents (this may take a while)...');
    const startTime = Date.now();

    const pageCount = await mergePDF(inputs, output);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Successfully merged ${inputs.length} large PDFs`);
    console.log(`✓ Total pages: ${pageCount}`);
    console.log(`✓ Time: ${duration}s`);
    console.log(`✓ Output: ${output}\n`);
  } catch (error) {
    console.error('✗ Merge failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 5: Batch merge multiple sets of documents
 */
async function batchMerge() {
  console.log('Example 5: Batch Merge\n');

  const mergeSets = [
    {
      name: 'Invoice Set 1',
      inputs: ['../test-pdfs/invoice1.pdf', '../test-pdfs/invoice2.pdf'],
      output: '/tmp/invoices-set1.pdf'
    },
    {
      name: 'Invoice Set 2',
      inputs: ['../test-pdfs/invoice3.pdf', '../test-pdfs/invoice4.pdf'],
      output: '/tmp/invoices-set2.pdf'
    }
  ];

  for (const set of mergeSets) {
    // Check if all inputs exist
    const allExist = set.inputs.every((path) => existsSync(path));
    if (!allExist) {
      console.log(`⚠ Skipping ${set.name}: Some files not found`);
      continue;
    }

    try {
      const pageCount = await mergePDF(set.inputs, set.output);
      console.log(`✓ ${set.name}: Merged ${pageCount} pages`);
    } catch (error) {
      console.error(`✗ ${set.name} failed:`, error instanceof Error ? error.message : error);
    }
  }
  console.log();
}

// Run all examples
async function main() {
  console.log('='.repeat(60));
  console.log('PDF Merging Examples');
  console.log('='.repeat(60));
  console.log();

  await simpleMerge();
  await enhancedMerge();
  await mergeWithValidation();
  await mergeLargeDocuments();
  await batchMerge();

  console.log('='.repeat(60));
  console.log('Examples complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
