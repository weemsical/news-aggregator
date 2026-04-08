/**
 * Deterministic hash for tiebreaking article order.
 * Same inputs produce the same result; different dates or IDs produce different results.
 */
export function dateSeededHash(articleId: string, dateString: string): number {
  const str = articleId + dateString;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // unsigned 32-bit
}
