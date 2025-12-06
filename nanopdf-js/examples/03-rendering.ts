/**
 * Example 3: Page Rendering
 *
 * This example demonstrates how to:
 * - Render pages to images
 * - Control resolution and quality
 * - Save as PNG
 * - Create thumbnails
 */

import { Document, Matrix, Colorspace } from 'nanopdf';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

function renderSinglePage() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/hello-world.pdf');
  const doc = Document.open(pdfPath);

  console.log('=== Rendering Single Page ===\n');

  const page = doc.loadPage(0);

  // Render at different resolutions
  const resolutions = [
    { name: 'Thumbnail', dpi: 36, scale: 0.5 },
    { name: 'Screen', dpi: 96, scale: 1.0 },
    { name: 'Print', dpi: 300, scale: 4.0 }
  ];

  for (const res of resolutions) {
    console.log(`Rendering at ${res.name} quality (${res.dpi} DPI)...`);

    const matrix = Matrix.scale(res.scale, res.scale);
    const pixmap = page.toPixmap(matrix, Colorspace.deviceRGB(), false);

    console.log(`  Size: ${pixmap.width} × ${pixmap.height} pixels`);
    console.log(`  Components: ${pixmap.components}`);
    console.log(`  Memory: ${(pixmap.width * pixmap.height * pixmap.components / 1024 / 1024).toFixed(2)} MB`);

    const pngData = page.toPNG(res.dpi);
    const outputPath = resolve(__dirname, `output-${res.name.toLowerCase()}.png`);
    writeFileSync(outputPath, pngData);

    console.log(`  ✅ Saved to: ${outputPath}\n`);
  }

  page.drop();
  doc.close();
}

function createThumbnails() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/multi-page.pdf');
  const doc = Document.open(pdfPath);

  console.log('=== Creating Thumbnails ===\n');

  const thumbnailScale = 0.2; // 20% of original size
  const matrix = Matrix.scale(thumbnailScale, thumbnailScale);

  for (let i = 0; i < Math.min(doc.pageCount, 5); i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(matrix, Colorspace.deviceRGB(), false);

    console.log(`Page ${i + 1}: ${pixmap.width}×${pixmap.height} pixels`);

    const pngData = page.toPNG(36); // 36 DPI for thumbnail
    const outputPath = resolve(__dirname, `thumbnail-page-${i + 1}.png`);
    writeFileSync(outputPath, pngData);

    console.log(`  ✅ Saved: ${outputPath}`);

    page.drop();
  }

  doc.close();
  console.log('\n✅ Done!');
}

function renderWithColorspace() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/hello-world.pdf');
  const doc = Document.open(pdfPath);

  console.log('\n=== Rendering with Different Colorspaces ===\n');

  const page = doc.loadPage(0);
  const matrix = Matrix.scale(1.0, 1.0);

  const colorspaces = [
    { name: 'RGB', cs: Colorspace.deviceRGB() },
    { name: 'Gray', cs: Colorspace.deviceGray() },
    { name: 'CMYK', cs: Colorspace.deviceCMYK() }
  ];

  for (const { name, cs } of colorspaces) {
    console.log(`Rendering in ${name} colorspace...`);

    const pixmap = page.toPixmap(matrix, cs, false);

    console.log(`  Components: ${pixmap.components}`);
    console.log(`  Size: ${pixmap.width}×${pixmap.height}`);

    const outputPath = resolve(__dirname, `output-${name.toLowerCase()}.png`);
    const pngData = page.toPNG(96);
    writeFileSync(outputPath, pngData);

    console.log(`  ✅ Saved: ${outputPath}\n`);
  }

  page.drop();
  doc.close();
}

function renderWithAlpha() {
  const pdfPath = resolve(__dirname, '../../test-pdfs/simple/hello-world.pdf');
  const doc = Document.open(pdfPath);

  console.log('\n=== Rendering with Alpha Channel ===\n');

  const page = doc.loadPage(0);
  const matrix = Matrix.scale(2.0, 2.0);

  // Render with alpha channel (transparency)
  const pixmap = page.toPixmap(matrix, Colorspace.deviceRGB(), true);

  console.log(`Rendered with alpha: ${pixmap.width}×${pixmap.height}`);
  console.log(`Components: ${pixmap.components} (includes alpha)`);
  console.log(`Has alpha: ${pixmap.hasAlpha}`);

  const pngData = page.toPNG(144);
  const outputPath = resolve(__dirname, 'output-with-alpha.png');
  writeFileSync(outputPath, pngData);

  console.log(`✅ Saved: ${outputPath}`);

  page.drop();
  doc.close();
}

// Run examples
if (require.main === module) {
  try {
    renderSinglePage();
    createThumbnails();
    renderWithColorspace();
    renderWithAlpha();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { renderSinglePage, createThumbnails, renderWithColorspace, renderWithAlpha };

