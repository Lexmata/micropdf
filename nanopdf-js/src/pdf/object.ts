/**
 * PDF Object Model
 *
 * This implementation mirrors the Rust `pdf::object` module for 100% API compatibility.
 */

import { PdfObjectType } from '../types.js';

/**
 * Base class for all PDF objects
 */
export abstract class PdfObject {
  abstract get type(): PdfObjectType;

  get isNull(): boolean { return this.type === PdfObjectType.Null; }
  get isBool(): boolean { return this.type === PdfObjectType.Bool; }
  get isInt(): boolean { return this.type === PdfObjectType.Int; }
  get isReal(): boolean { return this.type === PdfObjectType.Real; }
  get isNumber(): boolean { return this.isInt || this.isReal; }
  get isString(): boolean { return this.type === PdfObjectType.String; }
  get isName(): boolean { return this.type === PdfObjectType.Name; }
  get isArray(): boolean { return this.type === PdfObjectType.Array; }
  get isDict(): boolean { return this.type === PdfObjectType.Dict; }
  get isStream(): boolean { return this.type === PdfObjectType.Stream; }
  get isIndirect(): boolean { return this.type === PdfObjectType.Indirect; }

  toBool(): boolean {
    if (this instanceof PdfBool) return this.value;
    return false;
  }

  toInt(): number {
    if (this instanceof PdfInt) return this.value;
    if (this instanceof PdfReal) return Math.trunc(this.value);
    return 0;
  }

  toReal(): number {
    if (this instanceof PdfReal) return this.value;
    if (this instanceof PdfInt) return this.value;
    return 0;
  }

  toNumber(): number {
    return this.toReal();
  }

  toString(): string {
    if (this instanceof PdfString) return this.value;
    return '';
  }

  toName(): string {
    if (this instanceof PdfName) return this.value;
    return '';
  }

  nameEquals(name: string): boolean {
    if (this instanceof PdfName) return this.value === name;
    return false;
  }

  abstract equals(other: PdfObject): boolean;
}

/**
 * PDF Null object
 */
class PdfNull extends PdfObject {
  get type(): PdfObjectType { return PdfObjectType.Null; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfNull;
  }
}

/**
 * PDF Boolean object
 */
class PdfBool extends PdfObject {
  readonly value: boolean;

  constructor(value: boolean) {
    super();
    this.value = value;
  }

  get type(): PdfObjectType { return PdfObjectType.Bool; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfBool && other.value === this.value;
  }
}

/**
 * PDF Integer object
 */
class PdfInt extends PdfObject {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = Math.trunc(value);
  }

  get type(): PdfObjectType { return PdfObjectType.Int; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfInt && other.value === this.value;
  }
}

/**
 * PDF Real (floating point) object
 */
class PdfReal extends PdfObject {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  get type(): PdfObjectType { return PdfObjectType.Real; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfReal && other.value === this.value;
  }
}

/**
 * PDF String object
 */
class PdfString extends PdfObject {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  get type(): PdfObjectType { return PdfObjectType.String; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfString && other.value === this.value;
  }
}

/**
 * PDF Name object
 */
class PdfName extends PdfObject {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  get type(): PdfObjectType { return PdfObjectType.Name; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfName && other.value === this.value;
  }
}

/**
 * PDF Array object
 */
export class PdfArray extends PdfObject {
  private readonly items: PdfObject[];

  constructor(items: PdfObject[] = []) {
    super();
    this.items = [...items];
  }

  get type(): PdfObjectType { return PdfObjectType.Array; }

  get length(): number {
    return this.items.length;
  }

  get(index: number): PdfObject | undefined {
    return this.items[index];
  }

  push(obj: PdfObject): void {
    this.items.push(obj);
  }

  insert(index: number, obj: PdfObject): void {
    this.items.splice(index, 0, obj);
  }

  delete(index: number): void {
    this.items.splice(index, 1);
  }

  toArray(): PdfObject[] {
    return [...this.items];
  }

  [Symbol.iterator](): Iterator<PdfObject> {
    return this.items[Symbol.iterator]();
  }

  equals(other: PdfObject): boolean {
    if (!(other instanceof PdfArray)) return false;
    if (other.length !== this.length) return false;
    for (let i = 0; i < this.length; i++) {
      if (!this.items[i]!.equals(other.items[i]!)) return false;
    }
    return true;
  }
}

/**
 * PDF Dictionary object
 */
export class PdfDict extends PdfObject {
  private readonly entries: Map<string, PdfObject>;

  constructor(entries: Record<string, PdfObject> = {}) {
    super();
    this.entries = new Map(Object.entries(entries));
  }

  get type(): PdfObjectType { return PdfObjectType.Dict; }

  get length(): number {
    return this.entries.size;
  }

  get(key: string): PdfObject | undefined {
    return this.entries.get(key);
  }

  put(key: string, value: PdfObject): void {
    this.entries.set(key, value);
  }

  del(key: string): void {
    this.entries.delete(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  keys(): string[] {
    return Array.from(this.entries.keys());
  }

  *[Symbol.iterator](): Generator<[string, PdfObject]> {
    for (const [key, value] of this.entries) {
      yield [key, value];
    }
  }

  // Typed getters
  getName(key: string): string {
    return this.get(key)?.toName() ?? '';
  }

  getString(key: string): string {
    return this.get(key)?.toString() ?? '';
  }

  getInt(key: string): number {
    return this.get(key)?.toInt() ?? 0;
  }

  getReal(key: string): number {
    return this.get(key)?.toReal() ?? 0;
  }

  getBool(key: string): boolean {
    return this.get(key)?.toBool() ?? false;
  }

  getArray(key: string): PdfArray | undefined {
    const obj = this.get(key);
    return obj instanceof PdfArray ? obj : undefined;
  }

  getDict(key: string): PdfDict | undefined {
    const obj = this.get(key);
    return obj instanceof PdfDict ? obj : undefined;
  }

  equals(other: PdfObject): boolean {
    if (!(other instanceof PdfDict)) return false;
    if (other.length !== this.length) return false;
    for (const [key, value] of this.entries) {
      const otherValue = other.get(key);
      if (!otherValue || !value.equals(otherValue)) return false;
    }
    return true;
  }
}

/**
 * PDF Stream object
 */
export class PdfStream extends PdfObject {
  readonly dict: PdfDict;
  private _data: Uint8Array;

  constructor(dict: PdfDict, data: Uint8Array = new Uint8Array(0)) {
    super();
    this.dict = dict;
    this._data = data;
  }

  get type(): PdfObjectType { return PdfObjectType.Stream; }

  getData(): Uint8Array {
    return this._data;
  }

  setData(data: Uint8Array): void {
    this._data = data;
  }

  equals(other: PdfObject): boolean {
    if (!(other instanceof PdfStream)) return false;
    if (!this.dict.equals(other.dict)) return false;
    if (this._data.length !== other._data.length) return false;
    for (let i = 0; i < this._data.length; i++) {
      if (this._data[i] !== other._data[i]) return false;
    }
    return true;
  }
}

/**
 * PDF Indirect Reference object
 */
export class PdfIndirectRef extends PdfObject {
  readonly objNum: number;
  readonly genNum: number;

  constructor(objNum: number, genNum: number = 0) {
    super();
    this.objNum = objNum;
    this.genNum = genNum;
  }

  get type(): PdfObjectType { return PdfObjectType.Indirect; }

  equals(other: PdfObject): boolean {
    return other instanceof PdfIndirectRef &&
           other.objNum === this.objNum &&
           other.genNum === this.genNum;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

const NULL_SINGLETON = new PdfNull();

/**
 * Create a null PDF object
 */
export function pdfNull(): PdfObject {
  return NULL_SINGLETON;
}

/**
 * Create a boolean PDF object
 */
export function pdfBool(value: boolean): PdfObject {
  return new PdfBool(value);
}

/**
 * Create an integer PDF object
 */
export function pdfInt(value: number): PdfObject {
  return new PdfInt(value);
}

/**
 * Create a real PDF object
 */
export function pdfReal(value: number): PdfObject {
  return new PdfReal(value);
}

/**
 * Create a string PDF object
 */
export function pdfString(value: string): PdfObject {
  return new PdfString(value);
}

/**
 * Create a name PDF object
 */
export function pdfName(value: string): PdfObject {
  return new PdfName(value);
}

/**
 * Create an array PDF object
 */
export function pdfArray(items: PdfObject[] = []): PdfArray {
  return new PdfArray(items);
}

/**
 * Create a dictionary PDF object
 */
export function pdfDict(entries: Record<string, PdfObject> = {}): PdfDict {
  return new PdfDict(entries);
}

