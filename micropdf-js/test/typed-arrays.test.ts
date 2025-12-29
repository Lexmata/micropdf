import { describe, it, expect } from 'vitest';
import {
  colorFromRGB,
  colorFromRGBA,
  colorFromGray,
  colorFromCMYK,
  pointsFromCoords,
  pointsFromObjects,
  transformPointsInPlace,
  transformPoints,
  rectsFromCoords,
  rectsFromObjects,
  transformRectsInPlace,
  matrixIdentity,
  matrixTranslate,
  matrixScale,
  matrixRotate,
  matrixConcatInPlace,
  matrixConcat,
  pointDistances,
  pointDistancesSquared,
  rectContainsPoints,
  countPointsInRect,
  convertPixelFormat,
  premultiplyAlpha,
  unpremultiplyAlpha
} from '../src/typed-arrays';

describe('Color Arrays', () => {
  it('should create RGB color from 0-255 values', () => {
    const color = colorFromRGB(255, 128, 0);
    expect(color).toBeInstanceOf(Float32Array);
    expect(color.length).toBe(3);
    expect(color[0]).toBeCloseTo(1.0, 2);
    expect(color[1]).toBeCloseTo(0.5, 2);
    expect(color[2]).toBeCloseTo(0.0, 2);
  });

  it('should create RGB color from 0-1 values', () => {
    const color = colorFromRGB(1.0, 0.5, 0.0, false);
    expect(color[0]).toBe(1.0);
    expect(color[1]).toBe(0.5);
    expect(color[2]).toBe(0.0);
  });

  it('should create RGBA color', () => {
    const color = colorFromRGBA(255, 255, 255, 128);
    expect(color.length).toBe(4);
    expect(color[3]).toBeCloseTo(0.5, 2);
  });

  it('should create grayscale color', () => {
    const color = colorFromGray(128);
    expect(color.length).toBe(1);
    expect(color[0]).toBeCloseTo(0.5, 2);
  });

  it('should create CMYK color', () => {
    const color = colorFromCMYK(255, 0, 255, 0);
    expect(color.length).toBe(4);
    expect(color[0]).toBeCloseTo(1.0, 2);
    expect(color[2]).toBeCloseTo(1.0, 2);
  });
});

describe('Point Arrays', () => {
  it('should create points from coordinates', () => {
    const points = pointsFromCoords(0, 0, 100, 100, 200, 50);
    expect(points).toBeInstanceOf(Float32Array);
    expect(points.length).toBe(6);
    expect(points[0]).toBe(0);
    expect(points[2]).toBe(100);
  });

  it('should create points from objects', () => {
    const points = pointsFromObjects([
      { x: 10, y: 20 },
      { x: 30, y: 40 }
    ]);
    expect(points.length).toBe(4);
    expect(points[0]).toBe(10);
    expect(points[3]).toBe(40);
  });

  it('should transform points in place', () => {
    const points = pointsFromCoords(0, 0, 100, 0);
    // Scale by 2
    transformPointsInPlace(points, 2, 0, 0, 2, 0, 0);
    expect(points[2]).toBe(200);
  });

  it('should transform points returning new array', () => {
    const points = pointsFromCoords(0, 0, 100, 0);
    const transformed = transformPoints(points, 1, 0, 0, 1, 50, 50);
    expect(points[2]).toBe(100); // Original unchanged
    expect(transformed[2]).toBe(150); // Translated
    expect(transformed[3]).toBe(50);
  });
});

describe('Rectangle Arrays', () => {
  it('should create rectangles from coordinates', () => {
    const rects = rectsFromCoords(0, 0, 100, 100, 200, 200, 300, 300);
    expect(rects.length).toBe(8);
  });

  it('should create rectangles from objects', () => {
    const rects = rectsFromObjects([
      { x0: 0, y0: 0, x1: 50, y1: 50 },
      { x0: 100, y0: 100, x1: 150, y1: 150 }
    ]);
    expect(rects.length).toBe(8);
    expect(rects[4]).toBe(100);
  });

  it('should transform rectangles with translation', () => {
    const rects = rectsFromCoords(0, 0, 100, 100);
    transformRectsInPlace(rects, 1, 0, 0, 1, 50, 25);
    expect(rects[0]).toBe(50);
    expect(rects[1]).toBe(25);
    expect(rects[2]).toBe(150);
    expect(rects[3]).toBe(125);
  });

  it('should transform rectangles with scale', () => {
    const rects = rectsFromCoords(0, 0, 100, 100);
    transformRectsInPlace(rects, 2, 0, 0, 2, 0, 0);
    expect(rects[2]).toBe(200);
    expect(rects[3]).toBe(200);
  });
});

describe('Matrix Operations', () => {
  it('should create identity matrix', () => {
    const m = matrixIdentity();
    expect(m[0]).toBe(1);
    expect(m[3]).toBe(1);
    expect(m[4]).toBe(0);
  });

  it('should create translation matrix', () => {
    const m = matrixTranslate(100, 50);
    expect(m[4]).toBe(100);
    expect(m[5]).toBe(50);
  });

  it('should create scale matrix', () => {
    const m = matrixScale(2, 3);
    expect(m[0]).toBe(2);
    expect(m[3]).toBe(3);
  });

  it('should create rotation matrix for common angles', () => {
    const m90 = matrixRotate(90);
    expect(m90[0]).toBeCloseTo(0, 5);
    expect(m90[1]).toBeCloseTo(1, 5);

    const m180 = matrixRotate(180);
    expect(m180[0]).toBeCloseTo(-1, 5);
  });

  it('should concatenate matrices in place', () => {
    const m1 = matrixScale(2, 2);
    const m2 = matrixTranslate(50, 50);
    matrixConcatInPlace(m1, m2);
    // Scale then translate: (x*2, y*2) then + (50, 50)
    // m1 is now [2, 0, 0, 2, 50, 50]
    expect(m1[4]).toBe(50);
  });

  it('should concatenate matrices returning new array', () => {
    const m1 = matrixScale(2, 2);
    const m2 = matrixTranslate(50, 50);
    const m3 = matrixConcat(m1, m2);
    expect(m1[4]).toBe(0); // Original unchanged
    expect(m3[4]).toBe(50);
  });
});

describe('Distance Calculations', () => {
  it('should calculate distances from point to points', () => {
    const points = pointsFromCoords(3, 4, 0, 0, 6, 8);
    const distances = pointDistances(0, 0, points);
    expect(distances[0]).toBeCloseTo(5, 5); // 3-4-5 triangle
    expect(distances[1]).toBe(0);
    expect(distances[2]).toBeCloseTo(10, 5);
  });

  it('should calculate squared distances', () => {
    const points = pointsFromCoords(3, 4);
    const distances = pointDistancesSquared(0, 0, points);
    expect(distances[0]).toBe(25);
  });
});

describe('Containment Tests', () => {
  it('should test which points are in rectangle', () => {
    const points = pointsFromCoords(5, 5, 50, 50, 150, 150);
    const result = rectContainsPoints(0, 0, 100, 100, points);
    expect(result[0]).toBe(1); // Inside
    expect(result[1]).toBe(1); // Inside
    expect(result[2]).toBe(0); // Outside
  });

  it('should count points in rectangle', () => {
    const points = pointsFromCoords(5, 5, 50, 50, 150, 150, 200, 200);
    const count = countPointsInRect(0, 0, 100, 100, points);
    expect(count).toBe(2);
  });
});

describe('Pixel Operations', () => {
  it('should convert RGB to RGBA', () => {
    const rgb = new Uint8Array([255, 0, 0, 0, 255, 0]);
    const rgba = convertPixelFormat(rgb, 3, 4);
    expect(rgba.length).toBe(8);
    expect(rgba[0]).toBe(255); // R
    expect(rgba[3]).toBe(255); // A (default)
    expect(rgba[5]).toBe(255); // G of second pixel
  });

  it('should convert RGBA to RGB', () => {
    const rgba = new Uint8Array([255, 0, 0, 128, 0, 255, 0, 255]);
    const rgb = convertPixelFormat(rgba, 4, 3);
    expect(rgb.length).toBe(6);
    expect(rgb[0]).toBe(255);
    expect(rgb[4]).toBe(255); // G of second pixel
  });

  it('should convert Gray to RGB', () => {
    const gray = new Uint8Array([128, 255]);
    const rgb = convertPixelFormat(gray, 1, 3);
    expect(rgb.length).toBe(6);
    expect(rgb[0]).toBe(128);
    expect(rgb[1]).toBe(128);
    expect(rgb[2]).toBe(128);
  });

  it('should premultiply alpha', () => {
    const pixels = new Uint8Array([255, 255, 255, 128]);
    premultiplyAlpha(pixels);
    expect(pixels[0]).toBeCloseTo(128, -1); // ~128 (255 * 0.5)
    expect(pixels[1]).toBeCloseTo(128, -1);
    expect(pixels[2]).toBeCloseTo(128, -1);
    expect(pixels[3]).toBe(128); // Alpha unchanged
  });

  it('should unpremultiply alpha', () => {
    const pixels = new Uint8Array([128, 128, 128, 128]);
    unpremultiplyAlpha(pixels);
    expect(pixels[0]).toBe(255);
    expect(pixels[1]).toBe(255);
    expect(pixels[2]).toBe(255);
  });
});
