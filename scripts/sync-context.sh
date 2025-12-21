#!/usr/bin/env bash
#
# sync-context.sh - Synchronize the Janus Context Bridge
#
# This script ensures the janus-context directory stays in sync:
# - Syncs MANIFESTO.md to janus-context/manifesto/
# - Validates JSON state files
# - Optionally commits and pushes changes
#
# Dependencies:
# - Python 3 (for JSON validation)
#
# Usage: ./scripts/sync-context.sh [--commit] [--push]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTEXT_DIR="$PROJECT_ROOT/janus-context"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
COMMIT=false
PUSH=false

for arg in "$@"; do
  case $arg in
    --commit)
      COMMIT=true
      ;;
    --push)
      PUSH=true
      COMMIT=true  # Push implies commit
      ;;
    --help|-h)
      echo "Usage: $0 [--commit] [--push]"
      echo ""
      echo "Options:"
      echo "  --commit  Commit context changes to git"
      echo "  --push    Commit and push context changes"
      exit 0
      ;;
  esac
done

echo -e "${GREEN}=== Janus Context Sync ===${NC}"

# 1. Sync MANIFESTO.md to context directory
echo -e "\n${YELLOW}Syncing MANIFESTO.md...${NC}"
if [[ -f "$PROJECT_ROOT/MANIFESTO.md" ]]; then
  mkdir -p "$CONTEXT_DIR/manifesto"
  cp "$PROJECT_ROOT/MANIFESTO.md" "$CONTEXT_DIR/manifesto/MANIFESTO.md"
  echo -e "${GREEN}✓ MANIFESTO.md synced to janus-context/manifesto/${NC}"
else
  echo -e "${RED}✗ MANIFESTO.md not found in project root${NC}"
  exit 1
fi

# 2. Ensure required directories exist
echo -e "\n${YELLOW}Ensuring directory structure...${NC}"
REQUIRED_DIRS=(
  "$CONTEXT_DIR/sessions"
  "$CONTEXT_DIR/decisions"
  "$CONTEXT_DIR/state"
  "$CONTEXT_DIR/state/delegations"
  "$CONTEXT_DIR/artifacts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  mkdir -p "$dir"
  # Ensure .gitkeep exists for empty directories
  if [[ -z "$(ls -A "$dir" 2>/dev/null)" ]]; then
    touch "$dir/.gitkeep"
  fi
done
echo -e "${GREEN}✓ Directory structure verified${NC}"

# 3. Validate JSON state files
echo -e "\n${YELLOW}Validating state files...${NC}"
STATE_FILES=(
  "$CONTEXT_DIR/state/current-focus.json"
  "$CONTEXT_DIR/state/open-questions.json"
)

for file in "${STATE_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
      echo -e "${GREEN}✓ $(basename "$file") is valid JSON${NC}"
    else
      echo -e "${RED}✗ $(basename "$file") contains invalid JSON${NC}"
      exit 1
    fi
  else
    # Create empty state file if missing
    echo "{}" > "$file"
    echo -e "${YELLOW}Created empty $(basename "$file")${NC}"
  fi
done

# 4. Generate context summary
echo -e "\n${YELLOW}Context Summary:${NC}"
SESSION_COUNT=$(find "$CONTEXT_DIR/sessions" -name "*.json" 2>/dev/null | wc -l)
DECISION_COUNT=$(find "$CONTEXT_DIR/decisions" -name "*.md" 2>/dev/null | wc -l)
ARTIFACT_COUNT=$(find "$CONTEXT_DIR/artifacts" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

echo "  Sessions:  $SESSION_COUNT"
echo "  Decisions: $DECISION_COUNT"
echo "  Artifacts: $ARTIFACT_COUNT"

# 5. Optionally commit changes
if [[ "$COMMIT" == true ]]; then
  echo -e "\n${YELLOW}Committing context changes...${NC}"
  cd "$PROJECT_ROOT"

  if git diff --quiet "$CONTEXT_DIR" && git diff --cached --quiet "$CONTEXT_DIR"; then
    echo -e "${GREEN}✓ No changes to commit${NC}"
  else
    git add "$CONTEXT_DIR"
    git commit -m "sync: Update janus-context state

- Synced MANIFESTO.md
- Updated context bridge state"
    echo -e "${GREEN}✓ Changes committed${NC}"
  fi
fi

# 6. Optionally push changes
if [[ "$PUSH" == true ]]; then
  echo -e "\n${YELLOW}Pushing to remote...${NC}"
  cd "$PROJECT_ROOT"
  BRANCH=$(git branch --show-current)
  git push -u origin "$BRANCH"
  echo -e "${GREEN}✓ Pushed to origin/$BRANCH${NC}"
fi

echo -e "\n${GREEN}=== Sync Complete ===${NC}"
