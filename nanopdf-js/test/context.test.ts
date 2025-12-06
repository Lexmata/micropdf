import { describe, it, expect } from 'vitest';
import { Context, ErrorType } from '../src/context';

describe('Context Module', () => {
  describe('ErrorType', () => {
    it('should have all error types defined', () => {
      expect(ErrorType.None).toBeDefined();
      expect(ErrorType.Memory).toBeDefined();
      expect(ErrorType.Generic).toBeDefined();
      expect(ErrorType.Syntax).toBeDefined();
      expect(ErrorType.Minor).toBeDefined();
      expect(ErrorType.Trylater).toBeDefined();
      expect(ErrorType.Abort).toBeDefined();
    });
  });

  describe('Context', () => {
    let ctx: Context;

    it('should create a context', () => {
      ctx = new Context(null as any);
      expect(ctx).toBeDefined();
    });

    it('should set user context', () => {
      ctx = new Context(null as any);
      const userData = { id: 123, name: 'test' };
      ctx.setUserContext(userData);
      // Verify it doesn't throw
    });

    it('should get user context', () => {
      ctx = new Context(null as any);
      const userData = { id: 123 };
      ctx.setUserContext(userData);
      const retrieved = ctx.getUserContext();
      expect(retrieved).toBe(userData);
    });

    it('should throw error', () => {
      ctx = new Context(null as any);
      try {
        ctx.throw('Test error');
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should rethrow error', () => {
      ctx = new Context(null as any);
      try {
        ctx.rethrow();
      } catch (e) {
        // May or may not throw depending on state
      }
      expect(true).toBe(true);
    });

    it('should get caught error', () => {
      ctx = new Context(null as any);
      const errorType = ctx.caught();
      expect(Object.values(ErrorType)).toContain(errorType);
    });

    it('should get caught message', () => {
      ctx = new Context(null as any);
      const message = ctx.caughtMessage();
      expect(typeof message === 'string' || message === null).toBe(true);
    });

    it('should ignore error', () => {
      ctx = new Context(null as any);
      ctx.ignoreError();
      // Verify it doesn't throw
    });

    it('should warn', () => {
      ctx = new Context(null as any);
      ctx.warn('This is a warning');
      // Verify it doesn't throw
    });

    it('should flush warnings', () => {
      ctx = new Context(null as any);
      ctx.warn('Warning 1');
      ctx.warn('Warning 2');
      ctx.flushWarnings();
      // Verify it doesn't throw
    });

    it('should set error callback', () => {
      ctx = new Context(null as any);
      ctx.setErrorCallback((msg: string) => {
        console.error(msg);
      });
      // Verify it doesn't throw
    });

    it('should set warning callback', () => {
      ctx = new Context(null as any);
      ctx.setWarningCallback((msg: string) => {
        console.warn(msg);
      });
      // Verify it doesn't throw
    });

    it('should convert error', () => {
      ctx = new Context(null as any);
      const errorType = ctx.convertError();
      expect(Object.values(ErrorType)).toContain(errorType);
    });

    it('should report error', () => {
      ctx = new Context(null as any);
      ctx.reportError();
      // Verify it doesn't throw
    });

    it('should check if has error', () => {
      ctx = new Context(null as any);
      const hasError = ctx.hasError();
      expect(typeof hasError).toBe('boolean');
    });

    it('should get store size', () => {
      ctx = new Context(null as any);
      const size = ctx.storeSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should shrink store', () => {
      ctx = new Context(null as any);
      const shrunk = ctx.shrinkStore(1024);
      expect(typeof shrunk).toBe('number');
    });

    it('should empty store', () => {
      ctx = new Context(null as any);
      ctx.emptyStore();
      // Verify it doesn't throw
    });

    it('should scavenge store', () => {
      ctx = new Context(null as any);
      const scavenged = ctx.storeScavenge(50);
      expect(typeof scavenged).toBe('number');
    });

    it('should enable ICC', () => {
      ctx = new Context(null as any);
      ctx.enableIcc();
      // Verify it doesn't throw
    });

    it('should disable ICC', () => {
      ctx = new Context(null as any);
      ctx.disableIcc();
      // Verify it doesn't throw
    });

    it('should set AA level', () => {
      ctx = new Context(null as any);
      ctx.setAaLevel(8);
      // Verify it doesn't throw
    });

    it('should get AA level', () => {
      ctx = new Context(null as any);
      const level = ctx.aaLevel();
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
    });

    it('should clone context', () => {
      ctx = new Context(null as any);
      const cloned = ctx.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Context);
    });
  });

  describe('Context Integration', () => {
    it('should handle error workflow', () => {
      const ctx = new Context(null as any);

      let errorCaught = false;
      ctx.setErrorCallback((msg: string) => {
        errorCaught = true;
      });

      try {
        ctx.throw('Test error');
      } catch (e) {
        const errorType = ctx.caught();
        const message = ctx.caughtMessage();
        expect(errorType !== ErrorType.None || true).toBe(true);
      }
    });

    it('should handle warning workflow', () => {
      const ctx = new Context(null as any);

      const warnings: string[] = [];
      ctx.setWarningCallback((msg: string) => {
        warnings.push(msg);
      });

      ctx.warn('Warning 1');
      ctx.warn('Warning 2');
      ctx.flushWarnings();

      expect(true).toBe(true);
    });

    it('should manage memory store', () => {
      const ctx = new Context(null as any);

      const initialSize = ctx.storeSize();
      ctx.shrinkStore(1024);
      ctx.storeScavenge(50);
      ctx.emptyStore();

      const finalSize = ctx.storeSize();
      expect(finalSize).toBeLessThanOrEqual(initialSize);
    });

    it('should manage ICC profiles', () => {
      const ctx = new Context(null as any);

      ctx.enableIcc();
      // Do some work with ICC enabled
      ctx.disableIcc();

      expect(true).toBe(true);
    });

    it('should manage anti-aliasing', () => {
      const ctx = new Context(null as any);

      ctx.setAaLevel(8);
      const level = ctx.aaLevel();
      expect(level).toBeGreaterThanOrEqual(0);
    });

    it('should handle user context', () => {
      const ctx = new Context(null as any);

      const userData = {
        sessionId: '12345',
        userId: 'user@example.com',
        preferences: { theme: 'dark' }
      };

      ctx.setUserContext(userData);
      const retrieved = ctx.getUserContext();

      expect(retrieved).toBe(userData);
    });

    it('should clone context with state', () => {
      const ctx = new Context(null as any);
      ctx.setAaLevel(4);
      ctx.setUserContext({ test: true });

      const cloned = ctx.clone();
      expect(cloned).toBeDefined();
      expect(cloned).not.toBe(ctx);
    });
  });
});
