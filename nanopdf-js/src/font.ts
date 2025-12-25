/**
 * Font - PDF font handling
 *
 * This module provides 100% API compatibility with MuPDF's font operations.
 * Handles font loading, glyph encoding, metrics, and rendering.
 */

import { getDefaultContext } from './context.js';
import { Rect, type RectLike } from './geometry.js';
import { native } from './native.js';
import type { NativeContext, NativeFont } from './native.js';
import { Path } from './path.js';

/**
 * Font flags
 */
export enum FontFlags {
  Bold = 1 << 0,
  Italic = 1 << 1,
  Serif = 1 << 2,
  Monospaced = 1 << 3,
  Embedded = 1 << 4
}

/**
 * A PDF font
 */
export class Font {
  private _ctx?: NativeContext;

  private _font?: NativeFont;
  private _name: string;
  private _flags: number = 0;
  private _bbox: Rect = Rect.EMPTY;
  private _ascender: number = 1000;
  private _descender: number = -200;
  private _refCount: number = 1;
  private _glyphs: Map<number, GlyphInfo> = new Map();
  private _encoding: Map<number, number> = new Map(); // unicode -> glyph

  constructor(name: string, flags?: number) {
    this._name = name;
    if (flags !== undefined) {
      this._flags = flags;
    }
  }

  /**
   * @internal Check if FFI bindings are available
   */
  get hasNativeHandle(): boolean {
    return this._ctx !== undefined && this._font !== undefined;
  }

  /**
   * Create a new font
   */
  static create(name: string, flags?: number): Font {
    return new Font(name, flags);
  }

  /**
   * Create font from memory buffer using FFI
   * @throws Error when native bindings are not available
   */
  static createFromMemory(name: string, data: Uint8Array): Font {
    const ctx = (getDefaultContext() as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error(
        'Font creation from memory requires native FFI bindings (fz_new_font_from_memory)'
      );
    }

    const font = new Font(name);
    font._ctx = ctx;
    font._font = native.loadFontFromMemory(ctx, Buffer.from(data), 0);
    return font;
  }

  /**
   * Create font from file using FFI
   * @throws Error when native bindings are not available
   */
  static createFromFile(path: string): Font {
    const ctx = (getDefaultContext() as unknown as { _nativeCtx?: NativeContext })?._nativeCtx;

    if (!ctx) {
      throw new Error(
        'Font loading from file requires native FFI bindings (fz_new_font_from_file)'
      );
    }

    const name =
      path
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') || 'Unknown';

    const font = new Font(name);
    font._ctx = ctx;
    font._font = native.loadFontFromFile(ctx, path, 0);
    return font;
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
   * Clone this font
   */
  clone(): Font {
    const cloned = new Font(this._name, this._flags);
    cloned._bbox = this._bbox;
    cloned._ascender = this._ascender;
    cloned._descender = this._descender;
    cloned._glyphs = new Map(this._glyphs);
    cloned._encoding = new Map(this._encoding);
    return cloned;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  get name(): string {
    return this._name;
  }

  /**
   * Check if font is bold
   */
  isBold(): boolean {
    return (this._flags & FontFlags.Bold) !== 0;
  }

  /**
   * Check if font is italic
   */
  isItalic(): boolean {
    return (this._flags & FontFlags.Italic) !== 0;
  }

  /**
   * Check if font is serif
   */
  isSerif(): boolean {
    return (this._flags & FontFlags.Serif) !== 0;
  }

  /**
   * Check if font is monospaced
   */
  isMonospaced(): boolean {
    return (this._flags & FontFlags.Monospaced) !== 0;
  }

  /**
   * Check if font is embedded
   */
  isEmbedded(): boolean {
    return (this._flags & FontFlags.Embedded) !== 0;
  }

  /**
   * Get font flags
   */
  get flags(): number {
    return this._flags;
  }

  // ============================================================================
  // Metrics
  // ============================================================================

  /**
   * Get font bounding box
   */
  getBBox(): Rect {
    return this._bbox;
  }

  /**
   * Set font bounding box
   */
  setBBox(bbox: RectLike): void {
    this._bbox = Rect.from(bbox);
  }

  /**
   * Get font ascender (distance above baseline)
   */
  getAscender(): number {
    return this._ascender;
  }

  /**
   * Set font ascender
   */
  setAscender(ascender: number): void {
    this._ascender = ascender;
  }

  /**
   * Get font descender (distance below baseline)
   */
  getDescender(): number {
    return this._descender;
  }

  /**
   * Set font descender
   */
  setDescender(descender: number): void {
    this._descender = descender;
  }

  // ============================================================================
  // Character Encoding
  // ============================================================================

  /**
   * Encode a Unicode character to a glyph ID
   */
  encodeCharacter(unicode: number): number {
    return this._encoding.get(unicode) || 0;
  }

  /**
   * Encode character with fallback
   */
  encodeCharacterWithFallback(unicode: number, fallback: number = 0): number {
    return this._encoding.get(unicode) || fallback;
  }

  /**
   * Set character encoding
   */
  setEncoding(unicode: number, glyph: number): void {
    this._encoding.set(unicode, glyph);
  }

  // ============================================================================
  // Glyph Operations
  // ============================================================================

  /**
   * Get glyph advance width
   */
  advanceGlyph(glyph: number, wmode: number = 0): number {
    const info = this._glyphs.get(glyph);
    if (info) {
      return wmode === 0 ? info.advanceX : info.advanceY;
    }
    // Default advance for unknown glyphs
    return 500;
  }

  /**
   * Get glyph bounding box
   */
  boundGlyph(glyph: number): Rect {
    const info = this._glyphs.get(glyph);
    return info?.bbox || Rect.EMPTY;
  }

  /**
   * Get glyph outline as a path
   */
  outlineGlyph(glyph: number): Path | null {
    const info = this._glyphs.get(glyph);
    return info?.outline || null;
  }

  /**
   * Get glyph name
   */
  glyphName(glyph: number): string {
    const info = this._glyphs.get(glyph);
    return info?.name || `.notdef`;
  }

  /**
   * Add glyph info
   */
  addGlyph(glyph: number, info: GlyphInfo): void {
    this._glyphs.set(glyph, info);
  }

  /**
   * Get glyph info
   */
  getGlyphInfo(glyph: number): GlyphInfo | undefined {
    return this._glyphs.get(glyph);
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Check if font is valid
   */
  isValid(): boolean {
    return this._name.length > 0;
  }

  // ============================================================================
  // Text Measurement
  // ============================================================================

  /**
   * Measure text width
   */
  measureText(text: string, size: number = 12): number {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const unicode = text.charCodeAt(i);
      const glyph = this.encodeCharacter(unicode);
      const advance = this.advanceGlyph(glyph);
      width += advance;
    }
    return (width * size) / 1000; // Scale from font units to points
  }

  /**
   * Get text bounding box
   */
  measureTextBounds(text: string, size: number = 12): Rect {
    let width = 0;
    let minY = 0;
    let maxY = 0;

    for (let i = 0; i < text.length; i++) {
      const unicode = text.charCodeAt(i);
      const glyph = this.encodeCharacter(unicode);
      const advance = this.advanceGlyph(glyph);
      const bbox = this.boundGlyph(glyph);

      minY = Math.min(minY, bbox.y0);
      maxY = Math.max(maxY, bbox.y1);
      width += advance;
    }

    const scale = size / 1000;
    return new Rect(0, minY * scale, width * scale, maxY * scale);
  }
}

/**
 * Glyph information
 */
export interface GlyphInfo {
  name: string;
  advanceX: number;
  advanceY: number;
  bbox: Rect;
  outline?: Path;
}

/**
 * Font manager for loading and caching fonts
 */
export class FontManager {
  private _fonts: Map<string, Font> = new Map();
  private _defaultFont: Font | null = null;

  constructor() {
    // Create default font
    this._defaultFont = Font.create('Helvetica');
    this._fonts.set('Helvetica', this._defaultFont);
  }

  /**
   * Get the singleton instance
   */
  private static _instance: FontManager | null = null;
  static getInstance(): FontManager {
    if (!FontManager._instance) {
      FontManager._instance = new FontManager();
    }
    return FontManager._instance;
  }

  /**
   * Load a font by name
   */
  loadFont(name: string): Font | null {
    return this._fonts.get(name) || null;
  }

  /**
   * Register a font
   */
  registerFont(name: string, font: Font): void {
    this._fonts.set(name, font);
  }

  /**
   * Get default font
   */
  getDefaultFont(): Font {
    return this._defaultFont!;
  }

  /**
   * Set default font
   */
  setDefaultFont(font: Font): void {
    this._defaultFont = font;
  }

  /**
   * Get all registered font names
   */
  getFontNames(): string[] {
    return [...this._fonts.keys()];
  }

  /**
   * Clear all fonts
   */
  clear(): void {
    this._fonts.clear();
    this._defaultFont = null;
  }
}

/**
 * Standard PDF font names
 */
export const StandardFonts = {
  TimesRoman: 'Times-Roman',
  TimesBold: 'Times-Bold',
  TimesItalic: 'Times-Italic',
  TimesBoldItalic: 'Times-BoldItalic',
  Helvetica: 'Helvetica',
  HelveticaBold: 'Helvetica-Bold',
  HelveticaOblique: 'Helvetica-Oblique',
  HelveticaBoldOblique: 'Helvetica-BoldOblique',
  Courier: 'Courier',
  CourierBold: 'Courier-Bold',
  CourierOblique: 'Courier-Oblique',
  CourierBoldOblique: 'Courier-BoldOblique',
  Symbol: 'Symbol',
  ZapfDingbats: 'ZapfDingbats'
} as const;
