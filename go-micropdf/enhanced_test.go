package micropdf

import (
	"testing"
)

func TestMergePDFs(t *testing.T) {
	ctx := NewContext()
	defer ctx.Drop()

	t.Run("EmptyInputPaths", func(t *testing.T) {
		_, err := MergePDFs(ctx, []string{}, "output.pdf")
		if err != ErrInvalidArgument {
			t.Errorf("Expected ErrInvalidArgument, got %v", err)
		}
	})

	t.Run("EmptyOutputPath", func(t *testing.T) {
		_, err := MergePDFs(ctx, []string{"doc1.pdf"}, "")
		if err != ErrInvalidArgument {
			t.Errorf("Expected ErrInvalidArgument, got %v", err)
		}
	})

	t.Run("NilContext", func(t *testing.T) {
		_, err := MergePDFs(nil, []string{"doc1.pdf"}, "output.pdf")
		if err != ErrInvalidContext {
			t.Errorf("Expected ErrInvalidContext, got %v", err)
		}
	})

	t.Run("MockImplementation", func(t *testing.T) {
		if !IsMock() {
			t.Skip("Skipping mock test in CGO mode")
		}

		pageCount, err := MergePDFs(ctx, []string{"doc1.pdf", "doc2.pdf"}, "output.pdf")
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		// Mock returns 10 pages per document
		expectedPages := 20
		if pageCount != expectedPages {
			t.Errorf("Expected %d pages, got %d", expectedPages, pageCount)
		}
	})
}
