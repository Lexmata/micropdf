//go:build go1.18
// +build go1.18

package nanopdf

import (
	"testing"
)

// FuzzDocumentOpen tests document opening with random data
func FuzzDocumentOpen(f *testing.F) {
	// Add seed corpus from test PDFs
	seeds := [][]byte{
		[]byte("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<</Root 1 0 R>>"),
		[]byte("%PDF-1.0"),
		[]byte("not a pdf"),
		{},
	}

	for _, seed := range seeds {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) == 0 {
			return
		}

		// Try to open document (should not crash)
		ctx := NewContext()
		if ctx == nil {
			return
		}
		defer ctx.Drop()

		doc, err := OpenDocumentFromBytes(ctx, data, "")
		if err != nil {
			return // Error is expected for invalid data
		}
		defer doc.Drop()

		// If document opened, try basic operations
		_, _ = doc.PageCount()
		_, _ = doc.NeedsPassword()

		// Try to load first page
		page, err := doc.LoadPage(0)
		if err != nil {
			return
		}
		defer page.Drop()

		// Get page bounds
		_ = page.Bounds()
	})
}

// FuzzBuffer tests buffer operations with random data
func FuzzBuffer(f *testing.F) {
	seeds := [][]byte{
		[]byte("Hello, World!"),
		[]byte(""),
		make([]byte, 1024),
		[]byte("\x00\x01\x02\x03"),
	}

	for _, seed := range seeds {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, data []byte) {
		// Test buffer creation and operations
		buf := NewBuffer(len(data))
		if buf == nil {
			return
		}
		defer buf.Free()

		// Append data in chunks
		chunkSize := 256
		for i := 0; i < len(data); i += chunkSize {
			end := i + chunkSize
			if end > len(data) {
				end = len(data)
			}
			chunk := data[i:end]
			_ = buf.Append(chunk)
		}

		// Get data back
		_ = buf.Bytes()
		_ = buf.Len()

		// Clear and append again
		buf.Clear()
		_ = buf.Append(data)
	})
}

// FuzzPageText tests text extraction with random PDFs
func FuzzPageText(f *testing.F) {
	// Add seed: minimal valid PDF with text
	seed := []byte(`%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT
/F1 12 Tf
100 700 Td
(Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
0000000157 00000 n
trailer<</Root 1 0 R/Size 5>>
startxref
250
%%EOF`)

	f.Add(seed)
	f.Add([]byte("%PDF-1.4"))
	f.Add([]byte(""))

	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) == 0 {
			return
		}

		ctx := NewContext()
		if ctx == nil {
			return
		}
		defer ctx.Drop()

		doc, err := OpenDocumentFromBytes(ctx, data, "")
		if err != nil {
			return
		}
		defer doc.Drop()

		page, err := doc.LoadPage(0)
		if err != nil {
			return
		}
		defer page.Drop()

		// Try text extraction (should not crash)
		_, _ = page.ExtractText()

		// Try text search
		_, _ = page.SearchText("test")
	})
}

// FuzzMetadata tests metadata extraction with random PDFs
func FuzzMetadata(f *testing.F) {
	seed := []byte(`%PDF-1.4
1 0 obj<</Type/Catalog/Metadata 2 0 R>>endobj
2 0 obj<</Type/Metadata/Subtype/XML/Length 100>>stream
<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/'>
</x:xmpmeta>
<?xpacket end='w'?>
endstream
endobj
xref
0 3
0000000000 65535 f
0000000009 00000 n
0000000061 00000 n
trailer<</Root 1 0 R/Size 3>>
startxref
230
%%EOF`)

	f.Add(seed)
	f.Add([]byte("%PDF-1.4\ntrailer<</Info<</Title(Test)>>>>"))

	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) == 0 {
			return
		}

		ctx := NewContext()
		if ctx == nil {
			return
		}
		defer ctx.Drop()

		doc, err := OpenDocumentFromBytes(ctx, data, "")
		if err != nil {
			return
		}
		defer doc.Drop()

		// Try metadata operations (should not crash)
		_, _ = doc.GetMetadata("Title")
		_, _ = doc.GetMetadata("Author")
		_, _ = doc.GetMetadata("Subject")
		_, _ = doc.GetMetadata("Creator")
	})
}

// FuzzGeometry tests geometry operations with random values
func FuzzGeometry(f *testing.F) {
	f.Add(float32(0.0), float32(0.0), float32(100.0), float32(100.0))
	f.Add(float32(-100.0), float32(-100.0), float32(100.0), float32(100.0))
	f.Add(float32(1.0), float32(1.0), float32(1.0), float32(1.0))

	f.Fuzz(func(t *testing.T, x0, y0, x1, y1 float32) {
		// Test Rect operations
		r := Rect{X0: x0, Y0: y0, X1: x1, Y1: y1}

		_ = r.IsEmpty()
		_ = r.IsInfinite()
		_ = r.Width()
		_ = r.Height()

		// Test with another rect
		r2 := Rect{X0: 0, Y0: 0, X1: 50, Y1: 50}
		_ = r.Union(r2)
		_ = r.Intersect(r2)

		// Test Point operations
		p := Point{X: x0, Y: y0}
		_ = r.Contains(p)
		_ = r.ContainsXY(p.X, p.Y)

		// Test Matrix operations
		m := MatrixIdentity()
		m = m.Concat(MatrixTranslate(x0, y0))
		m = m.Concat(MatrixScale(x1, y1))
		m = m.Concat(MatrixRotate(45.0))

		_ = m.TransformPoint(p)
		_ = m.TransformRect(r)
	})
}
