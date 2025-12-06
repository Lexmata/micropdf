# NanoPDF Go Architecture

This document describes the internal architecture of the NanoPDF Go bindings.

---

## Table of Contents

- [Overview](#overview)
- [Layer Architecture](#layer-architecture)
- [Module Structure](#module-structure)
- [Memory Management](#memory-management)
- [CGO Integration](#cgo-integration)
- [Error Handling](#error-handling)
- [Testing Strategy](#testing-strategy)

---

## Overview

NanoPDF for Go provides idiomatic Go bindings to the MuPDF PDF library via a Rust FFI layer and CGO. The architecture is designed for performance, safety, and ease of use.

### Design Goals

1. **Performance** - Direct C bindings via CGO for zero overhead
2. **Safety** - Proper resource management with explicit Drop() calls
3. **Usability** - Clean, idiomatic Go API
4. **Portability** - Pure Go mock for CGO-disabled environments
5. **Testability** - High test coverage with unit and integration tests

---

## Layer Architecture

The system consists of 4 distinct layers:

```
┌────────────────────────────────────────────────────────────┐
│  Layer 4: Go API (*.go files)                              │
│  ─────────────────────────────────────────────────────────│
│  • Idiomatic Go interfaces                                 │
│  • Types: Context, Document, Page, Buffer, etc.           │
│  • Error handling and validation                           │
│  • Resource lifecycle management                           │
│  • ~3,000 lines of Go                                      │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ function calls
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 3: CGO Bindings (native_cgo.go)                     │
│  ─────────────────────────────────────────────────────────│
│  • C function calls via CGO                                │
│  • Type conversions (Go ↔ C)                               │
│  • Memory safety wrappers                                  │
│  • Build tag: !mock                                        │
│  • ~800 lines of Go with C imports                         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ CGO bridge
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 2: Rust FFI (libnanopdf.a)                          │
│  ─────────────────────────────────────────────────────────│
│  • C-compatible FFI functions (#[no_mangle])               │
│  • 660+ functions exposing MuPDF functionality             │
│  • Handle-based memory management                          │
│  • Error code translation                                  │
│  • ~20,000 lines of Rust                                   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ MuPDF C API calls
                         ↓
┌────────────────────────────────────────────────────────────┐
│  Layer 1: MuPDF Library (C)                                │
│  ─────────────────────────────────────────────────────────│
│  • Core PDF processing engine                              │
│  • Rendering, parsing, manipulation                        │
│  • Mature, battle-tested codebase                          │
│  • ~200,000 lines of C                                     │
└────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Layer 4: Go API

**Purpose**: Provide a clean, idiomatic Go interface.

**Responsibilities**:
- Type-safe structs and interfaces
- Error handling with Go conventions
- Resource lifecycle management
- Default values and convenience functions
- Documentation and examples

**Key Files**:
- `context.go` - Rendering context
- `document.go` - PDF document operations
- `page.go` - Page rendering and text
- `pixmap.go` - Raster images
- `buffer.go` - Binary data
- `geometry.go` - Point, Rect, Matrix, Quad
- `errors.go` - Error types

#### Layer 3: CGO Bindings

**Purpose**: Bridge Go to C/Rust FFI.

**Responsibilities**:
- Call C functions via CGO
- Convert Go types to C types
- Convert C types back to Go
- Handle unsafe pointer operations
- Conditional compilation (build tags)

**Key Files**:
- `native_cgo.go` - CGO implementation (build tag: `!mock`)
- `native_mock.go` - Pure Go mock (build tag: `mock`)
- `include/nanopdf_ffi.h` - C header declarations

**Build Tags**:
```go
//go:build !mock
// +build !mock

// This file is built when CGO is enabled
```

```go
//go:build mock
// +build mock

// This file is built when CGO is disabled
```

#### Layer 2: Rust FFI

See [nanopdf-rs documentation](../nanopdf-rs/README.md) for details.

#### Layer 1: MuPDF

The core PDF processing library. See [MuPDF documentation](https://mupdf.com/docs/).

---

## Module Structure

### Core Modules

```
go-nanopdf/
├── context.go          # Rendering context
├── context_test.go     # Context tests
│
├── document.go         # Document operations
├── document_test.go    # Document tests
│
├── page.go             # Page rendering/text
├── page_test.go        # Page tests
│
├── pixmap.go           # Raster images
├── pixmap_test.go      # Pixmap tests
│
├── buffer.go           # Binary buffers
├── buffer_test.go      # Buffer tests
│
├── geometry.go         # Point, Rect, Matrix, Quad
├── geometry_test.go    # Geometry tests
│
├── errors.go           # Error types
├── errors_test.go      # Error tests
│
├── nanopdf.go          # Package-level functions
├── nanopdf_test.go     # Package tests
│
├── native_cgo.go       # CGO bindings (build: !mock)
├── native_mock.go      # Mock bindings (build: mock)
│
├── doc.go              # Package documentation
│
├── test/               # Integration tests
│   ├── integration/
│   │   ├── document_integration_test.go
│   │   ├── rendering_integration_test.go
│   │   ├── text_integration_test.go
│   │   └── ...
│   └── README.md
│
├── examples/           # Example programs
│   ├── 01_basic_reading.go
│   ├── 02_text_extraction.go
│   └── ...
│
├── docker/             # Docker testing
│   ├── Dockerfile.test
│   └── build-test.sh
│
└── include/            # C headers for CGO
    └── nanopdf_ffi.h
```

### Module Dependencies

```
┌─────────┐
│ nanopdf │ ← Package-level (Version, IsMock)
└────┬────┘
     │
     ├─→ context ──────────┐
     │                     │
     ├─→ document ─→ page ─┼─→ pixmap
     │                     │
     ├─→ buffer            │
     │                     │
     ├─→ geometry ←────────┘
     │   (Point, Rect, Matrix, Quad)
     │
     └─→ errors ←─────────── All modules use errors
```

---

## Memory Management

### Handle-Based System

NanoPDF uses a **handle-based memory management** system where Go objects hold handles (uint64) to C/Rust resources:

```go
type Context struct {
    handle uint64
}

type Document struct {
    ctx    *Context
    handle uint64
}

type Page struct {
    doc    *Document
    handle uint64
}
```

### Resource Lifecycle

```
┌─────────────────────────────────────┐
│  1. Create: NewContext()            │
│     - Allocates C resources         │
│     - Returns Go wrapper            │
│     - Handle stored in struct       │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  2. Use: Call methods               │
│     - Methods use handle            │
│     - Pass handle to CGO/FFI        │
│     - Return results to Go          │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  3. Drop: ctx.Drop()                │
│     - Calls FFI drop function       │
│     - Frees C resources             │
│     - Invalidates handle            │
└─────────────────────────────────────┘
```

### Example: Proper Resource Management

```go
// ✅ Good: Explicit cleanup with defer
func processDocument(path string) error {
    ctx := nanopdf.NewContext()
    if ctx == nil {
        return errors.New("failed to create context")
    }
    defer ctx.Drop() // Always clean up!

    doc, err := nanopdf.OpenDocument(ctx, path)
    if err != nil {
        return err
    }
    defer doc.Drop() // Always clean up!

    page, err := doc.LoadPage(0)
    if err != nil {
        return err
    }
    defer page.Drop() // Always clean up!

    // Work with page...
    text, _ := page.ExtractText()
    fmt.Println(text)

    return nil
}

// ❌ Bad: Missing cleanup (memory leak!)
func leakyFunction(path string) {
    ctx := nanopdf.NewContext()
    doc, _ := nanopdf.OpenDocument(ctx, path)
    page, _ := doc.LoadPage(0)
    // ... memory leak!
}
```

### Memory Safety Rules

1. **Always call Drop()** - Use `defer` immediately after creation
2. **No use-after-drop** - Methods return errors for invalid handles
3. **Check IsValid()** - Validate before use if needed
4. **One owner** - Don't share handles between goroutines without synchronization

---

## CGO Integration

### CGO Function Calls

```go
// native_cgo.go
//go:build !mock

/*
#cgo LDFLAGS: -lnanopdf -lm
#include "nanopdf_ffi.h"
*/
import "C"
import "unsafe"

func contextCreate() uint64 {
    handle := C.fz_new_context(nil, nil, 0)
    return uint64(uintptr(unsafe.Pointer(handle)))
}

func contextDrop(handle uint64) {
    h := C.fz_context(unsafe.Pointer(uintptr(handle)))
    C.fz_drop_context(h)
}
```

### Type Conversions

**Go to C**:
```go
// String
goString := "example.pdf"
cString := C.CString(goString)
defer C.free(unsafe.Pointer(cString))

// Integer
goInt := int32(42)
cInt := C.int32_t(goInt)

// Float
goFloat := float32(1.5)
cFloat := C.float(goFloat)

// Pointer
goHandle := uint64(12345)
cPointer := unsafe.Pointer(uintptr(goHandle))
```

**C to Go**:
```go
// String
cString := C.fz_get_metadata(...)
goString := C.GoString(cString)

// Integer
cInt := C.fz_count_pages(...)
goInt := int32(cInt)

// Float
cFloat := C.fz_get_width(...)
goFloat := float32(cFloat)

// Pointer (handle)
cPointer := C.fz_open_document(...)
goHandle := uint64(uintptr(unsafe.Pointer(cPointer)))
```

### Build Configuration

**go.mod**:
```go
module github.com/lexmata/nanopdf/go-nanopdf

go 1.19

// No external dependencies!
```

**CGO Flags** (embedded in source):
```go
/*
#cgo CFLAGS: -I${SRCDIR}/include
#cgo linux LDFLAGS: -L${SRCDIR}/lib/linux_amd64 -lnanopdf -lm
#cgo darwin LDFLAGS: -L${SRCDIR}/lib/darwin_arm64 -lnanopdf -lm
#cgo windows LDFLAGS: -L${SRCDIR}/lib/windows_amd64 -lnanopdf
*/
```

---

## Error Handling

### Error Types

```go
// errors.go
type Error struct {
    Code    int32
    Message string
    Cause   error
}

func (e *Error) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Cause)
    }
    return e.Message
}

func (e *Error) Unwrap() error {
    return e.Cause
}

// Predefined errors
var (
    ErrOK               = &Error{Code: 0, Message: "success"}
    ErrGeneric          = &Error{Code: -1, Message: "generic error"}
    ErrInvalidArgument  = &Error{Code: -2, Message: "invalid argument"}
    ErrMemory           = &Error{Code: -3, Message: "memory error"}
    ErrNotFound         = &Error{Code: -11, Message: "not found"}
    // ... more errors
)
```

### Error Propagation

```
┌────────────────────────────────────┐
│  Go API: error interface           │
│  - Wraps FFI error codes           │
│  - Adds context and messages       │
└────────────────┬───────────────────┘
                 │ return error
                 ↓
┌────────────────────────────────────┐
│  CGO: Check return codes           │
│  - if (ret != 0) return error      │
└────────────────┬───────────────────┘
                 │ int32 error code
                 ↓
┌────────────────────────────────────┐
│  Rust FFI: Error codes (i32)      │
│  - 0 = success                     │
│  - <0 = error                      │
└────────────────┬───────────────────┘
                 │ fz_try/fz_catch
                 ↓
┌────────────────────────────────────┐
│  MuPDF: fz_try/fz_catch            │
└────────────────────────────────────┘
```

### Error Handling Example

```go
page, err := doc.LoadPage(pageNum)
if err != nil {
    // Check for specific error types
    if errors.Is(err, nanopdf.ErrInvalidArgument) {
        log.Printf("Invalid page number: %d", pageNum)
        return
    }

    // Or check error code
    if nanoErr, ok := err.(*nanopdf.Error); ok {
        log.Printf("Error code %d: %s", nanoErr.Code, nanoErr.Message)
    }

    return err
}
defer page.Drop()
```

---

## Testing Strategy

### Test Pyramid

```
          ┌─────────────────┐
          │ Docker/CI Tests │ (~10 min)
          │  Full builds    │
          └────────┬────────┘
                   │
          ┌────────┴────────────┐
          │ Integration Tests   │ (~30 sec)
          │  60 tests, real PDFs│
          └────────┬────────────┘
                   │
        ┌──────────┴──────────────┐
        │    Unit Tests           │ (~1 sec)
        │  83 tests, mock/CGO     │
        └─────────────────────────┘
```

### Test Categories

**Unit Tests** (`*_test.go`):
- Test individual functions and types
- Fast execution (<1 second)
- Both mock and CGO modes
- 90.5% code coverage

**Integration Tests** (`test/integration/*_integration_test.go`):
- Test with real PDF files
- Real CGO bindings required
- Moderate execution (~30 seconds)
- 60 tests covering workflows

**Docker Tests** (`docker/Dockerfile.test`):
- Complete environment testing
- Multi-architecture support
- Includes build verification
- Slow execution (~10 minutes)

### Test Coverage by Module

| Module | Coverage | Unit Tests | Integration Tests |
|--------|----------|------------|-------------------|
| **buffer** | 95.2% | 15 | 5 |
| **context** | 100.0% | 4 | 3 |
| **document** | 95.0% | 15 | 12 |
| **page** | 88.9% | 12 | 15 |
| **pixmap** | 90.9% | 8 | 8 |
| **geometry** | 98.5% | 18 | 5 |
| **errors** | 100.0% | 11 | 0 |
| **Overall** | **90.5%** | **83** | **60** |

### Running Tests

```bash
# Unit tests with CGO
go test ./...

# Unit tests without CGO (mock)
CGO_ENABLED=0 go test ./...

# Integration tests only
go test -run Integration ./test/integration/...

# With coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# In Docker
cd docker
./build-test.sh --unit
./build-test.sh --integration
```

---

## Performance Considerations

### Zero-Copy Operations

Where possible, NanoPDF uses zero-copy operations:

```go
// Zero-copy: Returns pointer to C memory
samples, _ := pixmap.Samples()
// Warning: Valid only while pixmap is alive!

// Copy: Creates Go-owned slice
data := buffer.Bytes()
// Safe: Go owns the memory
```

### Goroutine Safety

**Thread-safe operations**:
- Each Context is independent
- Multiple goroutines can use different Contexts

**NOT thread-safe**:
- Sharing Document/Page/Pixmap across goroutines
- Concurrent access to same resource

```go
// ✅ Good: Each goroutine has own context
func processFiles(files []string) {
    var wg sync.WaitGroup

    for _, file := range files {
        wg.Add(1)
        go func(f string) {
            defer wg.Done()

            ctx := nanopdf.NewContext()
            defer ctx.Drop()

            doc, _ := nanopdf.OpenDocument(ctx, f)
            defer doc.Drop()

            // Process...
        }(file)
    }

    wg.Wait()
}

// ❌ Bad: Sharing document across goroutines
func badPattern(doc *nanopdf.Document) {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(pageNum int32) {
            defer wg.Done()

            // RACE CONDITION!
            page, _ := doc.LoadPage(pageNum)
            defer page.Drop()
        }(int32(i))
    }

    wg.Wait()
}
```

### Performance Tips

1. **Reuse Context objects** when processing multiple documents
2. **Use appropriate DPI** for rendering (72-300 depending on use case)
3. **Process pages one at a time** for large documents
4. **Drop resources immediately** after use (don't accumulate)

---

## Future Architecture Changes

### Planned Improvements

1. **Goroutine-Safe API**
   - Add mutex protection for resources
   - Thread-safe document/page access

2. **Streaming API**
   - Stream large PDFs without loading entire file
   - Incremental rendering

3. **Caching Layer**
   - Cache rendered pages
   - Cache extracted text
   - Configurable cache size

4. **Pure Go Implementation**
   - Full Go port of core functionality
   - No CGO dependency

---

## References

- [MuPDF Documentation](https://mupdf.com/docs/)
- [CGO Documentation](https://pkg.go.dev/cmd/cgo)
- [Go Build Tags](https://pkg.go.dev/cmd/go#hdr-Build_constraints)
- [Rust FFI Guide](https://doc.rust-lang.org/nomicon/ffi.html)

---

<div align="center">

**For questions or clarifications, please open an issue on GitHub.**

</div>

