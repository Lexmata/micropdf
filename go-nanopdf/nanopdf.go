// Package nanopdf provides Go bindings for the NanoPDF PDF library.
//
// NanoPDF is a native Rust PDF library inspired by MuPDF. This package
// provides Go bindings via CGO to the Rust static library.
//
// # Installation
//
// First, build the Rust library:
//
//	cd nanopdf-rs
//	cargo build --release
//
// Then copy the static library to the appropriate location:
//
//	# Linux
//	cp target/release/libnanopdf.a go-nanopdf/lib/linux_amd64/
//
//	# macOS
//	cp target/release/libnanopdf.a go-nanopdf/lib/darwin_amd64/
//
//	# Windows
//	cp target/release/nanopdf.lib go-nanopdf/lib/windows_amd64/
//
// # Usage
//
//	import "github.com/lexmata/nanopdf/go-nanopdf"
//
//	func main() {
//	    // Get version
//	    fmt.Println(nanopdf.Version())
//
//	    // Create a buffer
//	    buf := nanopdf.NewBuffer(1024)
//	    defer buf.Free()
//
//	    // Work with geometry
//	    p := nanopdf.Point{X: 100, Y: 200}
//	    m := nanopdf.MatrixTranslate(50, 50)
//	    result := p.Transform(m)
//	}
package nanopdf

// Version returns the NanoPDF library version.
func Version() string {
	return version()
}

// IsMock returns true if using the mock implementation (native library not available).
func IsMock() bool {
	return isMock()
}
