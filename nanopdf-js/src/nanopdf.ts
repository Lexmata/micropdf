/**
 * NanoPDF - Main API
 */

import { native_addon, isMock } from './native.js';

/**
 * Options for NanoPDF initialization
 */
export interface NanoPDFOptions {
  /**
   * Whether to allow mock implementation when native addon is not available
   * @default true
   */
  allowMock?: boolean;
}

/**
 * Get the NanoPDF library version
 */
export function getVersion(): string {
  return native_addon.getVersion();
}

/**
 * Main NanoPDF class
 */
export class NanoPDF {
  private static initialized = false;

  /**
   * Initialize NanoPDF
   */
  static init(options: NanoPDFOptions = {}): void {
    const { allowMock = true } = options;

    if (isMock && !allowMock) {
      throw new Error(
        'NanoPDF native addon not found. Install native dependencies or set allowMock: true'
      );
    }

    NanoPDF.initialized = true;
  }

  /**
   * Check if NanoPDF is using the mock implementation
   */
  static get isMock(): boolean {
    return isMock;
  }

  /**
   * Get the library version
   */
  static get version(): string {
    return getVersion();
  }

  /**
   * Check if initialized
   */
  static get isInitialized(): boolean {
    return NanoPDF.initialized;
  }
}
