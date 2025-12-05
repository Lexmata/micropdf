# Native C++ N-API Implementation Status

## Current Status: **Blocked on Header Compatibility**

### Work Completed ✅

1. **C++ Module Structure Created**:
   - `context.cc` - Context management (create, drop, clone)
   - `document.cc` - Document operations (open, authenticate, metadata, save)
   - `page.cc` - Page operations (load, render, text extraction, search)
   - Total: ~960 lines of C++ N-API bindings

2. **Build Infrastructure**:
   - Updated `binding.gyp` with new source files
   - Copied Rust library (`libnanopdf.a` - 35MB) to `native/lib/linux-x64/`
   - Added type definitions (`nanopdf/types.h`)

3. **Modules Integrated**:
   - Buffer (existing)
   - Geometry (existing)
   - Context (new)
   - Document (new)
   - Page (new)

### Current Blocker ❌

**Auto-generated C headers contain Rust syntax that doesn't compile in C++**:

Examples of problematic constructs:
```c
// Rust array syntax
void fz_md5_buffer(int32_t _ctx, int32_t buf, [u8; 16] * digest);

// Rust Option type
Option<unsafe extern "C" fn(*mut c_void, c_int, *const c_char)> callback

// Rust comments embedded in parameters
int32_t fz_new_context(const void * _alloc, const void * we use Rust allocator _locks, ...)

// Rust pointer syntax
const *const c_char * _colorants
```

### Solution Options

#### Option A: Clean C Header Generation (Recommended)
1. Modify `nanopdf-rs/scripts/generate_headers.py` to generate C++-compatible headers
2. Remove Rust-specific syntax
3. Convert `Option<T>` to nullable pointers
4. Convert `[T; N]` arrays to proper C syntax
5. Remove inline Rust comments

#### Option B: Manual Header Creation
1. Create minimal C-compatible headers manually
2. Only include functions we actually need
3. ~40 function declarations for TypeScript FFI calls
4. Bypass comprehensive MuPDF compatibility

#### Option C: Use cbindgen Tool
1. Use `cbindgen` crate to generate proper C bindings
2. Configure in `nanopdf-rs/cbindgen.toml`
3. Automatically generate compatible headers
4. Maintain synchronization with Rust code

### Recommended Path Forward

**Implement Option C (cbindgen)**:

1. Add `cbindgen` to `nanopdf-rs`:
   ```bash
   cd nanopdf-rs
   cargo install cbindgen
   ```

2. Create `cbindgen.toml`:
   ```toml
   language = "C"
   cpp_compat = true
   include_guard = "NANOPDF_H"
   namespace = "nanopdf"
   ```

3. Generate headers:
   ```bash
   cbindgen --config cbindgen.toml --crate nanopdf-rs --output include/nanopdf.h
   ```

4. Copy to Node.js project and rebuild

### Alternative: Minimal Binding Approach

If header generation continues to be problematic, create minimal manual bindings for only the functions we need:

**Required Functions** (from TypeScript FFI analysis):
- `fz_new_context`, `fz_drop_context`, `fz_clone_context`
- `fz_open_document`, `fz_open_document_with_buffer`, `fz_drop_document`
- `fz_load_page`, `fz_drop_page`, `fz_bound_page`
- `fz_count_pages`, `fz_needs_password`, `fz_authenticate_password`
- `fz_new_pixmap_from_page`, `fz_new_buffer_from_pixmap_as_png`
- `fz_new_stext_page_from_page`, `fz_new_buffer_from_stext_page`
- `fz_load_links`, `fz_search_stext_page`
- `pdf_save_document`, `pdf_lookup_named_dest`, `pdf_has_permission`

Total: ~40 critical functions instead of 660+

### Build Progress

| Component | Status | Lines |
|-----------|--------|-------|
| Context C++ | ✅ Complete | 90 |
| Document C++ | ✅ Complete | 280 |
| Page C++ | ✅ Complete | 380 |
| Binding.gyp | ✅ Updated | - |
| Headers | ❌ Blocked | - |
| Build | ❌ Blocked | - |
| Test | ⏸️ Pending | - |

### Next Steps

1. Choose header generation approach (recommend cbindgen)
2. Generate clean C-compatible headers
3. Rebuild native addon
4. Test basic functionality
5. Implement remaining modules (fonts, images, enhanced API)

### Time Estimates

- Header cleanup/generation: 1-2 hours
- Build and test: 30 minutes
- Remaining modules: 2-3 hours
- **Total to working bindings**: 4-6 hours

### Notes

- The Rust library (35MB) is built and ready
- C++ code structure is solid and follows N-API best practices
- Only blocker is header compatibility
- Once headers are fixed, compilation should succeed

