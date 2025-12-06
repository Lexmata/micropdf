// Example 2: Text Extraction
//
// This example demonstrates how to:
//   - Extract text from all pages
//   - Search for specific text
//   - Save extracted text to file

//go:build example

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	nanopdf "github.com/lexmata/nanopdf/go-nanopdf"
)

func main() {
	ctx := nanopdf.NewContext()
	if ctx == nil {
		log.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := filepath.Join("..", "..", "test-pdfs", "simple", "multi-page.pdf")
	doc, err := nanopdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		log.Fatalf("Failed to open PDF: %v", err)
	}
	defer doc.Drop()

	fmt.Println("=== Extracting Text from All Pages ===\n")

	pageCount, err := doc.PageCount()
	if err != nil {
		log.Fatal(err)
	}

	var allText string

	for i := int32(0); i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			log.Printf("Error loading page %d: %v", i, err)
			continue
		}

		text, err := page.ExtractText()
		if err != nil {
			log.Printf("Error extracting text from page %d: %v", i, err)
			page.Drop()
			continue
		}

		fmt.Printf("Page %d:\n", i+1)
		fmt.Println("--------------------------------------------------")
		fmt.Println(text)
		fmt.Println()

		allText += fmt.Sprintf("\n=== Page %d ===\n%s\n", i+1, text)

		page.Drop()
	}

	// Save to file
	outputPath := "extracted-text.txt"
	err = os.WriteFile(outputPath, []byte(allText), 0644)
	if err != nil {
		log.Printf("Warning: Could not save to file: %v", err)
	} else {
		fmt.Printf("✅ Saved to: %s\n", outputPath)
	}

	// Search for text
	fmt.Println("\n=== Searching for Text ===\n")

	searchTerm := "Page"
	totalHits := 0

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
			fmt.Printf("Page %d: Found %d occurrence(s)\n", i+1, len(results))

			for idx, rect := range results {
				if idx < 3 { // Show first 3 hits
					fmt.Printf("  Hit %d: [%.1f, %.1f, %.1f, %.1f]\n",
						idx+1, rect.X0, rect.Y0, rect.X1, rect.Y1)
				}
			}
			totalHits += len(results)
		}

		page.Drop()
	}

	fmt.Printf("\nTotal: %d occurrences found\n", totalHits)
	fmt.Println("\n✅ Done!")
}

