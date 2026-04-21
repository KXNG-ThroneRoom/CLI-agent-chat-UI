#!/usr/bin/env bash
# Generate electron/icon.icns and electron/icon.png from electron/icon.svg.
# Requires macOS (iconutil is built in) and one of: rsvg-convert, inkscape,
# or the built-in `qlmanage`.
#
# Usage:  ./electron/make-icon.sh

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SVG="$HERE/icon.svg"
ICONSET="$HERE/icon.iconset"
OUT_ICNS="$HERE/icon.icns"
OUT_PNG="$HERE/icon.png"

if [[ ! -f "$SVG" ]]; then
  echo "Missing $SVG"; exit 1
fi

render() {
  local size="$1" out="$2"
  if command -v rsvg-convert >/dev/null 2>&1; then
    rsvg-convert -w "$size" -h "$size" "$SVG" -o "$out"
  elif command -v inkscape >/dev/null 2>&1; then
    inkscape "$SVG" --export-type=png --export-filename="$out" -w "$size" -h "$size"
  elif command -v sips >/dev/null 2>&1 && command -v qlmanage >/dev/null 2>&1; then
    qlmanage -t -s "$size" -o "$HERE" "$SVG" >/dev/null 2>&1
    mv "$HERE/icon.svg.png" "$out"
  else
    echo "Need rsvg-convert, inkscape, or qlmanage. Install with:  brew install librsvg" >&2
    exit 1
  fi
}

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

# macOS requires these specific sizes for iconutil.
render 16    "$ICONSET/icon_16x16.png"
render 32    "$ICONSET/icon_16x16@2x.png"
render 32    "$ICONSET/icon_32x32.png"
render 64    "$ICONSET/icon_32x32@2x.png"
render 128   "$ICONSET/icon_128x128.png"
render 256   "$ICONSET/icon_128x128@2x.png"
render 256   "$ICONSET/icon_256x256.png"
render 512   "$ICONSET/icon_256x256@2x.png"
render 512   "$ICONSET/icon_512x512.png"
render 1024  "$ICONSET/icon_512x512@2x.png"

# Copy the largest as a plain PNG fallback for dock on Linux/Win.
cp "$ICONSET/icon_512x512@2x.png" "$OUT_PNG"

iconutil -c icns -o "$OUT_ICNS" "$ICONSET"
rm -rf "$ICONSET"

echo "Generated:"
echo "  $OUT_ICNS"
echo "  $OUT_PNG"
