// Example 1: Basic PDF Reading
//
// This example demonstrates how to:
//   - Open a PDF document
//   - Read basic properties
//   - Access metadata
//   - Load and inspect pages

//go:build example

package main

import (
	"fmt"
	"log"
	"path/filepath"

	micropdf "github.com/lexmata/micropdf/go-micropdf"
)

func main() {
	// Create context (required for all PDF operations)
	ctx := micropdf.NewContext()
	if ctx == nil {
		log.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	// Open a PDF document
	pdfPath := filepath.Join("..", "..", "test-pdfs", "simple", "hello-world.pdf")
	doc, err := micropdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		log.Fatalf("Failed to open PDF: %v", err)
	}
	defer doc.Drop()

	fmt.Println("=== Basic PDF Information ===")
	fmt.Printf("File: %s\n", pdfPath)

	// Get page count
	pageCount, err := doc.PageCount()
	if err != nil {
		log.Fatalf("Failed to get page count: %v", err)
	}
	fmt.Printf("Pages: %d\n", pageCount)

	// Check if password is needed
	needsPassword, err := doc.NeedsPassword()
	if err != nil {
		log.Printf("Warning: Could not check password status: %v", err)
	} else {
		fmt.Printf("Needs Password: %v\n", needsPassword)
	}

	// Read metadata
	fmt.Println("\n=== Metadata ===")
	metadataKeys := []string{"Title", "Author", "Subject", "Keywords", "Creator", "Producer"}
	for _, key := range metadataKeys {
		value, err := doc.GetMetadata(key)
		if err == nil && value != "" {
			fmt.Printf("%s: %s\n", key, value)
		}
	}

	// Load and inspect the first page
	fmt.Println("\n=== First Page ===")
	page, err := doc.LoadPage(0)
	if err != nil {
		log.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	pageNum := page.PageNumber()
	fmt.Printf("Page Number: %d\n", pageNum)

	bounds := page.Bounds()
	fmt.Printf("Bounds: [%.2f, %.2f, %.2f, %.2f]\n",
		bounds.X0, bounds.Y0, bounds.X1, bounds.Y1)
	fmt.Printf("Width: %.2f points\n", bounds.Width())
	fmt.Printf("Height: %.2f points\n", bounds.Height())

	// Convert points to inches (72 points = 1 inch)
	widthInches := bounds.Width() / 72
	heightInches := bounds.Height() / 72
	fmt.Printf("Size: %.2f\" × %.2f\"\n", widthInches, heightInches)

	fmt.Println("\n✅ Done!")
}
