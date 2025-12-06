/**
 * Example 1: Basic PDF Reading
 *
 * This example demonstrates how to:
 * - Open a PDF document
 * - Read basic properties
 * - Access metadata
 * - Load and inspect pages
 */

import { Document } from 'nanopdf';
import { resolve } from 'path';

function basicReading() {
  // Open a PDF document
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/hello-world.pdf');
  const doc = Document.open(pdfPath);

  console.log('=== Basic PDF Information ===');
  console.log(`File: ${pdfPath}`);
  console.log(`Format: ${doc.format}`);
  console.log(`Pages: ${doc.pageCount}`);
  console.log(`Needs Password: ${doc.needsPassword()}`);
  console.log(`Is Authenticated: ${doc.isAuthenticated}`);

  // Read metadata
  console.log('\n=== Metadata ===');
  const metadataKeys = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'];
  for (const key of metadataKeys) {
    const value = doc.getMetadata(key);
    if (value) {
      console.log(`${key}: ${value}`);
    }
  }

  // Load and inspect the first page
  console.log('\n=== First Page ===');
  const page = doc.loadPage(0);
  console.log(`Page Number: ${page.pageNumber}`);
  console.log(`Bounds: [${page.bounds.x0}, ${page.bounds.y0}, ${page.bounds.x1}, ${page.bounds.y1}]`);
  console.log(`Width: ${page.bounds.width} points`);
  console.log(`Height: ${page.bounds.height} points`);
  console.log(`Rotation: ${page.rotation} degrees`);

  // Convert points to inches (72 points = 1 inch)
  const widthInches = page.bounds.width / 72;
  const heightInches = page.bounds.height / 72;
  console.log(`Size: ${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}"`);

  // Clean up
  page.drop();
  doc.close();

  console.log('\n✅ Done!');
}

// Run the example
if (require.main === module) {
  try {
    basicReading();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { basicReading };

