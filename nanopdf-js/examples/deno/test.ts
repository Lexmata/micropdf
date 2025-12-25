/**
 * Tests for NanoPDF Deno bindings
 */

import { assertEquals, assertExists } from '@std/assert';
import { Context, Document, Pixmap, MatrixHelper } from '../../mod.ts';

Deno.test('Context - create and drop', () => {
  const ctx = new Context();
  assertExists(ctx.getHandle());
  ctx.drop();
});

Deno.test('Context - using keyword', () => {
  using ctx = new Context();
  assertExists(ctx.getHandle());
  // Automatic cleanup
});

Deno.test('Context - clone', () => {
  using ctx1 = new Context();
  using ctx2 = ctx1.clone();
  assertExists(ctx1.getHandle());
  assertExists(ctx2.getHandle());
});

Deno.test('MatrixHelper - identity', () => {
  const m = MatrixHelper.identity();
  assertEquals(m.a, 1);
  assertEquals(m.d, 1);
  assertEquals(m.b, 0);
  assertEquals(m.c, 0);
  assertEquals(m.e, 0);
  assertEquals(m.f, 0);
});

Deno.test('MatrixHelper - scale', () => {
  const m = MatrixHelper.scale(2.0, 3.0);
  assertEquals(m.a, 2.0);
  assertEquals(m.d, 3.0);
});

Deno.test('MatrixHelper - dpi', () => {
  const m = MatrixHelper.dpi(300);
  const scale = 300 / 72;
  assertEquals(m.a, scale);
  assertEquals(m.d, scale);
});

// Note: The following tests require a sample PDF file
// They are skipped if the file doesn't exist

async function hasSamplePdf(): Promise<boolean> {
  try {
    await Deno.stat('sample.pdf');
    return true;
  } catch {
    return false;
  }
}

Deno.test({
  name: 'Document - open and get page count',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    const count = doc.pageCount();
    assertEquals(typeof count, 'number');
    assertEquals(count > 0, true);
  }
});

Deno.test({
  name: 'Document - metadata',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    const title = doc.getMetadata('Title');
    assertEquals(typeof title, 'string');
  }
});

Deno.test({
  name: 'Page - load and get bounds',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    using page = doc.loadPage(0);
    const bounds = page.bounds();

    assertExists(bounds);
    assertEquals(typeof bounds.x0, 'number');
    assertEquals(typeof bounds.y0, 'number');
    assertEquals(typeof bounds.x1, 'number');
    assertEquals(typeof bounds.y1, 'number');
  }
});

Deno.test({
  name: 'Page - extract text',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    using page = doc.loadPage(0);
    const text = page.extractText();

    assertEquals(typeof text, 'string');
  }
});

Deno.test({
  name: 'Pixmap - render from page',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    using page = doc.loadPage(0);

    const matrix = MatrixHelper.scale(1.0, 1.0);
    using pixmap = Pixmap.fromPage(ctx, page, matrix);

    const width = pixmap.width();
    const height = pixmap.height();

    assertEquals(typeof width, 'number');
    assertEquals(typeof height, 'number');
    assertEquals(width > 0, true);
    assertEquals(height > 0, true);
  }
});

Deno.test({
  name: 'Pixmap - get samples',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    using page = doc.loadPage(0);

    const matrix = MatrixHelper.scale(0.5, 0.5);
    using pixmap = Pixmap.fromPage(ctx, page, matrix);

    const samples = pixmap.samples();

    assertExists(samples);
    assertEquals(samples instanceof Uint8Array, true);
    assertEquals(samples.length > 0, true);
  }
});

Deno.test({
  name: 'Pixmap - to PNG',
  ignore: !(await hasSamplePdf()),
  fn: () => {
    using ctx = new Context();
    using doc = Document.open(ctx, 'sample.pdf');
    using page = doc.loadPage(0);

    const matrix = MatrixHelper.scale(0.5, 0.5);
    using pixmap = Pixmap.fromPage(ctx, page, matrix);

    const pngData = pixmap.toPng();

    assertExists(pngData);
    assertEquals(pngData instanceof Uint8Array, true);
    assertEquals(pngData.length > 0, true);

    // Check PNG signature
    assertEquals(pngData[0], 0x89);
    assertEquals(pngData[1], 0x50);
    assertEquals(pngData[2], 0x4e);
    assertEquals(pngData[3], 0x47);
  }
});

Deno.test({
  name: 'Pixmap - save PNG',
  ignore: !(await hasSamplePdf()),
  fn: async () => {
    const outputPath = 'test_output.png';

    try {
      using ctx = new Context();
      using doc = Document.open(ctx, 'sample.pdf');
      using page = doc.loadPage(0);

      const matrix = MatrixHelper.scale(0.5, 0.5);
      using pixmap = Pixmap.fromPage(ctx, page, matrix);

      await pixmap.savePng(outputPath);

      // Verify file was created
      const stat = await Deno.stat(outputPath);
      assertEquals(stat.isFile, true);
      assertEquals(stat.size > 0, true);
    } finally {
      // Cleanup
      try {
        await Deno.remove(outputPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }
});
