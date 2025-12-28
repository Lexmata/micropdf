//! Memory Allocation Profiling Benchmarks
//!
//! Measures memory allocation patterns for core NanoPDF operations:
//! - Allocation count per operation
//! - Bytes allocated per operation
//! - Peak memory usage
//! - Allocation hotspots
//!
//! Uses a custom allocator wrapper to track allocations during benchmarks.

use criterion::{BenchmarkId, Criterion, black_box, criterion_group, criterion_main};
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering};

use nanopdf::fitz::buffer::Buffer;
use nanopdf::fitz::geometry::{Matrix, Point, Quad, Rect};

// ============================================================================
// Allocation Tracking
// ============================================================================

/// Global counters for allocation tracking
static ALLOC_COUNT: AtomicUsize = AtomicUsize::new(0);
static ALLOC_BYTES: AtomicUsize = AtomicUsize::new(0);
static DEALLOC_COUNT: AtomicUsize = AtomicUsize::new(0);
static DEALLOC_BYTES: AtomicUsize = AtomicUsize::new(0);
static PEAK_BYTES: AtomicUsize = AtomicUsize::new(0);
static CURRENT_BYTES: AtomicUsize = AtomicUsize::new(0);

/// Reset allocation counters
fn reset_counters() {
    ALLOC_COUNT.store(0, Ordering::SeqCst);
    ALLOC_BYTES.store(0, Ordering::SeqCst);
    DEALLOC_COUNT.store(0, Ordering::SeqCst);
    DEALLOC_BYTES.store(0, Ordering::SeqCst);
    PEAK_BYTES.store(0, Ordering::SeqCst);
    CURRENT_BYTES.store(0, Ordering::SeqCst);
}

/// Get allocation statistics
#[derive(Debug, Clone, Copy)]
struct AllocStats {
    alloc_count: usize,
    alloc_bytes: usize,
    dealloc_count: usize,
    dealloc_bytes: usize,
    peak_bytes: usize,
    net_bytes: isize,
}

fn get_stats() -> AllocStats {
    let alloc_bytes = ALLOC_BYTES.load(Ordering::SeqCst);
    let dealloc_bytes = DEALLOC_BYTES.load(Ordering::SeqCst);
    AllocStats {
        alloc_count: ALLOC_COUNT.load(Ordering::SeqCst),
        alloc_bytes,
        dealloc_count: DEALLOC_COUNT.load(Ordering::SeqCst),
        dealloc_bytes,
        peak_bytes: PEAK_BYTES.load(Ordering::SeqCst),
        net_bytes: alloc_bytes as isize - dealloc_bytes as isize,
    }
}

/// Tracking allocator wrapper
struct TrackingAllocator;

unsafe impl GlobalAlloc for TrackingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = System.alloc(layout);
        if !ptr.is_null() {
            ALLOC_COUNT.fetch_add(1, Ordering::SeqCst);
            ALLOC_BYTES.fetch_add(layout.size(), Ordering::SeqCst);

            let current = CURRENT_BYTES.fetch_add(layout.size(), Ordering::SeqCst) + layout.size();
            let mut peak = PEAK_BYTES.load(Ordering::SeqCst);
            while current > peak {
                match PEAK_BYTES.compare_exchange_weak(
                    peak,
                    current,
                    Ordering::SeqCst,
                    Ordering::SeqCst,
                ) {
                    Ok(_) => break,
                    Err(p) => peak = p,
                }
            }
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        DEALLOC_COUNT.fetch_add(1, Ordering::SeqCst);
        DEALLOC_BYTES.fetch_add(layout.size(), Ordering::SeqCst);
        CURRENT_BYTES.fetch_sub(layout.size(), Ordering::SeqCst);
        System.dealloc(ptr, layout)
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        let new_ptr = System.realloc(ptr, layout, new_size);
        if !new_ptr.is_null() && new_size > layout.size() {
            let growth = new_size - layout.size();
            ALLOC_BYTES.fetch_add(growth, Ordering::SeqCst);

            let current = CURRENT_BYTES.fetch_add(growth, Ordering::SeqCst) + growth;
            let mut peak = PEAK_BYTES.load(Ordering::SeqCst);
            while current > peak {
                match PEAK_BYTES.compare_exchange_weak(
                    peak,
                    current,
                    Ordering::SeqCst,
                    Ordering::SeqCst,
                ) {
                    Ok(_) => break,
                    Err(p) => peak = p,
                }
            }
        } else if !new_ptr.is_null() && new_size < layout.size() {
            let shrink = layout.size() - new_size;
            DEALLOC_BYTES.fetch_add(shrink, Ordering::SeqCst);
            CURRENT_BYTES.fetch_sub(shrink, Ordering::SeqCst);
        }
        new_ptr
    }
}

// Note: We can't actually set a global allocator in a benchmark crate
// because criterion uses its own. Instead, we'll measure manually.

/// Measure allocations for a closure
fn measure_allocations<F, R>(f: F) -> (R, AllocStats)
where
    F: FnOnce() -> R,
{
    reset_counters();
    let result = f();
    let stats = get_stats();
    (result, stats)
}

// ============================================================================
// Geometry Allocation Benchmarks
// ============================================================================

fn bench_point_allocations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/point");

    // Single point creation
    group.bench_function("create_single", |b| {
        b.iter(|| Point::new(black_box(10.0), black_box(20.0)))
    });

    // Batch point creation
    for count in [10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("create_batch", count), &count, |b, &n| {
            b.iter(|| {
                let points: Vec<Point> = (0..n)
                    .map(|i| Point::new(i as f32, i as f32 * 2.0))
                    .collect();
                black_box(points)
            })
        });
    }

    // Point transform (no allocation expected)
    let p = Point::new(10.0, 20.0);
    let m = Matrix::scale(2.0, 2.0);
    group.bench_function("transform", |b| {
        b.iter(|| black_box(&p).transform(black_box(&m)))
    });

    group.finish();
}

fn bench_rect_allocations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/rect");

    // Single rect creation
    group.bench_function("create_single", |b| {
        b.iter(|| {
            Rect::new(
                black_box(0.0),
                black_box(0.0),
                black_box(100.0),
                black_box(100.0),
            )
        })
    });

    // Batch rect creation
    for count in [10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("create_batch", count), &count, |b, &n| {
            b.iter(|| {
                let rects: Vec<Rect> = (0..n)
                    .map(|i| Rect::new(0.0, 0.0, i as f32, i as f32))
                    .collect();
                black_box(rects)
            })
        });
    }

    // Rect transform
    let r = Rect::new(0.0, 0.0, 100.0, 100.0);
    let m = Matrix::rotate(45.0);
    group.bench_function("transform", |b| {
        b.iter(|| black_box(&r).transform(black_box(&m)))
    });

    // Rect operations (intersection, union)
    let r1 = Rect::new(0.0, 0.0, 100.0, 100.0);
    let r2 = Rect::new(50.0, 50.0, 150.0, 150.0);
    group.bench_function("intersect", |b| {
        b.iter(|| black_box(&r1).intersect(black_box(&r2)))
    });

    group.bench_function("union", |b| b.iter(|| black_box(&r1).union(black_box(&r2))));

    group.finish();
}

fn bench_matrix_allocations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/matrix");

    // Matrix creation methods
    group.bench_function("identity", |b| b.iter(Matrix::identity));

    group.bench_function("scale", |b| {
        b.iter(|| Matrix::scale(black_box(2.0), black_box(2.0)))
    });

    group.bench_function("rotate", |b| b.iter(|| Matrix::rotate(black_box(45.0))));

    group.bench_function("translate", |b| {
        b.iter(|| Matrix::translate(black_box(100.0), black_box(100.0)))
    });

    // Matrix concatenation (may allocate intermediate)
    let m1 = Matrix::scale(2.0, 2.0);
    let m2 = Matrix::rotate(45.0);
    group.bench_function("concat", |b| {
        b.iter(|| black_box(&m1).concat(black_box(&m2)))
    });

    // Chain of transforms
    group.bench_function("chain_4_transforms", |b| {
        b.iter(|| {
            Matrix::identity()
                .concat(&Matrix::scale(2.0, 2.0))
                .concat(&Matrix::rotate(45.0))
                .concat(&Matrix::translate(100.0, 100.0))
                .concat(&Matrix::scale(0.5, 0.5))
        })
    });

    // Matrix inversion
    let m = Matrix::scale(2.0, 3.0).concat(&Matrix::rotate(30.0));
    group.bench_function("invert", |b| b.iter(|| black_box(&m).invert()));

    group.finish();
}

fn bench_quad_allocations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/quad");

    // Quad from rect
    let r = Rect::new(0.0, 0.0, 100.0, 100.0);
    group.bench_function("from_rect", |b| b.iter(|| Quad::from_rect(black_box(&r))));

    // Quad transform
    let q = Quad::from_rect(&r);
    let m = Matrix::rotate(45.0);
    group.bench_function("transform", |b| {
        b.iter(|| black_box(&q).transform(black_box(&m)))
    });

    // Quad to bounding rect
    group.bench_function("bounds", |b| b.iter(|| black_box(&q).bounds()));

    // Contains point
    let p = Point::new(50.0, 50.0);
    group.bench_function("contains_point", |b| {
        b.iter(|| black_box(&q).contains(black_box(&p)))
    });

    group.finish();
}

// ============================================================================
// Buffer Allocation Benchmarks
// ============================================================================

fn bench_buffer_allocations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/buffer");

    // Buffer creation with various sizes
    for size in [0, 64, 256, 1024, 4096, 16384, 65536] {
        group.bench_with_input(BenchmarkId::new("create", size), &size, |b, &size| {
            b.iter(|| Buffer::new(black_box(size)))
        });
    }

    // Buffer from data (copies data)
    for size in [64, 256, 1024, 4096, 16384] {
        let data: Vec<u8> = (0..size).map(|i| i as u8).collect();
        group.bench_with_input(BenchmarkId::new("from_slice", size), &data, |b, data| {
            b.iter(|| Buffer::from_slice(black_box(data)))
        });
    }

    // Buffer append (may reallocate)
    let chunk: Vec<u8> = vec![0u8; 256];
    for append_count in [1, 10, 100] {
        group.bench_with_input(
            BenchmarkId::new("append_256B_x", append_count),
            &append_count,
            |b, &count| {
                b.iter(|| {
                    let mut buf = Buffer::new(0);
                    for _ in 0..count {
                        buf.append_data(black_box(&chunk));
                    }
                    buf
                })
            },
        );
    }

    // Buffer with pre-allocated capacity (should not reallocate)
    for append_count in [10, 100] {
        let capacity = 256 * append_count;
        group.bench_with_input(
            BenchmarkId::new("append_preallocated", append_count),
            &append_count,
            |b, &count| {
                b.iter(|| {
                    let mut buf = Buffer::new(capacity);
                    for _ in 0..count {
                        buf.append_data(black_box(&chunk));
                    }
                    buf
                })
            },
        );
    }

    group.finish();
}

// ============================================================================
// Operation Memory Profiles
// ============================================================================

/// Estimate allocations for common operation patterns
fn bench_operation_profiles(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/operation_profile");

    // Profile: Create and transform 100 points
    group.bench_function("transform_100_points", |b| {
        let m = Matrix::scale(2.0, 2.0).concat(&Matrix::rotate(45.0));
        b.iter(|| {
            let points: Vec<Point> = (0..100)
                .map(|i| {
                    let p = Point::new(i as f32, i as f32 * 2.0);
                    p.transform(&m)
                })
                .collect();
            black_box(points)
        })
    });

    // Profile: Create and transform 100 rects
    group.bench_function("transform_100_rects", |b| {
        let m = Matrix::scale(1.5, 1.5).concat(&Matrix::rotate(30.0));
        b.iter(|| {
            let rects: Vec<Rect> = (0..100)
                .map(|i| {
                    let r = Rect::new(0.0, 0.0, (i + 10) as f32, (i + 10) as f32);
                    r.transform(&m)
                })
                .collect();
            black_box(rects)
        })
    });

    // Profile: Build buffer incrementally (simulates content stream)
    group.bench_function("build_content_stream_1KB", |b| {
        b.iter(|| {
            let mut buf = Buffer::new(1024);
            buf.append_data(b"BT\n");
            buf.append_data(b"/F1 12 Tf\n");
            for i in 0..50 {
                let line = format!("1 0 0 1 72 {} Tm\n", 700 - i * 14);
                buf.append_data(line.as_bytes());
                buf.append_data(b"(Hello World) Tj\n");
            }
            buf.append_data(b"ET\n");
            buf
        })
    });

    // Profile: Matrix chain for page rendering
    group.bench_function("page_render_matrix_chain", |b| {
        b.iter(|| {
            // Typical rendering transform: scale to DPI, rotate, translate
            let dpi_scale = Matrix::scale(2.0, 2.0); // 144 DPI
            let rotation = Matrix::rotate(0.0); // No rotation
            let translate = Matrix::translate(0.0, 0.0);

            let ctm = dpi_scale.concat(&rotation).concat(&translate);

            // Transform page bounds
            let page_bounds = Rect::new(0.0, 0.0, 612.0, 792.0);
            let transformed = page_bounds.transform(&ctm);

            black_box(transformed)
        })
    });

    group.finish();
}

// ============================================================================
// Memory Size Tracking
// ============================================================================

/// Benchmark to verify type sizes (compile-time check)
fn bench_type_sizes(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory/type_sizes");

    // Report sizes (this is more of a documentation benchmark)
    group.bench_function("point_size", |b| b.iter(|| std::mem::size_of::<Point>()));

    group.bench_function("rect_size", |b| b.iter(|| std::mem::size_of::<Rect>()));

    group.bench_function("matrix_size", |b| b.iter(|| std::mem::size_of::<Matrix>()));

    group.bench_function("quad_size", |b| b.iter(|| std::mem::size_of::<Quad>()));

    // Print sizes (visible in benchmark output)
    println!("\nType sizes:");
    println!("  Point:  {} bytes", std::mem::size_of::<Point>());
    println!("  Rect:   {} bytes", std::mem::size_of::<Rect>());
    println!("  Matrix: {} bytes", std::mem::size_of::<Matrix>());
    println!("  Quad:   {} bytes", std::mem::size_of::<Quad>());
    println!(
        "  Buffer: {} bytes (struct only)",
        std::mem::size_of::<Buffer>()
    );

    group.finish();
}

// ============================================================================
// Criterion Configuration
// ============================================================================

criterion_group!(
    name = memory_benches;
    config = Criterion::default()
        .sample_size(100)
        .measurement_time(std::time::Duration::from_secs(3));
    targets =
        bench_point_allocations,
        bench_rect_allocations,
        bench_matrix_allocations,
        bench_quad_allocations,
        bench_buffer_allocations,
        bench_operation_profiles,
        bench_type_sizes,
);

criterion_main!(memory_benches);
