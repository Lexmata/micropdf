# NanoPDF Node.js Fuzzing

Comprehensive fuzzing setup for the NanoPDF Node.js library using Jazzer.js.

## Overview

Fuzzing helps discover bugs, crashes, and security vulnerabilities by feeding random/malformed data to the library. This setup uses [Jazzer.js](https://github.com/CodeIntelligenceTesting/jazzer.js), a coverage-guided JavaScript fuzzer based on libFuzzer.

## Quick Start

```bash
cd nanopdf-js

# Install dependencies (includes @jazzer.js/core)
pnpm install

# Run all fuzzers for 5 minutes each
pnpm fuzz

# Run specific fuzzer
pnpm fuzz:pdf     # PDF parsing
pnpm fuzz:buffer  # Buffer operations
pnpm fuzz:geometry # Geometry operations
```

## Fuzz Targets

### 1. PDF Parsing (`pdf-parse.fuzz.ts`)

**Tests:** Document opening, page loading, metadata extraction

```bash
pnpm fuzz:pdf
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

### 2. Buffer Operations (`buffer.fuzz.ts`)

**Tests:** Buffer creation, reading, writing

```bash
pnpm fuzz:buffer
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

### 3. Geometry Operations (`geometry.fuzz.ts`)

**Tests:** Point, Rect, Matrix, Quad operations with extreme values

```bash
pnpm fuzz:geometry
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

## Advanced Usage

### Run with Custom Duration

```bash
# Run for 10 minutes
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync -t 600

# Run for 1 hour
npx jazzer fuzz/targets/buffer.fuzz.ts --sync -t 3600
```

### Run with Custom Corpus

```bash
# Use specific corpus directory
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --corpus_dir=fuzz/corpus/pdf_parse

# Merge multiple corpora
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --corpus_dir=fuzz/corpus/pdf_parse \\
  --corpus_dir=fuzz/corpus/custom
```

### Reproduce a Crash

If fuzzing finds a crash, it saves the input to a file:

```bash
# Crash file saved as: crash-<hash>
# Reproduce:
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --reproducer=crash-<hash>
```

### Minimize a Crashing Input

```bash
# Reduce crash file to minimal reproducer
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --minimize_crash=crash-<hash>
```

## Corpus Management

### Seed Corpus

The `fuzz/corpus/` directory contains seed inputs that help fuzzing start with valid data:

```
fuzz/corpus/
├── pdf_parse/      # Sample PDF files
├── buffer/         # Binary data samples
├── geometry/       # Geometry test cases
└── document/       # Document operation samples
```

### Add Custom Seeds

```bash
# Add your own test files
cp my-test.pdf fuzz/corpus/pdf_parse/
cp my-data.bin fuzz/corpus/buffer/
```

### Generate Initial Corpus

```bash
# Create minimal valid PDF
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

## CI Integration

### GitHub Actions

Fuzzing runs automatically in CI on every push and PR:

```yaml
# .github/workflows/fuzz.yml
name: Fuzzing

on: [push, pull_request]

jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm fuzz:quick # Run all fuzzers for 60s each
```

### Continuous Fuzzing

For continuous fuzzing (24/7), consider:

- **OSS-Fuzz**: Google's continuous fuzzing service (free for open source)
- **Self-hosted**: Run fuzzing on dedicated CI runners
- **Clusterfuzz**: Google's scalable fuzzing infrastructure

## Performance Tips

### Optimize for Speed

```bash
# Use multiple cores
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --workers=8

# Disable expensive checks during fuzzing
export NODE_ENV=production
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync
```

### Monitor Coverage

```bash
# Generate coverage report
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --coverage_report=coverage.json

# View coverage
cat coverage.json
```

## Troubleshooting

### Fuzzer Hangs

If fuzzer seems stuck:

```bash
# Set timeout for test cases
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --timeout=1000  # 1 second per test case
```

### Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=8192 \\
  npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync
```

### Slow Fuzzing

```bash
# Check dictionary
npx jazzer fuzz/targets/pdf-parse.fuzz.ts --sync \\
  --print_coverage_stats
```

## Best Practices

1. **Start with short runs** - 1-5 minutes to verify setup
2. **Use seed corpus** - Helps fuzzer learn valid input structure
3. **Run regularly** - Integrate into CI/CD pipeline
4. **Minimize crashes** - Reduce crash files to minimal reproducers
5. **Review findings** - Triage and fix discovered issues promptly
6. **Update corpus** - Add interesting test cases to corpus

## Fuzzing Strategy

### Phase 1: Quick Smoke Test (1-5 minutes)

```bash
pnpm fuzz:quick
```

Verifies fuzzing setup works and catches obvious bugs.

### Phase 2: Extended Fuzzing (1 hour)

```bash
pnpm fuzz:extended
```

Discovers edge cases and less common code paths.

### Phase 3: Deep Fuzzing (24+ hours)

```bash
pnpm fuzz:deep
```

Finds rare bugs and complex edge cases. Run overnight or on CI.

### Phase 4: Continuous Fuzzing (24/7)

```bash
# OSS-Fuzz or self-hosted continuous fuzzing
```

Ongoing security and stability testing.

## Metrics

Track fuzzing effectiveness:

- **Coverage**: Lines/branches covered by fuzzing
- **Exec/sec**: Test cases executed per second
- **Corpus size**: Number of interesting test cases found
- **Crashes**: Unique bugs discovered
- **Time to first crash**: How quickly fuzzer finds bugs

## Resources

- [Jazzer.js Documentation](https://github.com/CodeIntelligenceTesting/jazzer.js)
- [LibFuzzer Documentation](https://llvm.org/docs/LibFuzzer.html)
- [AFL Documentation](https://github.com/google/AFL)
- [OSS-Fuzz](https://github.com/google/oss-fuzz)
- [Fuzzing Book](https://www.fuzzingbook.org/)

## Contributing

To add new fuzz targets:

1. Create `fuzz/targets/your-target.fuzz.ts`
2. Import `FuzzedDataProvider` from `@jazzer.js/core`
3. Export `fuzz(data: Buffer): void` function
4. Add corpus seeds to `fuzz/corpus/your-target/`
5. Add script to `package.json`
6. Update this README

Example:

```typescript
import { FuzzedDataProvider } from '@jazzer.js/core';
import { YourClass } from '../../src/your-module.js';

export function fuzz(data: Buffer): void {
  const provider = new FuzzedDataProvider(data);

  try {
    const input = provider.consumeRemainingAsBytes();
    YourClass.process(input);
  } catch (e) {
    // Expected errors are ok
  }
}
```

## License

Same as NanoPDF - see LICENSE file.
