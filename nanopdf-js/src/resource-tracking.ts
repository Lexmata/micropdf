/**
 * Resource Tracking and Memory Optimization for NanoPDF
 *
 * This module provides:
 * - FinalizationRegistry-based handle tracking for leak detection
 * - Object pools for geometry types (Point, Rect, Matrix, Quad)
 * - WeakRef-based leak detection warnings
 * - Buffer optimization utilities
 *
 * @module resource-tracking
 */

import { Point, Rect, Matrix, Quad } from './geometry.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Resource types that can be tracked
 */
export enum ResourceType {
  Context = 'Context',
  Buffer = 'Buffer',
  Stream = 'Stream',
  Pixmap = 'Pixmap',
  Document = 'Document',
  Page = 'Page',
  Font = 'Font',
  Image = 'Image',
  Path = 'Path',
  Text = 'Text',
  Device = 'Device',
  DisplayList = 'DisplayList',
  Colorspace = 'Colorspace',
  PdfObject = 'PdfObject',
  Annotation = 'Annotation',
  Link = 'Link',
  Outline = 'Outline',
  Cookie = 'Cookie',
  Archive = 'Archive',
  StextPage = 'StextPage',
  Other = 'Other'
}

/**
 * Information about a tracked allocation
 */
export interface AllocationInfo {
  handle: number;
  type: ResourceType;
  createdAt: number;
  stackTrace?: string | undefined;
  tag?: string | undefined;
}

/**
 * Statistics for a resource type
 */
export interface TypeStats {
  currentCount: number;
  totalAllocated: number;
  totalDeallocated: number;
}

/**
 * Global tracking statistics
 */
export interface GlobalStats {
  totalHandlesCreated: number;
  totalHandlesDestroyed: number;
  currentHandles: number;
  peakHandles: number;
  leakWarnings: number;
}

// ============================================================================
// FinalizationRegistry Handle Tracking
// ============================================================================

/**
 * Callback data for finalization registry
 */
interface RegistryData {
  handle: number;
  type: ResourceType;
  tag?: string | undefined;
}

/**
 * Global handle registry for tracking unreleased resources
 */
class HandleRegistry {
  private registry: FinalizationRegistry<RegistryData>;
  private allocations = new Map<number, AllocationInfo>();
  private weakRefs = new Map<number, WeakRef<object>>();
  private stats: GlobalStats = {
    totalHandlesCreated: 0,
    totalHandlesDestroyed: 0,
    currentHandles: 0,
    peakHandles: 0,
    leakWarnings: 0
  };
  private typeStats = new Map<ResourceType, TypeStats>();
  private enabled = false;
  private captureStacks = false;
  private leakWarnings: string[] = [];

  constructor() {
    this.registry = new FinalizationRegistry<RegistryData>((data) => {
      this.handleFinalized(data);
    });
  }

  /**
   * Enable or disable resource tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable stack trace capture (expensive)
   */
  setCaptureStacks(capture: boolean): void {
    this.captureStacks = capture;
  }

  /**
   * Register an object for tracking
   */
  register(target: object, handle: number, type: ResourceType, tag?: string): void {
    if (!this.enabled) return;

    const data: RegistryData = { handle, type, tag };
    this.registry.register(target, data, target);

    // Store allocation info
    const info: AllocationInfo = {
      handle,
      type,
      createdAt: Date.now(),
      tag
    };

    if (this.captureStacks) {
      info.stackTrace = new Error().stack;
    }

    this.allocations.set(handle, info);
    this.weakRefs.set(handle, new WeakRef(target));

    // Update stats
    this.stats.totalHandlesCreated++;
    this.stats.currentHandles++;
    if (this.stats.currentHandles > this.stats.peakHandles) {
      this.stats.peakHandles = this.stats.currentHandles;
    }

    // Update type stats
    let typeStats = this.typeStats.get(type);
    if (!typeStats) {
      typeStats = { currentCount: 0, totalAllocated: 0, totalDeallocated: 0 };
      this.typeStats.set(type, typeStats);
    }
    typeStats.currentCount++;
    typeStats.totalAllocated++;
  }

  /**
   * Unregister an object (called when properly disposed)
   */
  unregister(target: object, handle: number): void {
    if (!this.enabled) return;

    this.registry.unregister(target);

    const info = this.allocations.get(handle);
    if (info) {
      this.allocations.delete(handle);
      this.weakRefs.delete(handle);

      // Update stats
      this.stats.totalHandlesDestroyed++;
      this.stats.currentHandles--;

      // Update type stats
      const typeStats = this.typeStats.get(info.type);
      if (typeStats) {
        typeStats.currentCount--;
        typeStats.totalDeallocated++;
      }
    }
  }

  /**
   * Called when an object is garbage collected without being properly disposed
   */
  private handleFinalized(data: RegistryData): void {
    const info = this.allocations.get(data.handle);
    if (info) {
      // This is a leak - the object was GC'd without being disposed
      const warning = `[LEAK] ${data.type} (handle=${data.handle}${data.tag ? `, tag=${data.tag}` : ''}) was garbage collected without being disposed`;
      this.leakWarnings.push(warning);
      this.stats.leakWarnings++;

      // Log in development
      if (process.env['NODE_ENV'] !== 'production') {
        console.warn(warning);
        if (info.stackTrace) {
          console.warn('  Allocation stack:', info.stackTrace);
        }
      }

      // Clean up tracking
      this.allocations.delete(data.handle);
      this.weakRefs.delete(data.handle);
      this.stats.currentHandles--;

      const typeStats = this.typeStats.get(data.type);
      if (typeStats) {
        typeStats.currentCount--;
      }
    }
  }

  /**
   * Get current global statistics
   */
  getStats(): GlobalStats {
    return { ...this.stats };
  }

  /**
   * Get statistics by resource type
   */
  getTypeStats(): Map<ResourceType, TypeStats> {
    return new Map(this.typeStats);
  }

  /**
   * Get all current allocations
   */
  getAllocations(): AllocationInfo[] {
    return Array.from(this.allocations.values());
  }

  /**
   * Get potential leaks (allocations older than threshold)
   */
  getPotentialLeaks(minAgeMs: number): AllocationInfo[] {
    const cutoff = Date.now() - minAgeMs;
    return Array.from(this.allocations.values()).filter((info) => info.createdAt < cutoff);
  }

  /**
   * Get and clear leak warnings
   */
  getLeakWarnings(): string[] {
    const warnings = [...this.leakWarnings];
    this.leakWarnings = [];
    return warnings;
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.allocations.clear();
    this.weakRefs.clear();
    this.typeStats.clear();
    this.leakWarnings = [];
    this.stats = {
      totalHandlesCreated: 0,
      totalHandlesDestroyed: 0,
      currentHandles: 0,
      peakHandles: 0,
      leakWarnings: 0
    };
  }
}

/**
 * Global handle registry instance
 */
export const handleRegistry = new HandleRegistry();

/**
 * Enable resource tracking
 */
export function enableTracking(enabled: boolean): void {
  handleRegistry.setEnabled(enabled);
}

/**
 * Enable stack trace capture for allocations
 */
export function enableStackTraces(enabled: boolean): void {
  handleRegistry.setCaptureStacks(enabled);
}

/**
 * Check if tracking is enabled
 */
export function isTrackingEnabled(): boolean {
  return handleRegistry.isEnabled();
}

// ============================================================================
// Object Pools for Geometry Types
// ============================================================================

/**
 * Generic object pool
 */
class ObjectPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private factory: () => T;
  private reset: (obj: T) => void;

  // Stats
  private hits = 0;
  private misses = 0;
  private returns = 0;

  constructor(factory: () => T, reset: (obj: T) => void, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /**
   * Get an object from the pool or create a new one
   */
  acquire(): T {
    if (this.pool.length > 0) {
      this.hits++;
      return this.pool.pop()!;
    }
    this.misses++;
    return this.factory();
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
      this.returns++;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { size: number; hits: number; misses: number; returns: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.pool.length,
      hits: this.hits,
      misses: this.misses,
      returns: this.returns,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * Mutable Point for pooling (internal use only)
 */
class MutablePoint {
  x = 0;
  y = 0;

  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  toPoint(): Point {
    return new Point(this.x, this.y);
  }
}

/**
 * Mutable Rect for pooling (internal use only)
 */
class MutableRect {
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;

  reset(): void {
    this.x0 = 0;
    this.y0 = 0;
    this.x1 = 0;
    this.y1 = 0;
  }

  toRect(): Rect {
    return new Rect(this.x0, this.y0, this.x1, this.y1);
  }
}

/**
 * Mutable Matrix for pooling (internal use only)
 */
class MutableMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  reset(): void {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }

  toMatrix(): Matrix {
    return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
  }
}

/**
 * Mutable Quad for pooling (internal use only)
 */
class MutableQuad {
  ulX = 0;
  ulY = 0;
  urX = 0;
  urY = 0;
  llX = 0;
  llY = 0;
  lrX = 0;
  lrY = 0;

  reset(): void {
    this.ulX = 0;
    this.ulY = 0;
    this.urX = 0;
    this.urY = 0;
    this.llX = 0;
    this.llY = 0;
    this.lrX = 0;
    this.lrY = 0;
  }

  toQuad(): Quad {
    return new Quad(
      new Point(this.ulX, this.ulY),
      new Point(this.urX, this.urY),
      new Point(this.llX, this.llY),
      new Point(this.lrX, this.lrY)
    );
  }
}

// Create pools
const pointPool = new ObjectPool<MutablePoint>(
  () => new MutablePoint(),
  (p) => p.reset(),
  200
);

const rectPool = new ObjectPool<MutableRect>(
  () => new MutableRect(),
  (r) => r.reset(),
  100
);

const matrixPool = new ObjectPool<MutableMatrix>(
  () => new MutableMatrix(),
  (m) => m.reset(),
  50
);

const quadPool = new ObjectPool<MutableQuad>(
  () => new MutableQuad(),
  (q) => q.reset(),
  50
);

/**
 * Acquire a mutable point from the pool
 */
export function acquirePoint(): MutablePoint {
  return pointPool.acquire();
}

/**
 * Release a mutable point back to the pool
 */
export function releasePoint(p: MutablePoint): void {
  pointPool.release(p);
}

/**
 * Acquire a mutable rect from the pool
 */
export function acquireRect(): MutableRect {
  return rectPool.acquire();
}

/**
 * Release a mutable rect back to the pool
 */
export function releaseRect(r: MutableRect): void {
  rectPool.release(r);
}

/**
 * Acquire a mutable matrix from the pool
 */
export function acquireMatrix(): MutableMatrix {
  return matrixPool.acquire();
}

/**
 * Release a mutable matrix back to the pool
 */
export function releaseMatrix(m: MutableMatrix): void {
  matrixPool.release(m);
}

/**
 * Acquire a mutable quad from the pool
 */
export function acquireQuad(): MutableQuad {
  return quadPool.acquire();
}

/**
 * Release a mutable quad back to the pool
 */
export function releaseQuad(q: MutableQuad): void {
  quadPool.release(q);
}

/**
 * Get pool statistics
 */
export function getPoolStats(): Record<string, ReturnType<ObjectPool<unknown>['getStats']>> {
  return {
    point: pointPool.getStats(),
    rect: rectPool.getStats(),
    matrix: matrixPool.getStats(),
    quad: quadPool.getStats()
  };
}

/**
 * Clear all pools
 */
export function clearPools(): void {
  pointPool.clear();
  rectPool.clear();
  matrixPool.clear();
  quadPool.clear();
}

// ============================================================================
// Byte Array Pool
// ============================================================================

/**
 * Pool for reusable byte arrays
 */
class ByteArrayPool {
  private pools: Map<number, Uint8Array[]> = new Map();
  private sizes = [64, 256, 1024, 4096, 16384, 65536];
  private maxPerSize = 10;

  /**
   * Get the size class for a given length
   */
  private getSizeClass(length: number): number {
    for (const size of this.sizes) {
      if (size >= length) return size;
    }
    return -1; // No suitable size class
  }

  /**
   * Acquire a byte array with at least the specified length
   */
  acquire(minLength: number): Uint8Array {
    const sizeClass = this.getSizeClass(minLength);
    if (sizeClass === -1) {
      // Too large for pooling
      return new Uint8Array(minLength);
    }

    const pool = this.pools.get(sizeClass);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }

    return new Uint8Array(sizeClass);
  }

  /**
   * Release a byte array back to the pool
   */
  release(arr: Uint8Array): void {
    const sizeClass = this.getSizeClass(arr.length);
    if (sizeClass === -1 || arr.length !== sizeClass) return;

    let pool = this.pools.get(sizeClass);
    if (!pool) {
      pool = [];
      this.pools.set(sizeClass, pool);
    }

    if (pool.length < this.maxPerSize) {
      pool.push(arr);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
  }
}

/**
 * Global byte array pool
 */
export const byteArrayPool = new ByteArrayPool();

// ============================================================================
// Buffer Optimization Utilities
// ============================================================================

/**
 * Shared TextDecoder instance for efficient string conversion
 */
const textDecoder = new TextDecoder('utf-8');

/**
 * Threshold for using TextDecoder vs simple conversion (bytes)
 */
const TEXT_DECODER_THRESHOLD = 1024;

/**
 * Convert a Uint8Array to string efficiently
 *
 * Uses TextDecoder for larger buffers (> 1KB) which is more efficient,
 * and falls back to simple string conversion for smaller buffers.
 */
export function uint8ArrayToString(data: Uint8Array): string {
  if (data.length > TEXT_DECODER_THRESHOLD) {
    return textDecoder.decode(data);
  }
  // For small buffers, direct conversion is faster due to TextDecoder overhead
  return String.fromCharCode.apply(null, data as unknown as number[]);
}

/**
 * Convert a Buffer to string efficiently
 *
 * Uses TextDecoder for larger buffers (> 1KB) which is more efficient.
 */
export function bufferToString(
  data: globalThis.Buffer,
  encoding: BufferEncoding = 'utf-8'
): string {
  if (encoding === 'utf-8' || encoding === 'utf8') {
    if (data.length > TEXT_DECODER_THRESHOLD) {
      return textDecoder.decode(data);
    }
  }
  return data.toString(encoding);
}

// ============================================================================
// Reusable Array Utilities
// ============================================================================

/**
 * Reusable number array pool for hot paths
 */
class NumberArrayPool {
  private pools: Map<number, number[][]> = new Map();
  private maxPerSize = 20;

  acquire(size: number): number[] {
    const pool = this.pools.get(size);
    if (pool && pool.length > 0) {
      const arr = pool.pop()!;
      arr.length = size; // Reset length
      return arr;
    }
    return new Array(size);
  }

  release(arr: number[]): void {
    const size = arr.length;
    let pool = this.pools.get(size);
    if (!pool) {
      pool = [];
      this.pools.set(size, pool);
    }
    if (pool.length < this.maxPerSize) {
      // Clear array content
      arr.fill(0);
      pool.push(arr);
    }
  }

  clear(): void {
    this.pools.clear();
  }
}

/**
 * Global number array pool
 */
export const numberArrayPool = new NumberArrayPool();

// ============================================================================
// Leak Detection Report
// ============================================================================

/**
 * Generate a comprehensive leak report
 */
export function generateLeakReport(minAgeMs = 60000): string {
  const stats = handleRegistry.getStats();
  const typeStats = handleRegistry.getTypeStats();
  const potentialLeaks = handleRegistry.getPotentialLeaks(minAgeMs);
  const leakWarnings = handleRegistry.getLeakWarnings();

  const lines: string[] = [
    '=== NanoPDF Memory Leak Report (Node.js) ===',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Min age threshold: ${minAgeMs}ms`,
    '',
    '--- Global Statistics ---',
    `Handles created: ${stats.totalHandlesCreated}`,
    `Handles destroyed: ${stats.totalHandlesDestroyed}`,
    `Current handles: ${stats.currentHandles}`,
    `Peak handles: ${stats.peakHandles}`,
    `Leak warnings: ${stats.leakWarnings}`,
    '',
    '--- By Resource Type ---'
  ];

  for (const [type, tStats] of typeStats) {
    if (tStats.totalAllocated > 0) {
      lines.push(
        `  ${type}: ${tStats.currentCount} current (${tStats.totalAllocated} allocated, ${tStats.totalDeallocated} freed)`
      );
    }
  }

  if (potentialLeaks.length > 0) {
    lines.push('', `--- Potential Leaks (${potentialLeaks.length}) ---`);
    for (const leak of potentialLeaks.slice(0, 20)) {
      const age = Date.now() - leak.createdAt;
      lines.push(
        `  ${leak.type} (handle=${leak.handle}): age ${Math.round(age / 1000)}s${leak.tag ? `, tag=${leak.tag}` : ''}`
      );
    }
    if (potentialLeaks.length > 20) {
      lines.push(`  ... and ${potentialLeaks.length - 20} more`);
    }
  }

  if (leakWarnings.length > 0) {
    lines.push('', `--- Recent Leak Warnings (${leakWarnings.length}) ---`);
    for (const warning of leakWarnings.slice(0, 10)) {
      lines.push(`  ${warning}`);
    }
  }

  // Pool stats
  const poolStats = getPoolStats();
  lines.push('', '--- Object Pool Statistics ---');
  for (const [name, pStats] of Object.entries(poolStats)) {
    lines.push(
      `  ${name}: ${pStats.size} pooled, ${pStats.hits} hits, ${pStats.misses} misses, ${(pStats.hitRate * 100).toFixed(1)}% hit rate`
    );
  }

  return lines.join('\n');
}

/**
 * Print leak report to console
 */
export function printLeakReport(minAgeMs = 60000): void {
  console.log(generateLeakReport(minAgeMs));
}
