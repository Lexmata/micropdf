# FFI Architecture Issues

**Date**: December 4, 2025
**Status**: 🔴 Critical - Requires Architecture Refactoring

## Executive Summary

The FFI layer has a fundamental type mismatch that prevents compilation:
- **FFI Storage**: Uses `Arc<Mutex<T>>` for all resources (Font, Image, Buffer, etc.)
- **Fitz Layer**: Expects `Arc<T>` or `&T` in many methods
- **Impact**: 33 compilation errors across multiple modules

## Root Cause

The HandleStore pattern wraps all resources in `Arc<Mutex<T>>` to provide:
1. Thread-safe mutable access from C
2. Reference counting for lifetime management

However, the fitz layer (internal Rust API) was designed expecting:
1. Immutable shared ownership (`Arc<T>`)
2. Borrowed references (`&T`)

This creates incompatibility when FFI functions try to call fitz methods.

## Affected Modules

### 1. text.rs (8 errors)
**Issue**: `Text::show_glyph()` and `Text::show_string()` expect `Arc<Font>`

```rust
// FFI has: Arc<Mutex<Font>>
let f = FONTS.get(font_handle); // returns Arc<Mutex<Font>>

// But fitz needs: Arc<Font>
guard.show_glyph(Arc<Font>, ...); // ❌ Type mismatch
```

**Missing Methods**:
- `Text::set_language()`
- `Text::span_count()`
- `Text::item_count()`
- `Text::bounds()` - signature mismatch (needs ctm + optional stroke)

### 2. font.rs (10+ errors)
**Missing Methods**:
- `Font::from_data()` - Create font from byte data
- `Font::is_monospaced()` - Check if font is monospaced
- `Font::encode_character()` - Encode Unicode to glyph ID
- `Font::glyph_bbox()` - Get glyph bounding box
- `Font::bbox()` - Get font bounding box
- `Font::outline_glyph()` - Get glyph path outline

### 3. buffer.rs (1 error)
**Missing Methods**:
- `Buffer::as_slice()` - Get immutable view of buffer data
  - Currently has `data()` which returns `&[u8]`, but FFI expects `as_slice()`

### 4. image.rs (8+ errors)
**Missing Methods**:
- `Image::from_data()` - Create image from compressed data
- `Image::xres()` - Get X resolution (DPI)
- `Image::yres()` - Get Y resolution (DPI)
- `Image::is_mask()` - Check if image is a mask

**Type Mismatches**:
- Methods return wrong types or have wrong signatures

## Proposed Solutions

### Option 1: Refactor Fitz Layer (Recommended)
**Change**: Make fitz methods accept `&T` instead of `Arc<T>`

**Pros**:
- FFI can lock mutex and pass `&T`
- More flexible - works with any ownership model
- Better Rust idioms

**Cons**:
- Requires changes throughout fitz layer
- May affect internal fitz usage patterns
- TextSpan stores Arc<Font>, would need redesign

**Example**:
```rust
// Before
fn show_glyph(&mut self, font: Arc<Font>, ...)

// After
fn show_glyph(&mut self, font: &Font, ...)

// FFI can now do:
if let Ok(guard) = font_mutex.lock() {
    text.show_glyph(&*guard, ...); // ✅ Works
}
```

### Option 2: Refactor FFI Layer
**Change**: Store `Arc<T>` in HandleStore instead of `Arc<Mutex<T>>`

**Pros**:
- Matches fitz expectations perfectly
- Simpler FFI code

**Cons**:
- Loses mutability from C side
- Would need different approach for mutable operations
- Less thread-safe

### Option 3: Adapter Layer
**Change**: Create adapter types that convert between storage models

**Pros**:
- No changes to existing layers
- Gradual migration possible

**Cons**:
- Additional complexity
- Potential performance overhead
- Still need missing methods

### Option 4: Internal Mutability
**Change**: Use `RefCell` or similar for interior mutability in fitz

**Pros**:
- Can store as `Arc<T>` while allowing mutation
- Type-safe

**Cons**:
- Runtime borrow checking overhead
- Not thread-safe (need `Arc<Mutex<RefCell<T>>>` for that)

## Recommendation

**Recommended Approach**: Option 1 + Add Missing Methods

### Phase 1: Refactor Core Methods
1. Change `Text::show_glyph()` and `Text::show_string()` to accept `&Font`
2. Update `TextSpan` to store `Font` instead of `Arc<Font>` (or use lifetimes)
3. Fix FFI calls to pass borrowed references

### Phase 2: Add Missing Methods
1. Add missing methods to `Text`: `span_count()`, `item_count()`, `set_language()`
2. Add missing methods to `Font`: `from_data()`, `is_monospaced()`, etc.
3. Add missing methods to `Buffer`: `as_slice()` (or rename `data()`)
4. Add missing methods to `Image`: `from_data()`, `xres()`, `yres()`, `is_mask()`

### Phase 3: Verify & Test
1. Ensure all 33 errors are resolved
2. Run integration tests
3. Add new FFI tests for fixed functions

## Implementation Effort

- **Phase 1**: 4-6 hours (significant refactoring)
- **Phase 2**: 2-3 hours (add missing methods)
- **Phase 3**: 1-2 hours (testing)
- **Total**: 1-2 days of work

## Alternative: Minimal Viable Fix

If full refactoring is not desired, we can:

1. **Stub Out Problematic Methods**: Make them return errors or no-ops
2. **Focus on Compiling**: Get to 0 errors, even if some functions don't work
3. **Document Limitations**: Clearly mark non-functional FFI functions

This would take ~2-3 hours but leaves the codebase in a "compiles but broken" state.

## Current Status

- ✅ Device API fixed (void methods)
- ✅ Image API constructor fixed
- ✅ Buffer functions added (4 new)
- ✅ Test unsafe blocks added
- ⚠️  Text/Font/Buffer/Image have architectural issues
- ❌ 33 compilation errors remain

## Next Steps

**Immediate Decision Needed**: Choose between:
1. Full architectural refactoring (proper fix, 1-2 days)
2. Minimal stubbing (quick compile, limited functionality)
3. Pause FFI work until architecture is resolved

**Recommended**: Option 1 - The FFI layer is a critical interface and should be done properly.

---

**Author**: AI Assistant
**Last Updated**: December 4, 2025

