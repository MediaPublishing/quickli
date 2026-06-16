#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist_dir="$repo_root/dist"
stage_dir="$dist_dir/release-root"
obsidian_stage="$stage_dir/quickli-obsidian-plugin/quickli-share"
wordpress_stage="$stage_dir/quickli-wordpress-plugin/quickli-share"
obsidian_zip="$dist_dir/quickli-obsidian-plugin.zip"
wordpress_zip="$dist_dir/quickli-wordpress-plugin.zip"

mkdir -p "$dist_dir"
rm -rf "$stage_dir"
mkdir -p "$obsidian_stage" "$wordpress_stage"

pushd "$repo_root/obsidian-plugin" >/dev/null
npm run build
popd >/dev/null

cp "$repo_root/obsidian-plugin/manifest.json" "$obsidian_stage/manifest.json"
cp "$repo_root/obsidian-plugin/main.js" "$obsidian_stage/main.js"
cp "$repo_root/obsidian-plugin/styles.css" "$obsidian_stage/styles.css"
cp "$repo_root/wordpress-plugin/quickli-share.php" "$wordpress_stage/quickli-share.php"

rm -f "$obsidian_zip" "$wordpress_zip"
ditto -c -k --sequesterRsrc --keepParent "$stage_dir/quickli-obsidian-plugin" "$obsidian_zip"
ditto -c -k --sequesterRsrc --keepParent "$stage_dir/quickli-wordpress-plugin" "$wordpress_zip"

shasum -a 256 "$obsidian_zip" "$wordpress_zip"
printf 'Obsidian plugin %s\n' "$obsidian_zip"
printf 'WordPress plugin %s\n' "$wordpress_zip"
