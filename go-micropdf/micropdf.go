// Package micropdf provides Go bindings for the MicroPDF PDF library.
//
// MicroPDF is a native Rust PDF library inspired by MuPDF. This package
// provides Go bindings via CGO to the Rust static library.
//
// # Installation
//
// First, build the Rust library:
//
//	cd micropdf-rs
//	cargo build --release
//
// Then copy the static library to the appropriate location:
//
//	# Linux
//	cp target/release/libmicropdf.a go-micropdf/lib/linux_amd64/
//
//	# macOS
//	cp target/release/libmicropdf.a go-micropdf/lib/darwin_amd64/
//
//	# Windows
//	cp target/release/micropdf.lib go-micropdf/lib/windows_amd64/
//
// # Usage
//
//	import "github.com/lexmata/micropdf/go-micropdf"
//
//	func main() {
//	    // Get version
//	    fmt.Println(micropdf.Version())
//
//	    // Create a buffer
//	    buf := micropdf.NewBuffer(1024)
//	    defer buf.Free()
//
//	    // Work with geometry
//	    p := micropdf.Point{X: 100, Y: 200}
//	    m := micropdf.MatrixTranslate(50, 50)
//	    result := p.Transform(m)
//	}
package micropdf

// Version returns the MicroPDF library version.
func Version() string {
	return version()
}

// IsMock returns true if using the mock implementation (native library not available).
func IsMock() bool {
	return isMock()
}
