#!/usr/bin/env bash
# Runs the visual tests inside the exact image CI uses, so a baseline never
# differs from CI by font rasterizing or architecture. Needs Docker.
#   pnpm --filter @snapshot-ui/storybook visual:docker            # regenerate
#   pnpm --filter @snapshot-ui/storybook visual:docker -- --check # compare only
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

ARGS=(--update-snapshots)
if [[ "${1:-}" == "--check" ]]; then
  ARGS=()
fi
# ${ARGS[@]+...} expands an empty array safely under `set -u` in bash 3.2 (macOS).

pnpm run build
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$ROOT":/work -w /work/apps/storybook \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  node node_modules/@playwright/test/cli.js test ${ARGS[@]+"${ARGS[@]}"}
