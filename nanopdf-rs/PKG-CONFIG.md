# pkg-config Support

NanoPDF provides pkg-config files for easy integration into build systems and as a drop-in replacement for MuPDF.

## Overview

Two pkg-config files are installed:

- **nanopdf.pc** - Primary pkg-config file for NanoPDF
- **mupdf.pc** - Compatibility alias allowing NanoPDF as a drop-in replacement for MuPDF

## Usage

### Using with nanopdf name

```bash
# Get compiler flags
pkg-config --cflags nanopdf

# Get linker flags
pkg-config --libs nanopdf

# Get version
pkg-config --modversion nanopdf
```

### Using as MuPDF replacement

To use NanoPDF as a drop-in replacement for MuPDF:

```bash
# These commands work exactly as they would with MuPDF
pkg-config --cflags mupdf
pkg-config --libs mupdf
pkg-config --modversion mupdf
```

## Build System Integration

### Makefile

```makefile
CFLAGS += $(shell pkg-config --cflags nanopdf)
LDFLAGS += $(shell pkg-config --libs nanopdf)
```

### CMake

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(NANOPDF REQUIRED nanopdf)

target_include_directories(myapp PRIVATE ${NANOPDF_INCLUDE_DIRS})
target_link_libraries(myapp ${NANOPDF_LIBRARIES})
```

### Autotools

```autoconf
PKG_CHECK_MODULES([NANOPDF], [nanopdf >= 0.1.0])
```

### Meson

```meson
nanopdf_dep = dependency('nanopdf')
executable('myapp', 'myapp.c', dependencies: nanopdf_dep)
```

## Installation Paths

- **Debian/Ubuntu**: `/usr/lib/pkgconfig/`
- **RHEL/Fedora**: `/usr/lib64/pkgconfig/`

## Compatibility

The `mupdf.pc` file provides the same interface as MuPDF's pkg-config, making NanoPDF a true drop-in replacement for existing projects.

