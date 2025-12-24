# PDF Parse Corpus

Seed inputs for the PDF parsing fuzzer.

## Files

- `minimal.pdf` - Minimal valid PDF with one empty page

## Adding Seeds

Add diverse PDF files to help the fuzzer learn PDF structure:

```bash
cp your-test.pdf fuzz/corpus/pdf_parse/
```

Good seeds include:
- PDFs with different versions (1.0-1.7, 2.0)
- PDFs with various features (images, fonts, forms, annotations)
- Edge cases (empty, malformed, encrypted)
- Real-world documents

