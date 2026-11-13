import { createHash, timingSafeEqual } from "node:crypto";

const entryPattern = /^[a-zA-Z0-9@_-]{16,100}$/;
const reserved = new Set(["admin","omarshark-junior-panam"]);

export function normalizeConsoleEntry(value: string | undefined): string | null {
  if (!value) return null;
  const entry = value.startsWith("/") ? value.slice(1) : value;
  return entryPattern.test(entry) && !reserved.has(entry) ? entry : null;
}

/** Only the secret supplies the private address. No database or code fallback. */
export function getConsoleEntryPath(): string | null {
  const entry = normalizeConsoleEntry(process.env.ADMIN_PATH);
  return entry ? `/${entry}` : null;
}

export async function matchesConsoleEntry(value: string): Promise<boolean> {
  const expected = normalizeConsoleEntry(process.env.ADMIN_PATH);
  if (!expected || !entryPattern.test(value)) return false;
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(value),digest(expected));
}
