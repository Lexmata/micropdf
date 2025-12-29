import { describe, it, expect } from 'vitest';
import { Archive, ArchiveFormat } from '../src/archive';

describe('Archive Module', () => {
  describe('ArchiveFormat', () => {
    it('should have all formats defined', () => {
      expect(ArchiveFormat.ZIP).toBeDefined();
      expect(ArchiveFormat.TAR).toBeDefined();
    });
  });

  describe('Archive', () => {
    let archive: Archive;

    it('should create an archive', () => {
      archive = new Archive(null as any);
      expect(archive).toBeDefined();
    });

    it('should check if valid', () => {
      archive = new Archive(null as any);
      const isValid = archive.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get format', () => {
      archive = new Archive(null as any);
      const format = archive.getFormat();
      expect(Object.values(ArchiveFormat)).toContain(format);
    });

    it('should count entries', () => {
      archive = new Archive(null as any);
      const count = archive.countEntries();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should list entry', () => {
      archive = new Archive(null as any);
      const entry = archive.listEntry(0);
      expect(typeof entry === 'string' || entry === null).toBe(true);
    });

    it('should check if has entry', () => {
      archive = new Archive(null as any);
      const hasEntry = archive.hasEntry('test.txt');
      expect(typeof hasEntry).toBe('boolean');
    });

    it('should read entry', () => {
      archive = new Archive(null as any);
      const buffer = archive.readEntry('test.txt');
      expect(buffer === null || Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should get entry names', () => {
      archive = new Archive(null as any);
      const names = archive.getEntryNames();
      expect(Array.isArray(names)).toBe(true);
    });

    it('should get entry size', () => {
      archive = new Archive(null as any);
      const size = archive.getEntrySize('test.txt');
      expect(typeof size).toBe('number');
    });

    it('should clone archive', () => {
      archive = new Archive(null as any);
      const cloned = archive.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Archive);
      expect(cloned).not.toBe(archive);
    });
  });

  describe('Archive Integration', () => {
    it('should enumerate entries', () => {
      const archive = new Archive(null as any);
      const count = archive.countEntries();

      for (let i = 0; i < count; i++) {
        const name = archive.listEntry(i);
        expect(typeof name === 'string' || name === null).toBe(true);
      }
    });

    it('should get all entry names', () => {
      const archive = new Archive(null as any);
      const names = archive.getEntryNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(archive.countEntries());
    });

    it('should check entry existence', () => {
      const archive = new Archive(null as any);
      const names = archive.getEntryNames();

      for (const name of names) {
        expect(archive.hasEntry(name)).toBe(true);
      }
    });

    it('should read entry contents', () => {
      const archive = new Archive(null as any);
      const names = archive.getEntryNames();

      for (const name of names) {
        const buffer = archive.readEntry(name);
        expect(buffer === null || Buffer.isBuffer(buffer)).toBe(true);
      }
    });

    it('should get entry sizes', () => {
      const archive = new Archive(null as any);
      const names = archive.getEntryNames();

      for (const name of names) {
        const size = archive.getEntrySize(name);
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
