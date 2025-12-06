import { describe, it, expect } from 'vitest';
import { Device, DeviceType } from '../src/device';
import { Rect, Matrix } from '../src/geometry';

describe('Device Module', () => {
  describe('DeviceType', () => {
    it('should have all device types defined', () => {
      expect(DeviceType.Draw).toBeDefined();
      expect(DeviceType.BBox).toBeDefined();
      expect(DeviceType.Trace).toBeDefined();
      expect(DeviceType.List).toBeDefined();
    });
  });

  describe('Device', () => {
    let device: Device;

    it('should create a device', () => {
      device = new Device(null as any);
      expect(device).toBeDefined();
    });

    it('should check if valid', () => {
      device = new Device(null as any);
      const isValid = device.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get device type', () => {
      device = new Device(null as any);
      const type = device.getType();
      expect(Object.values(DeviceType)).toContain(type);
    });

    it('should enable hints', () => {
      device = new Device(null as any);
      device.enableHints(0x01);
      // Verify it doesn't throw
    });

    it('should disable hints', () => {
      device = new Device(null as any);
      device.disableHints(0x01);
      // Verify it doesn't throw
    });

    it('should close device', () => {
      device = new Device(null as any);
      device.close();
      // Verify it doesn't throw
    });

    it('should handle begin/end tile', () => {
      device = new Device(null as any);
      const rect = new Rect(0, 0, 100, 100);
      const matrix = Matrix.IDENTITY;

      device.beginTile(rect, rect, 1.0, 0, matrix, 0);
      device.endTile();
      // Verify it doesn't throw
    });

    it('should handle fill path', () => {
      device = new Device(null as any);
      device.fillPath(
        null as any,
        true,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      // Verify it doesn't throw
    });

    it('should handle stroke path', () => {
      device = new Device(null as any);
      device.strokePath(
        null as any,
        null as any,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      // Verify it doesn't throw
    });

    it('should handle clip path', () => {
      device = new Device(null as any);
      device.clipPath(null as any, true, Matrix.IDENTITY, null as any);
      // Verify it doesn't throw
    });

    it('should handle clip stroke path', () => {
      device = new Device(null as any);
      device.clipStrokePath(null as any, null as any, Matrix.IDENTITY, null as any);
      // Verify it doesn't throw
    });

    it('should handle fill text', () => {
      device = new Device(null as any);
      device.fillText(null as any, Matrix.IDENTITY, null as any, 1.0, null as any, null as any);
      // Verify it doesn't throw
    });

    it('should handle stroke text', () => {
      device = new Device(null as any);
      device.strokeText(
        null as any,
        null as any,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      // Verify it doesn't throw
    });

    it('should handle clip text', () => {
      device = new Device(null as any);
      device.clipText(null as any, Matrix.IDENTITY, null as any);
      // Verify it doesn't throw
    });

    it('should handle clip stroke text', () => {
      device = new Device(null as any);
      device.clipStrokeText(null as any, null as any, Matrix.IDENTITY, null as any);
      // Verify it doesn't throw
    });

    it('should handle ignore text', () => {
      device = new Device(null as any);
      device.ignoreText(null as any, Matrix.IDENTITY);
      // Verify it doesn't throw
    });

    it('should handle fill image', () => {
      device = new Device(null as any);
      device.fillImage(null as any, Matrix.IDENTITY, 1.0, null as any);
      // Verify it doesn't throw
    });

    it('should handle fill image mask', () => {
      device = new Device(null as any);
      device.fillImageMask(
        null as any,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      // Verify it doesn't throw
    });

    it('should handle clip image mask', () => {
      device = new Device(null as any);
      device.clipImageMask(null as any, Matrix.IDENTITY, null as any);
      // Verify it doesn't throw
    });

    it('should handle pop clip', () => {
      device = new Device(null as any);
      device.popClip();
      // Verify it doesn't throw
    });

    it('should handle begin/end mask', () => {
      device = new Device(null as any);
      const rect = new Rect(0, 0, 100, 100);

      device.beginMask(rect, false, null as any, null as any, null as any);
      device.endMask();
      // Verify it doesn't throw
    });

    it('should handle begin/end group', () => {
      device = new Device(null as any);
      const rect = new Rect(0, 0, 100, 100);

      device.beginGroup(rect, null as any, false, false, 0, 1.0);
      device.endGroup();
      // Verify it doesn't throw
    });
  });

  describe('Device Integration', () => {
    it('should handle drawing workflow', () => {
      const device = new Device(null as any);
      const matrix = Matrix.IDENTITY;
      const rect = new Rect(0, 0, 100, 100);

      device.beginTile(rect, rect, 1.0, 0, matrix, 0);
      device.fillPath(null as any, true, matrix, null as any, 1.0, null as any, null as any);
      device.strokePath(
        null as any,
        null as any,
        matrix,
        null as any,
        1.0,
        null as any,
        null as any
      );
      device.endTile();
      device.close();

      expect(true).toBe(true);
    });

    it('should handle clipping workflow', () => {
      const device = new Device(null as any);
      const matrix = Matrix.IDENTITY;

      device.clipPath(null as any, true, matrix, null as any);
      device.fillPath(null as any, true, matrix, null as any, 1.0, null as any, null as any);
      device.popClip();
      device.close();

      expect(true).toBe(true);
    });

    it('should handle masking workflow', () => {
      const device = new Device(null as any);
      const rect = new Rect(0, 0, 100, 100);

      device.beginMask(rect, false, null as any, null as any, null as any);
      device.fillPath(
        null as any,
        true,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      device.endMask();
      device.close();

      expect(true).toBe(true);
    });

    it('should handle grouping workflow', () => {
      const device = new Device(null as any);
      const rect = new Rect(0, 0, 100, 100);

      device.beginGroup(rect, null as any, false, false, 0, 1.0);
      device.fillPath(
        null as any,
        true,
        Matrix.IDENTITY,
        null as any,
        1.0,
        null as any,
        null as any
      );
      device.endGroup();
      device.close();

      expect(true).toBe(true);
    });
  });
});
