# Geometry Corpus

Seed inputs for the geometry operations fuzzer.

## Adding Seeds

Add binary data representing floating-point values:

```bash
# Generate random floats
python3 -c "import struct, random; print(''.join(struct.pack('f', random.uniform(-1e6, 1e6)) for _ in range(16)), end='')" > seed.bin
cp seed.bin fuzz/corpus/geometry/
```

Good seeds include:

- Extreme values (0, Infinity, NaN)
- Edge cases (very small, very large)
- Special combinations (identity matrices, empty rects)
