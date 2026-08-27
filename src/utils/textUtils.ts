/**
 * Utility functions for accent-insensitive and case-insensitive text search and normalization.
 */

/**
 * Normalizes a string by:
 * - Decomposing diacritics/accents via Unicode NFD (e.g. 'é' -> 'e' + combining accent)
 * - Removing all accent/diacritic combining marks (\u0300-\u036f)
 * - Converting to lowercase
 * - Trimming outer whitespace
 *
 * Example:
 * "Inteligência" -> "inteligencia"
 * "FORÇA" -> "forca"
 * "Espírito & Ilusão" -> "espirito & ilusao"
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks if target text contains the search query, ignoring case, accents, and diacritics.
 * If query is empty or only whitespace, returns true.
 */
export function matchesSearchQuery(
  target: string | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normalizedTarget = normalizeSearchText(target);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return true;
  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Checks if any of multiple target texts contains the search query.
 */
export function matchesAnySearchQuery(
  targets: (string | null | undefined)[],
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return targets.some((t) => {
    if (!t) return false;
    return normalizeSearchText(t).includes(normalizedQuery);
  });
}
