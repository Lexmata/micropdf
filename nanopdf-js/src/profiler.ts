/**
 * Memory Profiler - Detailed memory leak detection for NanoPDF
 *
 * Provides comprehensive memory profiling capabilities:
 * - Handle allocation tracking with stack traces
 * - Leak detection for unreleased handles
 * - Memory usage statistics by type
 * - WeakRef-based leak detection
 *
 * @example
 * ```typescript
 * import { enableProfiling, getLeakReport } from 'nanopdf/profiler';
 *
 * enableProfiling(true);
 * // ... use NanoPDF ...
 * const report = getLeakReport(60000); // Leaks older than 60s
 * console.log(report.toString());
 * ```
 */

/** Resource types being tracked */
export enum ResourceType {
  Context = 0,
  Buffer = 1,
  Stream = 2,
  Pixmap = 3,
  Document = 4,
  Page = 5,
  Font = 6,
  Image = 7,
  Path = 8,
  Text = 9,
  Device = 10,
  DisplayList = 11,
  Colorspace = 12,
  PdfObject = 13,
  Outline = 14,
  Link = 15,
  Annotation = 16,
  StextPage = 17,
  Cookie = 18,
  Archive = 19,
  Other = 255
}

const resourceTypeNames: Record<ResourceType, string> = {
  [ResourceType.Context]: 'Context',
  [ResourceType.Buffer]: 'Buffer',
  [ResourceType.Stream]: 'Stream',
  [ResourceType.Pixmap]: 'Pixmap',
  [ResourceType.Document]: 'Document',
  [ResourceType.Page]: 'Page',
  [ResourceType.Font]: 'Font',
  [ResourceType.Image]: 'Image',
  [ResourceType.Path]: 'Path',
  [ResourceType.Text]: 'Text',
  [ResourceType.Device]: 'Device',
  [ResourceType.DisplayList]: 'DisplayList',
  [ResourceType.Colorspace]: 'Colorspace',
  [ResourceType.PdfObject]: 'PdfObject',
  [ResourceType.Outline]: 'Outline',
  [ResourceType.Link]: 'Link',
  [ResourceType.Annotation]: 'Annotation',
  [ResourceType.StextPage]: 'StextPage',
  [ResourceType.Cookie]: 'Cookie',
  [ResourceType.Archive]: 'Archive',
  [ResourceType.Other]: 'Other'
};

export function getResourceTypeName(type: ResourceType): string {
  return resourceTypeNames[type] ?? `Unknown(${type})`;
}

/** Record of a single allocation */
export interface AllocationRecord {
  handle: number;
  resourceType: ResourceType;
  sizeBytes: number;
  allocatedAt: Date;
  stackTrace?: string;
  tag?: string;
}

/** Statistics for a specific resource type */
export interface TypeStats {
  currentCount: number;
  currentBytes: number;
  totalAllocated: number;
  totalDeallocated: number;
  totalBytesAllocated: number;
  totalBytesDeallocated: number;
  peakCount: number;
  peakBytes: number;
}

/** Global statistics snapshot */
export interface GlobalStats {
  totalHandlesCreated: number;
  totalHandlesDestroyed: number;
  currentHandles: number;
  currentBytes: number;
  peakHandles: number;
  peakBytes: number;
  uptimeMs: number;
}

/** Leak detection report */
export interface LeakReport {
  generatedAt: Date;
  minAgeThresholdMs: number;
  totalPotentialLeaks: number;
  leaksByType: Map<ResourceType, AllocationRecord[]>;
  globalStats: GlobalStats;
}

/**
 * Memory profiler for tracking handle allocations and detecting leaks
 */
export class MemoryProfiler {
  private enabled = false;
  private captureStackTraces = false;
  private allocations = new Map<number, AllocationRecord>();
  private statsByType = new Map<ResourceType, TypeStats>();
  private startTime = Date.now();

  // Statistics
  private totalCreated = 0;
  private totalDestroyed = 0;
  private currentHandles = 0;
  private currentBytes = 0;
  private peakHandles = 0;
  private peakBytes = 0;

  // WeakRef registry for detecting GC'd objects
  private readonly _registry?: FinalizationRegistry<{
    handle: number;
    type: ResourceType;
  }>;

  constructor() {
    // Set up FinalizationRegistry if available (Node.js 14+)
    if (typeof FinalizationRegistry !== 'undefined') {
      this._registry = new FinalizationRegistry((heldValue) => {
        // Object was GC'd without being explicitly deallocated
        if (this.enabled && this.allocations.has(heldValue.handle)) {
          console.warn(
            `[NanoPDF] Handle ${heldValue.handle} (${getResourceTypeName(heldValue.type)}) ` +
              'was garbage collected without being explicitly freed. This may indicate a leak.'
          );
        }
      });
    }
  }

  /** Enable or disable profiling */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Enable or disable stack trace capture */
  setStackTraceCapture(enabled: boolean): void {
    this.captureStackTraces = enabled;
  }

  /** Check if profiling is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Record a new allocation */
  recordAllocation(
    handle: number,
    resourceType: ResourceType,
    sizeBytes: number,
    tag?: string
  ): void {
    if (!this.enabled) return;

    const record: AllocationRecord = {
      handle,
      resourceType,
      sizeBytes,
      allocatedAt: new Date()
    };

    if (tag !== undefined) {
      record.tag = tag;
    }

    if (this.captureStackTraces) {
      const stack = new Error().stack;
      if (stack !== undefined) {
        record.stackTrace = stack;
      }
    }

    this.allocations.set(handle, record);

    // Update type stats
    let stats = this.statsByType.get(resourceType);
    if (!stats) {
      stats = {
        currentCount: 0,
        currentBytes: 0,
        totalAllocated: 0,
        totalDeallocated: 0,
        totalBytesAllocated: 0,
        totalBytesDeallocated: 0,
        peakCount: 0,
        peakBytes: 0
      };
      this.statsByType.set(resourceType, stats);
    }

    stats.currentCount++;
    stats.currentBytes += sizeBytes;
    stats.totalAllocated++;
    stats.totalBytesAllocated += sizeBytes;
    stats.peakCount = Math.max(stats.peakCount, stats.currentCount);
    stats.peakBytes = Math.max(stats.peakBytes, stats.currentBytes);

    // Update global stats
    this.totalCreated++;
    this.currentHandles++;
    this.currentBytes += sizeBytes;
    this.peakHandles = Math.max(this.peakHandles, this.currentHandles);
    this.peakBytes = Math.max(this.peakBytes, this.currentBytes);
  }

  /** Record a deallocation */
  recordDeallocation(handle: number): AllocationRecord | undefined {
    if (!this.enabled) return undefined;

    const record = this.allocations.get(handle);
    if (!record) return undefined;

    this.allocations.delete(handle);

    // Update type stats
    const stats = this.statsByType.get(record.resourceType);
    if (stats) {
      stats.currentCount--;
      stats.currentBytes -= record.sizeBytes;
      stats.totalDeallocated++;
      stats.totalBytesDeallocated += record.sizeBytes;
    }

    // Update global stats
    this.totalDestroyed++;
    this.currentHandles--;
    this.currentBytes -= record.sizeBytes;

    return record;
  }

  /** Register an object for GC tracking */
  registerForGCTracking(target: object, handle: number, resourceType: ResourceType): void {
    if (this._registry && this.enabled) {
      this._registry.register(target, { handle, type: resourceType });
    }
  }

  /** Get all currently live allocations */
  getLiveAllocations(): AllocationRecord[] {
    return Array.from(this.allocations.values());
  }

  /** Get allocations older than minAgeMs (potential leaks) */
  getPotentialLeaks(minAgeMs: number): AllocationRecord[] {
    const cutoff = Date.now() - minAgeMs;
    return this.getLiveAllocations().filter((r) => r.allocatedAt.getTime() < cutoff);
  }

  /** Get statistics by resource type */
  getStatsByType(): Map<ResourceType, TypeStats> {
    return new Map(this.statsByType);
  }

  /** Get global statistics */
  getGlobalStats(): GlobalStats {
    return {
      totalHandlesCreated: this.totalCreated,
      totalHandlesDestroyed: this.totalDestroyed,
      currentHandles: this.currentHandles,
      currentBytes: this.currentBytes,
      peakHandles: this.peakHandles,
      peakBytes: this.peakBytes,
      uptimeMs: Date.now() - this.startTime
    };
  }

  /** Reset all profiling data */
  reset(): void {
    this.allocations.clear();
    this.statsByType.clear();
    this.totalCreated = 0;
    this.totalDestroyed = 0;
    this.currentHandles = 0;
    this.currentBytes = 0;
    this.peakHandles = 0;
    this.peakBytes = 0;
    this.startTime = Date.now();
  }

  /** Generate a leak report */
  generateLeakReport(minAgeMs: number): LeakReport {
    const leaks = this.getPotentialLeaks(minAgeMs);
    const leaksByType = new Map<ResourceType, AllocationRecord[]>();

    for (const leak of leaks) {
      const existing = leaksByType.get(leak.resourceType) ?? [];
      existing.push(leak);
      leaksByType.set(leak.resourceType, existing);
    }

    return {
      generatedAt: new Date(),
      minAgeThresholdMs: minAgeMs,
      totalPotentialLeaks: leaks.length,
      leaksByType,
      globalStats: this.getGlobalStats()
    };
  }
}

// Global profiler instance
let globalProfiler: MemoryProfiler | null = null;

/** Get the global memory profiler instance */
export function getProfiler(): MemoryProfiler {
  if (!globalProfiler) {
    globalProfiler = new MemoryProfiler();
  }
  return globalProfiler;
}

/** Enable or disable memory profiling */
export function enableProfiling(enabled: boolean): void {
  getProfiler().setEnabled(enabled);
}

/** Enable or disable stack trace capture */
export function enableStackTraces(enabled: boolean): void {
  getProfiler().setStackTraceCapture(enabled);
}

/** Check if profiling is enabled */
export function isProfilingEnabled(): boolean {
  return getProfiler().isEnabled();
}

/** Track an allocation */
export function trackAllocation(
  handle: number,
  resourceType: ResourceType,
  sizeBytes: number,
  tag?: string
): void {
  getProfiler().recordAllocation(handle, resourceType, sizeBytes, tag);
}

/** Track a deallocation */
export function trackDeallocation(handle: number): void {
  getProfiler().recordDeallocation(handle);
}

/** Get a leak report */
export function getLeakReport(minAgeMs: number = 60000): LeakReport {
  return getProfiler().generateLeakReport(minAgeMs);
}

/** Print a leak report to console */
export function printLeakReport(minAgeMs: number = 60000): void {
  const report = getLeakReport(minAgeMs);
  console.log(formatLeakReport(report));
}

/** Reset the profiler */
export function resetProfiler(): void {
  getProfiler().reset();
}

/** Format a leak report as a string */
export function formatLeakReport(report: LeakReport): string {
  const lines: string[] = [];

  lines.push('=== NanoPDF Memory Leak Report (Node.js) ===');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt.toISOString()}`);
  lines.push(`Min age threshold: ${report.minAgeThresholdMs}ms`);
  lines.push(`Total potential leaks: ${report.totalPotentialLeaks}`);
  lines.push('');

  lines.push('--- Global Statistics ---');
  lines.push(`Handles created: ${report.globalStats.totalHandlesCreated}`);
  lines.push(`Handles destroyed: ${report.globalStats.totalHandlesDestroyed}`);
  lines.push(`Current handles: ${report.globalStats.currentHandles}`);
  lines.push(`Current memory: ${report.globalStats.currentBytes} bytes`);
  lines.push(`Peak handles: ${report.globalStats.peakHandles}`);
  lines.push(`Peak memory: ${report.globalStats.peakBytes} bytes`);
  lines.push(`Uptime: ${report.globalStats.uptimeMs}ms`);
  lines.push('');

  lines.push('--- Leaks by Type ---');

  const sortedTypes = Array.from(report.leaksByType.keys()).sort((a, b) => a - b);

  for (const resourceType of sortedTypes) {
    const leaks = report.leaksByType.get(resourceType) ?? [];
    if (leaks.length === 0) continue;

    lines.push('');
    lines.push(`${getResourceTypeName(resourceType)} (${leaks.length} leaks):`);

    // Sort by age (oldest first)
    const sorted = leaks.sort((a, b) => a.allocatedAt.getTime() - b.allocatedAt.getTime());

    for (let i = 0; i < Math.min(10, sorted.length); i++) {
      const leak = sorted[i]!;
      const age = Date.now() - leak.allocatedAt.getTime();
      let line = `  ${i + 1}. Handle ${leak.handle} - ${leak.sizeBytes} bytes, age ${age}ms`;
      if (leak.tag) {
        line += `, tag: ${leak.tag}`;
      }
      lines.push(line);

      if (leak.stackTrace) {
        const stackLines = leak.stackTrace.split('\n').slice(1, 6);
        for (const stackLine of stackLines) {
          lines.push(`      ${stackLine.trim()}`);
        }
      }
    }

    if (sorted.length > 10) {
      lines.push(`  ... and ${sorted.length - 10} more`);
    }
  }

  return lines.join('\n');
}

/** Get Node.js process memory usage */
export function getProcessMemory(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
} {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
    arrayBuffers: usage.arrayBuffers
  };
}

/** Print Node.js process memory statistics */
export function printProcessMemory(): void {
  const mem = getProcessMemory();
  console.log('=== Node.js Process Memory ===');
  console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`ArrayBuffers: ${(mem.arrayBuffers / 1024 / 1024).toFixed(2)} MB`);
}

/** Force garbage collection if available (requires --expose-gc flag) */
export function forceGC(): boolean {
  if (typeof global.gc === 'function') {
    global.gc();
    return true;
  }
  return false;
}

/** Take a heap snapshot if v8 is available */
export async function takeHeapSnapshot(filename: string): Promise<boolean> {
  try {
    const v8 = await import('node:v8');

    const snapshotStream = v8.writeHeapSnapshot(filename);
    if (snapshotStream) {
      console.log(`Heap snapshot written to: ${snapshotStream}`);
      return true;
    }
    return false;
  } catch {
    console.warn('Heap snapshot not available (requires Node.js with v8 module)');
    return false;
  }
}
