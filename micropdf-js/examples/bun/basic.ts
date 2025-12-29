/**
 * Basic usage examples for MicroPDF with Bun
 */

import { Context, Document, Pixmap, MatrixHelper } from '../../bun';

// Example 1: Extract text from PDF
async function extractText(pdfPath: string): Promise<string> {
  console.log('📄 Extracting text from PDF...');

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);

  const pageCount = doc.pageCount();
  console.log(`   Pages: ${pageCount}`);

  let fullText = '';

  for (let i = 0; i < pageCount; i++) {
    using page = doc.loadPage(i);
    const text = page.extractText();
    fullText += `\n--- Page ${i + 1} ---\n${text}`;
  }

  return fullText;
}

// Example 2: Render page to PNG
async function renderToPng(
  pdfPath: string,
  pageNum: number,
  outputPath: string,
  dpi = 150
): Promise<void> {
  console.log(`\n🖼️  Rendering page ${pageNum} to PNG at ${dpi} DPI...`);

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);
  using page = doc.loadPage(pageNum);

  const matrix = MatrixHelper.dpi(dpi);
  using pixmap = Pixmap.fromPage(ctx, page, matrix);

  await pixmap.savePng(outputPath);

  console.log(`   Saved to: ${outputPath}`);
  console.log(`   Size: ${pixmap.width()}x${pixmap.height()}`);
}

// Example 3: Get document metadata
function getMetadata(pdfPath: string): void {
  console.log('\n📋 Document Metadata:');

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);

  const metadata = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'];

  for (const key of metadata) {
    const value = doc.getMetadata(key);
    if (value) {
      console.log(`   ${key}: ${value}`);
    }
  }

  const needsPassword = doc.needsPassword();
  console.log(`   Password Protected: ${needsPassword}`);
  console.log(`   Page Count: ${doc.pageCount()}`);
}

// Example 4: Get page bounds
function getPageBounds(pdfPath: string, pageNum: number): void {
  console.log(`\n📏 Page ${pageNum} Bounds:`);

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);
  using page = doc.loadPage(pageNum);

  const bounds = page.bounds();
  const width = bounds.x1 - bounds.x0;
  const height = bounds.y1 - bounds.y0;

  console.log(`   Width: ${width.toFixed(2)} points (${(width / 72).toFixed(2)} inches)`);
  console.log(`   Height: ${height.toFixed(2)} points (${(height / 72).toFixed(2)} inches)`);
  console.log(`   Bounds: (${bounds.x0}, ${bounds.y0}) to (${bounds.x1}, ${bounds.y1})`);
}

// Example 5: Render all pages
async function renderAllPages(pdfPath: string, outputDir: string, dpi = 150): Promise<void> {
  console.log(`\n📚 Rendering all pages to ${outputDir}/...`);

  // Create output directory
  await Bun.write(`${outputDir}/.keep`, '');

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);

  const pageCount = doc.pageCount();
  const matrix = MatrixHelper.dpi(dpi);

  for (let i = 0; i < pageCount; i++) {
    using page = doc.loadPage(i);
    using pixmap = Pixmap.fromPage(ctx, page, matrix);

    const outputPath = `${outputDir}/page_${String(i + 1).padStart(3, '0')}.png`;
    await pixmap.savePng(outputPath);

    console.log(`   ✓ Page ${i + 1}/${pageCount}: ${outputPath}`);
  }
}

// Example 6: Password-protected PDF
function openPasswordProtected(pdfPath: string, password: string): void {
  console.log('\n🔒 Opening password-protected PDF...');

  using ctx = new Context();
  using doc = Document.open(ctx, pdfPath);

  if (doc.needsPassword()) {
    console.log('   Password required!');
    const success = doc.authenticate(password);

    if (success) {
      console.log('   ✓ Authentication successful');
      console.log(`   Pages: ${doc.pageCount()}`);
    } else {
      console.log('   ✗ Authentication failed');
    }
  } else {
    console.log('   No password required');
  }
}

// Main function
async function main() {
  const args = Bun.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: bun run examples/bun/basic.ts <pdf-file> [command]');
    console.log('\nCommands:');
    console.log('  text         - Extract text from PDF');
    console.log('  render       - Render first page to PNG');
    console.log('  metadata     - Show document metadata');
    console.log('  bounds       - Show page bounds');
    console.log('  render-all   - Render all pages to PNG');
    console.log('\nExample:');
    console.log('  bun run examples/bun/basic.ts sample.pdf text');
    process.exit(1);
  }

  const pdfPath = args[0];
  const command = args[1] || 'text';

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MicroPDF for Bun - Usage Examples                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    switch (command) {
      case 'text': {
        const text = await extractText(pdfPath);
        console.log('\n📄 Extracted Text:');
        console.log(text.substring(0, 500) + '...');
        break;
      }

      case 'render': {
        await renderToPng(pdfPath, 0, 'output.png', 300);
        break;
      }

      case 'metadata': {
        getMetadata(pdfPath);
        break;
      }

      case 'bounds': {
        getPageBounds(pdfPath, 0);
        break;
      }

      case 'render-all': {
        await renderAllPages(pdfPath, 'output_pages', 150);
        break;
      }

      default:
        console.log(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('\n✅ Complete!');
  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.main) {
  await main();
}
