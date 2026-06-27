import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatClock,
  normalizeAnswer,
} from './format';

describe('formatDuration', () => {
  it('formats milliseconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(600_000)).toBe('10:00');
  });
  it('never goes negative', () => {
    expect(formatDuration(-5000)).toBe('0:00');
  });
});

describe('formatClock', () => {
  it('zero-pads minutes and seconds', () => {
    expect(formatClock(5)).toBe('00:05');
    expect(formatClock(125)).toBe('02:05');
  });
});

describe('normalizeAnswer', () => {
  it('strips accents, case and punctuation', () => {
    expect(normalizeAnswer('Éléphant')).toBe('elephant');
    expect(normalizeAnswer('  Côte d’Ivoire ')).toBe('cote d ivoire');
    expect(normalizeAnswer('FRANCE')).toBe('france');
  });
  it('treats equivalent spacing as equal', () => {
    expect(normalizeAnswer('New-York')).toBe(normalizeAnswer('new york'));
  });
});
