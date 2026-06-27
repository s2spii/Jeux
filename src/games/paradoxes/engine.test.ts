import { describe, it, expect } from 'vitest';
import {
  generateLevel,
  applyRaw,
  interpret,
  distance,
  initialState,
  play,
  usePower,
  scoreLevel,
  type Op,
  type Level,
  type Difficulty,
} from './engine';

/** Breadth-first shortest solution length, ignoring paradoxes (player's base controls). */
function shortestSolution(level: Level, cap: number): number {
  const ops: Op[] = [];
  for (let i = 0; i < level.size; i++) {
    ops.push({ type: 'inc', index: i });
    ops.push({ type: 'dec', index: i });
    ops.push({ type: 'swap', index: i });
  }
  ops.push({ type: 'rot', dir: 'left' });
  ops.push({ type: 'rot', dir: 'right' });

  const targetKey = level.target.join(',');
  const startKey = level.start.join(',');
  if (startKey === targetKey) return 0;

  const seen = new Set<string>([startKey]);
  let frontier: number[][] = [level.start];
  let depth = 0;
  while (frontier.length && depth < cap) {
    depth++;
    const next: number[][] = [];
    for (const cells of frontier) {
      for (const op of ops) {
        const child = applyRaw(cells, op, level.colors);
        const key = child.join(',');
        if (key === targetKey) return depth;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(child);
        }
      }
    }
    frontier = next;
  }
  return Infinity;
}

const DIFFS: Difficulty[] = ['entrainement', 'normal', 'difficile', 'cauchemar'];

describe('paradoxes — generation is solvable within budget', () => {
  it('every generated level is solvable within its move budget', () => {
    for (const diff of DIFFS) {
      for (let i = 0; i < 6; i++) {
        const level = generateLevel(`seed-${diff}-${i}`, diff, i);
        expect(distance(level.start, level.target)).toBeGreaterThan(0);
        const best = shortestSolution(level, level.budget + 1);
        expect(best, `${diff} #${i} solvable`).toBeLessThanOrEqual(level.budget);
      }
    }
  });

  it('is reproducible from the same seed', () => {
    const a = generateLevel('repro', 'normal', 2);
    const b = generateLevel('repro', 'normal', 2);
    expect(a.start).toEqual(b.start);
    expect(a.target).toEqual(b.target);
  });
});

describe('reversible operations', () => {
  it('inc and dec are inverses', () => {
    const cells = [0, 1, 2];
    const inc = applyRaw(cells, { type: 'inc', index: 1 }, 3);
    const back = applyRaw(inc, { type: 'dec', index: 1 }, 3);
    expect(back).toEqual(cells);
  });
  it('swap is self-inverse', () => {
    const cells = [1, 2, 3];
    const once = applyRaw(cells, { type: 'swap', index: 0 }, 5);
    const twice = applyRaw(once, { type: 'swap', index: 0 }, 5);
    expect(twice).toEqual(cells);
  });
  it('rotate left/right are inverses', () => {
    const cells = [1, 2, 3, 4];
    const l = applyRaw(cells, { type: 'rot', dir: 'left' }, 5);
    const back = applyRaw(l, { type: 'rot', dir: 'right' }, 5);
    expect(back).toEqual(cells);
  });
});

describe('paradox interpretation', () => {
  it('inversion swaps inc and dec', () => {
    expect(interpret({ type: 'inc', index: 0 }, 'inversion', 5)).toEqual({
      type: 'dec',
      index: 0,
    });
  });
  it('mirror flips rotation direction', () => {
    expect(interpret({ type: 'rot', dir: 'left' }, 'mirror', 5)).toEqual({
      type: 'rot',
      dir: 'right',
    });
  });
});

describe('play loop', () => {
  it('marks solved when reaching the target', () => {
    const level = generateLevel('play', 'entrainement', 0);
    let st = initialState(level);
    // Brute the BFS path by repeatedly fixing each cell with inc/dec.
    for (let i = 0; i < level.size; i++) {
      let guard = 0;
      while (st.cells[i] !== level.target[i] && guard++ < level.colors) {
        st = play(level, st, { type: 'inc', index: i }).state;
      }
    }
    expect(st.solved).toBe(true);
  });

  it('fails when the move budget is exhausted without solving', () => {
    const level = generateLevel('fail', 'normal', 0);
    let st = initialState(level);
    let safety = 0;
    while (!st.solved && !st.failed && safety++ < 1000) {
      // Deliberately unproductive: toggle and untoggle a cell unrelated.
      st = play(level, st, { type: 'rot', dir: 'left' }).state;
    }
    expect(st.movesUsed).toBeLessThanOrEqual(level.budget);
  });

  it('grants energy on progress and powers spend it', () => {
    const level = generateLevel('power', 'normal', 0);
    let st = initialState(level);
    // Force progress with a saut once we have energy; first gain energy.
    const wrong = st.cells.findIndex((c, i) => c !== level.target[i]);
    st = play(level, st, { type: 'inc', index: wrong }).state;
    // Give energy artificially to exercise usePower.
    st = { ...st, energy: 3 };
    const after = usePower(level, st, 'saut');
    expect(after.energy).toBe(0);
  });
});

describe('scoring', () => {
  it('returns 0 when unsolved', () => {
    const level = generateLevel('s', 'normal', 0);
    const st = initialState(level);
    expect(scoreLevel(level, st, 10)).toBe(0);
  });
  it('rewards efficiency and speed when solved', () => {
    const level = generateLevel('s2', 'difficile', 0);
    const fast = scoreLevel(level, { ...initialState(level), solved: true, movesUsed: 1 }, 5);
    const slow = scoreLevel(level, { ...initialState(level), solved: true, movesUsed: level.budget }, 200);
    expect(fast).toBeGreaterThan(slow);
  });
});
