#!/usr/bin/env bash
# Free-plan path: static HTML + /_next/static for the thin worker.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

html=".next/server/app/index.html"
static=".next/static"

if [[ ! -f "$html" ]]; then
  echo "missing $html — run next build first" >&2
  exit 1
fi
if [[ ! -d "$static" ]]; then
  echo "missing $static — run next build first" >&2
  exit 1
fi

rm -rf deploy-assets
mkdir -p deploy-assets/_next
cp "$html" deploy-assets/index.html
cp -R "$static" deploy-assets/_next/static

if [[ -f app/favicon.ico ]]; then
  cp app/favicon.ico deploy-assets/favicon.ico
fi

if [[ -d public ]]; then
  cp -R public/. deploy-assets/
  rm -f deploy-assets/.gitkeep
fi

echo "packed deploy-assets/ from next build"
