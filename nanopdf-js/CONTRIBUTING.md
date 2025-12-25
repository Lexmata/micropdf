# Contributing to NanoPDF

Thank you for your interest in contributing to NanoPDF! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
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

- **Node.js** >= 18.0.0
- **pnpm** (recommended) or npm/yarn
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
   git clone https://github.com/YOUR_USERNAME/nanopdf.git
   cd nanopdf
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/nanopdf.git
   ```

---

## Development Setup

### Initial Setup

```bash
# Navigate to Node.js project
cd nanopdf-js

# Install dependencies
pnpm install

# Build Rust library
cd ../nanopdf-rs
cargo build --release

# Copy library to Node.js project
cd ../nanopdf-js
mkdir -p native/lib/$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)
cp ../nanopdf-rs/target/release/libnanopdf.a native/lib/*/

# Build TypeScript
pnpm run build:ts

# Build native addon
pnpm run build:native

# Run tests to verify setup
pnpm test
```

### Development Scripts

```bash
# TypeScript development
pnpm run build:ts        # Build TypeScript
pnpm run build:ts:watch  # Watch mode

# Native addon development
pnpm run build:native    # Build N-API addon
pnpm run rebuild         # Clean rebuild

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage
pnpm test:integration   # Integration tests only

# Linting and formatting
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix linting issues
pnpm format             # Format with Prettier
pnpm format:check       # Check formatting
pnpm quality            # Run all quality checks

# Complete build
pnpm run build          # Build everything
```

---

## Project Structure

```
nanopdf/
├── nanopdf-rs/              # Rust FFI library
│   ├── src/
│   │   └── ffi/             # FFI functions
│   ├── include/             # C headers
│   └── Cargo.toml
│
├── nanopdf-js/              # Node.js bindings
│   ├── src/                 # TypeScript source
│   │   ├── document.ts
│   │   ├── page.ts
│   │   ├── geometry.ts
│   │   └── ...
│   │
│   ├── native/              # N-API C++ bindings
│   │   ├── nanopdf.cc
│   │   ├── context.cc
│   │   ├── document.cc
│   │   └── ...
│   │
│   ├── test/                # Tests
│   │   ├── *.test.ts
│   │   └── integration/
│   │
│   ├── docker/              # Docker testing
│   └── dist/                # Build output
│
└── test-pdfs/               # Test PDF files (Git LFS)
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
git checkout -b feature/my-awesome-feature

# Make your changes...
git add .
git commit -m "feat: add my awesome feature"

# Push to your fork
git push origin feature/my-awesome-feature
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
feat(document): add save() method for writing PDFs

Implemented document.save() to write modified PDFs to disk.
Includes support for incremental updates and linearization.

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

### TypeScript

```typescript
// ✅ Good: Clear, documented, type-safe
/**
 * Extracts text from a PDF page.
 *
 * @param page - The page to extract text from
 * @returns The extracted text as a string
 * @throws {NanoPDFError} If page is invalid
 */
export function extractText(page: Page): string {
  if (!page.isValid) {
    throw NanoPDFError.argument('Invalid page');
  }
  return native.extractText(page.handle);
}

// ❌ Bad: No docs, loose typing, poor error handling
export function extractText(page: any): any {
  return native.extractText(page.handle);
}
```

### Naming Conventions

```typescript
// Classes: PascalCase
class Document {}
class PageRenderer {}

// Functions/methods: camelCase
function extractText() {}
function renderPage() {}

// Constants: UPPER_SNAKE_CASE
const MAX_PAGE_SIZE = 1000;
const DEFAULT_DPI = 96;

// Interfaces: PascalCase with descriptive names
interface DocumentOptions {}
interface RenderSettings {}

// Type aliases: PascalCase
type Handle = bigint;
type ErrorCode = number;

// Private members: prefix with underscore
class Page {
  private _handle: bigint;
  private _dropped: boolean;
}
```

### Documentation

All public APIs must have JSDoc comments:

````typescript
/**
 * Renders a page to a pixmap at the specified resolution.
 *
 * @param matrix - Transformation matrix for rendering (default: identity)
 * @param colorspace - Colorspace for output (default: RGB)
 * @param alpha - Include alpha channel (default: false)
 * @returns A pixmap containing the rendered page
 * @throws {NanoPDFError} If rendering fails
 *
 * @example
 * ```typescript
 * const page = doc.loadPage(0);
 * const matrix = Matrix.scale(2, 2); // 2x resolution
 * const pixmap = page.toPixmap(matrix);
 * console.log(`Rendered: ${pixmap.width}x${pixmap.height}`);
 * ```
 */
toPixmap(
  matrix?: MatrixLike,
  colorspace?: Colorspace,
  alpha?: boolean
): Pixmap {
  // Implementation...
}
````

### Error Handling

```typescript
// ✅ Good: Specific error types, clear messages
if (!fs.existsSync(path)) {
  throw NanoPDFError.notFound(`File not found: ${path}`);
}

if (pageNum < 0 || pageNum >= this.pageCount) {
  throw NanoPDFError.range(`Page number ${pageNum} out of range [0, ${this.pageCount})`);
}

// ❌ Bad: Generic errors, vague messages
if (!fs.existsSync(path)) {
  throw new Error('Error');
}
```

### Memory Management

```typescript
// ✅ Good: Explicit cleanup
const doc = Document.open('file.pdf');
try {
  // Work with document
} finally {
  doc.close(); // Always clean up!
}

// ❌ Bad: Missing cleanup (memory leak)
const doc = Document.open('file.pdf');
// Work with document
// ... leaked!
```

---

## Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Document, Page } from '../src';

describe('Document', () => {
  let doc: Document;

  beforeEach(() => {
    // Setup before each test
    doc = Document.open('test-pdfs/simple/hello-world.pdf');
  });

  afterEach(() => {
    // Cleanup after each test
    doc.close();
  });

  it('should open a PDF document', () => {
    expect(doc).toBeDefined();
    expect(doc.pageCount).toBeGreaterThan(0);
  });

  it('should load a page', () => {
    const page = doc.loadPage(0);
    expect(page.pageNumber).toBe(0);
    page.drop();
  });

  it('should throw error for invalid page number', () => {
    expect(() => doc.loadPage(-1)).toThrow();
    expect(() => doc.loadPage(9999)).toThrow();
  });
});
```

### Test Coverage Requirements

- **Unit tests**: >85% coverage
- **Integration tests**: Critical paths covered
- **All public APIs**: Must have tests
- **Error cases**: Must be tested

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- document.test.ts

# Run with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run in watch mode
pnpm test:watch
```

---

## Submitting Changes

### Before Submitting

1. **Run all quality checks**:

   ```bash
   pnpm quality
   ```

2. **Ensure tests pass**:

   ```bash
   pnpm test
   ```

3. **Check test coverage**:

   ```bash
   pnpm test:coverage
   ```

4. **Update documentation** if needed

5. **Add tests** for new features

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

   - [ ] My code follows the code style of this project
   - [ ] I have updated the documentation accordingly
   - [ ] I have added tests to cover my changes
   - [ ] All new and existing tests passed
   - [ ] My changes generate no new warnings
   - [ ] I have checked my code and corrected any misspellings
   ```

### Code Review Process

1. **Automated checks** will run (CI/CD)
2. **Maintainer review** (may request changes)
3. **Address feedback** if needed
4. **Approval and merge** by maintainer

---

## Areas for Contribution

### High Priority

1. **N-API Bindings** (C++)
   - Currently only 20% complete (130/660 functions)
   - Need C++ wrappers for Rust FFI functions
   - See [FFI_IMPLEMENTATION_STATUS.md](FFI_IMPLEMENTATION_STATUS.md)

2. **Form Fields Support**
   - 57 FFI functions need N-API bindings
   - Reading and writing form field values
   - Field validation

3. **Annotations Support**
   - 31 FFI functions need N-API bindings
   - Creating and modifying annotations
   - Text markup, stamps, shapes

4. **Advanced Text Operations**
   - Structured text extraction
   - Text search improvements
   - Font information

### Medium Priority

1. **Display Lists**
   - Caching rendered pages
   - Performance optimization

2. **Link Support**
   - Reading hyperlinks
   - Navigation

3. **Image Operations**
   - Image extraction
   - Image manipulation

### Low Priority

1. **Documentation**
   - More examples
   - Tutorials
   - API reference improvements

2. **Testing**
   - More test cases
   - Edge case coverage
   - Performance benchmarks

3. **Tools**
   - CLI utilities
   - Code generators
   - Development helpers

### Good First Issues

Look for issues tagged with `good first issue` on GitHub:

- Documentation improvements
- Simple bug fixes
- Adding tests for existing functionality
- Code cleanup and refactoring

---

## Development Tips

### Debugging

```typescript
// Enable debug logging
process.env.DEBUG = 'nanopdf:*';

// Add temporary logs
console.log('[DEBUG]', 'value:', value);
```

### Testing with Docker

```bash
cd docker
./build-test.sh --shell  # Interactive shell
./build-test.sh --unit   # Unit tests only
./build-test.sh --integration  # Integration tests only
```

### Performance Profiling

```typescript
import { performance } from 'perf_hooks';

const start = performance.now();
// ... operation ...
const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```

### Memory Profiling

```bash
node --expose-gc --max-old-space-size=4096 script.js
```

---

## Getting Help

- 📚 **Documentation**: Read [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/username/nanopdf/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/username/nanopdf/issues)
- 📧 **Email**: maintainer@example.com

---

## License

By contributing to NanoPDF, you agree that your contributions will be licensed under the Apache License 2.0.

---

## Acknowledgments

Thank you to all contributors who have helped make NanoPDF better!

<div align="center">

**Happy Coding! 🚀**

</div>
