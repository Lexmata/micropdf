#!/usr/bin/env python3
"""Basic usage examples for NanoPDF Python bindings."""

from nanopdf import EasyPDF, Context, Document, Matrix, Pixmap, Colorspace


def example_easy_api_extract_text():
    """Example 1: Extract text using Easy API (one-liner)."""
    print("=" * 60)
    print("Example 1: Extract Text (Easy API)")
    print("=" * 60)

    # Simple one-liner
    text = EasyPDF.extract_text('sample.pdf')
    print(f"Extracted {len(text)} characters")
    print(text[:200] + "...")
    print()


def example_easy_api_render():
    """Example 2: Render page to PNG using Easy API."""
    print("=" * 60)
    print("Example 2: Render Page (Easy API)")
    print("=" * 60)

    # Render first page at 300 DPI
    EasyPDF.render_to_png('sample.pdf', 'output.png', page=0, dpi=300)
    print("Rendered page 0 to output.png at 300 DPI")
    print()


def example_easy_api_context_manager():
    """Example 3: Using Easy API with context manager."""
    print("=" * 60)
    print("Example 3: Context Manager (Easy API)")
    print("=" * 60)

    with EasyPDF.open('sample.pdf') as pdf:
        # Get document info
        info = pdf.get_info()
        print(f"Title: {info.title}")
        print(f"Author: {info.author}")
        print(f"Pages: {info.page_count}")
        print(f"Encrypted: {info.is_encrypted}")

        # Extract text from specific page
        text = pdf.extract_page_text(0)
        print(f"\nFirst page text ({len(text)} chars):")
        print(text[:200] + "...")

        # Search for text
        results = pdf.search_all('PDF')
        print(f"\nFound 'PDF' {len(results)} times:")
        for i, result in enumerate(results[:5]):
            print(f"  {i+1}. Page {result['page_num']}: {result['bbox']}")

    print()


def example_low_level_api():
    """Example 4: Low-level API for advanced control."""
    print("=" * 60)
    print("Example 4: Low-Level API")
    print("=" * 60)

    # Manual resource management with context managers
    with Context() as ctx:
        with Document.open(ctx, 'sample.pdf') as doc:
            print(f"Document has {doc.page_count()} pages")
            print(f"Title: {doc.get_metadata('Title')}")
            print(f"Author: {doc.get_metadata('Author')}")

            # Load first page
            with doc.load_page(0) as page:
                # Get page bounds
                bounds = page.bounds()
                print(f"\nPage 0 bounds: {bounds}")
                print(f"  Width: {bounds.width()}")
                print(f"  Height: {bounds.height()}")

                # Extract text
                text = page.extract_text()
                print(f"\nExtracted text: {len(text)} characters")

                # Render at custom scale
                scale = 2.0  # 144 DPI
                matrix = Matrix.scale(scale, scale)
                colorspace = Colorspace.device_rgb(ctx)

                with Pixmap.from_page(ctx, page, matrix, colorspace) as pix:
                    print(f"\nRendered pixmap: {pix.width()}x{pix.height()}")
                    pix.save_png('low_level_output.png')
                    print("Saved to low_level_output.png")

    print()


def example_render_all_pages():
    """Example 5: Render all pages to individual PNG files."""
    print("=" * 60)
    print("Example 5: Render All Pages")
    print("=" * 60)

    with EasyPDF.open('sample.pdf') as pdf:
        paths = pdf.render_all_pages(
            output_dir='rendered_pages',
            prefix='page',
            dpi=150
        )

        print(f"Generated {len(paths)} PNG files:")
        for path in paths:
            print(f"  - {path}")

    print()


def example_password_protected():
    """Example 6: Open password-protected PDF."""
    print("=" * 60)
    print("Example 6: Password-Protected PDF")
    print("=" * 60)

    try:
        with EasyPDF.open_with_password('secure.pdf', 'password123') as pdf:
            print(f"Successfully opened encrypted PDF")
            print(f"Pages: {pdf.page_count()}")
            text = pdf.extract_page_text(0)
            print(f"First page: {len(text)} characters")
    except Exception as e:
        print(f"Error: {e}")

    print()


def example_search_and_extract():
    """Example 7: Search for keyword and extract surrounding text."""
    print("=" * 60)
    print("Example 7: Search and Extract")
    print("=" * 60)

    keyword = 'Python'

    with EasyPDF.open('sample.pdf') as pdf:
        results = pdf.search_all(keyword)

        print(f"Found '{keyword}' {len(results)} times")

        for i, result in enumerate(results[:3], 1):
            page_num = result['page_num']
            bbox = result['bbox']

            # Extract full page text
            page_text = pdf.extract_page_text(page_num)

            print(f"\n{i}. Page {page_num}:")
            print(f"   Location: {bbox}")
            print(f"   Context: ...{page_text[max(0, page_text.find(keyword)-50):page_text.find(keyword)+50]}...")

    print()


def example_metadata_extraction():
    """Example 8: Extract comprehensive metadata."""
    print("=" * 60)
    print("Example 8: Metadata Extraction")
    print("=" * 60)

    with EasyPDF.open('sample.pdf') as pdf:
        metadata = pdf.get_metadata()

        print("Document Metadata:")
        for key, value in metadata.items():
            if value:
                print(f"  {key}: {value}")

        # Get detailed info
        info = pdf.get_info()
        print(f"\nDetailed Info:")
        print(f"  Pages: {info.page_count}")
        print(f"  Encrypted: {info.is_encrypted}")

    print()


def example_custom_dpi():
    """Example 9: Render at different DPI values."""
    print("=" * 60)
    print("Example 9: Custom DPI Rendering")
    print("=" * 60)

    dpis = [72, 150, 300, 600]

    with EasyPDF.open('sample.pdf') as pdf:
        for dpi in dpis:
            output_file = f'output_{dpi}dpi.png'
            pdf.render_page(0, output_file, dpi=dpi)
            print(f"Rendered at {dpi} DPI -> {output_file}")

    print()


def example_page_dimensions():
    """Example 10: Get dimensions of all pages."""
    print("=" * 60)
    print("Example 10: Page Dimensions")
    print("=" * 60)

    with EasyPDF.open('sample.pdf') as pdf:
        print(f"Document has {pdf.page_count()} pages\n")

        for i in range(pdf.page_count()):
            bounds = pdf.get_page_bounds(i)
            print(f"Page {i}:")
            print(f"  Size: {bounds.width():.2f} x {bounds.height():.2f} points")
            print(f"  Inches: {bounds.width()/72:.2f} x {bounds.height()/72:.2f}")
            print()


def main():
    """Run all examples."""
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║  NanoPDF Python Bindings - Usage Examples             ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()

    examples = [
        example_easy_api_extract_text,
        example_easy_api_render,
        example_easy_api_context_manager,
        example_low_level_api,
        example_render_all_pages,
        example_search_and_extract,
        example_metadata_extraction,
        example_custom_dpi,
        example_page_dimensions,
    ]

    for example in examples:
        try:
            example()
        except FileNotFoundError:
            print(f"⚠️  Skipping (sample.pdf not found)\n")
        except Exception as e:
            print(f"❌ Error: {e}\n")

    print("✅ Examples completed!")
    print()


if __name__ == '__main__':
    main()

