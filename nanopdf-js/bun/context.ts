/**
 * Context management for NanoPDF operations
 */

import { fz_new_context, fz_drop_context, fz_clone_context, FZ_STORE_DEFAULT } from "./ffi";

export class Context {
  private handle: bigint;
  private dropped = false;

  constructor(maxStore: number = FZ_STORE_DEFAULT) {
    const handle = fz_new_context(null, null, BigInt(maxStore));
    if (handle === 0n) {
      throw new Error("Failed to create context");
    }
    this.handle = handle;
  }

  getHandle(): bigint {
    if (this.dropped) {
      throw new Error("Context has been dropped");
    }
    return this.handle;
  }

  clone(): Context {
    const newHandle = fz_clone_context(this.handle);
    if (newHandle === 0n) {
      throw new Error("Failed to clone context");
    }
    const ctx = Object.create(Context.prototype);
    ctx.handle = newHandle;
    ctx.dropped = false;
    return ctx;
  }

  drop(): void {
    if (!this.dropped) {
      fz_drop_context(this.handle);
      this.dropped = true;
    }
  }

  [Symbol.dispose](): void {
    this.drop();
  }
}

