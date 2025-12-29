// Package easy provides a simplified, ergonomic API for common PDF tasks.
//
// This package offers a high-level interface with automatic resource management
// and intuitive method chaining, making PDF operations simple and safe.
//
// Example usage:
//
//	import "github.com/lexmata/micropdf/go-micropdf/easy"
//
//	// Extract text
//	text, err := easy.ExtractText("document.pdf")
//
//	// Render to PNG
//	err := easy.RenderToPNG("document.pdf", "output.png", 0, 300)
//
//	// Fluent API
//	pdf, _ := easy.Open("document.pdf")
//	defer pdf.Close()
//	info := pdf.GetInfo()
//	text := pdf.ExtractAllText()
package easy

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/lexmata/micropdf/go-micropdf"
)

// RenderOptions specifies options for rendering pages
type RenderOptions struct {
	// DPI for rendering (default: 72)
	DPI float32
	// Width in pixels (alternative to DPI)
	Width int
	// Height in pixels (alternative to DPI)
	Height int
	// Colorspace (default: "rgb")
	Colorspace string // "gray", "rgb", "cmyk"
	// Include alpha channel (default: false)
	Alpha bool
	// Image format for output (default: "png")
	Format string // "png", "pnm", "pam", "pbm"
}

// Metadata represents PDF metadata
type Metadata struct {
	Title        string
	Author       string
	Subject      string
	Keywords     string
	Creator      string
	Producer     string
	CreationDate *time.Time
	ModDate      *time.Time
}

// PageInfo represents information about a page
type PageInfo struct {
	PageNumber int
	Width      float32
	Height     float32
	Rotation   int
}

// DocumentInfo represents complete document information
type DocumentInfo struct {
	PageCount   int
	Metadata    Metadata
	IsEncrypted bool
	Pages       []PageInfo
}

// SearchResult represents a text search result
type SearchResult struct {
	Text       string
	PageNumber int
	BBox       micropdf.Rect
}

// PDF is a fluent builder for PDF operations
type PDF struct {
	ctx       *micropdf.Context
	doc       *micropdf.Document
	autoClose bool
}

// Open opens a PDF document
//
//	pdf, err := easy.Open("document.pdf")
//	if err != nil {
//	    return err
//	}
//	defer pdf.Close()
func Open(path string) (*PDF, error) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		return nil, micropdf.NewError(micropdf.ErrCodeGeneric, "failed to create context")
	}

	doc, err := micropdf.OpenDocument(ctx, path)
	if err != nil {
		ctx.Drop()
		return nil, err
	}

	return &PDF{
		ctx:       ctx,
		doc:       doc,
		autoClose: true,
	}, nil
}

// OpenWithPassword opens a password-protected PDF document
func OpenWithPassword(path, password string) (*PDF, error) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		return nil, micropdf.NewError(micropdf.ErrCodeGeneric, "failed to create context")
	}

	doc, err := micropdf.OpenDocument(ctx, path)
	if err != nil {
		ctx.Drop()
		return nil, err
	}

	// Authenticate if needed
	if needs, _ := doc.NeedsPassword(); needs {
		if ok, _ := doc.Authenticate(password); !ok {
			doc.Drop()
			ctx.Drop()
			return nil, micropdf.NewError(micropdf.ErrCodeArgument, "invalid password")
		}
	}

	return &PDF{
		ctx:       ctx,
		doc:       doc,
		autoClose: true,
	}, nil
}

// FromBytes opens a PDF from byte data
func FromBytes(data []byte) (*PDF, error) {
	ctx := micropdf.NewContext()
	if ctx == nil {
		return nil, micropdf.NewError(micropdf.ErrCodeGeneric, "failed to create context")
	}

	doc, err := micropdf.OpenDocumentFromBytes(ctx, data, ".pdf")
	if err != nil {
		ctx.Drop()
		return nil, err
	}

	return &PDF{
		ctx:       ctx,
		doc:       doc,
		autoClose: true,
	}, nil
}

// ============================================================================
// Static Helper Functions (convenience methods)
// ============================================================================

// ExtractText extracts all text from a PDF file
//
//	text, err := easy.ExtractText("document.pdf")
//	if err != nil {
//	    return err
//	}
//	fmt.Println(text)
func ExtractText(path string) (string, error) {
	pdf, err := Open(path)
	if err != nil {
		return "", err
	}
	defer pdf.Close()

	return pdf.ExtractAllText()
}

// ExtractPageText extracts text from a specific page
//
//	text, err := easy.ExtractPageText("document.pdf", 0)
func ExtractPageText(path string, pageNumber int) (string, error) {
	pdf, err := Open(path)
	if err != nil {
		return "", err
	}
	defer pdf.Close()

	return pdf.ExtractPageText(pageNumber)
}

// GetPageCount returns the number of pages in a PDF
//
//	count, err := easy.GetPageCount("document.pdf")
func GetPageCount(path string) (int, error) {
	pdf, err := Open(path)
	if err != nil {
		return 0, err
	}
	defer pdf.Close()

	return pdf.PageCount(), nil
}

// GetMetadata returns PDF metadata
//
//	meta, err := easy.GetMetadata("document.pdf")
//	fmt.Println(meta.Title)
func GetMetadata(path string) (*Metadata, error) {
	pdf, err := Open(path)
	if err != nil {
		return nil, err
	}
	defer pdf.Close()

	return pdf.GetMetadata(), nil
}

// GetInfo returns complete document information
//
//	info, err := easy.GetInfo("document.pdf")
//	fmt.Printf("Document has %d pages\n", info.PageCount)
func GetInfo(path string) (*DocumentInfo, error) {
	pdf, err := Open(path)
	if err != nil {
		return nil, err
	}
	defer pdf.Close()

	return pdf.GetInfo(), nil
}

// RenderToPNG renders a page to PNG
//
//	err := easy.RenderToPNG("document.pdf", "output.png", 0, 300)
func RenderToPNG(pdfPath, outputPath string, pageNumber int, dpi float32) error {
	pdf, err := Open(pdfPath)
	if err != nil {
		return err
	}
	defer pdf.Close()

	return pdf.RenderToFile(pageNumber, outputPath, RenderOptions{DPI: dpi, Format: "png"})
}

// RenderAllToPNG renders all pages to PNG files
//
//	err := easy.RenderAllToPNG("document.pdf", "output/page-{page}.png", 150)
func RenderAllToPNG(pdfPath, outputPattern string, dpi float32) error {
	pdf, err := Open(pdfPath)
	if err != nil {
		return err
	}
	defer pdf.Close()

	return pdf.RenderAllToFiles(outputPattern, RenderOptions{DPI: dpi, Format: "png"})
}

// Search searches for text in a PDF
//
//	results, err := easy.Search("document.pdf", "important")
//	fmt.Printf("Found %d occurrences\n", len(results))
func Search(pdfPath, query string) ([]int, error) {
	pdf, err := Open(pdfPath)
	if err != nil {
		return nil, err
	}
	defer pdf.Close()

	results, err := pdf.Search(query, -1)
	if err != nil {
		return nil, err
	}

	// Extract unique page numbers
	pageSet := make(map[int]bool)
	for _, result := range results {
		pageSet[result.PageNumber] = true
	}

	pages := make([]int, 0, len(pageSet))
	for page := range pageSet {
		pages = append(pages, page)
	}

	return pages, nil
}

// IsEncrypted checks if a PDF is encrypted
//
//	if encrypted, _ := easy.IsEncrypted("document.pdf"); encrypted {
//	    fmt.Println("PDF is password protected")
//	}
func IsEncrypted(path string) (bool, error) {
	pdf, err := Open(path)
	if err != nil {
		// If error mentions password, it's encrypted
		if strings.Contains(err.Error(), "password") {
			return true, nil
		}
		return false, err
	}
	defer pdf.Close()

	return pdf.IsEncrypted(), nil
}

// SaveTextToFile extracts text and saves to a file
//
//	err := easy.SaveTextToFile("document.pdf", "output.txt")
func SaveTextToFile(pdfPath, outputPath string) error {
	text, err := ExtractText(pdfPath)
	if err != nil {
		return err
	}

	return os.WriteFile(outputPath, []byte(text), 0644)
}

// QuickSummary returns a human-readable summary of the PDF
//
//	summary, err := easy.QuickSummary("document.pdf")
//	fmt.Println(summary)
func QuickSummary(path string) (string, error) {
	pdf, err := Open(path)
	if err != nil {
		return "", err
	}
	defer pdf.Close()

	info := pdf.GetInfo()

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("Document: %s\n", filepath.Base(path)))
	builder.WriteString(fmt.Sprintf("Pages: %d\n", info.PageCount))

	if info.Metadata.Title != "" {
		builder.WriteString(fmt.Sprintf("Title: %s\n", info.Metadata.Title))
	}
	if info.Metadata.Author != "" {
		builder.WriteString(fmt.Sprintf("Author: %s\n", info.Metadata.Author))
	}
	if info.Metadata.Subject != "" {
		builder.WriteString(fmt.Sprintf("Subject: %s\n", info.Metadata.Subject))
	}

	builder.WriteString(fmt.Sprintf("Encrypted: %v\n", info.IsEncrypted))

	return builder.String(), nil
}

// ============================================================================
// PDF Methods
// ============================================================================

// PageCount returns the number of pages
func (p *PDF) PageCount() int {
	count, _ := p.doc.PageCount()
	return count
}

// IsEncrypted returns whether the document is encrypted
func (p *PDF) IsEncrypted() bool {
	needs, _ := p.doc.NeedsPassword()
	return needs
}

// GetMetadata returns PDF metadata
func (p *PDF) GetMetadata() *Metadata {
	getMeta := func(key string) string {
		val, _ := p.doc.GetMetadata(key)
		return val
	}

	meta := &Metadata{
		Title:    getMeta("Title"),
		Author:   getMeta("Author"),
		Subject:  getMeta("Subject"),
		Keywords: getMeta("Keywords"),
		Creator:  getMeta("Creator"),
		Producer: getMeta("Producer"),
	}

	// Parse dates if present
	if creationDate := getMeta("CreationDate"); creationDate != "" {
		if t, err := parsePDFDate(creationDate); err == nil {
			meta.CreationDate = &t
		}
	}
	if modDate := getMeta("ModDate"); modDate != "" {
		if t, err := parsePDFDate(modDate); err == nil {
			meta.ModDate = &t
		}
	}

	return meta
}

// GetInfo returns complete document information
func (p *PDF) GetInfo() *DocumentInfo {
	pageCount := p.PageCount()
	pages := make([]PageInfo, pageCount)

	for i := 0; i < pageCount; i++ {
		page, err := p.doc.LoadPage(i)
		if err != nil {
			continue
		}

		bounds := page.Bounds()
		pages[i] = PageInfo{
			PageNumber: i,
			Width:      bounds.Width(),
			Height:     bounds.Height(),
			Rotation:   0, // TODO: Get rotation from page
		}

		page.Drop()
	}

	return &DocumentInfo{
		PageCount:   pageCount,
		Metadata:    *p.GetMetadata(),
		IsEncrypted: p.IsEncrypted(),
		Pages:       pages,
	}
}

// ExtractPageText extracts text from a specific page
func (p *PDF) ExtractPageText(pageNumber int) (string, error) {
	page, err := p.doc.LoadPage(pageNumber)
	if err != nil {
		return "", err
	}
	defer page.Drop()

	text, err := page.ExtractText()
	if err != nil {
		return "", err
	}
	return text, nil
}

// ExtractAllText extracts text from all pages
func (p *PDF) ExtractAllText() (string, error) {
	return p.ExtractAllTextWithSeparator("\n\n---\n\n")
}

// ExtractAllTextWithSeparator extracts text from all pages with a custom separator
func (p *PDF) ExtractAllTextWithSeparator(separator string) (string, error) {
	var builder strings.Builder
	pageCount := p.PageCount()

	for i := 0; i < pageCount; i++ {
		text, err := p.ExtractPageText(i)
		if err != nil {
			return "", err
		}

		builder.WriteString(text)
		if i < pageCount-1 {
			builder.WriteString(separator)
		}
	}

	return builder.String(), nil
}

// Search searches for text in the document
func (p *PDF) Search(query string, pageNumber int) ([]SearchResult, error) {
	var results []SearchResult

	searchPage := func(pNum int) error {
		page, err := p.doc.LoadPage(pNum)
		if err != nil {
			return err
		}
		defer page.Drop()

		hits, err := page.SearchText(query)
		if err != nil {
			return err
		}

		for _, hit := range hits {
			results = append(results, SearchResult{
				Text:       query,
				PageNumber: pNum,
				BBox:       hit,
			})
		}

		return nil
	}

	if pageNumber >= 0 {
		if err := searchPage(pageNumber); err != nil {
			return nil, err
		}
	} else {
		for i := 0; i < p.PageCount(); i++ {
			if err := searchPage(i); err != nil {
				return nil, err
			}
		}
	}

	return results, nil
}

// RenderToBytes renders a page to an image buffer
func (p *PDF) RenderToBytes(pageNumber int, opts RenderOptions) ([]byte, error) {
	page, err := p.doc.LoadPage(pageNumber)
	if err != nil {
		return nil, err
	}
	defer page.Drop()

	// Calculate transform matrix
	matrix := micropdf.MatrixIdentity()

	if opts.DPI > 0 {
		scale := opts.DPI / 72.0
		matrix = micropdf.MatrixScale(scale, scale)
	} else if opts.Width > 0 || opts.Height > 0 {
		bounds := page.Bounds()
		scaleX := float32(1.0)
		scaleY := float32(1.0)

		if opts.Width > 0 {
			scaleX = float32(opts.Width) / bounds.Width()
		}
		if opts.Height > 0 {
			scaleY = float32(opts.Height) / bounds.Height()
		}

		scale := scaleX
		if opts.Height > 0 && scaleY < scaleX {
			scale = scaleY
		}

		matrix = micropdf.MatrixScale(scale, scale)
	}

	// Render to pixmap
	pixmap, err := page.RenderToPixmap(matrix, opts.Alpha)
	if err != nil {
		return nil, err
	}
	defer pixmap.Drop()

	// Convert to format
	format := opts.Format
	if format == "" {
		format = "png"
	}

	return pixmap.ToBytes(format)
}

// RenderToFile renders a page to a file
func (p *PDF) RenderToFile(pageNumber int, outputPath string, opts RenderOptions) error {
	data, err := p.RenderToBytes(pageNumber, opts)
	if err != nil {
		return err
	}

	return os.WriteFile(outputPath, data, 0644)
}

// RenderAll renders all pages
func (p *PDF) RenderAll(opts RenderOptions) ([][]byte, error) {
	results := make([][]byte, p.PageCount())

	for i := 0; i < p.PageCount(); i++ {
		data, err := p.RenderToBytes(i, opts)
		if err != nil {
			return nil, err
		}
		results[i] = data
	}

	return results, nil
}

// RenderAllToFiles renders all pages to files
func (p *PDF) RenderAllToFiles(outputPattern string, opts RenderOptions) error {
	for i := 0; i < p.PageCount(); i++ {
		outputPath := strings.Replace(outputPattern, "{page}", fmt.Sprintf("%d", i), -1)

		// Create directory if needed
		dir := filepath.Dir(outputPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}

		if err := p.RenderToFile(i, outputPath, opts); err != nil {
			return err
		}
	}

	return nil
}

// KeepOpen disables automatic closing
func (p *PDF) KeepOpen() *PDF {
	p.autoClose = false
	return p
}

// Close closes the document and frees resources
func (p *PDF) Close() error {
	if p.doc != nil {
		p.doc.Drop()
		p.doc = nil
	}
	if p.ctx != nil {
		p.ctx.Drop()
		p.ctx = nil
	}
	return nil
}

// Use executes a callback with the PDF, automatically closing it
func (p *PDF) Use(callback func(*PDF) error) error {
	defer func() {
		if p.autoClose {
			p.Close()
		}
	}()

	return callback(p)
}

// ============================================================================
// Helper Functions
// ============================================================================

// parsePDFDate parses a PDF date string
func parsePDFDate(dateStr string) (time.Time, error) {
	// PDF date format: D:YYYYMMDDHHmmSSOHH'mm
	if !strings.HasPrefix(dateStr, "D:") {
		return time.Time{}, errors.New("invalid PDF date format")
	}

	dateStr = strings.TrimPrefix(dateStr, "D:")

	// Parse at least YYYYMMDD
	if len(dateStr) < 8 {
		return time.Time{}, errors.New("date string too short")
	}

	// Extract components
	year := dateStr[0:4]
	month := dateStr[4:6]
	day := dateStr[6:8]

	hour := "00"
	minute := "00"
	second := "00"

	if len(dateStr) >= 10 {
		hour = dateStr[8:10]
	}
	if len(dateStr) >= 12 {
		minute = dateStr[10:12]
	}
	if len(dateStr) >= 14 {
		second = dateStr[12:14]
	}

	dateString := fmt.Sprintf("%s-%s-%sT%s:%s:%sZ", year, month, day, hour, minute, second)
	return time.Parse(time.RFC3339, dateString)
}
