import { describe, it, expect } from 'vitest';
import { Rng, hashSeed, dailySeed } from './rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng('hello');
    const b = new Rng('hello');
    const seqA = Array.from({ length: 10 }, () => a.float());
    const seqB = Array.from({ length: 10 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = new Rng('hello');
    const b = new Rng('world');
    expect(a.float()).not.toEqual(b.float());
  });

  it('int respects bounds', () => {
    const r = new Rng(42);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('shuffle keeps the same elements and is deterministic', () => {
    const arr = [1, 2, 3, 4, 5];
    const s1 = new Rng('s').shuffle(arr);
    const s2 = new Rng('s').shuffle(arr);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]); // non-mutating
  });

  it('sample returns distinct elements', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const picked = new Rng('x').sample(arr, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('pick throws on empty array', () => {
    expect(() => new Rng(1).pick([])).toThrow();
  });
});

describe('hashSeed', () => {
  it('produces stable 32-bit hashes', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
  });
});

describe('dailySeed', () => {
  it('encodes the UTC date', () => {
    const d = new Date(Date.UTC(2026, 5, 27));
    expect(dailySeed('paradoxes', d)).toBe('paradoxes-2026-06-27');
  });
});
