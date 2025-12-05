#!/bin/bash
# Build and test go-nanopdf in Docker
#
# Usage:
#   ./docker/build-test.sh [options]
#
# Options:
#   --no-cache    Build without using Docker cache
#   --shell       Drop into a shell instead of running tests
#   --verbose     Enable verbose output

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
NO_CACHE=""
SHELL_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --shell)
            SHELL_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Get the project root (parent of go-nanopdf)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GO_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$GO_PROJECT_DIR/.." && pwd)"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}go-nanopdf Docker Test Build${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Project root: ${PROJECT_ROOT}"
echo -e "Go project:   ${GO_PROJECT_DIR}"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Build the Docker image
echo -e "${GREEN}==> Building Docker image...${NC}"
docker build \
    $NO_CACHE \
    -f go-nanopdf/docker/Dockerfile.test \
    -t nanopdf-go-test:latest \
    .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}==> Docker image built successfully!${NC}"
echo ""

# Run the container
if [ "$SHELL_MODE" = true ]; then
    echo -e "${BLUE}==> Dropping into shell...${NC}"
    echo -e "${YELLOW}Tip: Run 'go test -v ./...' to run tests${NC}"
    echo ""
    docker run -it --rm \
        -v "$GO_PROJECT_DIR:/workspace/go-nanopdf" \
        nanopdf-go-test:latest \
        /bin/bash
else
    echo -e "${GREEN}==> Running tests...${NC}"
    echo ""
    docker run --rm \
        nanopdf-go-test:latest
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}=====================================${NC}"
else
    echo ""
    echo -e "${RED}=====================================${NC}"
    echo -e "${RED}✗ Tests failed!${NC}"
    echo -e "${RED}=====================================${NC}"
    exit 1
fi

