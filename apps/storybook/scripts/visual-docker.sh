#!/usr/bin/env bash
# Runs the visual tests inside the exact image CI uses, so a baseline never
# differs from CI by font rasterizing or architecture. Needs Docker.
#   pnpm --filter @snapshot-ui/storybook visual:docker            # regenerate every baseline
#   pnpm --filter @snapshot-ui/storybook visual:docker -- --check # compare only, never writes
# Storybook is rebuilt first, with core and react, so the baselines always show
# the CSS and components as they are on disk.
# The repository is mounted whole, so pnpm's symlinked node_modules resolve.
# Only pure JavaScript runs in the container: Playwright, the test runner and
# http-server. The browsers come from the image.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"

# pnpm 10 passes the literal "--" of `visual:docker -- --check` on to the script.
if [[ "${1:-}" == "--" ]]; then
  shift
fi

usage() {
  echo 'usage: visual:docker [-- --check]' >&2
  exit 2
}

if [[ $# -gt 1 ]]; then
  usage
fi
# The output is deterministic, so regenerating unchanged images writes identical bytes.
case "${1:-}" in
  '') ARGS=(--update-snapshots=all) ;;
  --check) ARGS=(--update-snapshots=none) ;;
  *) usage ;;
esac

(cd "$ROOT" && pnpm turbo run build --filter=@snapshot-ui/storybook)
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$ROOT":/work -w /work/apps/storybook \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  node node_modules/@playwright/test/cli.js test "${ARGS[@]}"
