# NanoPDF Deployment Scripts

This directory contains scripts for managing NanoPDF releases and deployments across all projects.

## Scripts

### `sync-version.sh`

Synchronizes version numbers across all NanoPDF projects.

**Usage:**

```bash
./scripts/sync-version.sh <version> [options]
```

**Examples:**

```bash
# Update to version 0.2.0
./scripts/sync-version.sh 0.2.0

# Update to beta version
./scripts/sync-version.sh 1.0.0-beta.1

# Dry run (show what would be done)
./scripts/sync-version.sh 0.2.0 --dry-run

# Update without creating git commit
./scripts/sync-version.sh 0.2.0 --no-commit

# Update without creating git tag
./scripts/sync-version.sh 0.2.0 --no-tag
```

**What it does:**

1. Validates version format (semantic versioning)
2. Updates `nanopdf-rs/Cargo.toml`
3. Updates `nanopdf-js/package.json`
4. Updates root `VERSION` file
5. Creates git commit (optional)
6. Creates git tag `v<version>` (optional)

**Options:**

- `--no-commit` - Don't create a git commit
- `--no-tag` - Don't create a git tag
- `--dry-run` - Show what would be done without making changes
- `-h, --help` - Show help message

---

### `deploy.sh`

Complete deployment workflow for NanoPDF releases.

**Usage:**

```bash
./scripts/deploy.sh <version> [options]
```

**Examples:**

```bash
# Full deployment workflow
./scripts/deploy.sh 0.2.0

# Deploy without running tests (faster)
./scripts/deploy.sh 0.2.0 --skip-tests

# Deploy without building packages
./scripts/deploy.sh 0.2.0 --skip-build

# Create release locally without pushing
./scripts/deploy.sh 0.2.0 --no-push

# Dry run to see what would happen
./scripts/deploy.sh 0.2.0 --dry-run
```

**What it does:**

1. **Validates environment** - Checks for required tools (cargo, node, pnpm, go, git)
2. **Checks git status** - Ensures clean working directory
3. **Runs tests** - Executes test suites for all projects
   - Rust: `cargo test --release`
   - Go: `go test -tags=mock ./...`
   - Node.js: `pnpm test`
4. **Syncs version** - Updates version across all projects
5. **Builds packages** - Compiles release builds
   - Rust: `cargo build --release`
   - Node.js: `pnpm build` (native addon)
6. **Creates git commit and tag** - Version bump commit + `v<version>` tag
7. **Pushes to remote** - Pushes commit and tag to origin (optional)

**Options:**

- `--skip-tests` - Skip running test suites
- `--skip-build` - Skip building packages
- `--no-push` - Don't push to remote (commit and tag locally only)
- `--dry-run` - Show what would be done without making changes
- `-h, --help` - Show help message

---

## Version File

The root `VERSION` file contains the current version of all NanoPDF projects. This is the single source of truth for the project version.

**Format:**

```
X.Y.Z
```

Or with pre-release suffix:

```
X.Y.Z-suffix
```

**Examples:**

```
0.1.0
0.2.0
1.0.0
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

---

## Deployment Workflow

### For Regular Releases

```bash
# 1. Ensure you're on main/master branch
git checkout main
git pull origin main

# 2. Run full deployment
./scripts/deploy.sh 0.2.0

# 3. Create GitHub release
# Go to https://github.com/your-org/nanopdf/releases/new
# Select tag v0.2.0
# Add release notes

# 4. Publish packages
cd nanopdf-rs && cargo publish
cd ../nanopdf-js && pnpm publish
```

### For Beta/RC Releases

```bash
# Deploy beta version
./scripts/deploy.sh 1.0.0-beta.1

# After testing, deploy RC
./scripts/deploy.sh 1.0.0-rc.1

# Finally, deploy stable
./scripts/deploy.sh 1.0.0
```

### For Hotfix Releases

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/fix-critical-bug

# 2. Fix the bug and commit
git add .
git commit -m "fix: critical bug description"

# 3. Deploy patch version (--no-push for review)
./scripts/deploy.sh 0.1.1 --no-push

# 4. Push hotfix branch for review
git push origin hotfix/fix-critical-bug

# 5. After approval, merge and push tag
git checkout main
git merge hotfix/fix-critical-bug
git push origin main
git push origin v0.1.1
```

---

## Semantic Versioning

NanoPDF follows [Semantic Versioning](https://semver.org/).

**Format:** `MAJOR.MINOR.PATCH[-SUFFIX]`

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)
- **SUFFIX** (optional): Pre-release identifiers (`alpha`, `beta`, `rc`)

**Examples:**

- `0.1.0` → `0.1.1` - Bug fix (patch)
- `0.1.0` → `0.2.0` - New feature (minor)
- `0.1.0` → `1.0.0` - Breaking change (major)
- `1.0.0-alpha.1` - Alpha pre-release
- `1.0.0-beta.1` - Beta pre-release
- `1.0.0-rc.1` - Release candidate

---

## Troubleshooting

### "Missing required tools"

Install missing dependencies:

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22

# pnpm
npm install -g pnpm

# Go
# Download from https://golang.org/dl/
```

### "Uncommitted changes detected"

Commit or stash your changes:

```bash
# Commit
git add .
git commit -m "your message"

# Or stash
git stash
```

### "Not on main/master branch"

Switch to main branch:

```bash
git checkout main
```

Or proceed anyway when prompted (for testing purposes).

### "Tag already exists"

Delete the existing tag:

```bash
# Delete local tag
git tag -d v0.2.0

# Delete remote tag
git push origin :refs/tags/v0.2.0
```

Then run the deployment script again.

### Version Mismatch

If versions are out of sync, run:

```bash
./scripts/sync-version.sh <correct-version>
```

---

## CI/CD Integration

The deployment scripts are designed to work with GitHub Actions:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Verify version sync
        run: |
          if [[ "$(cat VERSION)" != "${{ steps.version.outputs.VERSION }}" ]]; then
            echo "Version mismatch!"
            exit 1
          fi
      
      - name: Build and publish
        run: |
          cd nanopdf-rs && cargo publish
          cd ../nanopdf-js && pnpm publish
```

---

## Best Practices

1. **Always run tests before deploying** - Don't use `--skip-tests` for production releases
2. **Use dry run first** - Verify deployment with `--dry-run` before actual deployment
3. **Follow semantic versioning** - Major for breaking changes, minor for features, patch for fixes
4. **Update CHANGELOG.md** - Document changes in the changelog before releasing
5. **Create GitHub releases** - Add release notes and binaries after pushing tags
6. **Test in staging** - Use beta/RC versions for testing before stable release
7. **Keep git history clean** - One commit per version bump, clear commit messages

---

## Quick Reference

```bash
# Version sync only
./scripts/sync-version.sh 0.2.0

# Full deployment
./scripts/deploy.sh 0.2.0

# Dry run
./scripts/deploy.sh 0.2.0 --dry-run

# Fast deployment (no tests)
./scripts/deploy.sh 0.2.0 --skip-tests

# Local-only deployment
./scripts/deploy.sh 0.2.0 --no-push
```

---

For more information, see the main project [README.md](../README.md).

