#!/usr/bin/env node

/**
 * Build MicroPDF native library from Rust source
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const rustDir = join(rootDir, '..', 'micropdf-rs');

const platform = process.platform;
const arch = process.arch;

async function main() {
  console.log('Building MicroPDF from Rust source');
  console.log(`Platform: ${platform}-${arch}`);
  console.log('');

  // Check for Rust source
  if (!existsSync(join(rustDir, 'Cargo.toml'))) {
    console.error('Error: Rust source not found at', rustDir);
    console.error('Make sure you have the complete micropdf repository');
    process.exit(1);
  }

  // Check for cargo
  try {
    const version = execSync('cargo --version', { encoding: 'utf-8' });
    console.log(`Found: ${version.trim()}`);
  } catch {
    console.error('Error: Rust/Cargo not found');
    console.error('Install Rust from: https://rustup.rs');
    process.exit(1);
  }

  // Build the Rust library
  console.log('');
  console.log('Building Rust library...');

  try {
    execSync('cargo build --release', {
      cwd: rustDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Rust build failed');
    process.exit(1);
  }

  // Determine library name
  const libDir = join(rootDir, 'native', 'lib', `${platform}-${arch}`);
  let libName;

  if (platform === 'win32') {
    libName = 'micropdf.lib';
  } else {
    libName = 'libmicropdf.a';
  }

  // Create output directory
  mkdirSync(libDir, { recursive: true });

  // Copy the library
  const srcLib = join(rustDir, 'target', 'release', libName);
  const destLib = join(libDir, libName);

  if (!existsSync(srcLib)) {
    console.error(`Error: Built library not found at ${srcLib}`);
    process.exit(1);
  }

  copyFileSync(srcLib, destLib);
  console.log(`Library copied to: ${destLib}`);

  // Also copy the C header if it exists
  const headerSrc = join(rustDir, 'include', 'micropdf.h');
  const headerDest = join(rootDir, 'native', 'include', 'micropdf.h');

  if (existsSync(headerSrc)) {
    copyFileSync(headerSrc, headerDest);
    console.log(`Header copied to: ${headerDest}`);
  }

  console.log('');
  console.log('Build complete!');
  console.log('Run `npm run build:native` to build the Node.js addon');
}

main().catch((error) => {
  console.error('Build failed:', error.message);
  process.exit(1);
});
