# Docker Testing Container for micropdf-js

This directory contains Docker configuration for building and testing micropdf-js (Node.js bindings) in an isolated environment.

## Overview

The Docker testing container:

1. **Builds the Rust library** (`libmicropdf.a`) from `micropdf-rs/`
2. **Sets up Node.js environment** with pnpm and build tools
3. **Compiles native N-API addon** using node-gyp
4. **Runs comprehensive tests** including:
   - Unit tests (Vitest)
   - Integration tests
   - Type checking (TypeScript)
   - Native addon verification

## Quick Start

### Run All Tests

```bash
./docker/build-test.sh
```

This will:

- Build the Docker image
- Compile the Rust library
- Build the N-API native addon
- Run all tests (unit + integration)
- Verify TypeScript compilation
- Report results

### Options

```bash
# Build without cache (clean build)
./docker/build-test.sh --no-cache

# Drop into an interactive shell
./docker/build-test.sh --shell

# Run tests with coverage
./docker/build-test.sh --coverage

# Verbose output
./docker/build-test.sh --verbose
```

## Use Cases

### 1. Continuous Integration

Use in CI pipelines to verify builds:

```yaml
# GitHub Actions example
- name: Test Node.js bindings
  run: |
    cd micropdf-js
    ./docker/build-test.sh
```

### 2. Local Testing

Test the full build without installing Rust locally:

```bash
# Run all tests
./docker/build-test.sh

# Interactive debugging
./docker/build-test.sh --shell
```

### 3. Native Addon Verification

Ensure the N-API addon compiles and loads correctly:

```bash
# Full test including native addon
./docker/build-test.sh
```

## What Gets Tested

### Unit Tests

```bash
pnpm test
```

- Tests all TypeScript modules
- Verifies API functionality
- Mock and real implementations
- ~100+ test cases

### Integration Tests

```bash
pnpm test -- --run integration
```

- End-to-end PDF operations
- Real document processing
- Native addon integration
- Performance benchmarks

### Type Checking

```bash
pnpm exec tsc --noEmit
```

- Verifies TypeScript types
- Checks for type errors
- Ensures type safety

### Native Addon

```bash
node -e "require('./build/Release/micropdf_native.node')"
```

- Verifies addon loads
- Checks exported functions
- Tests N-API compatibility

## Container Structure

### Stage 1: Rust Builder

```dockerfile
FROM rust:1.87-bookworm
# Builds libmicropdf.a from micropdf-rs/
```

- Compiles Rust library in release mode
- ~2-5 minutes for cold build
- Uses Cargo cache for speed

### Stage 2: Node.js Testing

```dockerfile
FROM node:22-bookworm
# Copies Rust library
# Builds native addon
# Runs tests
```

- Node.js 22 (LTS)
- pnpm package manager
- node-gyp for native builds
- Vitest for testing

## Manual Docker Usage

### Build the Image

```bash
cd /path/to/micropdf  # Project root
docker build -f micropdf-js/docker/Dockerfile.test -t micropdf-js-test:latest .
```

### Run Tests

```bash
docker run --rm micropdf-js-test:latest
```

### Interactive Shell

```bash
docker run -it --rm micropdf-js-test:latest /bin/bash
```

Inside the container:

```bash
# Run specific tests
pnpm test -- geometry

# Run tests with watch mode
pnpm test:watch

# Build TypeScript
pnpm run build:ts

# Rebuild native addon
pnpm run build:native

# Check native addon
node -e "console.log(require('./build/Release/micropdf_native.node'))"

# Run coverage
pnpm test -- --coverage
```

## Development Workflow

### Test Local Changes

Mount your local directory for rapid iteration:

```bash
docker run -it --rm \
  -v "$(pwd):/workspace/micropdf-js" \
  micropdf-js-test:latest \
  /bin/bash

# Inside container:
pnpm test
```

### Debug Native Addon

```bash
# Start shell
./docker/build-test.sh --shell

# Check library exists
ls -lh /usr/local/lib/libmicropdf.a

# Check headers
ls -R /usr/local/include/

# Verify native addon
ls -lh build/Release/micropdf_native.node
file build/Release/micropdf_native.node

# Test loading
node -e "const n = require('./build/Release/micropdf_native.node'); console.log(Object.keys(n));"

# Run specific test
pnpm test -- document.test.ts
```

### Debug Build Issues

```bash
# Clean and rebuild
pnpm run clean
pnpm run build:native

# Verbose node-gyp
node-gyp rebuild --verbose

# Check binding.gyp
cat binding.gyp

# Test TypeScript compilation
pnpm exec tsc --noEmit
```

## Troubleshooting

### Build Fails

**Issue**: Docker build fails with "no such file"

**Solution**: Ensure you're running from the project root:

```bash
cd /path/to/micropdf  # Project root, not micropdf-js/
./micropdf-js/docker/build-test.sh
```

### Native Addon Fails to Load

**Issue**: "Cannot find module 'micropdf_native.node'"

**Solution**: Rebuild the native addon:

```bash
./docker/build-test.sh --shell
# Inside container:
pnpm run build:native
node -e "require('./build/Release/micropdf_native.node')"
```

### Tests Fail

**Issue**: Tests fail with import errors

**Solution**: Rebuild TypeScript:

```bash
./docker/build-test.sh --shell
# Inside container:
pnpm run build:ts
pnpm test
```

### Slow Build

**Issue**: Docker build takes too long

**Solution**: Use cache and multi-stage builds:

```bash
# Use cache (default)
./docker/build-test.sh

# Force rebuild only when needed
./docker/build-test.sh --no-cache
```

## Environment Variables

Inside the container:

| Variable   | Value                   | Purpose          |
| ---------- | ----------------------- | ---------------- |
| `NODE_ENV` | `test`                  | Test environment |
| `PATH`     | Includes pnpm, node-gyp | Tool access      |

## Advanced Usage

### Custom Test Command

```bash
docker run --rm micropdf-js-test:latest \
  sh -c "pnpm test -- --run geometry"
```

### Benchmark Tests

```bash
docker run --rm micropdf-js-test:latest \
  sh -c "pnpm test -- --run --reporter=verbose"
```

### Coverage Report

```bash
docker run --rm micropdf-js-test:latest \
  sh -c "pnpm test -- --coverage"
```

### Watch Mode

```bash
docker run -it --rm \
  -v "$(pwd):/workspace/micropdf-js" \
  micropdf-js-test:latest \
  pnpm test:watch
```

### Multi-Architecture Build

```bash
# AMD64 (default)
docker build --platform linux/amd64 \
  -f micropdf-js/docker/Dockerfile.test \
  -t micropdf-js-test:amd64 .

# ARM64
docker build --platform linux/arm64 \
  -f micropdf-js/docker/Dockerfile.test \
  -t micropdf-js-test:arm64 .
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Test Node.js Bindings

on: [push, pull_request]

jobs:
  test-nodejs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and test
        run: |
          cd micropdf-js
          ./docker/build-test.sh
```

### GitLab CI

```yaml
test-nodejs-bindings:
  image: docker:latest
  services:
    - docker:dind
  script:
    - cd micropdf-js
    - ./docker/build-test.sh
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Test Node.js Bindings') {
            steps {
                sh 'cd micropdf-js && ./docker/build-test.sh'
            }
        }
    }
}
```

## Performance

Typical build times (on modern hardware):

- **Rust library build**: ~2-5 minutes (first time)
- **pnpm install**: ~30-60 seconds
- **Native addon build**: ~30-60 seconds
- **TypeScript compilation**: ~10-20 seconds
- **Test execution**: ~10-30 seconds
- **Total**: ~4-8 minutes

Subsequent builds with cache: ~1-2 minutes

## Test Structure

### Unit Tests

Located in `test/`:

- `buffer.test.ts` - Buffer operations
- `context.test.ts` - Context management
- `document.test.ts` - Document operations
- `page.test.ts` - Page rendering
- `geometry.test.ts` - Geometric operations
- And more...

### Integration Tests

Located in `test/integration/`:

- Real PDF processing
- End-to-end workflows
- Performance tests
- Memory leak detection

## Dependencies

The container includes:

- **Node.js 22**: LTS version
- **pnpm**: Fast package manager
- **node-gyp**: Native addon compiler
- **build-essential**: C++ compiler
- **python3**: Required by node-gyp
- **Vitest**: Test framework
- **TypeScript**: Type checking

## Comparison with Other Approaches

| Approach           | Pros                             | Cons                    |
| ------------------ | -------------------------------- | ----------------------- |
| **Docker**         | Isolated, reproducible, CI-ready | Slower, requires Docker |
| **Native**         | Fast, local development          | Requires Rust installed |
| **GitHub Actions** | Automated, cloud-based           | Only on push/PR         |

## Related Documentation

- [Main README](../README.md) - Node.js bindings documentation
- [Building Guide](../../micropdf-rs/BUILDING.md) - Rust library build instructions
- [N-API Documentation](https://nodejs.org/api/n-api.html) - Node.js native API

## License

Same as the main project: Dual-licensed under Apache 2.0 and MIT.
