/** Where a photo sits in its bucket, read back from its public URL. Null for a foreign URL. */
export function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const start = url.indexOf(marker);
  if (start < 0) return null;
  const path = url.slice(start + marker.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
}

/** New photos go last: the first one may be the page's cover, it must not change by itself. */
export function nextPortfolioOrder(items: readonly { sort_order: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
}
