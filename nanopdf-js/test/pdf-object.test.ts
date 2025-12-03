/**
 * Tests for PDF Object module
 */
import { describe, it, expect } from 'vitest';
import {
  PdfObject,
  PdfArray,
  PdfDict,
  PdfStream,
  PdfIndirectRef,
  PdfObjectType,
  pdfNull,
  pdfBool,
  pdfInt,
  pdfReal,
  pdfString,
  pdfName,
  pdfArray,
  pdfDict,
} from '../src/index.js';

describe('PdfObject', () => {
  describe('primitive values', () => {
    it('should create null', () => {
      const obj = pdfNull();
      expect(obj.type).toBe(PdfObjectType.Null);
      expect(obj.isNull).toBe(true);
    });

    it('should create boolean true', () => {
      const obj = pdfBool(true);
      expect(obj.type).toBe(PdfObjectType.Bool);
      expect(obj.isBool).toBe(true);
      expect(obj.toBool()).toBe(true);
    });

    it('should create boolean false', () => {
      const obj = pdfBool(false);
      expect(obj.toBool()).toBe(false);
    });

    it('should create integer', () => {
      const obj = pdfInt(42);
      expect(obj.type).toBe(PdfObjectType.Int);
      expect(obj.isInt).toBe(true);
      expect(obj.toInt()).toBe(42);
    });

    it('should create negative integer', () => {
      const obj = pdfInt(-100);
      expect(obj.toInt()).toBe(-100);
    });

    it('should create real number', () => {
      const obj = pdfReal(3.14159);
      expect(obj.type).toBe(PdfObjectType.Real);
      expect(obj.isReal).toBe(true);
      expect(obj.toReal()).toBeCloseTo(3.14159);
    });

    it('should treat int as number', () => {
      const obj = pdfInt(42);
      expect(obj.isNumber).toBe(true);
      expect(obj.toNumber()).toBe(42);
    });

    it('should treat real as number', () => {
      const obj = pdfReal(3.14);
      expect(obj.isNumber).toBe(true);
      expect(obj.toNumber()).toBeCloseTo(3.14);
    });
  });

  describe('strings', () => {
    it('should create string', () => {
      const obj = pdfString('Hello, World!');
      expect(obj.type).toBe(PdfObjectType.String);
      expect(obj.isString).toBe(true);
      expect(obj.toString()).toBe('Hello, World!');
    });

    it('should handle empty string', () => {
      const obj = pdfString('');
      expect(obj.toString()).toBe('');
    });

    it('should handle special characters', () => {
      const obj = pdfString('Line1\nLine2\tTabbed');
      expect(obj.toString()).toBe('Line1\nLine2\tTabbed');
    });
  });

  describe('names', () => {
    it('should create name', () => {
      const obj = pdfName('Type');
      expect(obj.type).toBe(PdfObjectType.Name);
      expect(obj.isName).toBe(true);
      expect(obj.toName()).toBe('Type');
    });

    it('should handle names with special chars', () => {
      const obj = pdfName('Font#20Name');
      expect(obj.toName()).toBe('Font#20Name');
    });

    it('should compare names', () => {
      const name1 = pdfName('Type');
      const name2 = pdfName('Type');
      const name3 = pdfName('Other');

      expect(name1.nameEquals('Type')).toBe(true);
      expect(name1.nameEquals('Other')).toBe(false);
      expect(name1.equals(name2)).toBe(true);
      expect(name1.equals(name3)).toBe(false);
    });
  });

  describe('comparison', () => {
    it('should compare equal objects', () => {
      expect(pdfInt(42).equals(pdfInt(42))).toBe(true);
      expect(pdfString('test').equals(pdfString('test'))).toBe(true);
      expect(pdfBool(true).equals(pdfBool(true))).toBe(true);
    });

    it('should compare unequal objects', () => {
      expect(pdfInt(42).equals(pdfInt(43))).toBe(false);
      expect(pdfInt(42).equals(pdfString('42'))).toBe(false);
      expect(pdfBool(true).equals(pdfBool(false))).toBe(false);
    });
  });
});

describe('PdfArray', () => {
  it('should create empty array', () => {
    const arr = pdfArray();
    expect(arr.type).toBe(PdfObjectType.Array);
    expect(arr.isArray).toBe(true);
    expect(arr.length).toBe(0);
  });

  it('should create array with values', () => {
    const arr = pdfArray([pdfInt(1), pdfInt(2), pdfInt(3)]);
    expect(arr.length).toBe(3);
  });

  it('should get element by index', () => {
    const arr = pdfArray([pdfInt(10), pdfInt(20), pdfInt(30)]);

    expect(arr.get(0)?.toInt()).toBe(10);
    expect(arr.get(1)?.toInt()).toBe(20);
    expect(arr.get(2)?.toInt()).toBe(30);
    expect(arr.get(3)).toBeUndefined();
  });

  it('should push elements', () => {
    const arr = pdfArray();
    arr.push(pdfInt(1));
    arr.push(pdfString('two'));
    arr.push(pdfBool(true));

    expect(arr.length).toBe(3);
    expect(arr.get(0)?.toInt()).toBe(1);
    expect(arr.get(1)?.toString()).toBe('two');
    expect(arr.get(2)?.toBool()).toBe(true);
  });

  it('should insert elements', () => {
    const arr = pdfArray([pdfInt(1), pdfInt(3)]);
    arr.insert(1, pdfInt(2));

    expect(arr.length).toBe(3);
    expect(arr.get(0)?.toInt()).toBe(1);
    expect(arr.get(1)?.toInt()).toBe(2);
    expect(arr.get(2)?.toInt()).toBe(3);
  });

  it('should delete elements', () => {
    const arr = pdfArray([pdfInt(1), pdfInt(2), pdfInt(3)]);
    arr.delete(1);

    expect(arr.length).toBe(2);
    expect(arr.get(0)?.toInt()).toBe(1);
    expect(arr.get(1)?.toInt()).toBe(3);
  });

  it('should iterate elements', () => {
    const arr = pdfArray([pdfInt(1), pdfInt(2), pdfInt(3)]);
    const values: number[] = [];

    for (const obj of arr) {
      values.push(obj.toInt());
    }

    expect(values).toEqual([1, 2, 3]);
  });

  it('should convert to JS array', () => {
    const arr = pdfArray([pdfInt(1), pdfString('two'), pdfBool(true)]);
    const jsArr = arr.toArray();

    expect(jsArr.length).toBe(3);
    expect(jsArr[0]?.toInt()).toBe(1);
  });
});

describe('PdfDict', () => {
  it('should create empty dict', () => {
    const dict = pdfDict();
    expect(dict.type).toBe(PdfObjectType.Dict);
    expect(dict.isDict).toBe(true);
    expect(dict.length).toBe(0);
  });

  it('should create dict with entries', () => {
    const dict = pdfDict({
      Type: pdfName('Page'),
      Width: pdfInt(612),
    });

    expect(dict.length).toBe(2);
  });

  it('should get value by key', () => {
    const dict = pdfDict({
      Name: pdfString('Test'),
      Count: pdfInt(42),
    });

    expect(dict.get('Name')?.toString()).toBe('Test');
    expect(dict.get('Count')?.toInt()).toBe(42);
    expect(dict.get('Missing')).toBeUndefined();
  });

  it('should put value by key', () => {
    const dict = pdfDict();
    dict.put('Key', pdfString('Value'));

    expect(dict.get('Key')?.toString()).toBe('Value');
  });

  it('should delete key', () => {
    const dict = pdfDict({
      A: pdfInt(1),
      B: pdfInt(2),
    });

    dict.del('A');
    expect(dict.get('A')).toBeUndefined();
    expect(dict.get('B')?.toInt()).toBe(2);
  });

  it('should check if key exists', () => {
    const dict = pdfDict({
      Exists: pdfInt(1),
    });

    expect(dict.has('Exists')).toBe(true);
    expect(dict.has('Missing')).toBe(false);
  });

  it('should get keys', () => {
    const dict = pdfDict({
      Alpha: pdfInt(1),
      Beta: pdfInt(2),
      Gamma: pdfInt(3),
    });

    const keys = dict.keys();
    expect(keys.length).toBe(3);
    expect(keys).toContain('Alpha');
    expect(keys).toContain('Beta');
    expect(keys).toContain('Gamma');
  });

  it('should iterate entries', () => {
    const dict = pdfDict({
      A: pdfInt(1),
      B: pdfInt(2),
    });

    const entries: [string, number][] = [];
    for (const [key, value] of dict) {
      entries.push([key, value.toInt()]);
    }

    expect(entries.length).toBe(2);
  });

  it('should get typed values', () => {
    const dict = pdfDict({
      Name: pdfName('TestName'),
      Text: pdfString('TestString'),
      Count: pdfInt(42),
      Ratio: pdfReal(3.14),
      Flag: pdfBool(true),
    });

    expect(dict.getName('Name')).toBe('TestName');
    expect(dict.getString('Text')).toBe('TestString');
    expect(dict.getInt('Count')).toBe(42);
    expect(dict.getReal('Ratio')).toBeCloseTo(3.14);
    expect(dict.getBool('Flag')).toBe(true);
  });

  it('should return defaults for missing typed values', () => {
    const dict = pdfDict();

    expect(dict.getName('Missing')).toBe('');
    expect(dict.getString('Missing')).toBe('');
    expect(dict.getInt('Missing')).toBe(0);
    expect(dict.getReal('Missing')).toBe(0);
    expect(dict.getBool('Missing')).toBe(false);
  });
});

describe('PdfStream', () => {
  it('should create stream', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const stream = new PdfStream(pdfDict(), data);

    expect(stream.type).toBe(PdfObjectType.Stream);
    expect(stream.isStream).toBe(true);
  });

  it('should get stream data', () => {
    const data = new Uint8Array([10, 20, 30]);
    const stream = new PdfStream(pdfDict(), data);

    const result = stream.getData();
    expect(result.length).toBe(3);
    expect(result[0]).toBe(10);
  });

  it('should set stream data', () => {
    const stream = new PdfStream(pdfDict(), new Uint8Array(0));
    stream.setData(new Uint8Array([100, 200]));

    const result = stream.getData();
    expect(result.length).toBe(2);
    expect(result[0]).toBe(100);
  });

  it('should get stream dictionary', () => {
    const dict = pdfDict({
      Length: pdfInt(100),
      Filter: pdfName('FlateDecode'),
    });
    const stream = new PdfStream(dict, new Uint8Array(100));

    expect(stream.dict.get('Filter')?.toName()).toBe('FlateDecode');
  });
});

describe('PdfIndirectRef', () => {
  it('should create indirect reference', () => {
    const ref = new PdfIndirectRef(42, 0);

    expect(ref.type).toBe(PdfObjectType.Indirect);
    expect(ref.isIndirect).toBe(true);
    expect(ref.objNum).toBe(42);
    expect(ref.genNum).toBe(0);
  });

  it('should compare references', () => {
    const ref1 = new PdfIndirectRef(10, 0);
    const ref2 = new PdfIndirectRef(10, 0);
    const ref3 = new PdfIndirectRef(10, 1);
    const ref4 = new PdfIndirectRef(20, 0);

    expect(ref1.equals(ref2)).toBe(true);
    expect(ref1.equals(ref3)).toBe(false);
    expect(ref1.equals(ref4)).toBe(false);
  });
});

