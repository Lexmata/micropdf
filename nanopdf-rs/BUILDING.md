# Building NanoPDF from Source

This document describes how to build and install NanoPDF from source.

## Prerequisites

### Required

- **Rust toolchain** (1.70.0 or later)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **C compiler** (gcc or clang)
  ```bash
  # Debian/Ubuntu
  sudo apt install build-essential

  # Fedora/RHEL
  sudo dnf install gcc make

  # macOS
  xcode-select --install
  ```

### Optional

- **cargo-watch** (for development)
  ```bash
  cargo install cargo-watch
  ```

## Quick Start

The simplest way to build NanoPDF:

```bash
make
```

This will build the library in release mode at `target/release/libnanopdf.a`.

## Build Targets

### Release Build (Optimized)

```bash
make release
```

Builds the library with optimizations enabled.

### Debug Build

```bash
make debug
```

Builds the library with debug symbols (faster compilation, slower runtime).

### Generate Headers

```bash
make headers
```

Regenerates C header files from Rust FFI declarations.

## Installation

### System-wide Installation

Install to `/usr/local` (default):

```bash
sudo make install
```

This installs:
- **Library**: `/usr/local/lib/libnanopdf.a`
- **Headers**: `/usr/local/include/nanopdf/` and `/usr/local/include/mupdf/`
- **Pkg-config**: `/usr/local/lib/pkgconfig/nanopdf.pc` and `mupdf.pc`

### Custom Installation Prefix

Install to a different location:

```bash
make install PREFIX=/opt/nanopdf
```

Or for distribution packaging:

```bash
make install PREFIX=/usr DESTDIR=/tmp/nanopdf-build
```

### Install Individual Components

```bash
make install-lib         # Library only
make install-headers     # Headers only
make install-pkgconfig   # Pkg-config files only
```

## Using the Installed Library

After installation, use pkg-config to get compiler flags:

```bash
# Get compile flags
pkg-config --cflags nanopdf

# Get link flags
pkg-config --libs nanopdf

# Compile a program
gcc myapp.c $(pkg-config --cflags --libs nanopdf) -o myapp
```

For MuPDF compatibility, use `mupdf` instead of `nanopdf`:

```bash
pkg-config --cflags --libs mupdf
```

## Uninstallation

Remove all installed files:

```bash
sudo make uninstall
```

Or uninstall individual components:

```bash
sudo make uninstall-lib
sudo make uninstall-headers
sudo make uninstall-pkgconfig
```

## Testing

### Run Tests

```bash
make test
```

### Run Tests with Verbose Output

```bash
make test-verbose
```

### Run Benchmarks

```bash
make bench
```

## Code Quality

### Check Code

```bash
make check
```

### Run Linter

```bash
make clippy
```

### Format Code

```bash
make fmt
```

### Check Code Format

```bash
make fmt-check
```

## Documentation

### Generate Documentation

```bash
make doc
```

Documentation will be generated at `target/doc/nanopdf/index.html`.

### Generate and Open Documentation

```bash
make doc-open
```

This will open the documentation in your default browser.

## Development Workflow

### Watch for Changes and Rebuild

```bash
make watch
```

### Watch for Changes and Run Tests

```bash
make watch-test
```

## Package Building

### Build Debian Package

Requires Docker:

```bash
make deb
```

Package will be created in `docker/output/`.

### Build RPM Package

Requires Docker:

```bash
make rpm
```

Package will be created in `docker/output/`.

## Cleaning

### Clean Build Artifacts

```bash
make clean
```

### Deep Clean (including Cargo.lock)

```bash
make distclean
```

## Advanced Usage

### Cross-Compilation

To cross-compile for a different architecture:

```bash
# Install target
rustup target add aarch64-unknown-linux-gnu

# Build
cargo build --release --target aarch64-unknown-linux-gnu
```

### Custom Cargo Flags

Pass additional flags to cargo:

```bash
make release CARGO_BUILD_FLAGS="--features experimental"
```

### Parallel Builds

Cargo automatically uses multiple cores. To control parallelism:

```bash
make release CARGO_BUILD_FLAGS="-j 4"
```

## Build Configuration

The Makefile respects the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PREFIX` | `/usr/local` | Installation prefix |
| `DESTDIR` | (empty) | Staging directory for packaging |
| `CARGO` | `cargo` | Cargo command to use |
| `CARGO_BUILD_FLAGS` | (empty) | Additional cargo build flags |
| `CARGO_TEST_FLAGS` | (empty) | Additional cargo test flags |
| `TARGET_TRIPLE` | Auto-detected | Target architecture triple |

## Troubleshooting

### Build Fails with "linker not found"

Install a C compiler:

```bash
# Debian/Ubuntu
sudo apt install build-essential

# Fedora/RHEL
sudo dnf install gcc

# macOS
xcode-select --install
```

### Permission Denied During Installation

Use `sudo`:

```bash
sudo make install
```

Or install to a user-writable location:

```bash
make install PREFIX=$HOME/.local
```

### Headers Not Generating

Ensure you've built the project first:

```bash
cargo clean
make release
```

## Integration Examples

### CMake Integration

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(NANOPDF REQUIRED nanopdf)

add_executable(myapp main.c)
target_include_directories(myapp PRIVATE ${NANOPDF_INCLUDE_DIRS})
target_link_libraries(myapp ${NANOPDF_LIBRARIES})
```

### Meson Integration

```meson
nanopdf_dep = dependency('nanopdf')

executable('myapp',
  'main.c',
  dependencies: [nanopdf_dep]
)
```

### Direct Compilation

```bash
gcc -I/usr/local/include myapp.c -L/usr/local/lib -lnanopdf -o myapp
```

## Platform-Specific Notes

### Linux

Standard installation to `/usr/local` works out of the box. For system-wide installation to `/usr`, use:

```bash
sudo make install PREFIX=/usr
```

### macOS

If using Homebrew, consider installing to the Homebrew prefix:

```bash
make install PREFIX=$(brew --prefix)
```

### Windows

NanoPDF can be built on Windows using:
- **MSVC**: Use the standard Rust MSVC toolchain
- **MinGW**: Use the GNU toolchain

The Makefile is designed for Unix-like systems. On Windows, consider using cargo directly:

```cmd
cargo build --release
```

## Getting Help

For more information:
- Run `make help` to see all available targets
- Run `make info` to see build configuration
- Run `make version` to see version information
- Check the [main README](README.md) for project documentation
- Visit the [GitHub repository](https://github.com/Lexmata/nanopdf)

## License

NanoPDF is dual-licensed under Apache 2.0 and MIT. See LICENSE-APACHE and LICENSE-MIT for details.

