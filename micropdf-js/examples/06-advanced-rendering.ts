/**
 * Advanced Rendering Options Example
 *
 * Demonstrates fine-grained control over PDF rendering quality, performance,
 * and output characteristics.
 */

import {
  Document,
  AntiAliasLevel,
  Colorspace,
  Matrix,
  type RenderOptions,
  dpiToScale,
  scaleToDpi
} from '../src/index.js';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

// Example 1: High-quality print rendering
function highQualityPrintRendering() {
  console.log('\n=== Example 1: High-Quality Print Rendering ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  const options: RenderOptions = {
    dpi: 300, // Standard print resolution
    colorspace: Colorspace.deviceRGB(),
    alpha: false, // No transparency for print
    antiAlias: AntiAliasLevel.High, // Best quality
    renderAnnotations: true,
    renderFormFields: true
  };

  console.log('Rendering at 300 DPI for print...');
  const start = Date.now();
  const pixmap = page.renderWithOptions(options);
  const elapsed = Date.now() - start;

  console.log(`Rendered in ${elapsed}ms`);
  console.log(`Output size: ${pixmap.width} x ${pixmap.height} pixels`);
  console.log(`Color components: ${pixmap.components}`);
  console.log(`Has alpha: ${pixmap.hasAlpha}`);
  console.log(
    `Memory usage: ~${Math.round((pixmap.width * pixmap.height * pixmap.components) / 1024 / 1024)}MB`
  );

  // Save as PNG
  const pngPath = join(__dirname, 'output-print-300dpi.png');
  writeFileSync(pngPath, Buffer.from(pixmap.data));
  console.log(`Saved to: ${pngPath}`);

  pixmap.drop();
  page.drop();
  doc.close();
}

// Example 2: Fast preview rendering
function fastPreviewRendering() {
  console.log('\n=== Example 2: Fast Preview Rendering ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  const options: RenderOptions = {
    dpi: 72, // Screen resolution
    colorspace: Colorspace.deviceRGB(),
    antiAlias: AntiAliasLevel.None // Fastest
  };

  console.log('Rendering at 72 DPI for preview...');
  const start = Date.now();
  const pixmap = page.renderWithOptions(options);
  const elapsed = Date.now() - start;

  console.log(`Rendered in ${elapsed}ms (should be very fast!)`);
  console.log(`Output size: ${pixmap.width} x ${pixmap.height} pixels`);

  pixmap.drop();
  page.drop();
  doc.close();
}

// Example 3: Multiple DPI renderings
function multipleDPIRenderings() {
  console.log('\n=== Example 3: Multiple DPI Renderings ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  const dpiLevels = [72, 96, 150, 300, 600];

  console.log('Rendering at different DPI levels:\n');
  console.log('DPI  | Width  | Height | Scale | Time');
  console.log('-----|--------|--------|-------|------');

  for (const dpi of dpiLevels) {
    const start = Date.now();
    const pixmap = page.renderWithOptions({ dpi });
    const elapsed = Date.now() - start;

    const scale = dpiToScale(dpi);
    console.log(
      `${dpi.toString().padStart(4)} | ${pixmap.width.toString().padStart(6)} | ${pixmap.height.toString().padStart(6)} | ${scale.toFixed(2).padStart(5)} | ${elapsed}ms`
    );

    pixmap.drop();
  }

  page.drop();
  doc.close();
}

// Example 4: Different colorspaces
function differentColorspaces() {
  console.log('\n=== Example 4: Different Colorspaces ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  // RGB
  console.log('Rendering in RGB...');
  const rgbPixmap = page.renderWithOptions({
    dpi: 150,
    colorspace: Colorspace.deviceRGB()
  });
  console.log(`  Components: ${rgbPixmap.components} (Red, Green, Blue)`);
  console.log(`  Size: ${rgbPixmap.width} x ${rgbPixmap.height}`);

  // Grayscale
  console.log('\nRendering in Grayscale...');
  const grayPixmap = page.renderWithOptions({
    dpi: 150,
    colorspace: Colorspace.deviceGray()
  });
  console.log(`  Components: ${grayPixmap.components} (Gray)`);
  console.log(`  Size: ${grayPixmap.width} x ${grayPixmap.height}`);

  // RGB with alpha
  console.log('\nRendering in RGBA...');
  const rgbaPixmap = page.renderWithOptions({
    dpi: 150,
    colorspace: Colorspace.deviceRGB(),
    alpha: true
  });
  console.log(`  Components: ${rgbaPixmap.components} (Red, Green, Blue)`);
  console.log(`  Has alpha: ${rgbaPixmap.hasAlpha}`);
  console.log(`  Size: ${rgbaPixmap.width} x ${rgbaPixmap.height}`);

  rgbPixmap.drop();
  grayPixmap.drop();
  rgbaPixmap.drop();
  page.drop();
  doc.close();
}

// Example 5: Custom transformations
function customTransformations() {
  console.log('\n=== Example 5: Custom Transformations ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  // Original size
  const original = page.renderWithOptions({ dpi: 72 });
  console.log(`Original: ${original.width} x ${original.height}`);

  // 2x scale
  const scaled = page.renderWithOptions({
    transform: Matrix.scale(2, 2)
  });
  console.log(`2x scaled: ${scaled.width} x ${scaled.height}`);

  // 90° rotation
  const rotated = page.renderWithOptions({
    transform: Matrix.rotate(90)
  });
  console.log(`90° rotated: ${rotated.width} x ${rotated.height}`);

  // Combined: scale + rotate
  const combined = page.renderWithOptions({
    transform: Matrix.scale(1.5, 1.5).postRotate(45)
  });
  console.log(`1.5x + 45° rotated: ${combined.width} x ${combined.height}`);

  original.drop();
  scaled.drop();
  rotated.drop();
  combined.drop();
  page.drop();
  doc.close();
}

// Example 6: Progress tracking
async function progressTracking() {
  console.log('\n=== Example 6: Progress Tracking ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  let lastPercent = 0;
  const pixmap = await page.renderWithProgress({
    dpi: 300,
    antiAlias: AntiAliasLevel.High,
    onProgress: (current, total) => {
      const percent = Math.round((current / total) * 100);
      if (percent !== lastPercent) {
        console.log(`Progress: ${percent}%`);
        lastPercent = percent;
      }
      return true; // Continue rendering
    },
    onError: (error) => {
      console.error('Render error:', error);
    }
  });

  console.log(`Completed: ${pixmap.width} x ${pixmap.height}`);

  pixmap.drop();
  page.drop();
  doc.close();
}

// Example 7: Anti-aliasing comparison
function antiAliasingComparison() {
  console.log('\n=== Example 7: Anti-Aliasing Comparison ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/hello-world.pdf'));
  const page = doc.loadPage(0);

  const levels = [
    { level: AntiAliasLevel.None, name: 'None (0x0)' },
    { level: AntiAliasLevel.Low, name: 'Low (2x2)' },
    { level: AntiAliasLevel.Medium, name: 'Medium (4x4)' },
    { level: AntiAliasLevel.High, name: 'High (8x8)' }
  ];

  console.log('Rendering with different anti-aliasing levels:\n');
  console.log('Level          | Time   | Quality Notes');
  console.log('---------------|--------|----------------');

  for (const { level, name } of levels) {
    const start = Date.now();
    const pixmap = page.renderWithOptions({
      dpi: 150,
      antiAlias: level
    });
    const elapsed = Date.now() - start;

    let notes = '';
    if (level === AntiAliasLevel.None) notes = 'Fastest, jagged edges';
    if (level === AntiAliasLevel.Low) notes = 'Fast, some smoothing';
    if (level === AntiAliasLevel.Medium) notes = 'Balanced';
    if (level === AntiAliasLevel.High) notes = 'Best quality, slower';

    console.log(`${name.padEnd(14)} | ${elapsed.toString().padStart(4)}ms | ${notes}`);

    pixmap.drop();
  }

  page.drop();
  doc.close();
}

// Example 8: Batch rendering with options
async function batchRenderingWithOptions() {
  console.log('\n=== Example 8: Batch Rendering with Options ===\n');

  const doc = Document.open(join(__dirname, '../../test-pdfs/simple/multi-page.pdf'));
  const pageCount = Math.min(3, doc.pageCount);

  console.log(`Batch rendering ${pageCount} pages at 150 DPI...\n`);

  const options: RenderOptions = {
    dpi: 150,
    antiAlias: AntiAliasLevel.Medium
  };

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);

    const pixmap = await page.renderWithProgress({
      ...options,
      onProgress: (current, total) => {
        if (current === total) {
          console.log(`  Page ${i + 1}: Complete (${pixmap.width}x${pixmap.height})`);
        }
        return true;
      }
    });

    // Save each page
    const outputPath = join(__dirname, `output-page-${i + 1}.png`);
    writeFileSync(outputPath, Buffer.from(pixmap.data));

    pixmap.drop();
    page.drop();
  }

  console.log(`\nBatch rendering complete!`);
  doc.close();
}

// Run all examples
function runAll() {
  console.log('='.repeat(70));
  console.log('Advanced Rendering Options Examples');
  console.log('='.repeat(70));

  try {
    highQualityPrintRendering();
    fastPreviewRendering();
    multipleDPIRenderings();
    differentColorspaces();
    customTransformations();
    antiAliasingComparison();

    // Async examples
    progressTracking()
      .then(() => batchRenderingWithOptions())
      .then(() => {
        console.log('\n' + '='.repeat(70));
        console.log('All examples completed successfully!');
        console.log('='.repeat(70) + '\n');
      })
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAll();
}

export { runAll };
