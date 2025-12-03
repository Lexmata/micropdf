#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$PROJECT_DIR/dist"

case "$1" in
    deb)
        docker build -f "$SCRIPT_DIR/Dockerfile.deb" -t nanopdf-deb-builder "$PROJECT_DIR"
        docker run --rm -v "$PROJECT_DIR/dist:/dist" nanopdf-deb-builder
        ;;
    rpm)
        docker build -f "$SCRIPT_DIR/Dockerfile.rpm" -t nanopdf-rpm-builder "$PROJECT_DIR"
        docker run --rm -v "$PROJECT_DIR/dist:/dist" nanopdf-rpm-builder
        ;;
    all)
        $0 deb && $0 rpm
        echo "All packages built in: $PROJECT_DIR/dist/"
        ls -la "$PROJECT_DIR/dist/"
        ;;
    clean)
        docker rmi nanopdf-deb-builder nanopdf-rpm-builder 2>/dev/null || true
        rm -rf "$PROJECT_DIR/dist"
        ;;
    *)
        echo "Usage: $0 {deb|rpm|all|clean}"
        exit 1
        ;;
esac

