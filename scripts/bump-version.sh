#!/bin/bash

# ============================================================================
# OmegaFramework Version Bumping Script
# ============================================================================
#
# Usage:
#   ./scripts/bump-version.sh patch   # 1.1.0 -> 1.1.1
#   ./scripts/bump-version.sh minor   # 1.1.0 -> 1.2.0
#   ./scripts/bump-version.sh major   # 1.1.0 -> 2.0.0
#
# This script:
# 1. Reads current version from config/version.json
# 2. Calculates new version based on semver
# 3. Updates all relevant files
# 4. Creates git commit and tag
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Check argument
VERSION_TYPE=$1

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type.${NC}"
    echo "Usage: $0 [patch|minor|major]"
    echo ""
    echo "Examples:"
    echo "  $0 patch    # Bugfix (1.1.0 → 1.1.1)"
    echo "  $0 minor    # New feature (1.1.0 → 1.2.0)"
    echo "  $0 major    # Breaking change (1.1.0 → 2.0.0)"
    exit 1
fi

# Read current version
VERSION_FILE="config/version.json"

if [ ! -f "$VERSION_FILE" ]; then
    echo -e "${RED}Error: $VERSION_FILE not found${NC}"
    exit 1
fi

CURRENT_MAJOR=$(jq -r '.major' $VERSION_FILE)
CURRENT_MINOR=$(jq -r '.minor' $VERSION_FILE)
CURRENT_PATCH=$(jq -r '.patch' $VERSION_FILE)
CURRENT_VERSION="$CURRENT_MAJOR.$CURRENT_MINOR.$CURRENT_PATCH"

# Calculate new version
case $VERSION_TYPE in
    patch)
        NEW_MAJOR=$CURRENT_MAJOR
        NEW_MINOR=$CURRENT_MINOR
        NEW_PATCH=$((CURRENT_PATCH + 1))
        ;;
    minor)
        NEW_MAJOR=$CURRENT_MAJOR
        NEW_MINOR=$((CURRENT_MINOR + 1))
        NEW_PATCH=0
        ;;
    major)
        NEW_MAJOR=$((CURRENT_MAJOR + 1))
        NEW_MINOR=0
        NEW_PATCH=0
        ;;
esac

NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OmegaFramework Version Bump${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Current version: ${YELLOW}$CURRENT_VERSION${NC}"
echo -e "  New version:     ${GREEN}$NEW_VERSION${NC}"
echo -e "  Type:            ${BLUE}$VERSION_TYPE${NC}"
echo ""

# Confirm with user
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Updating files...${NC}"

# 1. Update config/version.json
echo -e "  ${GREEN}✓${NC} Updating config/version.json"
RELEASE_DATE=$(date +%Y-%m-%d)

jq --arg major "$NEW_MAJOR" \
   --arg minor "$NEW_MINOR" \
   --arg patch "$NEW_PATCH" \
   --arg full "$NEW_VERSION" \
   --arg date "$RELEASE_DATE" \
   '.major = ($major | tonumber) |
    .minor = ($minor | tonumber) |
    .patch = ($patch | tonumber) |
    .full = $full |
    .releaseDate = $date' \
   $VERSION_FILE > ${VERSION_FILE}.tmp && mv ${VERSION_FILE}.tmp $VERSION_FILE

# 2. Update version in Core.ssjs
CORE_FILE="src/Core.ssjs"
if [ -f "$CORE_FILE" ]; then
    echo -e "  ${GREEN}✓${NC} Updating src/Core.ssjs"

    # Update version in header comment
    sed -i.bak "s/OMEGAFRAMEWORK CORE v[0-9]\+\.[0-9]\+\.[0-9]\+/OMEGAFRAMEWORK CORE v$NEW_VERSION/" "$CORE_FILE"

    # Update version in getInfo() function
    sed -i.bak "s/version: \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/version: \"$NEW_VERSION\"/" "$CORE_FILE"

    rm "${CORE_FILE}.bak"
fi

# 3. Update README.md
README_FILE="README.md"
if [ -f "$README_FILE" ]; then
    echo -e "  ${GREEN}✓${NC} Updating README.md"
    sed -i.bak "s/Version [0-9]\+\.[0-9]\+\.[0-9]\+/Version $NEW_VERSION/" "$README_FILE"
    sed -i.bak "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$NEW_VERSION/g" "$README_FILE"
    rm "${README_FILE}.bak"
fi

# 4. Prompt for CHANGELOG update
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Update CHANGELOG.md manually${NC}"
echo ""
echo "Add this section at the top of CHANGELOG.md:"
echo ""
echo -e "${BLUE}## [$NEW_VERSION] - $RELEASE_DATE${NC}"
echo ""
echo "### Added"
echo "- "
echo ""
echo "### Changed"
echo "- "
echo ""
echo "### Fixed"
echo "- "
echo ""
read -p "Press enter when you've updated CHANGELOG.md..."

# 5. Git operations
echo ""
echo -e "${BLUE}Creating git commit and tag...${NC}"

# Add files
git add config/version.json
git add src/Core.ssjs
git add README.md
git add CHANGELOG.md

# Commit
COMMIT_MESSAGE="chore: bump version to $NEW_VERSION"
if [ "$VERSION_TYPE" == "major" ]; then
    COMMIT_MESSAGE="chore!: bump version to $NEW_VERSION (BREAKING CHANGES)"
fi

git commit -m "$COMMIT_MESSAGE"

# Create tag
TAG_NAME="v$NEW_VERSION"
git tag -a "$TAG_NAME" -m "Release $NEW_VERSION"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Version bumped successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Version:  ${GREEN}$NEW_VERSION${NC}"
echo -e "  Tag:      ${GREEN}$TAG_NAME${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git log -1 --stat"
echo "  2. Push commit: git push origin <branch>"
echo "  3. Push tag: git push origin $TAG_NAME"
echo ""

if [ "$VERSION_TYPE" == "major" ]; then
    echo -e "${RED}⚠ BREAKING CHANGES DETECTED${NC}"
    echo ""
    echo "Remember to:"
    echo "  1. Create new Content Blocks in SFMC with _v$NEW_MAJOR suffix"
    echo "  2. Keep old v$CURRENT_MAJOR Content Blocks for backward compatibility"
    echo "  3. Update documentation with migration guide"
    echo "  4. Communicate breaking changes to users"
    echo ""
fi
