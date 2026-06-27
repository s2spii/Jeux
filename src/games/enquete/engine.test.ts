import { describe, it, expect } from 'vitest';
import {
  generateCase,
  solve,
  scoreCase,
  explainSolution,
  type Difficulty,
} from './engine';

const DIFFS: Difficulty[] = ['facile', 'normal', 'difficile'];

describe('enquete engine — unique solution guarantee', () => {
  it('every generated case has exactly one consistent solution', () => {
    for (const diff of DIFFS) {
      for (let i = 0; i < 12; i++) {
        const c = generateCase(`seed-${diff}-${i}`, diff);
        const mandatory = c.clues.filter((cl) => !cl.optional);
        const { count, first } = solve(mandatory, c.suspects.length, 5);
        expect(count, `case ${c.id} should be unique`).toBe(1);
        // The unique solution must match the generator's stored solution.
        expect(first?.lieu).toEqual(c.solution.lieu);
        expect(first?.objet).toEqual(c.solution.objet);
      }
    }
  });

  it('culprit is the suspect matching both crime facts', () => {
    for (let i = 0; i < 10; i++) {
      const c = generateCase(`culprit-${i}`, 'normal');
      const culprit = c.solution.culprit;
      expect(c.solution.lieu[culprit]).toBe(c.crimeLieu);
      expect(c.solution.objet[culprit]).toBe(c.crimeObjet);
      // No other suspect shares both facts.
      const others = c.suspects
        .map((_, s) => s)
        .filter(
          (s) =>
            s !== culprit &&
            c.solution.lieu[s] === c.crimeLieu &&
            c.solution.objet[s] === c.crimeObjet,
        );
      expect(others).toHaveLength(0);
    }
  });

  it('is reproducible from the same seed', () => {
    const a = generateCase('repro', 'difficile');
    const b = generateCase('repro', 'difficile');
    expect(a.clues.map((c) => c.text)).toEqual(b.clues.map((c) => c.text));
    expect(a.solution).toEqual(b.solution);
  });

  it('produces different cases for different seeds', () => {
    const a = generateCase('one', 'normal');
    const b = generateCase('two', 'normal');
    expect(a.solution).not.toEqual(b.solution);
  });

  it('mandatory clue set is minimal (no redundant clue)', () => {
    const c = generateCase('minimal', 'normal');
    const mandatory = c.clues.filter((cl) => !cl.optional);
    for (let i = 0; i < mandatory.length; i++) {
      const without = mandatory.filter((_, idx) => idx !== i);
      // Removing any mandatory clue must break uniqueness.
      expect(solve(without, c.suspects.length, 5).count).toBeGreaterThan(1);
    }
  });
});

describe('enquete scoring', () => {
  it('awards zero when unsolved', () => {
    const s = scoreCase({
      solved: false,
      durationMs: 100000,
      hintsUsed: 0,
      optionalCluesRevealed: 0,
      wrongAccusations: 3,
      difficulty: 'normal',
    });
    expect(s.total).toBe(0);
  });

  it('rewards fast, hint-free solving and penalizes mistakes', () => {
    const clean = scoreCase({
      solved: true,
      durationMs: 30000,
      hintsUsed: 0,
      optionalCluesRevealed: 0,
      wrongAccusations: 0,
      difficulty: 'difficile',
    });
    const messy = scoreCase({
      solved: true,
      durationMs: 300000,
      hintsUsed: 3,
      optionalCluesRevealed: 3,
      wrongAccusations: 2,
      difficulty: 'difficile',
    });
    expect(clean.total).toBeGreaterThan(messy.total);
    expect(clean.total).toBeGreaterThan(0);
  });
});

describe('explainSolution', () => {
  it('names the culprit', () => {
    const c = generateCase('explain', 'facile');
    const lines = explainSolution(c);
    expect(lines.join(' ')).toContain(c.suspects[c.solution.culprit]);
  });
});
