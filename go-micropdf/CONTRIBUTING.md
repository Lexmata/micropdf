# Contributing to MicroPDF Go Bindings

Thank you for your interest in contributing to MicroPDF! This document provides guidelines and instructions for contributing to the Go bindings.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Areas for Contribution](#areas-for-contribution)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to creating a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Go** >= 1.19
- **Rust toolchain** (from [rustup.rs](https://rustup.rs))
- **Git**
- **Build tools**:
  - Linux: `build-essential`, `pkg-config`
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/micropdf.git
   cd micropdf/go-micropdf
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/micropdf.git
   ```

---

## Development Setup

### Initial Setup

```bash
# 1. Build Rust library
cd ../micropdf-rs
cargo build --release

# 2. Install library system-wide (recommended)
sudo make install

# OR copy to Go project directory
mkdir -p ../go-micropdf/lib/$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m)
cp target/release/libmicropdf.a ../go-micropdf/lib/*/

# 3. Return to Go project
cd ../go-micropdf

# 4. Run tests to verify setup
go test ./...

# 5. Run integration tests
go test -run Integration ./test/integration/...
```

### Development Workflow

```bash
# Format code
go fmt ./...

# Run linters
go vet ./...
golangci-lint run  # If installed

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run specific test
go test -run TestContextCreate ./...

# Run integration tests only
go test -run Integration ./test/integration/...

# Test without CGO (mock mode)
CGO_ENABLED=0 go test ./...

# Build examples
go build -tags example -o example01 examples/01_basic_reading.go
```

---

## Development Workflow

### Branching Strategy

We follow **Git Flow**:

- `main` - Production releases
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### Creating a Feature Branch

```bash
# Update develop
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/my-feature

# Make your changes...
go fmt ./...
go test ./...

# Commit changes
git add .
git commit -m "feat: add my feature"

# Push to your fork
git push origin feature/my-feature
```

### Commit Message Format

We use **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**

```bash
feat(document): add named destination resolution

Implemented ResolveLink() to resolve named destinations to page numbers.
Includes full error handling and tests.

Closes #123

---

fix(page): correct bounds calculation for rotated pages

Pages with rotation now correctly report their bounding box.

Fixes #456

---

docs(readme): add troubleshooting section

Added common issues and solutions to README.
```

---

## Coding Standards

### Go Style

Follow [Effective Go](https://golang.org/doc/effective_go.html) and [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments).

```go
// ✅ Good: Clear, documented, idiomatic
// ExtractText extracts all text from a PDF page.
//
// The text is returned as a single string with newlines preserved.
// Returns an error if the page is invalid or text extraction fails.
func (p *Page) ExtractText() (string, error) {
    if !p.IsValid() {
        return "", ErrInvalidArgument
    }

    text, err := pageExtractText(p.handle)
    if err != nil {
        return "", fmt.Errorf("failed to extract text: %w", err)
    }

    return text, nil
}

// ❌ Bad: No docs, poor error handling
func (p *Page) ExtractText() (string, error) {
    return pageExtractText(p.handle)
}
```

### Naming Conventions

```go
// Exported types: PascalCase
type Document struct { }
type PageRenderer struct { }

// Exported functions: PascalCase
func NewContext() *Context { }
func OpenDocument() (*Document, error) { }

// Unexported (private): camelCase
func extractTextInternal() string { }
func validatePageNum() bool { }

// Constants: PascalCase or UPPER_CASE
const MaxPageSize = 1000
const DEFAULT_DPI = 96

// Interfaces: PascalCase, often with -er suffix
type Reader interface { }
type Closer interface { }

// Struct fields
type Page struct {
    // Exported: PascalCase
    PageNumber int32

    // Unexported: camelCase
    handle uint64
    doc    *Document
}
```

### Documentation

All exported types, functions, and methods must have documentation comments:

```go
// Context represents a MuPDF rendering context.
//
// A context is required for all PDF operations and manages memory and error state.
// Each context is independent and can be used concurrently with other contexts.
//
// Always call Drop() when done to free resources:
//
//	ctx := micropdf.NewContext()
//	if ctx == nil {
//	    log.Fatal("failed to create context")
//	}
//	defer ctx.Drop()
type Context struct {
    handle uint64
}

// NewContext creates a new rendering context.
//
// Returns nil if context creation fails. Always call Drop() on the returned
// context when done to free resources.
//
// Example:
//
//	ctx := micropdf.NewContext()
//	if ctx == nil {
//	    log.Fatal("failed to create context")
//	}
//	defer ctx.Drop()
func NewContext() *Context {
    // Implementation...
}
```

### Error Handling

```go
// ✅ Good: Specific error types, context
if pageNum < 0 || pageNum >= pageCount {
    return nil, fmt.Errorf("page number %d out of range [0, %d): %w",
        pageNum, pageCount, ErrInvalidArgument)
}

if !ctx.IsValid() {
    return nil, fmt.Errorf("invalid context: %w", ErrInvalidArgument)
}

// ❌ Bad: Generic errors, no context
if pageNum < 0 {
    return nil, errors.New("invalid page")
}
```

### Resource Management

```go
// ✅ Good: Explicit cleanup with defer
func processDocument(path string) error {
    ctx := NewContext()
    if ctx == nil {
        return errors.New("failed to create context")
    }
    defer ctx.Drop() // Always clean up!

    doc, err := OpenDocument(ctx, path)
    if err != nil {
        return err
    }
    defer doc.Drop() // Always clean up!

    // Work with document...
    return nil
}

// ❌ Bad: Missing cleanup (memory leak)
func leakyFunction(path string) {
    ctx := NewContext()
    doc, _ := OpenDocument(ctx, path)
    // ... leaked!
}
```

---

## Testing Guidelines

### Writing Tests

```go
package micropdf

import (
    "testing"
)

func TestContextCreate(t *testing.T) {
    ctx := NewContext()
    if ctx == nil {
        t.Fatal("NewContext() returned nil")
    }
    defer ctx.Drop()

    if !ctx.IsValid() {
        t.Error("Context should be valid after creation")
    }
}

func TestDocumentOpen(t *testing.T) {
    ctx := NewContext()
    if ctx == nil {
        t.Fatal("Failed to create context")
    }
    defer ctx.Drop()

    doc, err := OpenDocument(ctx, "testdata/sample.pdf")
    if err != nil {
        t.Fatalf("OpenDocument() failed: %v", err)
    }
    defer doc.Drop()

    pageCount, err := doc.PageCount()
    if err != nil {
        t.Fatalf("PageCount() failed: %v", err)
    }

    if pageCount <= 0 {
        t.Errorf("PageCount() = %d, want > 0", pageCount)
    }
}

func TestDocumentOpenInvalidPath(t *testing.T) {
    ctx := NewContext()
    if ctx == nil {
        t.Fatal("Failed to create context")
    }
    defer ctx.Drop()

    _, err := OpenDocument(ctx, "nonexistent.pdf")
    if err == nil {
        t.Error("OpenDocument() should fail for nonexistent file")
    }
}
```

### Test Coverage Requirements

- **Unit tests**: >85% coverage
- **Integration tests**: Critical paths covered
- **All exported functions**: Must have tests
- **Error cases**: Must be tested

### Running Tests

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run specific test
go test -run TestContextCreate

# Run integration tests
go test -run Integration ./test/integration/...

# Test without CGO
CGO_ENABLED=0 go test ./...
```

### Test Files

- **Unit tests**: `*_test.go` in same directory as code
- **Integration tests**: `test/integration/*_integration_test.go`
- **Build tags**: Use `//go:build integration` for integration tests

---

## Submitting Changes

### Before Submitting

1. **Format code**:
   ```bash
   go fmt ./...
   ```

2. **Run linters**:
   ```bash
   go vet ./...
   golangci-lint run
   ```

3. **Run tests**:
   ```bash
   go test ./...
   go test -run Integration ./test/integration/...
   ```

4. **Check coverage**:
   ```bash
   go test -cover ./...
   ```

5. **Update documentation** if needed

6. **Add tests** for new features

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/my-feature
   ```

2. **Create Pull Request** on GitHub:
   - Title: Clear, descriptive summary
   - Description: Detailed explanation of changes
   - Link related issues: `Closes #123`, `Fixes #456`
   - Add screenshots/examples if applicable

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of what this PR does.

   ## Motivation and Context
   Why is this change needed? What problem does it solve?

   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to change)
   - [ ] Documentation update

   ## How Has This Been Tested?
   Describe the tests you ran and how to reproduce them.

   ## Checklist
   - [ ] My code follows the Go style guide
   - [ ] I have run go fmt and go vet
   - [ ] I have added tests to cover my changes
   - [ ] All new and existing tests passed
   - [ ] I have updated the documentation accordingly
   - [ ] My commit messages follow the conventional commits format
   ```

### Code Review Process

1. **Automated checks** will run (CI/CD)
2. **Maintainer review** (may request changes)
3. **Address feedback** if needed
4. **Approval and merge** by maintainer

---

## Areas for Contribution

### High Priority

1. **Performance Optimizations**
   - Reduce CGO overhead
   - Optimize memory allocations
   - Benchmark critical paths

2. **Advanced Text Operations**
   - Structured text extraction
   - Font information
   - Text layout analysis

3. **Goroutine Safety**
   - Add mutex protection for resources
   - Thread-safe API design
   - Concurrent processing examples

### Medium Priority

1. **Pure Go Implementation**
   - Port core functionality to pure Go
   - Remove CGO dependency
   - Better cross-compilation

2. **Caching Layer**
   - Cache rendered pages
   - Cache extracted text
   - Configurable cache size

3. **Streaming API**
   - Stream large PDFs
   - Incremental parsing
   - Progressive rendering

### Low Priority

1. **Documentation**
   - More examples
   - Tutorials
   - Performance guides

2. **Testing**
   - More test cases
   - Edge case coverage
   - Fuzz testing

3. **Tools**
   - CLI utilities
   - Benchmarking tools
   - Code generators

### Good First Issues

Look for issues tagged with `good first issue` on GitHub:

- Documentation improvements
- Simple bug fixes
- Adding tests for existing functionality
- Code cleanup and formatting

---

## Development Tips

### Debugging

```bash
# Enable verbose output
go test -v ./...

# Debug specific test
go test -v -run TestDocumentOpen

# Print coverage
go test -v -cover ./...

# Race detection
go test -race ./...

# CPU profiling
go test -cpuprofile=cpu.prof
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof
go tool pprof mem.prof
```

### Testing with Docker

```bash
cd docker

# Build and run all tests
./build-test.sh

# Unit tests only
./build-test.sh --unit

# Integration tests only
./build-test.sh --integration

# Interactive shell
./build-test.sh --shell
```

### Working with CGO

```bash
# Build with CGO enabled
CGO_ENABLED=1 go build

# Build with CGO disabled (mock)
CGO_ENABLED=0 go build

# Set CGO flags manually
export CGO_CFLAGS="-I/path/to/include"
export CGO_LDFLAGS="-L/path/to/lib -lmicropdf"
go build
```

---

## Getting Help

- 📚 **Documentation**: Read [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/username/micropdf/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/username/micropdf/issues)
- 📧 **Email**: maintainer@example.com

---

## License

By contributing to MicroPDF, you agree that your contributions will be licensed under the Apache License 2.0.

---

## Acknowledgments

Thank you to all contributors who have helped make MicroPDF better!

<div align="center">

**Happy Coding! 🚀**

</div>

