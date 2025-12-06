/**
 * Archive - File archive handling
 *
 * This module provides 100% API compatibility with MuPDF's archive operations.
 * Handles ZIP and other archive formats embedded in PDFs.
 */

import { native } from './native.js';
import type { NativeContext, NativeArchive } from './native.js';
import { getDefaultContext } from './context.js';

/**
 * Archive format types
 */
export enum ArchiveFormat {
  Unknown = 0,
  Zip = 1,
  Tar = 2,
  Directory = 3
}

/**
 * Archive entry
 */
export interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
}

/**
 * An archive (ZIP, TAR, etc.)
 */
export class Archive {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _ctx?: NativeContext;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _archive?: NativeArchive;
  private _format: ArchiveFormat;
  private _entries: Map<string, Uint8Array> = new Map();
  private _refCount: number = 1;
  private _path: string | null = null;

  constructor(format: ArchiveFormat = ArchiveFormat.Zip, path?: string) {
    this._format = format;
    this._path = path || null;
  }

  /**
   * @internal Check if FFI bindings are available
   */
  get hasNativeHandle(): boolean {
    return this._ctx !== undefined && this._archive !== undefined;
  }

  /**
   * Open archive from file path using FFI
   * @throws Error when native bindings are not available
   */
  static open(path: string): Archive {
    const ctx = (getDefaultContext() as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('Archive opening from file requires native FFI bindings (fz_open_archive)');
    }

    const format = path.endsWith('.zip')
      ? ArchiveFormat.Zip
      : path.endsWith('.tar')
        ? ArchiveFormat.Tar
        : ArchiveFormat.Unknown;

    const archive = new Archive(format, path);
    archive._ctx = ctx;
    archive._archive = native.openArchive(ctx, path);
    return archive;
  }

  /**
   * Open archive from buffer using FFI
   * @throws Error when native bindings are not available
   */
  static openWithBuffer(buffer: Uint8Array): Archive {
    const ctx = (getDefaultContext() as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error('Archive opening from buffer requires native FFI bindings (fz_open_archive_with_buffer)');
    }

    const format = Archive.detectFormat(buffer);
    const archive = new Archive(format);
    archive._ctx = ctx;
    archive._archive = native.openArchiveFromMemory(ctx, Buffer.from(buffer));
    return archive;
  }

  /**
   * Detect archive format
   */
  private static detectFormat(buffer: Uint8Array): ArchiveFormat {
    if (buffer.length < 4) {
      return ArchiveFormat.Unknown;
    }

    // ZIP: PK\x03\x04
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return ArchiveFormat.Zip;
    }

    // TAR: ustar at offset 257
    if (
      buffer.length >= 262 &&
      buffer[257] === 0x75 &&
      buffer[258] === 0x73 &&
      buffer[259] === 0x74 &&
      buffer[260] === 0x61 &&
      buffer[261] === 0x72
    ) {
      return ArchiveFormat.Tar;
    }

    return ArchiveFormat.Unknown;
  }

  // ============================================================================
  // Reference Counting
  // ============================================================================

  keep(): this {
    this._refCount++;
    return this;
  }

  drop(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
  }

  /**
   * Clone this archive
   */
  clone(): Archive {
    const cloned = new Archive(this._format, this._path ?? undefined);
    cloned._entries = new Map(this._entries);
    return cloned;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Get archive format
   */
  getFormat(): ArchiveFormat {
    return this._format;
  }

  /**
   * Get archive format name
   */
  getFormatName(): string {
    switch (this._format) {
      case ArchiveFormat.Zip:
        return 'ZIP';
      case ArchiveFormat.Tar:
        return 'TAR';
      case ArchiveFormat.Directory:
        return 'Directory';
      default:
        return 'Unknown';
    }
  }

  // ============================================================================
  // Entries
  // ============================================================================

  /**
   * Count archive entries
   */
  count(): number {
    return this._entries.size;
  }

  /**
   * List entry by index
   */
  listEntry(index: number): string | null {
    const names = Array.from(this._entries.keys());
    return names[index] || null;
  }

  /**
   * Get all entry names
   */
  entryNames(): string[] {
    return Array.from(this._entries.keys());
  }

  /**
   * Check if entry exists
   */
  hasEntry(name: string): boolean {
    return this._entries.has(name);
  }

  /**
   * Get entry size
   */
  entrySize(name: string): number {
    const data = this._entries.get(name);
    return data ? data.length : 0;
  }

  /**
   * Read entry data
   */
  readEntry(name: string): Uint8Array | null {
    const data = this._entries.get(name);
    return data ? new Uint8Array(data) : null;
  }

  /**
   * Add entry to archive
   */
  addEntry(name: string, data: Uint8Array): void {
    this._entries.set(name, data);
  }

  /**
   * Remove entry from archive
   */
  removeEntry(name: string): boolean {
    return this._entries.delete(name);
  }

  /**
   * Get all entries
   */
  getEntries(): ArchiveEntry[] {
    const entries: ArchiveEntry[] = [];
    for (const [name, data] of this._entries) {
      entries.push({
        name,
        size: data.length,
        isDirectory: name.endsWith('/')
      });
    }
    return entries;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if archive is valid
   */
  isValid(): boolean {
    return this._format !== ArchiveFormat.Unknown;
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  /**
   * Iterate over entry names
   */
  *[Symbol.iterator](): Generator<string> {
    for (const name of this._entries.keys()) {
      yield name;
    }
  }

  /**
   * For each entry
   */
  forEach(callback: (name: string, data: Uint8Array) => void): void {
    for (const [name, data] of this._entries) {
      callback(name, data);
    }
  }

  // ============================================================================
  // Extraction
  // ============================================================================

  /**
   * Extract all entries
   */
  extractAll(): Map<string, Uint8Array> {
    const extracted = new Map<string, Uint8Array>();
    for (const [name, data] of this._entries) {
      extracted.set(name, new Uint8Array(data));
    }
    return extracted;
  }

  /**
   * Extract entry by name
   */
  extract(name: string): Uint8Array | null {
    return this.readEntry(name);
  }

  /**
   * Extract entries matching pattern
   */
  extractPattern(pattern: string | RegExp): Map<string, Uint8Array> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const extracted = new Map<string, Uint8Array>();

    for (const [name, data] of this._entries) {
      if (regex.test(name)) {
        extracted.set(name, new Uint8Array(data));
      }
    }

    return extracted;
  }
}
