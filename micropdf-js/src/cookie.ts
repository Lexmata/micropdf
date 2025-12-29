/**
 * Cookie - Operation progress and cancellation tracking
 *
 * This module provides 100% API compatibility with MuPDF's cookie operations.
 * Cookies track progress, errors, and allow cancellation of long-running operations.
 */

/**
 * A cookie for tracking operation progress and cancellation
 */
export class Cookie {
  private _abort: boolean = false;
  private _progress: number = 0;
  private _progressMax: number = 0;
  private _errors: number = 0;
  private _incomplete: boolean = false;
  private _refCount: number = 1;

  constructor() {}

  /**
   * Create a new cookie
   */
  static create(): Cookie {
    return new Cookie();
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
   * Clone this cookie
   */
  clone(): Cookie {
    const cloned = new Cookie();
    cloned._abort = this._abort;
    cloned._progress = this._progress;
    cloned._progressMax = this._progressMax;
    cloned._errors = this._errors;
    cloned._incomplete = this._incomplete;
    return cloned;
  }

  // ============================================================================
  // Abort Control
  // ============================================================================

  /**
   * Check if operation should abort
   */
  shouldAbort(): boolean {
    return this._abort;
  }

  /**
   * Request abortion of the operation
   */
  abort(): void {
    this._abort = true;
  }

  /**
   * Reset abort flag
   */
  resetAbort(): void {
    this._abort = false;
  }

  /**
   * Check if aborted
   */
  get isAborted(): boolean {
    return this._abort;
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  /**
   * Get current progress
   */
  getProgress(): number {
    return this._progress;
  }

  /**
   * Set current progress
   */
  setProgress(progress: number): void {
    this._progress = Math.max(0, progress);
  }

  /**
   * Increment progress
   */
  incProgress(delta: number = 1): void {
    this._progress = Math.max(0, this._progress + delta);
  }

  /**
   * Get progress maximum
   */
  getProgressMax(): number {
    return this._progressMax;
  }

  /**
   * Set progress maximum
   */
  setProgressMax(max: number): void {
    this._progressMax = Math.max(0, max);
  }

  /**
   * Get progress as percentage (0-100)
   */
  getProgressPercent(): number {
    if (this._progressMax <= 0) {
      return 0;
    }
    return Math.min(100, (this._progress / this._progressMax) * 100);
  }

  /**
   * Get progress as float (0.0-1.0)
   */
  getProgressFloat(): number {
    if (this._progressMax <= 0) {
      return 0;
    }
    return Math.min(1.0, this._progress / this._progressMax);
  }

  /**
   * Get remaining progress
   */
  getProgressRemaining(): number {
    return Math.max(0, this._progressMax - this._progress);
  }

  /**
   * Check if progress is complete
   */
  isComplete(): boolean {
    return this._progressMax > 0 && this._progress >= this._progressMax;
  }

  // ============================================================================
  // Error Tracking
  // ============================================================================

  /**
   * Get error count
   */
  getErrors(): number {
    return this._errors;
  }

  /**
   * Set error count
   */
  setErrors(count: number): void {
    this._errors = Math.max(0, count);
  }

  /**
   * Increment error count
   */
  incErrors(delta: number = 1): void {
    this._errors = Math.max(0, this._errors + delta);
  }

  /**
   * Check if there are errors
   */
  hasErrors(): boolean {
    return this._errors > 0;
  }

  // ============================================================================
  // Incomplete Flag
  // ============================================================================

  /**
   * Check if operation is incomplete
   */
  isIncomplete(): boolean {
    return this._incomplete;
  }

  /**
   * Set incomplete flag
   */
  setIncomplete(incomplete: boolean): void {
    this._incomplete = incomplete;
  }

  // ============================================================================
  // Reset
  // ============================================================================

  /**
   * Reset cookie to initial state
   */
  reset(): void {
    this._abort = false;
    this._progress = 0;
    this._progressMax = 0;
    this._errors = 0;
    this._incomplete = false;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if cookie is valid
   */
  isValid(): boolean {
    return true; // Cookies are always valid in this implementation
  }

  // ============================================================================
  // Status Summary
  // ============================================================================

  /**
   * Get status summary
   */
  getStatus(): {
    aborted: boolean;
    progress: number;
    progressMax: number;
    progressPercent: number;
    progressFloat: number;
    errors: number;
    incomplete: boolean;
    complete: boolean;
  } {
    return {
      aborted: this._abort,
      progress: this._progress,
      progressMax: this._progressMax,
      progressPercent: this.getProgressPercent(),
      progressFloat: this.getProgressFloat(),
      errors: this._errors,
      incomplete: this._incomplete,
      complete: this.isComplete()
    };
  }

  /**
   * Get status string
   */
  toString(): string {
    const status = this.getStatus();
    return `Cookie(progress=${status.progress}/${status.progressMax} [${status.progressPercent.toFixed(1)}%], errors=${status.errors}, aborted=${status.aborted}, incomplete=${status.incomplete})`;
  }
}

/**
 * Cookie-aware operation wrapper
 */
export class CookieOperation<T> {
  private _cookie: Cookie;
  private _operation: (cookie: Cookie) => Promise<T>;
  private _onProgress?: (progress: number, max: number) => void;
  private _onError?: (error: Error) => void;
  private _running: boolean = false;

  constructor(
    operation: (cookie: Cookie) => Promise<T>,
    options?: {
      onProgress?: (progress: number, max: number) => void;
      onError?: (error: Error) => void;
    }
  ) {
    this._cookie = Cookie.create();
    this._operation = operation;
    if (options?.onProgress) {
      this._onProgress = options.onProgress;
    }
    if (options?.onError) {
      this._onError = options.onError;
    }
  }

  /**
   * Get the cookie
   */
  get cookie(): Cookie {
    return this._cookie;
  }

  /**
   * Check if operation is running
   */
  get isRunning(): boolean {
    return this._running;
  }

  /**
   * Run the operation
   */
  async run(): Promise<T> {
    if (this._running) {
      throw new Error('Operation already running');
    }

    this._running = true;
    this._cookie.reset();

    try {
      // Start progress monitoring
      const progressInterval = setInterval(() => {
        if (this._onProgress) {
          this._onProgress(this._cookie.getProgress(), this._cookie.getProgressMax());
        }
      }, 100);

      try {
        const result = await this._operation(this._cookie);
        clearInterval(progressInterval);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        this._cookie.incErrors();
        if (this._onError && error instanceof Error) {
          this._onError(error);
        }
        throw error;
      }
    } finally {
      this._running = false;
    }
  }

  /**
   * Abort the operation
   */
  abort(): void {
    this._cookie.abort();
  }

  /**
   * Get progress as percentage
   */
  getProgress(): number {
    return this._cookie.getProgressPercent();
  }
}
