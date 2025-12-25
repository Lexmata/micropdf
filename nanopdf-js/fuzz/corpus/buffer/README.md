# Buffer Corpus

Seed inputs for the buffer operations fuzzer.

## Files

- `hello.txt` - Simple text data

## Adding Seeds

Add diverse binary data to test buffer operations:

```bash
cp your-data.bin fuzz/corpus/buffer/
```

Good seeds include:

- Various data sizes (empty, small, large)
- Different data types (text, binary, compressed)
- Edge cases (null bytes, control characters)
