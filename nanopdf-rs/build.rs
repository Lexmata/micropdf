use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Get version from Cargo.toml
    let version = env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "0.1.0".to_string());

    // Determine prefix based on environment or use default
    let prefix = env::var("PREFIX").unwrap_or_else(|_| "/usr".to_string());

    // Create output directory for generated files
    let out_dir = env::var("OUT_DIR").unwrap();
    let pkg_config_dir = Path::new(&out_dir).join("pkgconfig");
    fs::create_dir_all(&pkg_config_dir).expect("Failed to create pkgconfig directory");

    // Create include directory if it doesn't exist
    let include_dir = Path::new("include");
    fs::create_dir_all(include_dir).expect("Failed to create include directory");

    // Generate C header files for FFI
    generate_ffi_headers();

    // Generate nanopdf.pc
    generate_pkg_config(
        "nanopdf.pc.in",
        &pkg_config_dir.join("nanopdf.pc"),
        &version,
        &prefix,
    );

    // Generate mupdf.pc (compatibility alias)
    generate_pkg_config(
        "mupdf.pc.in",
        &pkg_config_dir.join("mupdf.pc"),
        &version,
        &prefix,
    );

    println!("cargo:rerun-if-changed=nanopdf.pc.in");
    println!("cargo:rerun-if-changed=mupdf.pc.in");
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/");
}

fn generate_ffi_headers() {
    // Generate nanopdf.h - the main FFI header
    let nanopdf_header = r#"/**
 * NanoPDF - Fast, lightweight PDF library
 * 
 * This is a MuPDF-compatible C FFI header for the NanoPDF Rust library.
 * All functions are prefixed with fz_ or pdf_ for compatibility with MuPDF.
 */

#ifndef NANOPDF_H
#define NANOPDF_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Forward declarations - opaque handles */
typedef int32_t fz_context;
typedef int32_t fz_document;
typedef int32_t fz_page;
typedef int32_t fz_device;
typedef int32_t fz_pixmap;
typedef int32_t fz_buffer;
typedef int32_t fz_stream;
typedef int32_t fz_output;
typedef int32_t fz_colorspace;
typedef int32_t fz_font;
typedef int32_t fz_image;
typedef int32_t fz_path;
typedef int32_t fz_text;
typedef int32_t fz_cookie;
typedef int32_t fz_display_list;
typedef int32_t fz_link;
typedef int32_t fz_archive;
typedef int32_t pdf_obj;
typedef int32_t pdf_annot;
typedef int32_t pdf_form_field;

/* Core FFI functions are defined in the compiled library */
/* See the Rust documentation for detailed function signatures */

#ifdef __cplusplus
}
#endif

#endif /* NANOPDF_H */
"#;

    fs::write("include/nanopdf.h", nanopdf_header).expect("Failed to write nanopdf.h");
    println!("Generated: include/nanopdf.h");

    // Generate mupdf-ffi.h - MuPDF compatibility header
    let mupdf_ffi_header = r#"/**
 * MuPDF FFI Compatibility Header
 * 
 * This header provides MuPDF-compatible FFI bindings.
 * Include this for drop-in compatibility with MuPDF-based applications.
 */

#ifndef MUPDF_FFI_H
#define MUPDF_FFI_H

#include "nanopdf.h"

/* All MuPDF-compatible functions are available through nanopdf.h */

#endif /* MUPDF_FFI_H */
"#;

    fs::write("include/mupdf-ffi.h", mupdf_ffi_header).expect("Failed to write mupdf-ffi.h");
    println!("Generated: include/mupdf-ffi.h");
}

fn generate_pkg_config(template: &str, output: &Path, version: &str, prefix: &str) {
    let template_content = fs::read_to_string(template)
        .unwrap_or_else(|_| panic!("Failed to read template: {}", template));

    let content = template_content
        .replace("@VERSION@", version)
        .replace("@PREFIX@", prefix);

    fs::write(output, content)
        .unwrap_or_else(|_| panic!("Failed to write pkg-config file: {}", output.display()));

    println!("Generated: {}", output.display());
}
