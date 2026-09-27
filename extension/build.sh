#!/usr/bin/env bash
# Build the Porchlight Chrome extension (MV3) from a Next.js static export.
# Usage: ./extension/build.sh
# Output: extension/dist/ (load unpacked) and extension/porchlight-extension.zip (Web Store upload)
#
# Chrome Web Store constraints handled here:
# - manifest description must be <= 132 chars (kept short in extension/manifest.json)
# - no file paths may start with "_" (Next's _next dir is renamed to app-assets)
# - MV3 forbids inline scripts on extension pages (inline <script> blocks are
#   extracted to external .js files so the app actually runs under the MV3 CSP)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "-> static export"
PORCHLIGHT_EXPORT=1 npx next build

DIST="$ROOT/extension/dist"
rm -rf "$DIST"
mkdir -p "$DIST"
echo "-> copy export"
cp -r out/. "$DIST/"
rm -f "$DIST/sw.js"  # extensions use their own lifecycle; skip the PWA worker

echo "-> rename _next to app-assets (Chrome reserves _ paths)"
mv "$DIST/_next" "$DIST/app-assets"
grep -rl '/_next/' "$DIST" --include='*.html' --include='*.js' --include='*.css' --include='*.json' --include='*.webmanifest' | xargs sed -i 's|/_next/|/app-assets/|g'

echo "-> extract inline scripts (MV3 forbids them on extension pages)"
python3 - "$DIST" <<'EOF'
import os, re, sys
dist = sys.argv[1]
for dirpath, _, files in os.walk(dist):
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(dirpath, f)
        html = open(p, encoding='utf-8').read()
        state = {'n': 0}
        def repl(m):
            body = m.group(1)
            if not body.strip():
                return m.group(0)  # keep empty script tags as-is
            name = f'inline-{state["n"]}.js'
            state['n'] += 1
            open(os.path.join(dirpath, name), 'w', encoding='utf-8').write(body)
            return f'<script src="./{name}"></script>'
        new = re.sub(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', repl, html, flags=re.S)
        if new != html:
            open(p, 'w', encoding='utf-8').write(new)
            print(f'  {os.path.relpath(p, dist)}: extracted {state["n"]} inline script(s)')
EOF

echo "-> drop dead Next internals (unreferenced; some use reserved _ paths)"
rm -rf "$DIST/app-assets/static/chunks/pages"
rm -f "$DIST"/app-assets/static/*/_buildManifest.js "$DIST"/app-assets/static/*/_ssgManifest.js
rm -rf "$DIST/app-assets/static/chunks/app/_not-found"

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
