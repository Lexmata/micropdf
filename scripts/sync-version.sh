#!/bin/bash
# Sync version across all NanoPDF projects
#
# Usage:
#   ./scripts/sync-version.sh <version>
#   ./scripts/sync-version.sh 0.2.0
#
# This script:
#   1. Updates version in Cargo.toml (Rust)
#   2. Updates version in package.json (Node.js)
#   3. Updates VERSION file (root)
#   4. Creates a git commit
#   5. Creates a git tag
#
# Options:
#   --no-commit    Don't create a git commit
#   --no-tag       Don't create a git tag
#   --dry-run      Show what would be done without making changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
CREATE_COMMIT=true
CREATE_TAG=true
DRY_RUN=false
VERSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-commit)
            CREATE_COMMIT=false
            shift
            ;;
        --no-tag)
            CREATE_TAG=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: $0 <version> [options]

Sync version across all NanoPDF projects.

Arguments:
  <version>         Version to set (e.g., 0.2.0, 1.0.0-beta.1)

Options:
  --no-commit       Don't create a git commit
  --no-tag          Don't create a git tag
  --dry-run         Show what would be done without making changes
  -h, --help        Show this help message

Examples:
  $0 0.2.0
  $0 1.0.0-beta.1 --no-tag
  $0 0.2.0 --dry-run

Projects updated:
  - nanopdf-rs/Cargo.toml
  - nanopdf-js/package.json
  - VERSION file (root)
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

# Validate version format (semver: X.Y.Z or X.Y.Z-suffix)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo -e "${RED}Error: Invalid version format: $VERSION${NC}"
    echo "Expected format: X.Y.Z or X.Y.Z-suffix (e.g., 0.2.0, 1.0.0-beta.1)"
    exit 1
fi

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# File paths
CARGO_TOML="$PROJECT_ROOT/nanopdf-rs/Cargo.toml"
PACKAGE_JSON="$PROJECT_ROOT/nanopdf-js/package.json"
VERSION_FILE="$PROJECT_ROOT/VERSION"

# Verify files exist
if [[ ! -f "$CARGO_TOML" ]]; then
    echo -e "${RED}Error: $CARGO_TOML not found${NC}"
    exit 1
fi

if [[ ! -f "$PACKAGE_JSON" ]]; then
    echo -e "${RED}Error: $PACKAGE_JSON not found${NC}"
    exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}NanoPDF Version Sync${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Target version: ${GREEN}$VERSION${NC}"
echo -e "Dry run: ${YELLOW}$DRY_RUN${NC}"
echo ""

# Function to update Cargo.toml
update_cargo_toml() {
    echo -e "${BLUE}==> Updating $CARGO_TOML${NC}"

    # Get current version
    CURRENT_VERSION=$(grep '^version = ' "$CARGO_TOML" | head -1 | sed 's/version = "\(.*\)"/\1/')
    echo "  Current version: $CURRENT_VERSION"
    echo "  New version:     $VERSION"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${YELLOW}[DRY RUN] Would update version${NC}"
    else
        # Use sed to replace version
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "0,/^version = \".*\"/s//version = \"$VERSION\"/" "$CARGO_TOML"
        else
            # Linux
            sed -i "0,/^version = \".*\"/s//version = \"$VERSION\"/" "$CARGO_TOML"
        fi
        echo -e "  ${GREEN}✓ Updated${NC}"
    fi
}

# Function to update package.json
update_package_json() {
    echo -e "${BLUE}==> Updating $PACKAGE_JSON${NC}"

    # Get current version
    CURRENT_VERSION=$(grep '"version":' "$PACKAGE_JSON" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
    echo "  Current version: $CURRENT_VERSION"
    echo "  New version:     $VERSION"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${YELLOW}[DRY RUN] Would update version${NC}"
    else
        # Use sed to replace version
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON"
        else
            # Linux
            sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON"
        fi
        echo -e "  ${GREEN}✓ Updated${NC}"
    fi
}

# Function to update VERSION file
update_version_file() {
    echo -e "${BLUE}==> Updating $VERSION_FILE${NC}"

    if [[ -f "$VERSION_FILE" ]]; then
        CURRENT_VERSION=$(cat "$VERSION_FILE")
        echo "  Current version: $CURRENT_VERSION"
    else
        echo "  File does not exist, creating..."
    fi
    echo "  New version:     $VERSION"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${YELLOW}[DRY RUN] Would write version${NC}"
    else
        echo "$VERSION" > "$VERSION_FILE"
        echo -e "  ${GREEN}✓ Updated${NC}"
    fi
}

# Function to create git commit
create_git_commit() {
    if [[ "$CREATE_COMMIT" != "true" ]]; then
        echo -e "${YELLOW}==> Skipping git commit (--no-commit)${NC}"
        return
    fi

    echo -e "${BLUE}==> Creating git commit${NC}"

    # Check if git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "  ${RED}Error: Not a git repository${NC}"
        return 1
    fi

    # Check for uncommitted changes (excluding our version files)
    if ! git diff --quiet --exit-code -- ':!nanopdf-rs/Cargo.toml' ':!nanopdf-js/package.json' ':!VERSION'; then
        echo -e "  ${YELLOW}Warning: Uncommitted changes in other files${NC}"
        echo "  Commit message will include only version updates"
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${YELLOW}[DRY RUN] Would commit:${NC}"
        echo "    - nanopdf-rs/Cargo.toml"
        echo "    - nanopdf-js/package.json"
        echo "    - VERSION"
        echo "  Commit message: chore: bump version to $VERSION"
    else
        git add "$CARGO_TOML" "$PACKAGE_JSON" "$VERSION_FILE"
        git commit -m "chore: bump version to $VERSION

- Update nanopdf-rs to $VERSION
- Update nanopdf-js to $VERSION
- Update VERSION file to $VERSION"
        echo -e "  ${GREEN}✓ Committed${NC}"
    fi
}

# Function to create git tag
create_git_tag() {
    if [[ "$CREATE_TAG" != "true" ]]; then
        echo -e "${YELLOW}==> Skipping git tag (--no-tag)${NC}"
        return
    fi

    echo -e "${BLUE}==> Creating git tag${NC}"

    # Check if git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "  ${RED}Error: Not a git repository${NC}"
        return 1
    fi

    TAG_NAME="v$VERSION"

    # Check if tag already exists
    if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
        echo -e "  ${RED}Error: Tag $TAG_NAME already exists${NC}"
        return 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "  ${YELLOW}[DRY RUN] Would create tag: $TAG_NAME${NC}"
    else
        git tag -a "$TAG_NAME" -m "Release $VERSION

NanoPDF $VERSION

- nanopdf-rs: $VERSION
- nanopdf-js: $VERSION
- go-nanopdf: $VERSION"
        echo -e "  ${GREEN}✓ Created tag: $TAG_NAME${NC}"
        echo ""
        echo -e "  Push with: ${BLUE}git push origin $TAG_NAME${NC}"
    fi
}

# Main execution
cd "$PROJECT_ROOT"

# Update all files
update_cargo_toml
echo ""
update_package_json
echo ""
update_version_file
echo ""

# Git operations
if [[ "$DRY_RUN" != "true" ]]; then
    create_git_commit
    echo ""
    create_git_tag
fi

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Version sync complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo "Updated files:"
    echo "  ✓ nanopdf-rs/Cargo.toml -> $VERSION"
    echo "  ✓ nanopdf-js/package.json -> $VERSION"
    echo "  ✓ VERSION -> $VERSION"

    if [[ "$CREATE_COMMIT" == "true" ]]; then
        echo ""
        echo "Git commit created:"
        echo "  $(git log -1 --oneline)"
    fi

    if [[ "$CREATE_TAG" == "true" ]]; then
        echo ""
        echo "Git tag created: v$VERSION"
        echo ""
        echo "Next steps:"
        echo "  1. Review changes: git show"
        echo "  2. Push commit: git push origin $(git branch --show-current)"
        echo "  3. Push tag: git push origin v$VERSION"
    fi
fi

echo ""

