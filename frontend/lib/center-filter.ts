/** Append {@code centerId} query param for centre-scoped list APIs. */
export function buildCenterFilterUrl(baseUrl: string, centerId: string | null): string {
  if (!centerId) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}centerId=${encodeURIComponent(centerId)}`;
}
