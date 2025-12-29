/**
 * MicroPDF - Main API
 */

import { native_addon, isMock } from './native.js';

/**
 * Options for MicroPDF initialization
 */
export interface MicroPDFOptions {
  /**
   * Whether to allow mock implementation when native addon is not available
   * @default true
   */
  allowMock?: boolean;
}

/**
 * Get the MicroPDF library version
 */
export function getVersion(): string {
  return native_addon.getVersion();
}

/**
 * Main MicroPDF class
 */
export class MicroPDF {
  private static initialized = false;

  /**
   * Initialize MicroPDF
   */
  static init(options: MicroPDFOptions = {}): void {
    const { allowMock = true } = options;

    if (isMock && !allowMock) {
      throw new Error(
        'MicroPDF native addon not found. Install native dependencies or set allowMock: true'
      );
    }

    MicroPDF.initialized = true;
  }

  /**
   * Check if MicroPDF is using the mock implementation
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
    return MicroPDF.initialized;
  }
}
