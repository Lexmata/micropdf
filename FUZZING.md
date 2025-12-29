# Fuzzing Guide

Comprehensive fuzzing setup for MicroPDF across all language bindings.

## Overview

Fuzzing is an automated software testing technique that provides invalid, unexpected, or random data as inputs to discover bugs, crashes, and security vulnerabilities.

### Why Fuzz?

- **Find crashes** before users do
- **Discover edge cases** not covered by unit tests
- **Detect memory issues** (leaks, overflows, use-after-free)
- **Improve security** by finding exploitable bugs
- **Continuous testing** with minimal human effort

### What We Fuzz

| Project | Fuzzer | Targets |
|---------|--------|---------|
| **Rust** | cargo-fuzz (libFuzzer) | PDF parsing, buffers, streams, objects, filters |
| **Go** | Native Go fuzzing | Document ops, buffers, text, metadata, geometry |
| **Node.js** | Jazzer.js (libFuzzer) | PDF parsing, buffers, geometry operations |

---

## Rust Fuzzing

### Quick Start

```bash
cd micropdf-rs

# Install cargo-fuzz
cargo install cargo-fuzz

# Run PDF parsing fuzzer for 5 minutes
cargo fuzz run fuzz_pdf_parse -- -max_total_time=300

# Run all fuzzers
for target in fuzz_pdf_parse fuzz_buffer fuzz_stream fuzz_pdf_objects fuzz_filters; do
  cargo fuzz run $target -- -max_total_time=60
done
```

### Fuzz Targets

#### 1. **fuzz_pdf_parse** - PDF Document Parsing

Tests: Document opening, page loading, basic operations

```bash
cargo fuzz run fuzz_pdf_parse -- -max_total_time=300
```

**Finds:**
- Parse errors in malformed PDFs
- Crashes in document handling
- Memory issues (leaks, overflows)

#### 2. **fuzz_buffer** - Buffer Operations

Tests: Buffer creation, append, read, clear

```bash
cargo fuzz run fuzz_buffer -- -max_total_time=300
```

**Finds:**
- Buffer overflow/underflow
- Memory corruption
- Edge cases in buffer management

#### 3. **fuzz_stream** - Stream I/O

Tests: Stream reading, seeking, peeking

```bash
cargo fuzz run fuzz_stream -- -max_total_time=300
```

**Finds:**
- Stream handling bugs
- Read errors and edge cases
- Seeking issues

#### 4. **fuzz_pdf_objects** - PDF Object Model

Tests: Dictionaries, arrays, references, trailer, catalog

```bash
cargo fuzz run fuzz_pdf_objects -- -max_total_time=300
```

**Finds:**
- Object parsing bugs
- Type confusion
- Reference resolution issues

#### 5. **fuzz_filters** - Stream Filters

Tests: FlateDecode, ASCII85, ASCIIHex, RLE decompression

```bash
cargo fuzz run fuzz_filters -- -max_total_time=300
```

**Finds:**
- Decompression bugs
- Infinite loops
- Malicious compressed data handling

### Reproducing Crashes

```bash
# Crashes are saved to fuzz/artifacts/
ls micropdf-rs/fuzz/artifacts/fuzz_pdf_parse/

# Reproduce crash
cargo fuzz run fuzz_pdf_parse \
  micropdf-rs/fuzz/artifacts/fuzz_pdf_parse/crash-1234567890abcdef

# Debug crash
cargo fuzz run --debug fuzz_pdf_parse \
  micropdf-rs/fuzz/artifacts/fuzz_pdf_parse/crash-1234567890abcdef
```

### Coverage

```bash
# Generate coverage report
cd micropdf-rs
cargo fuzz coverage fuzz_pdf_parse

# View HTML report
cargo fuzz coverage fuzz_pdf_parse --html
firefox fuzz/coverage/fuzz_pdf_parse/index.html
```

---

## Go Fuzzing

### Quick Start

```bash
cd go-micropdf

# Run specific fuzz test for 5 minutes
go test -fuzz=FuzzDocumentOpen -fuzztime=5m

# Run all fuzz tests sequentially
go test -fuzz=FuzzDocumentOpen -fuzztime=1m
go test -fuzz=FuzzBuffer -fuzztime=1m
go test -fuzz=FuzzPageText -fuzztime=1m
go test -fuzz=FuzzMetadata -fuzztime=1m
go test -fuzz=FuzzGeometry -fuzztime=1m
```

### Fuzz Tests

#### 1. **FuzzDocumentOpen** - Document Operations

Tests: Opening PDFs, page loading, basic queries

```bash
go test -fuzz=FuzzDocumentOpen -fuzztime=5m
```

**Finds:**
- Document parsing crashes
- Invalid PDF handling
- CGO boundary issues

#### 2. **FuzzBuffer** - Buffer Operations

Tests: Buffer creation, append, read, clear

```bash
go test -fuzz=FuzzBuffer -fuzztime=5m
```

**Finds:**
- Buffer handling bugs
- Memory issues in Go/C boundary

#### 3. **FuzzPageText** - Text Extraction

Tests: Text extraction, text search

```bash
go test -fuzz=FuzzPageText -fuzztime=5m
```

**Finds:**
- Text extraction crashes
- Search algorithm bugs

#### 4. **FuzzMetadata** - Metadata Extraction

Tests: Metadata lookup

```bash
go test -fuzz=FuzzMetadata -fuzztime=5m
```

**Finds:**
- Metadata parsing bugs
- String handling issues

#### 5. **FuzzGeometry** - Geometric Operations

Tests: Rect, Point, Matrix operations

```bash
go test -fuzz=FuzzGeometry -fuzztime=5m
```

**Finds:**
- Float precision issues
- Edge cases in geometric calculations

### Reproducing Crashes

```bash
# Crashes are saved to testdata/fuzz/
ls go-micropdf/testdata/fuzz/FuzzDocumentOpen/

# Reproduce crash
go test -run=FuzzDocumentOpen/1234567890abcdef
```

### Corpus Management

```bash
# View corpus
ls go-micropdf/testdata/fuzz/FuzzDocumentOpen/

# Add custom seed
echo "%PDF-1.4" > testdata/fuzz/FuzzDocumentOpen/custom_seed

# Clear corpus
rm -rf testdata/fuzz/FuzzDocumentOpen/*
```

---

## Node.js Fuzzing

### Quick Start

```bash
cd micropdf-js

# Install dependencies (includes @jazzer.js/core)
pnpm install

# Run all fuzzers for 5 minutes each
pnpm fuzz

# Run specific fuzzer
pnpm fuzz:pdf      # PDF parsing
pnpm fuzz:buffer   # Buffer operations
pnpm fuzz:geometry # Geometry operations
```

### Fuzz Targets

#### 1. **pdf-parse** - PDF Document Parsing

Tests: Document opening, page loading, metadata extraction

```bash
pnpm fuzz:pdf
# or
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync -t 300
```

**Finds:**
- Parse errors in malformed PDFs
- Crashes in document handling
- Memory issues
- Edge cases in PDF structure

**Targets:**
- `Document.open()`
- `Document.openFromBuffer()`
- `doc.getPage()`
- `doc.getMetadata()`
- Page bounds access

#### 2. **buffer** - Buffer Operations

Tests: Buffer creation, reading, writing

```bash
pnpm fuzz:buffer
# or
npx jazzer fuzz/targets/buffer.fuzz.ts --sync -t 300
```

**Finds:**
- Buffer overflow/underflow
- Read/write edge cases
- Type conversion issues
- Memory corruption

**Targets:**
- `Buffer.fromArrayBuffer()`
- `Buffer.fromString()`
- `BufferReader` operations
- `BufferWriter` operations
- Slice operations

#### 3. **geometry** - Geometry Operations

Tests: Point, Rect, Matrix, Quad operations with extreme values

```bash
pnpm fuzz:geometry
# or
npx jazzer fuzz/targets/geometry.fuzz.ts --sync -t 300
```

**Finds:**
- Numerical overflow/underflow
- NaN/Infinity handling
- Matrix singularity issues
- Invalid transformations

**Targets:**
- `Point` distance and transforms
- `Rect` intersections and unions
- `Matrix` inversions and concatenations
- `Quad` transforms and bounding boxes

### Advanced Usage

```bash
# Custom duration (10 minutes)
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync -t 600

# Multiple workers
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync --workers=8

# With specific corpus
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --corpus_dir=fuzz/corpus/pdf_parse
```

### Reproducing Crashes

```bash
# Crash file saved as: crash-<hash>
# Reproduce:
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --reproducer=crash-<hash>

# Minimize crash
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --minimize_crash=crash-<hash>
```

### Corpus Management

```bash
# View corpus
ls micropdf-js/fuzz/corpus/pdf_parse/

# Add custom seed
cp my-test.pdf fuzz/corpus/pdf_parse/

# Create minimal PDF seed
cat > fuzz/corpus/pdf_parse/minimal.pdf << 'EOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj
xref
0 3
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
trailer<</Size 3/Root 1 0 R>>
startxref
110
%%EOF
EOF
```

### CI Integration

Node.js fuzzing runs automatically via GitHub Actions:

- **On Push/PR**: 5 minutes per target
- **Nightly**: Extended fuzzing (configurable)
- **Manual**: Custom duration via workflow dispatch

**Workflow:** `.github/workflows/fuzz-nodejs.yml`

```bash
# Trigger manual fuzzing
gh workflow run fuzz-nodejs.yml -f duration=600  # 10 minutes
```

---

## Continuous Fuzzing (CI)

### GitHub Actions

Fuzzing runs automatically:

- **On Push/PR**: 5 minutes per target
- **Nightly**: 30 minutes per target (2 AM UTC)
- **Manual**: Custom duration via workflow dispatch

### Workflow: `.github/workflows/fuzz.yml`

```yaml
# Trigger manual fuzzing with custom duration
gh workflow run fuzz.yml -f duration=600  # 10 minutes
```

### Crash Handling

1. **Crash detected** → Workflow fails
2. **Artifact uploaded** → Download from GitHub Actions
3. **Issue created** → Review and fix bug
4. **Regression test** → Add to integration tests

---

## OSS-Fuzz Integration

MicroPDF can be integrated with [OSS-Fuzz](https://github.com/google/oss-fuzz) for continuous, large-scale fuzzing by Google.

### Benefits

- **24/7 fuzzing** on Google infrastructure
- **ClusterFuzz** for crash management
- **Coverage tracking** over time
- **Automatic bug reports**

### Setup (Future)

1. Submit project to OSS-Fuzz
2. Create `oss-fuzz/projects/micropdf/` config
3. Add build script
4. Configure fuzz targets
5. Enable continuous fuzzing

---

## Best Practices

### 1. **Seed Corpus**

Provide diverse initial inputs:

```bash
# Rust
cp test-pdfs/*/*.pdf micropdf-rs/fuzz/corpus/fuzz_pdf_parse/

# Go (automatic via f.Add())
```

### 2. **Limit Input Size**

Prevent timeout on large inputs:

```bash
# Rust: Max 1 MB
cargo fuzz run fuzz_pdf_parse -- -max_len=1048576

# Go: Add check in fuzz function
if len(data) > 1048576 { return }
```

### 3. **Timeout**

Set reasonable timeout:

```bash
# Rust: 5 seconds per input
cargo fuzz run fuzz_pdf_parse -- -timeout=5

# Go: Set in code or via -timeout flag
```

### 4. **Memory Limits**

Prevent OOM:

```bash
# Rust: 2 GB RSS limit
cargo fuzz run fuzz_pdf_parse -- -rss_limit_mb=2048
```

### 5. **Parallel Fuzzing**

Use multiple cores:

```bash
# Rust
cargo fuzz run fuzz_pdf_parse -- -jobs=8

# Go
go test -fuzz=FuzzDocumentOpen -parallel=8
```

---

## Interpreting Results

### Rust libFuzzer Output

```
#123456 NEW    cov: 5678 ft: 9012 corp: 45/123KB exec/s: 1234
```

- `#123456`: Iteration number
- `NEW`: Found new coverage
- `cov: 5678`: Unique edges covered
- `ft: 9012`: Features (code paths)
- `corp: 45`: Corpus size (unique inputs)
- `exec/s: 1234`: Executions per second

### Go Fuzzing Output

```
fuzz: elapsed: 1m0s, execs: 123456 (2057/sec), new interesting: 12 (total: 45)
```

- `elapsed`: Time elapsed
- `execs`: Total executions
- `new interesting`: New corpus entries
- `(total: 45)`: Total corpus size

### Crashes

```
==12345==ERROR: AddressSanitizer: heap-buffer-overflow
```

- **AddressSanitizer**: Detected memory issue
- **Artifact saved**: Check `artifacts/` directory
- **Action required**: Fix bug and add regression test

---

## Performance

### Expected Speed

| Target | Executions/sec | Notes |
|--------|----------------|-------|
| fuzz_buffer | 5,000-10,000 | Fast, simple operations |
| fuzz_stream | 3,000-5,000 | Medium, I/O operations |
| fuzz_pdf_parse | 100-500 | Slow, complex parsing |
| fuzz_pdf_objects | 200-800 | Medium, object traversal |
| fuzz_filters | 1,000-3,000 | Fast-medium, decompression |

### Optimization Tips

1. **Limit work per input**: Check size early, skip large inputs
2. **Use release mode**: Always (automatic in cargo-fuzz)
3. **Profile**: Find slow code paths
4. **Simplify target**: Remove unnecessary operations

---

## Troubleshooting

### Slow Fuzzing (< 100 exec/s)

**Problem**: Fuzzer is too slow to be effective

**Solutions**:
- Reduce `-max_len` to limit input size
- Add early returns for invalid data
- Profile the fuzz target
- Check if running in release mode

### Out of Memory

**Problem**: Fuzzer killed due to OOM

**Solutions**:
- Add `-rss_limit_mb=2048` (Rust)
- Check for memory leaks
- Reduce corpus size
- Limit input processing

### No New Coverage

**Problem**: Coverage plateaus quickly

**Solutions**:
- Corpus may be sufficient (good!)
- Add more diverse seeds
- Try different fuzz target
- Run longer

### Timeout

**Problem**: Inputs timeout (> 1s execution)

**Solutions**:
- Increase `-timeout=10` (Rust)
- Add early returns for slow operations
- Check for infinite loops
- Limit recursion depth

---

## Security

### Sanitizers

#### Address Sanitizer (ASan) - Default

Detects:
- Heap buffer overflow/underflow
- Stack buffer overflow
- Use-after-free
- Double-free
- Memory leaks

#### Undefined Behavior Sanitizer (UBSan)

```bash
RUSTFLAGS="-Zsanitizer=undefined" cargo fuzz run fuzz_pdf_parse
```

Detects:
- Integer overflow
- Null pointer dereference
- Misaligned pointers
- Invalid enum values

#### Memory Sanitizer (MSan)

```bash
RUSTFLAGS="-Zsanitizer=memory" cargo fuzz run fuzz_pdf_parse
```

Detects:
- Use of uninitialized memory

---

## Contributing

### Adding New Fuzz Targets

#### Rust

1. Create `micropdf-rs/fuzz/fuzz_targets/fuzz_myfeature.rs`
2. Add binary to `micropdf-rs/fuzz/Cargo.toml`
3. Create corpus directory
4. Add seeds
5. Update documentation

#### Go

1. Add `FuzzMyFeature` to `go-micropdf/fuzz_test.go`
2. Add seed corpus with `f.Add()`
3. Implement fuzz logic
4. Test locally
5. Update documentation

### Reporting Crashes

When reporting crashes:

1. **Minimize crash input**: `cargo fuzz tmin fuzz_pdf_parse artifacts/crash-xyz`
2. **Create GitHub issue** with:
   - Fuzz target name
   - Minimized input (attach file)
   - Full stack trace
   - Environment (OS, Rust/Go version)
   - Steps to reproduce

### CI Integration

Fuzzing runs in GitHub Actions:
- On every push/PR (5 min per target)
- Nightly (30 min per target)
- Manual (custom duration)

---

## Resources

### Documentation

- [cargo-fuzz Book](https://rust-fuzz.github.io/book/cargo-fuzz.html)
- [libFuzzer Documentation](https://llvm.org/docs/LibFuzzer.html)
- [Go Fuzzing Guide](https://go.dev/security/fuzz/)
- [OSS-Fuzz](https://github.com/google/oss-fuzz)

### Tools

- [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz)
- [libFuzzer](https://llvm.org/docs/LibFuzzer.html)
- [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer)

### Articles

- [Effective Fuzzing](https://github.com/rust-fuzz/book/blob/master/src/introduction.md)
- [Fuzzing Rust with AFL](https://rust-fuzz.github.io/book/afl.html)
- [Go Fuzzing Tutorial](https://go.dev/doc/tutorial/fuzz)

---

## Status

| Project | Status | Targets | Coverage |
|---------|--------|---------|----------|
| **Rust** | ✅ Active | 5 targets | ~70% |
| **Go** | ✅ Active | 5 tests | ~85% |
| **Node.js** | ⏳ Planned | - | - |

**Last Updated**: 2025-01-05  
**Next Review**: 2025-02-05

---

**Happy Fuzzing!** 🐛🔨🔍

