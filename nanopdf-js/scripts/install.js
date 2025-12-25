#!/usr/bin/env node

/**
 * NanoPDF Installation Script
 *
 * Attempts to download prebuilt binaries from GitHub releases.
 * Falls back to building from Rust source if prebuilt is unavailable.
 */

import { createWriteStream, existsSync, mkdirSync, unlinkSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Package info
const pkg = JSON.parse(
  await import('node:fs/promises').then((fs) => fs.readFile(join(rootDir, 'package.json'), 'utf-8'))
);

const version = pkg.version;
const platform = process.platform;
const arch = process.arch;

const GITHUB_REPO = 'lexmata/nanopdf';
const RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${version}`;

/**
 * Get the prebuilt binary filename for current platform
 */
function getPrebuildFilename() {
  const platformMap = {
    linux: 'linux',
    darwin: 'macos',
    win32: 'windows'
  };

  const archMap = {
    x64: 'x86_64',
    arm64: 'aarch64'
  };

  const p = platformMap[platform];
  const a = archMap[arch];

  if (!p || !a) {
    return null;
  }

  const ext = platform === 'win32' ? 'zip' : 'tar.gz';
  return `nanopdf-${p}-${a}.${ext}`;
}

/**
 * Download a file from URL
 */
async function downloadFile(url, dest) {
  const { default: https } = await import('node:https');
  const { default: http } = await import('node:http');

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }

      const file = createWriteStream(dest);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        unlinkSync(dest);
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Extract tar.gz archive
 */
async function extractTarGz(archivePath, destDir) {
  const { createReadStream } = await import('node:fs');

  await pipeline(createReadStream(archivePath), createGunzip(), extract({ cwd: destDir }));
}

/**
 * Extract zip archive (Windows)
 */
async function extractZip(archivePath, destDir) {
  // Use built-in PowerShell on Windows
  execSync(
    `powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`,
    { stdio: 'inherit' }
  );
}

/**
 * Try to download prebuilt binaries
 */
async function tryDownloadPrebuilt() {
  const filename = getPrebuildFilename();

  if (!filename) {
    console.log(`No prebuilt binary available for ${platform}-${arch}`);
    return false;
  }

  const url = `${RELEASE_URL}/${filename}`;
  const tempFile = join(rootDir, filename);
  const libDir = join(rootDir, 'native', 'lib', `${platform}-${arch}`);

  console.log(`Downloading prebuilt binary from: ${url}`);

  try {
    // Create lib directory
    mkdirSync(libDir, { recursive: true });

    // Download archive
    await downloadFile(url, tempFile);
    console.log('Download complete, extracting...');

    // Extract
    if (filename.endsWith('.zip')) {
      await extractZip(tempFile, libDir);
    } else {
      await extractTarGz(tempFile, libDir);
    }

    // Clean up
    unlinkSync(tempFile);
    console.log('Prebuilt binary installed successfully');
    return true;
  } catch (error) {
    console.log(`Failed to download prebuilt: ${error.message}`);

    // Clean up on failure
    try {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    } catch {
      // Ignore cleanup errors
    }

    return false;
  }
}

/**
 * Build from Rust source
 */
async function buildFromSource() {
  const rustDir = join(rootDir, '..', 'nanopdf-rs');
  const libDir = join(rootDir, 'native', 'lib', `${platform}-${arch}`);

  console.log('Building from Rust source...');

  // Check if Rust source exists
  if (!existsSync(join(rustDir, 'Cargo.toml'))) {
    throw new Error(
      'Rust source not found. Clone the full repository or download prebuilt binaries.'
    );
  }

  // Check for cargo
  try {
    execSync('cargo --version', { stdio: 'ignore' });
  } catch {
    throw new Error(
      'Rust/Cargo not found. Install Rust from https://rustup.rs or download prebuilt binaries.'
    );
  }

  // Build the Rust library
  console.log('Running cargo build...');
  execSync('cargo build --release', {
    cwd: rustDir,
    stdio: 'inherit'
  });

  // Create lib directory
  mkdirSync(libDir, { recursive: true });

  // Copy the built library
  const releaseDir = join(rustDir, 'target', 'release');
  let libName;

  if (platform === 'win32') {
    libName = 'nanopdf.lib';
  } else {
    libName = 'libnanopdf.a';
  }

  const srcLib = join(releaseDir, libName);
  const destLib = join(libDir, libName);

  if (!existsSync(srcLib)) {
    throw new Error(`Built library not found: ${srcLib}`);
  }

  const { copyFileSync } = await import('node:fs');
  copyFileSync(srcLib, destLib);

  console.log(`Library copied to: ${destLib}`);
  console.log('Build from source complete');
}

/**
 * Build native addon with node-gyp
 */
async function buildNativeAddon() {
  console.log('Building native addon with node-gyp...');

  try {
    execSync('npx node-gyp rebuild', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('Native addon built successfully');
  } catch (error) {
    console.error('Failed to build native addon');
    console.error('The library will use mock implementation');
  }
}

/**
 * Main installation
 */
async function main() {
  console.log(`NanoPDF v${version} installation`);
  console.log(`Platform: ${platform}-${arch}`);
  console.log('');

  // Skip if CI environment without native deps
  if (process.env.NANOPDF_SKIP_BUILD === '1') {
    console.log('NANOPDF_SKIP_BUILD=1, skipping native build');
    return;
  }

  // Check if prebuilt already exists
  const libDir = join(rootDir, 'native', 'lib', `${platform}-${arch}`);
  const libName = platform === 'win32' ? 'nanopdf.lib' : 'libnanopdf.a';

  if (existsSync(join(libDir, libName))) {
    console.log('Native library already exists');
    await buildNativeAddon();
    return;
  }

  // Try to download prebuilt
  const downloaded = await tryDownloadPrebuilt();

  if (!downloaded) {
    // Fall back to building from source
    console.log('');
    console.log('Prebuilt not available, attempting to build from source...');

    try {
      await buildFromSource();
    } catch (error) {
      console.error(`Build from source failed: ${error.message}`);
      console.error('');
      console.error('The library will use mock implementation.');
      console.error('For full functionality, either:');
      console.error('  1. Install Rust and rebuild');
      console.error('  2. Wait for prebuilt binaries to be published');
      return;
    }
  }

  // Build the native addon
  await buildNativeAddon();
}

main().catch((error) => {
  console.error('Installation failed:', error.message);
  process.exit(1);
});
