#!/bin/bash
# Deploy Angular application to GitHub Pages
# This script builds the Angular app and pushes it to the gh-pages branch

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PAGES_DIR="pages"
BUILD_DIR="pages/dist/browser"
GH_PAGES_BRANCH="gh-pages"
REPO_URL=$(git config --get remote.origin.url)

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  NanoPDF GitHub Pages Deployment${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if we're in the project root
if [ ! -d "$PAGES_DIR" ]; then
    echo -e "${RED}Error: Must run from project root (pages/ directory not found)${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"

# Step 1: Install dependencies
echo -e "\n${GREEN}[1/6] Installing dependencies...${NC}"
cd "$PAGES_DIR"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi
cd ..

# Step 2: Build Angular app
echo -e "\n${GREEN}[2/6] Building Angular application...${NC}"
cd "$PAGES_DIR"
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi
cd ..

# Verify build succeeded
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory not found at ${BUILD_DIR}${NC}"
    exit 1
fi

# Step 3: Create temporary directory for built files
echo -e "\n${GREEN}[3/6] Preparing deployment files...${NC}"
TEMP_DIR=$(mktemp -d)
cp -r "$BUILD_DIR"/* "$TEMP_DIR/"

# Add .nojekyll to prevent Jekyll processing
touch "$TEMP_DIR/.nojekyll"

# Add CNAME if needed (uncomment and set your domain)
# echo "your-custom-domain.com" > "$TEMP_DIR/CNAME"

echo -e "${BLUE}Files prepared in: ${TEMP_DIR}${NC}"
ls -la "$TEMP_DIR"

# Step 4: Switch to gh-pages branch
echo -e "\n${GREEN}[4/6] Switching to ${GH_PAGES_BRANCH} branch...${NC}"

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/$GH_PAGES_BRANCH; then
    git checkout $GH_PAGES_BRANCH
else
    echo -e "${YELLOW}Creating new orphan branch: ${GH_PAGES_BRANCH}${NC}"
    git checkout --orphan $GH_PAGES_BRANCH
    git rm -rf . 2>/dev/null || true
fi

# Step 5: Replace contents with built files
echo -e "\n${GREEN}[5/6] Updating ${GH_PAGES_BRANCH} branch contents...${NC}"

# Remove all existing files (except .git)
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# Copy built files
cp -r "$TEMP_DIR"/* .

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Stage all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to deploy${NC}"
else
    # Commit
    COMMIT_MSG="deploy: update GitHub Pages $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"

    # Step 6: Push to remote
    echo -e "\n${GREEN}[6/6] Pushing to remote...${NC}"
    git push origin $GH_PAGES_BRANCH --force

    echo -e "\n${GREEN}✓ Deployment successful!${NC}"
fi

# Return to original branch
echo -e "\n${BLUE}Returning to ${CURRENT_BRANCH} branch...${NC}"
git checkout "$CURRENT_BRANCH"

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "Site URL: ${BLUE}https://lexmata.github.io/nanopdf/${NC}"

