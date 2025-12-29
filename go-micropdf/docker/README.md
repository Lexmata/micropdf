# Docker Testing Container for go-micropdf

This directory contains Docker configuration for building and testing go-micropdf in an isolated environment.

## Overview

The Docker testing container:

1. **Builds the Rust library** (`libmicropdf.a`) from `micropdf-rs/`
2. **Sets up Go environment** with both mock and CGO support
3. **Runs comprehensive tests** including:
   - Mock tests (pure Go, no CGO)
   - CGO tests (with Rust FFI)
   - Example builds (both mock and CGO)

## Quick Start

### Run All Tests

```bash
./docker/build-test.sh
```

This will:
- Build the Docker image
- Compile the Rust library
- Run all Go tests (mock and CGO)
- Build example programs
- Report results

### Options

```bash
# Build without cache (clean build)
./docker/build-test.sh --no-cache

# Drop into an interactive shell
./docker/build-test.sh --shell

# Run only unit tests
./docker/build-test.sh --unit

# Run only integration tests
./docker/build-test.sh --integration

# Verbose output
./docker/build-test.sh --verbose
```

## Use Cases

### 1. Continuous Integration

Use in CI pipelines to verify builds:

```yaml
# GitHub Actions example
- name: Test Go bindings
  run: |
    cd go-micropdf
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

### 3. Cross-Platform Verification

Ensure the Go bindings work correctly with the Rust FFI:

```bash
# Clean build and test
./docker/build-test.sh --no-cache
```

## What Gets Tested

### Unit Tests (Mock) - CGO_ENABLED=0

```bash
go test -tags=mock -v ./...
```

- Tests the pure Go mock implementation
- Verifies API correctness
- No Rust library required
- Fast execution (~5-10 seconds)
- Tests all modules in isolation

### Unit Tests (CGO) - CGO_ENABLED=1

```bash
go test -v -short ./...
```

- Tests with actual Rust FFI
- Verifies CGO integration
- Tests real PDF operations
- Requires libmicropdf.a
- Execution time: ~10-20 seconds

### Integration Tests - CGO_ENABLED=1

```bash
go test -v -tags=integration ./test/integration/...
```

- End-to-end PDF processing workflows
- Real document operations:
  - Opening and reading PDFs
  - Rendering pages to images
  - Text extraction and search
  - Metadata handling
  - Security/permissions
- Performance verification
- Memory management testing
- Execution time: ~15-30 seconds

**Integration Test Suites:**
- `document_integration_test.go` - Document lifecycle, metadata, security
- `rendering_integration_test.go` - Page rendering at various scales/formats
- `text_integration_test.go` - Text extraction and search operations

### Example Builds

```bash
# Mock example
go build -tags=mock -o example-mock ./example

# CGO example
go build -o example-cgo ./example
```

- Verifies example compiles correctly
- Tests both mock and CGO modes

## Container Structure

### Stage 1: Rust Builder

```dockerfile
FROM rust:1.87-bookworm
# Builds libmicropdf.a from micropdf-rs/
```

### Stage 2: Go Testing

```dockerfile
FROM golang:1.23-bookworm
# Copies Rust library
# Runs Go tests
```

## Manual Docker Usage

### Build the Image

```bash
cd /path/to/micropdf  # Project root
docker build -f go-micropdf/docker/Dockerfile.test -t micropdf-go-test:latest .
```

### Run Tests

```bash
docker run --rm micropdf-go-test:latest
```

### Interactive Shell

```bash
docker run -it --rm micropdf-go-test:latest /bin/bash
```

Inside the container:

```bash
# Run specific tests
go test -v ./buffer_test.go ./buffer.go

# Run with verbose output
go test -v -run TestBuffer ./...

# Build example
go build ./example

# Run example
./example -h
```

## Development Workflow

### Test Local Changes

Mount your local directory for rapid iteration:

```bash
docker run -it --rm \
  -v "$(pwd):/workspace/go-micropdf" \
  micropdf-go-test:latest \
  /bin/bash

# Inside container:
# Run all unit tests
go test -v ./...

# Run specific package
go test -v ./document_test.go ./document.go

# Run integration tests
go test -v -tags=integration ./test/integration/...

# Run specific integration test
go test -v -tags=integration -run TestPageRendering ./test/integration/
```

### Debug Build Issues

```bash
# Start shell
./docker/build-test.sh --shell

# Check library exists
ls -lh /usr/local/lib/libmicropdf.a

# Check headers
ls -R /usr/local/include/

# Verify Go can find library
go env CGO_LDFLAGS

# Run tests manually
CGO_ENABLED=1 go test -v ./...
```

## Troubleshooting

### Build Fails

**Issue**: Docker build fails with "no such file"

**Solution**: Ensure you're running from the project root:

```bash
cd /path/to/micropdf  # Project root, not go-micropdf/
./go-micropdf/docker/build-test.sh
```

### CGO Tests Fail

**Issue**: CGO tests fail with "library not found"

**Solution**: Verify the Rust library was built correctly:

```bash
./docker/build-test.sh --shell
# Inside container:
ls -lh /usr/local/lib/libmicropdf.a
file /usr/local/lib/libmicropdf.a
```

### Slow Build

**Issue**: Docker build takes too long

**Solution**: Use cache and parallel builds:

```bash
# Use cache (default)
./docker/build-test.sh

# Force rebuild
./docker/build-test.sh --no-cache
```

## Environment Variables

Inside the container:

| Variable | Value | Purpose |
|----------|-------|---------|
| `CGO_ENABLED` | `1` | Enable CGO by default |
| `GOFLAGS` | `-v` | Verbose Go output |
| `LD_LIBRARY_PATH` | `/usr/local/lib` | Library search path |

## Advanced Usage

### Run Specific Test Types

```bash
# Unit tests only
./docker/build-test.sh --unit

# Integration tests only
./docker/build-test.sh --integration

# All tests (default)
./docker/build-test.sh
```

### Custom Test Commands

```bash
# Run specific unit test
docker run --rm micropdf-go-test:latest \
  sh -c "go test -run TestBuffer ./..."

# Run specific integration test
docker run --rm micropdf-go-test:latest \
  sh -c "go test -tags=integration -run TestPageRendering ./test/integration/..."

# Run with verbose output
docker run --rm micropdf-go-test:latest \
  sh -c "go test -v -tags=integration ./test/integration/..."
```

### Benchmark Tests

```bash
docker run --rm micropdf-go-test:latest \
  sh -c "go test -bench=. ./..."
```

### Coverage Report

```bash
docker run --rm micropdf-go-test:latest \
  sh -c "go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out"
```

### Multi-Architecture Build

```bash
# AMD64 (default)
docker build --platform linux/amd64 \
  -f go-micropdf/docker/Dockerfile.test \
  -t micropdf-go-test:amd64 .

# ARM64
docker build --platform linux/arm64 \
  -f go-micropdf/docker/Dockerfile.test \
  -t micropdf-go-test:arm64 .
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Test Go Bindings

on: [push, pull_request]

jobs:
  test-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and test
        run: |
          cd go-micropdf
          ./docker/build-test.sh
```

### GitLab CI

```yaml
test-go-bindings:
  image: docker:latest
  services:
    - docker:dind
  script:
    - cd go-micropdf
    - ./docker/build-test.sh
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Test Go Bindings') {
            steps {
                sh 'cd go-micropdf && ./docker/build-test.sh'
            }
        }
    }
}
```

## Performance

Typical build times (on modern hardware):

- **Rust library build**: ~2-5 minutes
- **Go mock tests**: ~5-10 seconds
- **Go CGO tests**: ~10-20 seconds
- **Total**: ~3-6 minutes

Subsequent builds with cache: ~30 seconds

## Related Documentation

- [Main README](../README.md) - Go bindings documentation
- [Building Guide](../../micropdf-rs/BUILDING.md) - Rust library build instructions
- [Examples](../example/) - Usage examples

## License

Same as the main project: Dual-licensed under Apache 2.0 and MIT.

