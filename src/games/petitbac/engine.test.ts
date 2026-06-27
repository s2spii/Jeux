import { describe, it, expect } from 'vitest';
import {
  isValidAnswer,
  scoreRound,
  drawLetter,
  drawCategories,
  type RoundConfig,
  type PlayerRound,
} from './engine';

const baseConfig: RoundConfig = {
  letter: 'A',
  categories: ['animal', 'pays', 'ville'],
  durationSec: 60,
  minLength: 1,
  doubling: false,
};

describe('isValidAnswer', () => {
  it('accepts answers starting with the letter (accent-insensitive)', () => {
    expect(isValidAnswer('Âne', 'A')).toBe(true);
    expect(isValidAnswer('autruche', 'A')).toBe(true);
  });
  it('rejects wrong letter or empty', () => {
    expect(isValidAnswer('Chat', 'A')).toBe(false);
    expect(isValidAnswer('   ', 'A')).toBe(false);
  });
  it('enforces minimum length', () => {
    expect(isValidAnswer('As', 'A', 6)).toBe(false);
    expect(isValidAnswer('Antilope', 'A', 6)).toBe(true);
  });
});

describe('scoreRound — base rules', () => {
  it('awards 10 for a valid unique answer in solo', () => {
    const players: PlayerRound[] = [
      { id: 'p1', name: 'Solo', answers: { animal: 'Autruche', pays: '', ville: '' } },
    ];
    const [s] = scoreRound(baseConfig, players);
    expect(s.results.find((r) => r.category === 'animal')?.points).toBe(10);
    expect(s.results.find((r) => r.category === 'pays')?.status).toBe('empty');
    expect(s.basePoints).toBe(10);
  });

  it('awards 5 to each player for a shared answer, 10 for unique', () => {
    const players: PlayerRound[] = [
      { id: 'p1', name: 'A', answers: { animal: 'Antilope', pays: 'Allemagne', ville: '' } },
      { id: 'p2', name: 'B', answers: { animal: 'Antilope', pays: 'Argentine', ville: '' } },
    ];
    const [a, b] = scoreRound(baseConfig, players);
    expect(a.results.find((r) => r.category === 'animal')?.status).toBe('shared');
    expect(a.results.find((r) => r.category === 'animal')?.points).toBe(5);
    expect(b.results.find((r) => r.category === 'animal')?.points).toBe(5);
    // pays answers differ → unique → 10 each
    expect(a.results.find((r) => r.category === 'pays')?.points).toBe(10);
  });

  it('treats accented/spacing variants as the same answer (duplicate)', () => {
    const players: PlayerRound[] = [
      { id: 'p1', name: 'A', answers: { ville: 'Amiens', animal: '', pays: '' } },
      { id: 'p2', name: 'B', answers: { ville: 'amiens ', animal: '', pays: '' } },
    ];
    const [a] = scoreRound(baseConfig, players);
    expect(a.results.find((r) => r.category === 'ville')?.status).toBe('shared');
  });

  it('scores invalid answers as 0', () => {
    const players: PlayerRound[] = [
      { id: 'p1', name: 'A', answers: { animal: 'Zèbre', pays: '', ville: '' } },
    ];
    const [a] = scoreRound(baseConfig, players);
    expect(a.results.find((r) => r.category === 'animal')?.status).toBe('invalid');
    expect(a.basePoints).toBe(0);
  });
});

describe('scoreRound — combo and speed', () => {
  it('grants a combo bonus for consecutive valid answers', () => {
    const players: PlayerRound[] = [
      {
        id: 'p1',
        name: 'A',
        answers: { animal: 'Aigle', pays: 'Angola', ville: 'Annecy' },
      },
    ];
    const [a] = scoreRound(baseConfig, players);
    expect(a.maxCombo).toBe(3);
    expect(a.comboBonus).toBeGreaterThan(0);
  });

  it('resets combo when an answer is missing', () => {
    const players: PlayerRound[] = [
      {
        id: 'p1',
        name: 'A',
        answers: { animal: 'Aigle', pays: '', ville: 'Annecy' },
      },
    ];
    const [a] = scoreRound(baseConfig, players);
    expect(a.maxCombo).toBe(1);
  });

  it('adds a speed bonus when submitted early', () => {
    const players: PlayerRound[] = [
      { id: 'p1', name: 'A', answers: { animal: 'Aigle' }, submittedAt: 10 },
    ];
    const [a] = scoreRound(baseConfig, players);
    expect(a.speedBonus).toBe(Math.round((60 - 10) * 0.5));
    expect(a.total).toBe(a.basePoints + a.comboBonus + a.speedBonus);
  });
});

describe('special-letter doubling', () => {
  it('doubles points when doubling is on', () => {
    const cfg = { ...baseConfig, doubling: true };
    const players: PlayerRound[] = [
      { id: 'p1', name: 'A', answers: { animal: 'Aigle' } },
    ];
    const [a] = scoreRound(cfg, players);
    expect(a.results.find((r) => r.category === 'animal')?.points).toBe(20);
  });
});

describe('letter and category draw', () => {
  it('is deterministic for a seed', () => {
    expect(drawLetter('day-1')).toBe(drawLetter('day-1'));
    expect(drawCategories('day-1', 6)).toEqual(drawCategories('day-1', 6));
  });
  it('draws the requested number of distinct categories', () => {
    const cats = drawCategories('x', 8, true);
    expect(cats).toHaveLength(8);
    expect(new Set(cats).size).toBe(8);
  });
});
