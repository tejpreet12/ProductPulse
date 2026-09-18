export function parseProductId(
  raw: string | string[] | undefined,
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function extractRoute(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const route = (data as { route?: unknown }).route;
  if (typeof route !== "string") return null;
  if (!/^\/products\/\d+$/.test(route)) return null;

  return route;
}
