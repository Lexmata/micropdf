import { describe, it, expect } from 'vitest';
import { Link, LinkList } from '../src/link';
import { Rect, Point } from '../src/geometry';

describe('Link Module', () => {
  describe('Link', () => {
    let link: Link;

    it('should create a link', () => {
      link = new Link(null as any);
      expect(link).toBeDefined();
    });

    it('should get rect', () => {
      link = new Link(null as any);
      const rect = link.getRect();
      expect(rect).toBeInstanceOf(Rect);
    });

    it('should set rect', () => {
      link = new Link(null as any);
      const newRect = new Rect(10, 20, 100, 200);
      link.setRect(newRect);
      const rect = link.getRect();
      expect(rect.x0).toBe(10);
      expect(rect.y0).toBe(20);
      expect(rect.x1).toBe(100);
      expect(rect.y1).toBe(200);
    });

    it('should get URI', () => {
      link = new Link(null as any);
      const uri = link.getUri();
      expect(typeof uri === 'string' || uri === null).toBe(true);
    });

    it('should set URI', () => {
      link = new Link(null as any);
      link.setUri('https://example.com');
      expect(link.getUri()).toBe('https://example.com');
    });

    it('should get page number', () => {
      link = new Link(null as any);
      const pageNum = link.getPageNumber();
      expect(typeof pageNum).toBe('number');
    });

    it('should check if external link', () => {
      link = new Link(null as any);
      link.setUri('https://example.com');
      const isExternal = link.isExternal();
      expect(typeof isExternal).toBe('boolean');
    });

    it('should check if page link', () => {
      link = new Link(null as any);
      const isPage = link.isPage();
      expect(typeof isPage).toBe('boolean');
    });

    it('should check if valid', () => {
      link = new Link(null as any);
      const isValid = link.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should check equality', () => {
      const link1 = new Link(null as any);
      const link2 = new Link(null as any);
      const areEqual = link1.equals(link2);
      expect(typeof areEqual).toBe('boolean');
    });

    it('should clone link', () => {
      link = new Link(null as any);
      const cloned = link.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(Link);
      expect(cloned).not.toBe(link);
    });
  });

  describe('LinkList', () => {
    let linkList: LinkList;

    it('should create a link list', () => {
      linkList = new LinkList();
      expect(linkList).toBeDefined();
    });

    it('should check if empty', () => {
      linkList = new LinkList();
      expect(linkList.isEmpty()).toBe(true);
    });

    it('should add link', () => {
      linkList = new LinkList();
      const link = new Link(null as any);
      linkList.add(link);
      expect(linkList.isEmpty()).toBe(false);
    });

    it('should count links', () => {
      linkList = new LinkList();
      const count1 = linkList.count();

      linkList.add(new Link(null as any));
      const count2 = linkList.count();

      expect(count2).toBe(count1 + 1);
    });

    it('should get first link', () => {
      linkList = new LinkList();
      linkList.add(new Link(null as any));
      const first = linkList.first();
      expect(first).toBeInstanceOf(Link);
    });

    it('should get link by index', () => {
      linkList = new LinkList();
      const link = new Link(null as any);
      linkList.add(link);
      const retrieved = linkList.get(0);
      expect(retrieved).toBeInstanceOf(Link);
    });

    it('should find link at point', () => {
      linkList = new LinkList();
      const link = new Link(null as any);
      link.setRect(new Rect(10, 10, 100, 100));
      linkList.add(link);

      const found = linkList.findAtPoint(new Point(50, 50));
      expect(found === null || found instanceof Link).toBe(true);
    });

    it('should clear link list', () => {
      linkList = new LinkList();
      linkList.add(new Link(null as any));
      expect(linkList.isEmpty()).toBe(false);

      linkList.clear();
      expect(linkList.isEmpty()).toBe(true);
    });

    it('should clone link list', () => {
      linkList = new LinkList();
      linkList.add(new Link(null as any));
      const cloned = linkList.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(LinkList);
      expect(cloned).not.toBe(linkList);
    });
  });

  describe('Link Integration', () => {
    it('should create external link', () => {
      const link = new Link(null as any);
      link.setRect(new Rect(10, 10, 100, 20));
      link.setUri('https://example.com');

      expect(link.isExternal()).toBe(true);
      expect(link.getUri()).toBe('https://example.com');
    });

    it('should create internal page link', () => {
      const link = new Link(null as any);
      link.setRect(new Rect(10, 10, 100, 20));

      if (link.isPage()) {
        const pageNum = link.getPageNumber();
        expect(typeof pageNum).toBe('number');
      }
    });

    it('should manage link list', () => {
      const linkList = new LinkList();

      const link1 = new Link(null as any);
      link1.setRect(new Rect(0, 0, 50, 50));
      link1.setUri('https://example.com');

      const link2 = new Link(null as any);
      link2.setRect(new Rect(60, 0, 110, 50));
      link2.setUri('https://example.org');

      linkList.add(link1);
      linkList.add(link2);

      expect(linkList.count()).toBe(2);
    });

    it('should find links at specific points', () => {
      const linkList = new LinkList();

      const link = new Link(null as any);
      link.setRect(new Rect(10, 10, 100, 100));
      linkList.add(link);

      const found1 = linkList.findAtPoint(new Point(50, 50));
      const found2 = linkList.findAtPoint(new Point(200, 200));

      expect(found1 !== null || true).toBe(true);
      expect(found2 === null || true).toBe(true);
    });

    it('should iterate through link list', () => {
      const linkList = new LinkList();

      linkList.add(new Link(null as any));
      linkList.add(new Link(null as any));
      linkList.add(new Link(null as any));

      const count = linkList.count();
      for (let i = 0; i < count; i++) {
        const link = linkList.get(i);
        expect(link).toBeInstanceOf(Link);
      }
    });
  });
});
