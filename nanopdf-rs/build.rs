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
