# Git LFS Setup for GitHub Actions

This document explains how Git LFS is configured for NanoPDF's GitHub Actions workflows.

## Configuration

All GitHub Actions workflows now include `lfs: true` in their checkout steps to automatically download Git LFS files.

### Workflows with LFS Enabled

#### ci.yml
- ✅ `test-rust` - All Rust test jobs
- ✅ `lint-rust` - Rust linting
- ✅ `docs-rust` - Rust documentation
- ✅ `coverage-rust` - Rust coverage
- ✅ `test-nodejs` - Node.js tests
- ✅ `lint-nodejs` - Node.js linting
- ✅ `test-go` - Go tests
- ✅ `lint-go` - Go linting
- ✅ `docker-build` - Docker builds

#### test-go-bindings.yml
- ✅ `test-go-docker` - Docker-based Go tests
- ✅ `test-go-native` - Native Go tests
- ✅ `test-go-coverage` - Go coverage
- ✅ `lint-go` - Go linting

#### test-nodejs-bindings.yml
- ✅ `test-nodejs-docker` - Docker-based Node.js tests
- ✅ `test-nodejs-native` - Native Node.js tests (all versions)
- ✅ `test-nodejs-coverage` - Node.js coverage
- ✅ `lint-nodejs` - Node.js linting
- ✅ `test-prebuilds` - Prebuild testing

#### bench.yml
- ✅ `benchmark` - Benchmark execution
- ✅ `benchmark-compare` - Benchmark comparison

## LFS Tracked Files

### Test PDFs

```
test-pdfs/
├── minimal/empty.pdf           (~350 bytes)
├── simple/hello-world.pdf      (~590 bytes)
├── simple/multi-page.pdf       (~1.1 KB)
├── medium/with-metadata.pdf    (~1.3 KB)
├── medium/with-links.pdf       (~1.2 KB)
└── complex/with-forms.pdf      (~1.4 KB)
```

### Other LFS Files

- `*.pdf` - All PDF files
- `*.png`, `*.jpg`, `*.jpeg` - Images
- `*.a`, `*.so`, `*.dylib`, `*.dll` - Binary libraries
- See `.gitattributes` for complete list

## Checkout Step Format

All workflows use this pattern:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      lfs: true  # Automatically download LFS files
```

For workflows that need git history:

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0  # Full history
      lfs: true       # Download LFS files
```

## Verification

### In CI

To verify LFS files are downloaded in CI:

```yaml
- name: Verify LFS files
  run: |
    # Check if LFS files exist and have content
    if [ ! -s "test-pdfs/simple/hello-world.pdf" ]; then
      echo "ERROR: LFS files not downloaded!"
      exit 1
    fi

    # Show file size (should be actual size, not pointer size)
    ls -lh test-pdfs/simple/hello-world.pdf
```

### Locally

```bash
# Check LFS status
git lfs status

# List LFS tracked files
git lfs ls-files

# Verify specific file is tracked
git lfs ls-files | grep test-pdfs

# Pull LFS files
git lfs pull
```

## Usage in Tests

Test code can access LFS files transparently:

### Rust

```rust
#[test]
fn test_with_pdf() {
    let bytes = std::fs::read("../test-pdfs/simple/hello-world.pdf").unwrap();
    // Use bytes...
}
```

### Node.js

```javascript
import { readFileSync } from 'fs';

it('should work with PDFs', () => {
  const buffer = readFileSync('../test-pdfs/simple/hello-world.pdf');
  // Use buffer...
});
```

### Go

```go
func TestWithPDF(t *testing.T) {
    data, err := os.ReadFile("../test-pdfs/simple/hello-world.pdf")
    // Use data...
}
```

## Troubleshooting

### LFS Files Not Downloaded in CI

**Symptom**: Test files are small (~130 bytes) or contain text pointers

**Solution**: Ensure `lfs: true` is in the checkout step:

```yaml
- uses: actions/checkout@v4
  with:
    lfs: true  # MUST be present
```

### LFS Files Too Large

**Symptom**: Workflow takes too long to download files

**Solution**: LFS files are cached by GitHub. First run may be slow, subsequent runs are fast.

### File Size Mismatch

**Symptom**: File shows as ~130 bytes instead of actual size

**Cause**: LFS pointer file instead of actual content

**Solution**:
1. Verify `.gitattributes` includes the file pattern
2. Run `git lfs track "*.pdf"` to re-track
3. Add and commit the file again
4. Ensure `lfs: true` in workflow

### Quota Issues

**Symptom**: "Git LFS bandwidth or storage quota exceeded"

**Solution**:
- GitHub provides 1GB storage + 1GB bandwidth per month (free)
- Paid plans have higher limits
- Monitor usage: https://github.com/settings/billing

## Storage Limits

### GitHub Free Tier
- **Storage**: 1 GB
- **Bandwidth**: 1 GB/month
- Per-file limit: 2 GB

### Current Usage
- Test PDFs: ~6 KB
- Other LFS files: ~500 KB (icons, fixtures)
- **Total**: < 1 MB (well within limits)

### Bandwidth
- CI pulls LFS files on each workflow run
- GitHub caches LFS files to reduce bandwidth
- Typical workflow: ~1 MB download (all LFS files)
- Estimated monthly usage: ~10-50 MB (depends on workflow frequency)

## Best Practices

1. ✅ **Always enable LFS in checkout** - Add `lfs: true` to all workflows
2. ✅ **Track binary files** - PDFs, images, binaries should use LFS
3. ✅ **Keep test files small** - Use minimal test cases (< 10 MB)
4. ✅ **Verify locally first** - Test LFS files work before pushing
5. ✅ **Monitor quota** - Check storage/bandwidth usage periodically
6. ❌ **Don't track generated files** - Build artifacts shouldn't use LFS
7. ❌ **Don't track frequently changing files** - Each version uses storage

## References

- [Git LFS Documentation](https://git-lfs.github.com/)
- [GitHub LFS Guide](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
- [Actions Checkout LFS](https://github.com/actions/checkout#usage)
- [NanoPDF Test PDFs](../test-pdfs/README.md)

---

**Last Updated**: 2025-01-05
**Configuration Version**: 1.0
**Workflows Updated**: 4 (ci, test-go-bindings, test-nodejs-bindings, bench)

