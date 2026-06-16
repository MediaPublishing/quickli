#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_name="${PAGES_PROJECT_NAME:-quickli-landing}"

if ! wrangler pages project list | rg -q "$project_name"; then
  wrangler pages project create "$project_name" --production-branch main
fi

"$repo_root/scripts/build-release-assets.sh"
"$repo_root/scripts/build-pages-site.sh"

wrangler pages deploy "$repo_root/dist/pages-site" --project-name "$project_name" --commit-dirty=true
