// Example 4: Batch Processing
//
// This example demonstrates how to:
//   - Process multiple PDF files
//   - Extract information from a directory of PDFs
//   - Generate reports
//   - Handle errors gracefully

//go:build example

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	micropdf "github.com/lexmata/micropdf/go-micropdf"
)

type PDFInfo struct {
	Filename  string
	Path      string
	Pages     int32
	Title     string
	Author    string
	Width     float32
	Height    float32
	Encrypted bool
	Error     error
}

func processPDFDirectory(ctx *micropdf.Context, directory string) []PDFInfo {
	fmt.Printf("=== Processing PDFs in %s ===\n\n", directory)

	files, err := filepath.Glob(filepath.Join(directory, "*.pdf"))
	if err != nil {
		log.Printf("Error finding PDFs: %v", err)
		return nil
	}

	fmt.Printf("Found %d PDF file(s)\n\n", len(files))

	results := make([]PDFInfo, 0, len(files))

	for _, file := range files {
		info := PDFInfo{
			Filename: filepath.Base(file),
			Path:     file,
		}

		fmt.Printf("Processing: %s\n", info.Filename)

		doc, err := micropdf.OpenDocument(ctx, file)
		if err != nil {
			info.Error = err
			fmt.Printf("  ❌ Error: %v\n", err)
			results = append(results, info)
			continue
		}

		// Get page count
		pageCount, err := doc.PageCount()
		if err != nil {
			info.Error = err
			doc.Drop()
			results = append(results, info)
			continue
		}
		info.Pages = pageCount

		// Get metadata
		info.Title, _ = doc.GetMetadata("Title")
		info.Author, _ = doc.GetMetadata("Author")

		// Check if encrypted
		needsPassword, _ := doc.NeedsPassword()
		info.Encrypted = needsPassword

		// Get first page dimensions
		if pageCount > 0 {
			page, err := doc.LoadPage(0)
			if err == nil {
				bounds := page.Bounds()
				info.Width = bounds.Width()
				info.Height = bounds.Height()
				page.Drop()
			}
		}

		fmt.Printf("  ✅ %d pages, %.0fx%.0f pts",
			info.Pages, info.Width, info.Height)
		if info.Encrypted {
			fmt.Printf(" [ENCRYPTED]")
		}
		fmt.Println()

		doc.Drop()
		results = append(results, info)
	}

	return results
}

func generateReport(results []PDFInfo) string {
	report := "# PDF Processing Report\n\n"

	successCount := 0
	totalPages := int32(0)
	encryptedCount := 0

	for _, r := range results {
		if r.Error == nil {
			successCount++
			totalPages += r.Pages
			if r.Encrypted {
				encryptedCount++
			}
		}
	}

	report += fmt.Sprintf("## Summary\n\n")
	report += fmt.Sprintf("- Total Files: %d\n", len(results))
	report += fmt.Sprintf("- Successful: %d\n", successCount)
	report += fmt.Sprintf("- Errors: %d\n", len(results)-successCount)
	report += fmt.Sprintf("- Total Pages: %d\n", totalPages)
	report += fmt.Sprintf("- Encrypted: %d\n\n", encryptedCount)

	report += "## Files\n\n"
	report += "| Filename | Pages | Size | Title | Author | Encrypted | Status |\n"
	report += "|----------|-------|------|-------|--------|-----------|--------|\n"

	for _, r := range results {
		status := "✅"
		if r.Error != nil {
			status = fmt.Sprintf("❌ %v", r.Error)
		}

		encrypted := "-"
		if r.Encrypted {
			encrypted = "🔒"
		}

		title := r.Title
		if title == "" {
			title = "N/A"
		}

		author := r.Author
		if author == "" {
			author = "N/A"
		}

		report += fmt.Sprintf("| %s | %d | %.0fx%.0f | %s | %s | %s | %s |\n",
			r.Filename, r.Pages, r.Width, r.Height, title, author, encrypted, status)
	}

	return report
}

func searchInMultiplePDFs(ctx *micropdf.Context, directory string, searchTerm string) int {
	fmt.Printf("\n=== Searching for \"%s\" in PDFs ===\n\n", searchTerm)

	files, err := filepath.Glob(filepath.Join(directory, "*.pdf"))
	if err != nil {
		log.Printf("Error finding PDFs: %v", err)
		return 0
	}

	totalHits := 0

	for _, file := range files {
		doc, err := micropdf.OpenDocument(ctx, file)
		if err != nil {
			continue
		}

		pageCount, err := doc.PageCount()
		if err != nil {
			doc.Drop()
			continue
		}

		for i := int32(0); i < pageCount; i++ {
			page, err := doc.LoadPage(i)
			if err != nil {
				continue
			}

			results, err := page.SearchText(searchTerm)
			if err != nil {
				page.Drop()
				continue
			}

			if len(results) > 0 {
				fmt.Printf("Found in: %s (page %d): %d occurrence(s)\n",
					filepath.Base(file), i+1, len(results))
				totalHits += len(results)
			}

			page.Drop()
		}

		doc.Drop()
	}

	if totalHits == 0 {
		fmt.Printf("\n❌ \"%s\" not found in any PDF\n", searchTerm)
	} else {
		fmt.Printf("\n✅ Found \"%s\" %d time(s)\n", searchTerm, totalHits)
	}

	return totalHits
}

func main() {
	ctx := micropdf.NewContext()
	if ctx == nil {
		log.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	testPDFDir := filepath.Join("..", "..", "test-pdfs", "simple")

	// Process all PDFs
	results := processPDFDirectory(ctx, testPDFDir)

	// Generate report
	report := generateReport(results)
	reportPath := "pdf-report.md"
	err := os.WriteFile(reportPath, []byte(report), 0644)
	if err != nil {
		log.Printf("Error saving report: %v", err)
	} else {
		fmt.Printf("\n✅ Report saved to: %s\n", reportPath)
	}

	// Display report
	fmt.Println("\n" + report)

	// Search for text
	searchInMultiplePDFs(ctx, testPDFDir, "Page")

	fmt.Println("\n✅ Done!")
}
