import { parseProductId } from "@/lib/validation";

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const match = /^\/products\/([^/?#]+)/.exec(path);
    if (match && parseProductId(match[1]) === null) return "/unknown-link";
    return path;
  } catch {
    return "/unknown-link";
  }
}
