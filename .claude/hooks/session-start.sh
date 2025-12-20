#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install Node.js dependencies for Janus
cd "${CLAUDE_PROJECT_DIR:-/home/user/Janus}"

# Install npm dependencies
npm install

# Set up environment if .env doesn't exist
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# Ensure TypeScript builds correctly
npm run build 2>/dev/null || true

echo "Janus development environment ready"
