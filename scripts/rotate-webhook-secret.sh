#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN is not set."
  echo "Export it before running this script:"
  echo "  export CLOUDFLARE_API_TOKEN=your-token"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

NEW_SECRET="$(openssl rand -hex 32)"

echo "Generated new webhook secret."
echo ""

cd "$PROJECT_ROOT/apps/webhook"
echo "$NEW_SECRET" | wrangler secret put GITHUB_WEBHOOK_SECRET

echo ""
echo "New GITHUB_WEBHOOK_SECRET:"
echo "$NEW_SECRET"
echo ""
echo "Copy the secret above, then update the GitHub App webhook:"
echo "  https://github.com/settings/apps → MinhAgent → Webhook secret"
