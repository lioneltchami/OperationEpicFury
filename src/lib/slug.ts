/**
 * Generate a URL-safe slug from an English headline.
 * e.g. "First Explosions Rock Tehran" → "first-explosions-rock-tehran"
 *
 * If duplicates exist, appends a numeric suffix: "slug-2", "slug-3", etc.
 */
export function generateSlug(
  headline: string,
  existingSlugs: Set<string> = new Set(),
): string {
  if (!headline) return `event-${Date.now()}`;
  const slug = headline
    .toLowerCase()
    .replace(/['']/g, "") // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 80); // cap length

  if (!existingSlugs.has(slug)) return slug;

  // Deduplicate
  let i = 2;
  while (existingSlugs.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}
