// Example 3: Page Rendering
//
// This example demonstrates how to:
//   - Render pages to images
//   - Control resolution and quality
//   - Save as PNG
//   - Create thumbnails
//   - Use custom transformations

//go:build example

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	micropdf "github.com/lexmata/micropdf/go-micropdf"
)

func main() {
	ctx := micropdf.NewContext()
	if ctx == nil {
		log.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	pdfPath := filepath.Join("..", "..", "test-pdfs", "simple", "hello-world.pdf")
	doc, err := micropdf.OpenDocument(ctx, pdfPath)
	if err != nil {
		log.Fatalf("Failed to open PDF: %v", err)
	}
	defer doc.Drop()

	page, err := doc.LoadPage(0)
	if err != nil {
		log.Fatalf("Failed to load page: %v", err)
	}
	defer page.Drop()

	// Render at different resolutions
	fmt.Println("=== Rendering at Different Resolutions ===\n")

	type Resolution struct {
		Name string
		DPI  int32
	}

	resolutions := []Resolution{
		{"Thumbnail", 72},
		{"Screen", 150},
		{"Print", 300},
	}

	for _, res := range resolutions {
		fmt.Printf("Rendering at %s quality (%d DPI)...\n", res.Name, res.DPI)

		pngData, err := page.RenderToPNG(res.DPI)
		if err != nil {
			log.Printf("Error rendering: %v", err)
			continue
		}

		outputFile := fmt.Sprintf("output-%s.png", res.Name)
		err = os.WriteFile(outputFile, pngData, 0644)
		if err != nil {
			log.Printf("Error saving: %v", err)
			continue
		}

		fmt.Printf("  ✅ Saved to: %s (%.2f KB)\n\n",
			outputFile, float64(len(pngData))/1024)
	}

	// Custom rendering with pixmap
	fmt.Println("=== Custom Rendering with Transform ===\n")

	// Create 2x scale transform
	scale := micropdf.MatrixScale(2.0, 2.0)

	pix, err := page.RenderToPixmap(scale, false)
	if err != nil {
		log.Fatalf("Failed to render to pixmap: %v", err)
	}
	defer pix.Drop()

	width, _ := pix.Width()
	height, _ := pix.Height()
	n, _ := pix.N()

	fmt.Printf("Rendered pixmap: %dx%d pixels\n", width, height)
	fmt.Printf("Components per pixel: %d\n", n)

	samples, err := pix.Samples()
	if err != nil {
		log.Printf("Error getting samples: %v", err)
	} else {
		fmt.Printf("Pixel data: %d bytes (%.2f MB)\n",
			len(samples), float64(len(samples))/1024/1024)
	}

	// Save pixmap as PNG
	pngData, err := pix.WritePNG()
	if err != nil {
		log.Printf("Error converting to PNG: %v", err)
	} else {
		outputFile := "output-2x.png"
		err = os.WriteFile(outputFile, pngData, 0644)
		if err != nil {
			log.Printf("Error saving: %v", err)
		} else {
			fmt.Printf("✅ Saved to: %s\n", outputFile)
		}
	}

	fmt.Println("\n✅ Done!")
}
