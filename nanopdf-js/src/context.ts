/**
 * Context - Rendering and error context
 *
 * This module provides 100% API compatibility with MuPDF's context operations.
 * Handles error management, memory management, and rendering contexts.
 */

/**
 * Error callback type
 */
export type ErrorCallback = (message: string, code: number) => void;

/**
 * Warning callback type
 */
export type WarningCallback = (message: string) => void;

/**
 * Context for MuPDF operations
 */
export class Context {
  private _userData: unknown = null;
  private _errorCallback: ErrorCallback | null = null;
  private _warningCallback: WarningCallback | null = null;
  private _warnings: string[] = [];
  private _lastError: { message: string; code: number } | null = null;
  private _storeSize: number = 256 * 1024 * 1024; // 256MB default
  private _storeUsed: number = 0;
  private _aaLevel: number = 8;
  private _iccEnabled: boolean = true;
  private _refCount: number = 1;

  constructor() {}

  /**
   * Create a new default context
   */
  static createDefault(): Context {
    return new Context();
  }

  /**
   * Create a new context
   */
  static create(storeSize?: number): Context {
    const ctx = new Context();
    if (storeSize !== undefined) {
      ctx._storeSize = storeSize;
    }
    return ctx;
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
   * Clone this context
   */
  clone(): Context {
    const cloned = new Context();
    cloned._storeSize = this._storeSize;
    cloned._aaLevel = this._aaLevel;
    cloned._iccEnabled = this._iccEnabled;
    return cloned;
  }

  // ============================================================================
  // User Data
  // ============================================================================

  /**
   * Set user context data
   */
  setUserContext(data: unknown): void {
    this._userData = data;
  }

  /**
   * Get user context data
   */
  getUserContext<T = unknown>(): T | null {
    return this._userData as T | null;
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Throw an error
   */
  throw(message: string, code: number = 1): never {
    this._lastError = { message, code };
    if (this._errorCallback) {
      this._errorCallback(message, code);
    }
    throw new Error(message);
  }

  /**
   * Rethrow the last error
   */
  rethrow(): never {
    if (this._lastError) {
      this.throw(this._lastError.message, this._lastError.code);
    }
    throw new Error('No error to rethrow');
  }

  /**
   * Get caught error
   */
  caught(): number {
    return this._lastError ? this._lastError.code : 0;
  }

  /**
   * Get caught error message
   */
  caughtMessage(): string {
    return this._lastError ? this._lastError.message : '';
  }

  /**
   * Check if context has an error
   */
  hasError(): boolean {
    return this._lastError !== null;
  }

  /**
   * Ignore/clear the current error
   */
  ignoreError(): void {
    this._lastError = null;
  }

  /**
   * Convert error code to string
   */
  convertError(code: number): string {
    const errors: Record<number, string> = {
      0: 'No error',
      1: 'Generic error',
      2: 'Out of memory',
      3: 'Invalid operation',
      4: 'File not found',
      5: 'I/O error'
    };
    return errors[code] || `Error ${code}`;
  }

  /**
   * Report error
   */
  reportError(message: string, code: number = 1): void {
    this._lastError = { message, code };
    if (this._errorCallback) {
      this._errorCallback(message, code);
    }
  }

  /**
   * Set error callback
   */
  setErrorCallback(callback: ErrorCallback | null): void {
    this._errorCallback = callback;
  }

  // ============================================================================
  // Warning Handling
  // ============================================================================

  /**
   * Issue a warning
   */
  warn(message: string): void {
    this._warnings.push(message);
    if (this._warningCallback) {
      this._warningCallback(message);
    }
  }

  /**
   * Flush accumulated warnings
   */
  flushWarnings(): string[] {
    const warnings = [...this._warnings];
    this._warnings = [];
    return warnings;
  }

  /**
   * Set warning callback
   */
  setWarningCallback(callback: WarningCallback | null): void {
    this._warningCallback = callback;
  }

  // ============================================================================
  // Store (Cache) Management
  // ============================================================================

  /**
   * Get store size (cache size)
   */
  getStoreSize(): number {
    return this._storeSize;
  }

  /**
   * Get store used bytes
   */
  getStoreUsed(): number {
    return this._storeUsed;
  }

  /**
   * Shrink store to target size
   */
  shrinkStore(target: number): void {
    if (this._storeUsed > target) {
      this._storeUsed = target;
    }
  }

  /**
   * Empty the store completely
   */
  emptyStore(): void {
    this._storeUsed = 0;
  }

  /**
   * Scavenge store (reclaim memory)
   */
  storeScavenge(target: number): number {
    const before = this._storeUsed;
    this.shrinkStore(target);
    return before - this._storeUsed;
  }

  // ============================================================================
  // ICC Color Management
  // ============================================================================

  /**
   * Enable ICC color management
   */
  enableICC(): void {
    this._iccEnabled = true;
  }

  /**
   * Disable ICC color management
   */
  disableICC(): void {
    this._iccEnabled = false;
  }

  /**
   * Check if ICC is enabled
   */
  get isICCEnabled(): boolean {
    return this._iccEnabled;
  }

  // ============================================================================
  // Anti-Aliasing
  // ============================================================================

  /**
   * Set anti-aliasing level (0-8)
   */
  setAALevel(level: number): void {
    this._aaLevel = Math.max(0, Math.min(8, level));
  }

  /**
   * Get anti-aliasing level
   */
  getAALevel(): number {
    return this._aaLevel;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if context is valid
   */
  isValid(): boolean {
    return this._refCount > 0;
  }

  // ============================================================================
  // Context Info
  // ============================================================================

  /**
   * Get context info
   */
  getInfo(): ContextInfo {
    return {
      storeSize: this._storeSize,
      storeUsed: this._storeUsed,
      storeAvailable: this._storeSize - this._storeUsed,
      storePercent: (this._storeUsed / this._storeSize) * 100,
      aaLevel: this._aaLevel,
      iccEnabled: this._iccEnabled,
      hasError: this.hasError(),
      errorMessage: this.caughtMessage(),
      warningCount: this._warnings.length,
      refCount: this._refCount
    };
  }

  /**
   * Get context status string
   */
  toString(): string {
    const info = this.getInfo();
    return `Context(store=${(info.storeUsed / 1024 / 1024).toFixed(1)}/${(info.storeSize / 1024 / 1024).toFixed(0)}MB, aa=${info.aaLevel}, icc=${info.iccEnabled}, errors=${info.hasError}, warnings=${info.warningCount})`;
  }
}

/**
 * Context information
 */
export interface ContextInfo {
  storeSize: number;
  storeUsed: number;
  storeAvailable: number;
  storePercent: number;
  aaLevel: number;
  iccEnabled: boolean;
  hasError: boolean;
  errorMessage: string;
  warningCount: number;
  refCount: number;
}

/**
 * Global default context
 */
let defaultContext: Context | null = null;

/**
 * Get the global default context
 */
export function getDefaultContext(): Context {
  if (!defaultContext) {
    defaultContext = Context.createDefault();
  }
  return defaultContext;
}

/**
 * Set the global default context
 */
export function setDefaultContext(ctx: Context): void {
  defaultContext = ctx;
}

/**
 * Reset the global default context
 */
export function resetDefaultContext(): void {
  defaultContext = null;
}
