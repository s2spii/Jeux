/** Shared helpers for the Netlify Functions backend. */
import type { HandlerEvent } from '@netlify/functions';
import { getStore, connectLambda, type Store } from '@netlify/blobs';

/**
 * Returns a Netlify Blobs store, wired for the **Lambda-compatibility** function
 * signature. With this signature, `@netlify/blobs` cannot auto-discover its
 * context, so we MUST call `connectLambda(event)` first — otherwise `getStore`
 * throws and the function returns a 502. (This was the cause of the online-mode
 * 502.) `connectLambda` is idempotent and safe to call on every invocation.
 */
export function blobStore(event: HandlerEvent, name: string): Store {
  // `connectLambda` expects the raw Lambda event (with the injected `blobs`
  // context field), which is a superset of HandlerEvent at runtime.
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
  return getStore(name);
}

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export interface FnResponse {
  statusCode: number;
  headers: typeof JSON_HEADERS;
  body: string;
}

export function ok(body: unknown): FnResponse {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function bad(status: number, error: string): FnResponse {
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
