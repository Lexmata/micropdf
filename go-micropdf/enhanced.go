// Package micropdf - Enhanced PDF operations
package micropdf

// MergePDFs merges multiple PDF files into a single output PDF.
//
// This function takes a list of input PDF file paths and merges them into a new PDF
// at the specified output path. It is designed to handle large and potentially
// corrupted PDFs by attempting to recover and process pages robustly.
//
// Parameters:
//   - ctx: The context for the operation
//   - inputPaths: A slice of strings, where each string is a path to an input PDF file
//   - outputPath: The path where the merged PDF will be saved
//
// Returns:
//   - The total number of pages in the merged document
//   - An error if the operation fails
//
// Example:
//
//	ctx := micropdf.NewContext()
//	defer ctx.Drop()
//
//	pageCount, err := micropdf.MergePDFs(ctx, []string{
//	    "document1.pdf",
//	    "document2.pdf",
//	    "document3.pdf",
//	}, "merged.pdf")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Printf("Merged %d pages into merged.pdf\n", pageCount)
func MergePDFs(ctx *Context, inputPaths []string, outputPath string) (int, error) {
	if ctx == nil || !ctx.IsValid() {
		return -1, ErrInvalidContext
	}

	if len(inputPaths) == 0 {
		return -1, ErrInvalidArgument
	}

	if outputPath == "" {
		return -1, ErrInvalidArgument
	}

	result := mergePDFsNative(ctx.Handle(), inputPaths, outputPath)
	if result < 0 {
		return -1, ErrFailedToOpen
	}

	return result, nil
}
