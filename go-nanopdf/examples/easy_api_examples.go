// Package main provides examples of using the NanoPDF Easy API
//
// The Easy API provides a simplified, ergonomic interface for common PDF tasks
// with automatic resource management and intuitive method chaining.
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/lexmata/nanopdf/go-nanopdf"
	"github.com/lexmata/nanopdf/go-nanopdf/easy"
)

// Example1_SimpleTextExtraction demonstrates the simplest way to extract text
func Example1_SimpleTextExtraction() {
	// Extract all text
	text, err := easy.ExtractText("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(text)

	// Extract from specific page
	pageText, err := easy.ExtractPageText("document.pdf", 0)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(pageText)

	// Save text to file
	err = easy.SaveTextToFile("document.pdf", "output.txt")
	if err != nil {
		log.Fatal(err)
	}
}

// Example2_SimpleRendering demonstrates the simplest way to render pages
func Example2_SimpleRendering() {
	// Render first page at 150 DPI
	err := easy.RenderToPNG("document.pdf", "output.png", 0, 150)
	if err != nil {
		log.Fatal(err)
	}

	// Render specific page at high DPI
	err = easy.RenderToPNG("document.pdf", "output.png", 0, 300)
	if err != nil {
		log.Fatal(err)
	}

	// Render all pages
	err = easy.RenderAllToPNG("document.pdf", "output/page-{page}.png", 150)
	if err != nil {
		log.Fatal(err)
	}
}

// Example3_SimpleInfo demonstrates getting PDF information
func Example3_SimpleInfo() {
	// Get page count
	pageCount, err := easy.GetPageCount("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Pages: %d\n", pageCount)

	// Get metadata
	metadata, err := easy.GetMetadata("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Title: %s\n", metadata.Title)
	fmt.Printf("Author: %s\n", metadata.Author)

	// Get complete info
	info, err := easy.GetInfo("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Document has %d pages\n", info.PageCount)

	// Quick summary
	summary, err := easy.QuickSummary("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(summary)
}

// Example4_SimpleSearch demonstrates text searching
func Example4_SimpleSearch() {
	// Find pages containing text
	pages, err := easy.Search("document.pdf", "important")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Found on pages: %v\n", pages)

	// Check if encrypted
	encrypted, err := easy.IsEncrypted("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	if encrypted {
		fmt.Println("PDF is password protected")
	}
}

// Example5_FluentAPI demonstrates the fluent builder API
func Example5_FluentAPI() {
	// Open and use with automatic cleanup
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	pageCount := pdf.PageCount()
	metadata := pdf.GetMetadata()
	text, _ := pdf.ExtractAllText()

	fmt.Printf("Pages: %d\n", pageCount)
	fmt.Printf("Title: %s\n", metadata.Title)
	fmt.Printf("Text length: %d characters\n", len(text))
}

// Example6_ManualResourceManagement demonstrates manual cleanup
func Example6_ManualResourceManagement() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	pdf.KeepOpen()
	defer pdf.Close()

	// Extract text from multiple pages
	for i := 0; i < pdf.PageCount(); i++ {
		text, _ := pdf.ExtractPageText(i)
		fmt.Printf("Page %d: %s...\n", i, text[:min(100, len(text))])
	}

	// Search across document
	results, _ := pdf.Search("important", -1)
	fmt.Printf("Found %d occurrences\n", len(results))
}

// Example7_AdvancedRendering demonstrates advanced rendering options
func Example7_AdvancedRendering() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	// Render at specific DPI
	err = pdf.RenderToFile(0, "high-quality.png", easy.RenderOptions{
		DPI:    300,
		Format: "png",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Render with specific dimensions
	err = pdf.RenderToFile(0, "thumbnail.png", easy.RenderOptions{
		Width:  200,
		Height: 300,
		Format: "png",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Render in grayscale
	err = pdf.RenderToFile(0, "grayscale.png", easy.RenderOptions{
		DPI:        150,
		Colorspace: "gray",
		Format:     "png",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Render with alpha channel
	err = pdf.RenderToFile(0, "with-alpha.png", easy.RenderOptions{
		DPI:    150,
		Alpha:  true,
		Format: "png",
	})
	if err != nil {
		log.Fatal(err)
	}
}

// Example8_DetailedSearch demonstrates search with detailed results
func Example8_DetailedSearch() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	results, err := pdf.Search("important", -1)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found %d occurrences:\n", len(results))
	for i, result := range results {
		fmt.Printf("%d. Page %d:\n", i+1, result.PageNumber)
		fmt.Printf("   Text: \"%s\"\n", result.Text)
		fmt.Printf("   Position: (%.2f, %.2f)\n", result.BBox.X0, result.BBox.Y0)
		fmt.Printf("   Size: %.2fx%.2f\n", result.BBox.Width(), result.BBox.Height())
	}
}

// Example9_CompleteInfo demonstrates getting complete document information
func Example9_CompleteInfo() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	info := pdf.GetInfo()

	fmt.Println("Document Information:")
	fmt.Printf("  Pages: %d\n", info.PageCount)
	fmt.Printf("  Encrypted: %v\n", info.IsEncrypted)

	fmt.Println("\nMetadata:")
	if info.Metadata.Title != "" {
		fmt.Printf("  Title: %s\n", info.Metadata.Title)
	}
	if info.Metadata.Author != "" {
		fmt.Printf("  Author: %s\n", info.Metadata.Author)
	}
	if info.Metadata.Subject != "" {
		fmt.Printf("  Subject: %s\n", info.Metadata.Subject)
	}

	fmt.Println("\nPages:")
	for _, page := range info.Pages {
		fmt.Printf("  Page %d: %.0fx%.0f (rotation: %d°)\n",
			page.PageNumber, page.Width, page.Height, page.Rotation)
	}
}

// Example10_BatchProcessing demonstrates processing multiple PDFs
func Example10_BatchProcessing() {
	files := []string{"doc1.pdf", "doc2.pdf", "doc3.pdf"}

	for _, file := range files {
		fmt.Printf("\nProcessing %s...\n", file)

		// Extract text
		err := easy.SaveTextToFile(file, file+".txt")
		if err != nil {
			log.Printf("Error extracting text: %v", err)
			continue
		}

		// Render first page
		err = easy.RenderToPNG(file, file+".png", 0, 150)
		if err != nil {
			log.Printf("Error rendering: %v", err)
			continue
		}

		// Get info
		pageCount, _ := easy.GetPageCount(file)
		fmt.Printf("  %d pages processed\n", pageCount)
	}
}

// Example11_ErrorHandling demonstrates error handling
func Example11_ErrorHandling() {
	// Try to open encrypted PDF without password
	_, err := easy.ExtractText("encrypted.pdf")
	if err != nil {
		fmt.Printf("Error: %v\n", err)

		// Try again with password
		pdf, err := easy.OpenWithPassword("encrypted.pdf", "password123")
		if err != nil {
			fmt.Printf("Wrong password: %v\n", err)
			return
		}
		defer pdf.Close()

		fmt.Println("Success with password!")
	}
}

// Example12_UseCallback demonstrates the Use callback pattern
func Example12_UseCallback() {
	err := func() error {
		pdf, err := easy.Open("document.pdf")
		if err != nil {
			return err
		}

		return pdf.Use(func(p *easy.PDF) error {
			text, err := p.ExtractAllText()
			if err != nil {
				return err
			}

			fmt.Printf("Extracted %d characters\n", len(text))
			return nil
		})
	}()

	if err != nil {
		log.Fatal(err)
	}
}

// Example13_WorkingWithBytes demonstrates working with byte data
func Example13_WorkingWithBytes() {
	// Read PDF file
	data, err := os.ReadFile("document.pdf")
	if err != nil {
		log.Fatal(err)
	}

	// Open from bytes
	pdf, err := easy.FromBytes(data)
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	text, _ := pdf.ExtractAllText()
	pageCount := pdf.PageCount()

	fmt.Printf("Loaded %d pages from buffer\n", pageCount)
	fmt.Printf("Extracted %d characters\n", len(text))
}

// Example14_RenderToMemory demonstrates rendering to memory
func Example14_RenderToMemory() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	// Render first page to bytes
	imageData, err := pdf.RenderToBytes(0, easy.RenderOptions{
		DPI:    300,
		Format: "png",
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Rendered image: %d bytes\n", len(imageData))

	// Save to file
	err = os.WriteFile("output.png", imageData, 0644)
	if err != nil {
		log.Fatal(err)
	}
}

// Example15_RenderAllPages demonstrates rendering all pages
func Example15_RenderAllPages() {
	pdf, err := easy.Open("document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer pdf.Close()

	// Render all pages to memory
	images, err := pdf.RenderAll(easy.RenderOptions{
		DPI:    150,
		Format: "png",
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Rendered %d pages\n", len(images))

	// Save each image
	for i, imageData := range images {
		filename := fmt.Sprintf("page-%03d.png", i)
		err := os.WriteFile(filename, imageData, 0644)
		if err != nil {
			log.Printf("Error saving page %d: %v", i, err)
		}
	}
}

// Example16_ComparisonWithCoreAPI demonstrates the difference between Easy and Core APIs
func Example16_ComparisonWithCoreAPI() {
	// Easy API - Simple and clean
	text, _ := easy.ExtractText("document.pdf")
	fmt.Println(text)

	// Core API - More verbose but maximum control
	ctx := nanopdf.NewContext()
	if ctx == nil {
		log.Fatal("failed to create context")
	}
	defer ctx.Drop()

	doc, err := nanopdf.OpenDocument(ctx, "document.pdf")
	if err != nil {
		log.Fatal(err)
	}
	defer doc.Drop()

	pageCount, err := doc.PageCount()
	if err != nil {
		log.Fatal(err)
	}
	for i := 0; i < pageCount; i++ {
		page, err := doc.LoadPage(i)
		if err != nil {
			log.Printf("Error loading page %d: %v", i, err)
			continue
		}
		pageText, err := page.ExtractText()
		if err != nil {
			log.Printf("Error extracting text from page %d: %v", i, err)
			page.Drop()
			continue
		}
		fmt.Println(pageText)
		page.Drop()
	}
}

func main() {
	fmt.Println("NanoPDF Easy API Examples")
	fmt.Println("==========================")

	// Note: Most examples are functions that you can call individually
	// Uncomment and modify file paths as needed for your use case

	// Example1_SimpleTextExtraction()
	// Example2_SimpleRendering()
	// Example3_SimpleInfo()
	// Example4_SimpleSearch()
	// Example5_FluentAPI()
	// Example6_ManualResourceManagement()
	// Example7_AdvancedRendering()
	// Example8_DetailedSearch()
	// Example9_CompleteInfo()
	// Example10_BatchProcessing()
	// Example11_ErrorHandling()
	// Example12_UseCallback()
	// Example13_WorkingWithBytes()
	// Example14_RenderToMemory()
	// Example15_RenderAllPages()
	// Example16_ComparisonWithCoreAPI()

	fmt.Println("\nAll examples are defined as functions.")
	fmt.Println("Uncomment the ones you want to run in main().")
}

// Helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
