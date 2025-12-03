#!/bin/bash
# Test script to verify pkg-config file generation

set -e

echo "=== Testing pkg-config file generation ==="

# Generate the files
VERSION="0.1.0"
PREFIX="/usr"

echo "Generating nanopdf.pc..."
sed -e "s|@PREFIX@|$PREFIX|g" -e "s|@VERSION@|$VERSION|g" nanopdf.pc.in > /tmp/nanopdf.pc

echo "Generating mupdf.pc..."
sed -e "s|@PREFIX@|$PREFIX|g" -e "s|@VERSION@|$VERSION|g" mupdf.pc.in > /tmp/mupdf.pc

echo ""
echo "=== Generated nanopdf.pc ==="
cat /tmp/nanopdf.pc

echo ""
echo "=== Generated mupdf.pc ==="
cat /tmp/mupdf.pc

echo ""
echo "=== Testing with pkg-config ==="

# Test if the files are valid
if PKG_CONFIG_PATH=/tmp pkg-config --validate nanopdf 2>/dev/null; then
    echo "✓ nanopdf.pc is valid"
else
    echo "✗ nanopdf.pc is invalid"
    exit 1
fi

if PKG_CONFIG_PATH=/tmp pkg-config --validate mupdf 2>/dev/null; then
    echo "✓ mupdf.pc is valid"
else
    echo "✗ mupdf.pc is invalid"
    exit 1
fi

echo ""
echo "=== Query tests ==="

echo "nanopdf version: $(PKG_CONFIG_PATH=/tmp pkg-config --modversion nanopdf)"
echo "nanopdf cflags: $(PKG_CONFIG_PATH=/tmp pkg-config --cflags nanopdf)"
echo "nanopdf libs: $(PKG_CONFIG_PATH=/tmp pkg-config --libs nanopdf)"

echo ""
echo "mupdf version: $(PKG_CONFIG_PATH=/tmp pkg-config --modversion mupdf)"
echo "mupdf cflags: $(PKG_CONFIG_PATH=/tmp pkg-config --cflags mupdf)"
echo "mupdf libs: $(PKG_CONFIG_PATH=/tmp pkg-config --libs mupdf)"

echo ""
echo "=== All tests passed! ==="

# Cleanup
rm /tmp/nanopdf.pc /tmp/mupdf.pc

