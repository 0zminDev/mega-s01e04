import type { DigestRow } from './types.js';

export function sortDigestRows(rows: readonly DigestRow[]): DigestRow[] {
  return [...rows].sort((left, right) =>
    left.job < right.job ? -1 : left.job > right.job ? 1 : 0,
  );
}
