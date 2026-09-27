#!/usr/bin/env bash
# Build the Porchlight Chrome extension (MV3) from a Next.js static export.
# Usage: ./extension/build.sh
# Output: extension/dist/ (load unpacked) and extension/porchlight-extension.zip (Web Store upload)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "-> static export"
PORCHLIGHT_EXPORT=1 npx next build

DIST="$ROOT/extension/dist"
rm -rf "$DIST"
mkdir -p "$DIST/icons"
echo "-> copy export"
cp -r out/. "$DIST/"
rm -f "$DIST/sw.js"  # extensions use their own lifecycle; skip the PWA worker
echo "-> manifest"
cp "$ROOT/extension/manifest.json" "$DIST/manifest.json"
echo "-> icons"
for s in 16 48 128; do
  ffmpeg -y -v error -i "$ROOT/public/icons/icon-192.png" -vf "scale=${s}:${s}" "$DIST/icons/icon-${s}.png"
done
echo "-> zip"
rm -f "$ROOT/extension/porchlight-extension.zip"
(cd "$DIST" && zip -qr "$ROOT/extension/porchlight-extension.zip" .)
echo "done: $DIST"
du -sh "$ROOT/extension/porchlight-extension.zip"
