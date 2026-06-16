#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
site_dir="$repo_root/dist/pages-site"

required_files=(
  "$repo_root/dist/quickli-obsidian-plugin.zip"
  "$repo_root/dist/quickli-wordpress-plugin.zip"
  "$repo_root/landing/index.html"
  "$repo_root/landing/app.js"
  "$repo_root/landing/_headers"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'Missing required site asset: %s\nRun ./scripts/build-release-assets.sh first.\n' "$file" >&2
    exit 1
  fi
done

rm -rf "$site_dir"
mkdir -p "$site_dir/downloads" "$site_dir/assets"

cp -R "$repo_root/assets/." "$site_dir/assets/"
cp "$repo_root/landing/index.html" "$site_dir/index.html"
cp "$repo_root/landing/app.js" "$site_dir/app.js"
cp "$repo_root/landing/_headers" "$site_dir/_headers"
cp "$repo_root/dist/quickli-obsidian-plugin.zip" "$site_dir/downloads/quickli-obsidian-plugin.zip"
cp "$repo_root/dist/quickli-wordpress-plugin.zip" "$site_dir/downloads/quickli-wordpress-plugin.zip"
find "$site_dir" -name '.DS_Store' -delete

printf 'Built Pages site at %s\n' "$site_dir"
