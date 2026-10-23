#!/usr/bin/env bash
# Imports site pictures (image spec names, e.g. h-01-hero.webp) into
# app/assets/images/site/: copies each file, adds a 640 px wide copy for
# srcset (<name>@640.webp) and rewrites site-images.json with every file's size,
# which <SiteImage> reads for width/height and srcset.
#
#   pnpm web images ../../seene_website_images h-01-hero c-01-manicure …
#
# Needs cwebp (brew install webp). Only the names given are imported, so
# pictures without a place on the site stay out of the bundle.
set -euo pipefail

src=${1:?source folder}
shift
out="$(cd "$(dirname "$0")/.." && pwd)/app/assets/images/site"
mkdir -p "$out"

for name in "$@"; do
  for file in "$src/$name.webp" "$src/$name-mobile.webp"; do
    [ -f "$file" ] || continue
    base=$(basename "$file" .webp)
    cp "$file" "$out/$base.webp"
    width=$(sips -g pixelWidth "$file" | awk '/pixelWidth/ { print $2 }')
    if [ "$width" -gt 640 ]; then
      cwebp -quiet -q 78 -resize 640 0 "$file" -o "$out/$base@640.webp"
    fi
  done
done

# Manifest of every picture in the folder: { "<file name>": [width, height] }
{
  echo "{"
  first=1
  for file in "$out"/*.webp; do
    name=$(basename "$file" .webp)
    size=$(sips -g pixelWidth -g pixelHeight "$file" | awk '/pixel/ { printf "%s,", $2 }')
    [ $first -eq 1 ] || echo ","
    printf '  "%s": [%s]' "$name" "${size%,}"
    first=0
  done
  echo
  echo "}"
} > "$out/site-images.json"
