/**
 * Deterministic, seedable pseudo-random number generator.
 *
 * Used everywhere reproducibility matters: daily challenges (same seed for
 * everyone on a given day), procedurally generated paradox levels, and the
 * "replay with a different configuration" mode of the investigation game.
 */

/** Hash an arbitrary string into a 32-bit integer seed (xfnv1a). */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good-enough PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;

  constructor(seed: number | string) {
    const numeric = typeof seed === 'string' ? hashSeed(seed) : seed;
    this.next = mulberry32(numeric);
  }

  /** Float in [0, 1). */
  float(): number {
    return this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick a random element from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick: empty array');
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Return a new array shuffled with Fisher–Yates (non-mutating). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Pick `count` distinct elements. */
  sample<T>(arr: readonly T[], count: number): T[] {
    return this.shuffle(arr).slice(0, Math.min(count, arr.length));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Stable seed string for a given date (UTC) — used by daily challenges. */
export function dailySeed(prefix: string, date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${prefix}-${y}-${m}-${d}`;
}
