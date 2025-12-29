//! Cross-Language Overhead Measurement - Rust Baseline
//!
//! This module provides the Rust baseline measurements for comparing
//! FFI overhead across Go, Node.js, and Python bindings.
//!
//! Run with: cargo run --release --example cross_language_baseline

use micropdf::fitz::buffer::Buffer;
use micropdf::fitz::geometry::{Matrix, Point, Rect};
use std::time::Instant;

const ITERATIONS: usize = 100_000;
const WARMUP_ITERATIONS: usize = 1_000;

/// Benchmark result
struct BenchResult {
    name: String,
    iterations: usize,
    total_ns: u128,
    avg_ns: f64,
    throughput: f64,
}

impl BenchResult {
    fn new(name: &str, iterations: usize, total_ns: u128) -> Self {
        let avg_ns = total_ns as f64 / iterations as f64;
        let throughput = 1_000_000_000.0 / avg_ns; // ops/sec
        Self {
            name: name.to_string(),
            iterations,
            total_ns,
            avg_ns,
            throughput,
        }
    }

    fn print(&self) {
        println!(
            "{:<40} {:>10} iterations, {:>10.2} ns/op, {:>12.0} ops/sec",
            self.name, self.iterations, self.avg_ns, self.throughput
        );
    }

    fn to_json(&self) -> String {
        format!(
            r#"{{"name":"{}","iterations":{},"total_ns":{},"avg_ns":{:.2},"throughput":{:.0}}}"#,
            self.name, self.iterations, self.total_ns, self.avg_ns, self.throughput
        )
    }
}

/// Warmup function to trigger JIT and caching
fn warmup<F>(mut f: F)
where
    F: FnMut(),
{
    for _ in 0..WARMUP_ITERATIONS {
        f();
    }
}

/// Time a function
fn bench<F>(name: &str, iterations: usize, mut f: F) -> BenchResult
where
    F: FnMut(),
{
    warmup(&mut f);

    let start = Instant::now();
    for _ in 0..iterations {
        f();
    }
    let elapsed = start.elapsed();

    BenchResult::new(name, iterations, elapsed.as_nanos())
}

fn main() {
    println!("=== Cross-Language Overhead Benchmark (Rust Baseline) ===\n");
    println!("Iterations: {}", ITERATIONS);
    println!("Warmup: {}", WARMUP_ITERATIONS);
    println!();

    let mut results = Vec::new();

    // ========================================================================
    // Geometry Operations
    // ========================================================================

    println!("--- Geometry Operations ---\n");

    // Point creation
    results.push(bench("point_create", ITERATIONS, || {
        let _ = Point::new(10.0, 20.0);
    }));

    // Point transform
    let p = Point::new(10.0, 20.0);
    let m = Matrix::scale(2.0, 2.0);
    results.push(bench("point_transform", ITERATIONS, || {
        let _ = p.transform(&m);
    }));

    // Rect creation
    results.push(bench("rect_create", ITERATIONS, || {
        let _ = Rect::new(0.0, 0.0, 100.0, 100.0);
    }));

    // Rect transform
    let r = Rect::new(0.0, 0.0, 100.0, 100.0);
    let m = Matrix::rotate(45.0);
    results.push(bench("rect_transform", ITERATIONS, || {
        let _ = r.transform(&m);
    }));

    // Rect contains point
    let r = Rect::new(0.0, 0.0, 100.0, 100.0);
    let p = Point::new(50.0, 50.0);
    results.push(bench("rect_contains_point", ITERATIONS, || {
        let _ = r.contains(&p);
    }));

    // Matrix creation
    results.push(bench("matrix_identity", ITERATIONS, || {
        let _ = Matrix::identity();
    }));

    results.push(bench("matrix_scale", ITERATIONS, || {
        let _ = Matrix::scale(2.0, 2.0);
    }));

    results.push(bench("matrix_rotate", ITERATIONS, || {
        let _ = Matrix::rotate(45.0);
    }));

    results.push(bench("matrix_translate", ITERATIONS, || {
        let _ = Matrix::translate(100.0, 100.0);
    }));

    // Matrix concatenation
    let m1 = Matrix::scale(2.0, 2.0);
    let m2 = Matrix::rotate(45.0);
    results.push(bench("matrix_concat", ITERATIONS, || {
        let _ = m1.concat(&m2);
    }));

    // Matrix inversion
    let m = Matrix::scale(2.0, 3.0);
    results.push(bench("matrix_invert", ITERATIONS, || {
        let _ = m.invert();
    }));

    println!();

    // ========================================================================
    // Buffer Operations
    // ========================================================================

    println!("--- Buffer Operations ---\n");

    // Buffer creation
    results.push(bench("buffer_create_empty", ITERATIONS, || {
        let _ = Buffer::new(0);
    }));

    results.push(bench("buffer_create_1KB", ITERATIONS, || {
        let _ = Buffer::new(1024);
    }));

    // Buffer from data
    let data = vec![0u8; 256];
    results.push(bench("buffer_from_slice_256B", ITERATIONS, || {
        let _ = Buffer::from_slice(&data);
    }));

    let data = vec![0u8; 1024];
    results.push(bench("buffer_from_slice_1KB", ITERATIONS, || {
        let _ = Buffer::from_slice(&data);
    }));

    // Buffer append
    let chunk = vec![0u8; 64];
    results.push(bench("buffer_append_64B", ITERATIONS / 10, || {
        let mut buf = Buffer::new(64);
        buf.append_data(&chunk);
    }));

    println!();

    // ========================================================================
    // Combined Operations (Real-world patterns)
    // ========================================================================

    println!("--- Combined Operations ---\n");

    // Simulate page rendering setup
    results.push(bench("page_render_setup", ITERATIONS / 10, || {
        let dpi = 144.0;
        let scale = dpi / 72.0;
        let ctm = Matrix::scale(scale, scale);
        let page_bounds = Rect::new(0.0, 0.0, 612.0, 792.0);
        let _ = page_bounds.transform(&ctm);
    }));

    // Simulate text position calculation
    results.push(bench("text_position_calc", ITERATIONS, || {
        let base = Point::new(72.0, 700.0);
        let m = Matrix::translate(0.0, -14.0);
        let _ = base.transform(&m);
    }));

    // Simulate bounding box calculation for 10 items
    results.push(bench("bbox_calc_10_items", ITERATIONS / 10, || {
        let mut bbox = Rect::empty();
        for i in 0..10 {
            let item = Rect::new(i as f32 * 10.0, i as f32 * 10.0, 100.0 + i as f32 * 10.0, 20.0 + i as f32 * 10.0);
            bbox = bbox.union(&item);
        }
        let _ = bbox;
    }));

    println!();

    // ========================================================================
    // Summary
    // ========================================================================

    println!("=== Summary ===\n");

    for result in &results {
        result.print();
    }

    println!();

    // Output JSON for cross-language comparison
    println!("--- JSON Output ---");
    println!("[");
    for (i, result) in results.iter().enumerate() {
        let comma = if i < results.len() - 1 { "," } else { "" };
        println!("  {}{}", result.to_json(), comma);
    }
    println!("]");
}

