/** Shared helpers for the Netlify Functions backend. */

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export function ok(body: unknown) {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function bad(status: number, error: string) {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify({ error }) };
}

const VALID_GAMES = new Set(['enquete', 'petitbac', 'paradoxes']);

export function isValidGame(g: unknown): g is string {
  return typeof g === 'string' && VALID_GAMES.has(g);
}

/** Clamp + sanitize a username coming from the network. */
export function cleanName(name: unknown): string {
  if (typeof name !== 'string') return 'Anonyme';
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 20) || 'Anonyme';
}

/** Clamp a score to a sane integer range (anti-cheat: reject absurd values). */
export function cleanScore(score: unknown): number {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1_000_000, Math.round(n)));
}

/**
 * Very small in-memory rate limiter (best-effort; serverless instances are
 * ephemeral but this still curbs bursts within a warm instance).
 */
const hits = new Map<string, { count: number; ts: number }>();
export function rateLimited(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.ts > windowMs) {
    hits.set(key, { count: 1, ts: now });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
