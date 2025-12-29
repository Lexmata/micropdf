#!/bin/bash
#
# Cross-Language Overhead Comparison
#
# This script runs benchmarks across Rust, Go, Node.js, and Python
# and compares the results to measure FFI overhead.
#
# Usage: ./benchmarks/compare_overhead.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "Cross-Language Overhead Comparison"
echo "=============================================="
echo ""
echo "Project root: $PROJECT_ROOT"
echo ""

# Create results directory
RESULTS_DIR="$PROJECT_ROOT/benchmarks/results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ============================================================================
# Run Rust Baseline
# ============================================================================

echo "--- Running Rust Baseline ---"
if [ -f "$PROJECT_ROOT/micropdf-rs/Cargo.toml" ]; then
    cd "$PROJECT_ROOT/micropdf-rs"

    # Check if the example exists
    if cargo build --release --example cross_language_baseline 2>/dev/null; then
        cargo run --release --example cross_language_baseline 2>&1 | tee "$RESULTS_DIR/rust_${TIMESTAMP}.txt"
    else
        echo "Note: Rust baseline example not built. Running cargo bench instead."
        cargo bench --bench memory_allocation -- --noplot 2>&1 | head -100 | tee "$RESULTS_DIR/rust_${TIMESTAMP}.txt"
    fi
else
    echo "Warning: Rust project not found at $PROJECT_ROOT/micropdf-rs"
fi
echo ""

# ============================================================================
# Run Go Benchmark
# ============================================================================

echo "--- Running Go Benchmark ---"
if [ -f "$PROJECT_ROOT/go-micropdf/go.mod" ]; then
    cd "$PROJECT_ROOT"

    if command -v go &> /dev/null; then
        go run benchmarks/cross_language_overhead.go 2>&1 | tee "$RESULTS_DIR/go_${TIMESTAMP}.txt"
    else
        echo "Warning: Go not found in PATH"
    fi
else
    echo "Warning: Go project not found at $PROJECT_ROOT/go-micropdf"
fi
echo ""

# ============================================================================
# Run Node.js Benchmark
# ============================================================================

echo "--- Running Node.js Benchmark ---"
if [ -f "$PROJECT_ROOT/micropdf-js/package.json" ]; then
    cd "$PROJECT_ROOT"

    if command -v npx &> /dev/null; then
        npx tsx benchmarks/cross_language_overhead.ts 2>&1 | tee "$RESULTS_DIR/nodejs_${TIMESTAMP}.txt"
    elif command -v node &> /dev/null; then
        # Try with ts-node or directly if transpiled
        echo "Warning: tsx not found, trying node directly"
        node --loader tsx benchmarks/cross_language_overhead.ts 2>&1 | tee "$RESULTS_DIR/nodejs_${TIMESTAMP}.txt"
    else
        echo "Warning: Node.js not found in PATH"
    fi
else
    echo "Warning: Node.js project not found at $PROJECT_ROOT/micropdf-js"
fi
echo ""

# ============================================================================
# Run Python Benchmark
# ============================================================================

echo "--- Running Python Benchmark ---"
cd "$PROJECT_ROOT"

if command -v python3 &> /dev/null; then
    python3 benchmarks/cross_language_overhead.py 2>&1 | tee "$RESULTS_DIR/python_${TIMESTAMP}.txt"
elif command -v python &> /dev/null; then
    python benchmarks/cross_language_overhead.py 2>&1 | tee "$RESULTS_DIR/python_${TIMESTAMP}.txt"
else
    echo "Warning: Python not found in PATH"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "=============================================="
echo "Benchmark Complete"
echo "=============================================="
echo ""
echo "Results saved to: $RESULTS_DIR"
ls -la "$RESULTS_DIR"/*_${TIMESTAMP}.txt 2>/dev/null || echo "No results generated"
echo ""
echo "To compare results, extract the JSON output from each file"
echo "and calculate the overhead ratio:"
echo ""
echo "  overhead = language_ns / rust_ns"
echo ""
echo "Typical expectations:"
echo "  - Go FFI overhead: ~2-5x"
echo "  - Node.js FFI overhead: ~5-20x"
echo "  - Python FFI overhead: ~10-50x"
echo ""
echo "Pure language implementations (no FFI) should be similar"
echo "across all languages for simple operations."

