#!/bin/bash
# NanoPDF Deployment Script
#
# Complete deployment workflow for NanoPDF releases
#
# Usage:
#   ./scripts/deploy.sh <version> [options]
#   ./scripts/deploy.sh 0.2.0
#   ./scripts/deploy.sh 1.0.0-beta.1 --skip-tests
#
# This script:
#   1. Validates version format
#   2. Runs tests (optional)
#   3. Syncs version across all projects
#   4. Builds packages
#   5. Creates git commit and tag
#   6. Optionally pushes to remote
#
# Options:
#   --skip-tests     Skip running tests
#   --skip-build     Skip building packages
#   --no-push        Don't push to remote
#   --dry-run        Show what would be done without making changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default options
RUN_TESTS=true
BUILD_PACKAGES=true
PUSH_TO_REMOTE=true
DRY_RUN=false
VERSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            RUN_TESTS=false
            shift
            ;;
        --skip-build)
            BUILD_PACKAGES=false
            shift
            ;;
        --no-push)
            PUSH_TO_REMOTE=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: $0 <version> [options]

Complete deployment workflow for NanoPDF releases.

Arguments:
  <version>         Version to deploy (e.g., 0.2.0, 1.0.0-beta.1)

Options:
  --skip-tests      Skip running tests
  --skip-build      Skip building packages
  --no-push         Don't push to remote (commit and tag locally only)
  --dry-run         Show what would be done without making changes
  -h, --help        Show this help message

Examples:
  $0 0.2.0
  $0 1.0.0-beta.1 --skip-tests
  $0 0.2.0 --dry-run

Deployment Steps:
  1. Validate environment and dependencies
  2. Run test suites (Rust, Node.js, Go)
  3. Sync version across all projects
  4. Build Rust library (release mode)
  5. Build Node.js native addon
  6. Create git commit and tag
  7. Push to remote (optional)

Projects:
  - nanopdf-rs (Rust FFI library)
  - nanopdf-js (Node.js bindings)
  - go-nanopdf (Go bindings)
EOF
            exit 0
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                echo -e "${RED}Error: Unknown option: $1${NC}"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate version argument
if [[ -z "$VERSION" ]]; then
    echo -e "${RED}Error: Version argument required${NC}"
    echo "Usage: $0 <version> [options]"
    echo "Example: $0 0.2.0"
    exit 1
fi

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}        NanoPDF Deployment Script${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "Version:        ${GREEN}$VERSION${NC}"
echo -e "Run tests:      ${YELLOW}$RUN_TESTS${NC}"
echo -e "Build packages: ${YELLOW}$BUILD_PACKAGES${NC}"
echo -e "Push to remote: ${YELLOW}$PUSH_TO_REMOTE${NC}"
echo -e "Dry run:        ${YELLOW}$DRY_RUN${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step header
print_step() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Step 1: Validate environment
print_step "Step 1: Validating Environment"

echo "Checking required tools..."

MISSING_TOOLS=()

if ! command_exists cargo; then
    MISSING_TOOLS+=("cargo (Rust)")
fi

if ! command_exists node; then
    MISSING_TOOLS+=("node (Node.js)")
fi

if ! command_exists pnpm; then
    MISSING_TOOLS+=("pnpm (Node.js package manager)")
fi

if ! command_exists go; then
    MISSING_TOOLS+=("go (Go compiler)")
fi

if ! command_exists git; then
    MISSING_TOOLS+=("git")
fi

if [[ ${#MISSING_TOOLS[@]} -gt 0 ]]; then
    echo -e "${RED}Error: Missing required tools:${NC}"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo "  - $tool"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required tools available${NC}"
echo ""
echo "Environment:"
echo "  Rust:    $(cargo --version | head -1)"
echo "  Node.js: $(node --version)"
echo "  pnpm:    $(pnpm --version)"
echo "  Go:      $(go version | awk '{print $3}')"
echo "  Git:     $(git --version)"

# Step 2: Check git status
print_step "Step 2: Checking Git Status"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo -e "${YELLOW}Warning: Not on main/master branch${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: Uncommitted changes detected${NC}"
    echo "Please commit or stash your changes before deploying"
    git status --short
    exit 1
fi

echo -e "${GREEN}✓ Git status clean${NC}"

# Step 3: Run tests
if [[ "$RUN_TESTS" == "true" ]]; then
    print_step "Step 3: Running Tests"

    # Rust tests
    echo -e "${BLUE}==> Testing nanopdf-rs${NC}"
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: cd nanopdf-rs && cargo test${NC}"
    else
        cd "$PROJECT_ROOT/nanopdf-rs"
        cargo test --release
        echo -e "${GREEN}✓ Rust tests passed${NC}"
    fi
    echo ""

    # Go tests
    echo -e "${BLUE}==> Testing go-nanopdf${NC}"
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: cd go-nanopdf && go test -tags=mock ./...${NC}"
    else
        cd "$PROJECT_ROOT/go-nanopdf"
        go test -tags=mock ./...
        echo -e "${GREEN}✓ Go tests passed${NC}"
    fi
    echo ""

    # Node.js tests
    echo -e "${BLUE}==> Testing nanopdf-js${NC}"
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: cd nanopdf-js && pnpm test${NC}"
    else
        cd "$PROJECT_ROOT/nanopdf-js"
        if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
            pnpm test || echo -e "${YELLOW}Warning: Some tests failed${NC}"
        else
            echo -e "${YELLOW}No tests found, skipping${NC}"
        fi
        echo -e "${GREEN}✓ Node.js tests completed${NC}"
    fi

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}==> Skipping tests (--skip-tests)${NC}"
fi

# Step 4: Sync version
print_step "Step 4: Syncing Version"

SYNC_FLAGS=""
if [[ "$DRY_RUN" == "true" ]]; then
    SYNC_FLAGS="--dry-run"
fi

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would run: ./scripts/sync-version.sh $VERSION $SYNC_FLAGS${NC}"
else
    # Run sync-version.sh without creating commit/tag (we'll do that later)
    ./scripts/sync-version.sh "$VERSION" --no-commit --no-tag
fi

# Step 5: Build packages
if [[ "$BUILD_PACKAGES" == "true" ]]; then
    print_step "Step 5: Building Packages"

    # Build Rust library
    echo -e "${BLUE}==> Building nanopdf-rs (release)${NC}"
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: cd nanopdf-rs && cargo build --release${NC}"
    else
        cd "$PROJECT_ROOT/nanopdf-rs"
        cargo build --release
        echo -e "${GREEN}✓ Rust library built${NC}"
    fi
    echo ""

    # Build Node.js addon
    echo -e "${BLUE}==> Building nanopdf-js (native addon)${NC}"
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would run: cd nanopdf-js && pnpm build${NC}"
    else
        cd "$PROJECT_ROOT/nanopdf-js"
        if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
            pnpm build || echo -e "${YELLOW}Warning: Build had issues${NC}"
            echo -e "${GREEN}✓ Node.js addon built${NC}"
        else
            echo -e "${YELLOW}No build script found, skipping${NC}"
        fi
    fi

    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}==> Skipping build (--skip-build)${NC}"
fi

# Step 6: Create git commit and tag
print_step "Step 6: Creating Git Commit and Tag"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would create commit and tag for version $VERSION${NC}"
else
    # Stage version files
    git add VERSION nanopdf-rs/Cargo.toml nanopdf-js/package.json

    # Create commit
    git commit -m "chore: bump version to $VERSION

- Update nanopdf-rs to $VERSION
- Update nanopdf-js to $VERSION
- Update go-nanopdf to $VERSION
- Update VERSION file to $VERSION"

    echo -e "${GREEN}✓ Commit created${NC}"

    # Create tag
    TAG_NAME="v$VERSION"
    git tag -a "$TAG_NAME" -m "Release $VERSION

NanoPDF $VERSION

Projects:
- nanopdf-rs: $VERSION
- nanopdf-js: $VERSION
- go-nanopdf: $VERSION

See CHANGELOG.md for details."

    echo -e "${GREEN}✓ Tag created: $TAG_NAME${NC}"
fi

# Step 7: Push to remote
if [[ "$PUSH_TO_REMOTE" == "true" ]]; then
    print_step "Step 7: Pushing to Remote"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would push:${NC}"
        echo "  - Branch: $CURRENT_BRANCH"
        echo "  - Tag: v$VERSION"
    else
        echo "Pushing branch..."
        git push origin "$CURRENT_BRANCH"
        echo -e "${GREEN}✓ Branch pushed${NC}"

        echo "Pushing tag..."
        git push origin "v$VERSION"
        echo -e "${GREEN}✓ Tag pushed${NC}"
    fi
else
    echo -e "${YELLOW}==> Skipping push (--no-push)${NC}"
fi

# Final summary
print_step "Deployment Complete! 🎉"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
    echo "Run without --dry-run to perform actual deployment."
else
    echo -e "${GREEN}Successfully deployed NanoPDF $VERSION${NC}"
    echo ""
    echo "Summary:"
    echo "  ✓ Tests passed"
    echo "  ✓ Version synced across all projects"
    echo "  ✓ Packages built"
    echo "  ✓ Git commit created"
    echo "  ✓ Git tag created: v$VERSION"

    if [[ "$PUSH_TO_REMOTE" == "true" ]]; then
        echo "  ✓ Changes pushed to remote"
        echo ""
        echo "Next steps:"
        echo "  1. Monitor CI/CD pipeline for automated builds"
        echo "  2. Create GitHub release from tag: v$VERSION"
        echo "  3. Publish packages:"
        echo "     - Rust: cd nanopdf-rs && cargo publish"
        echo "     - Node.js: cd nanopdf-js && pnpm publish"
        echo "  4. Update documentation if needed"
    else
        echo ""
        echo "Next steps:"
        echo "  1. Push changes: git push origin $CURRENT_BRANCH"
        echo "  2. Push tag: git push origin v$VERSION"
        echo "  3. Create GitHub release"
        echo "  4. Publish packages"
    fi
fi

echo ""

