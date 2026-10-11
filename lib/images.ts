// Demo-safe image helpers.
//
// Real product photography is uploaded by admins (Cloudinary / any CDN) and
// stored as absolute URLs. When a product has no image yet, we render an
// on-brand generated placeholder from /api/img so the UI never shows a broken
// image or an irrelevant stock photo.

export function placeholderUrl(label: string, opts?: { w?: number; h?: number; sub?: string }): string {
  const params = new URLSearchParams();
  params.set("label", label);
  if (opts?.sub) params.set("sub", opts.sub);
  params.set("w", String(opts?.w ?? 800));
  params.set("h", String(opts?.h ?? 1000));
  return `/api/img?${params.toString()}`;
}

export function firstImage(
  images: { url: string }[] | undefined,
  label: string,
  sub?: string,
): string {
  if (images && images.length > 0) return images[0].url;
  return placeholderUrl(label, { sub });
}
