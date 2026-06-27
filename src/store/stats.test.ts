import { describe, it, expect, beforeEach } from 'vitest';
import { useStats } from './stats';

function reset() {
  useStats.setState({ history: [], unlocked: [], pendingUnlocks: [] });
  localStorage.clear();
}

const base = {
  game: 'petitbac' as const,
  userId: 'u1',
  username: 'Tester',
  mode: 'solo',
  meta: {},
};

describe('stats store', () => {
  beforeEach(reset);

  it('records entries and aggregates per-game stats', () => {
    useStats.getState().record({ ...base, score: 30 });
    useStats.getState().record({ ...base, score: 50 });
    const s = useStats.getState().statsFor('petitbac', 'u1');
    expect(s.played).toBe(2);
    expect(s.best).toBe(50);
    expect(s.total).toBe(80);
    expect(s.avg).toBe(40);
  });

  it('unlocks the first-steps achievement on first game', () => {
    const { newAchievements } = useStats
      .getState()
      .record({ ...base, score: 10 });
    expect(newAchievements).toContain('first-steps');
    expect(useStats.getState().unlocked).toContain('first-steps');
  });

  it('unlocks polyglot after playing all three games', () => {
    useStats.getState().record({ ...base, game: 'petitbac', score: 1 });
    useStats.getState().record({ ...base, game: 'enquete', score: 1 });
    const { newAchievements } = useStats
      .getState()
      .record({ ...base, game: 'paradoxes', score: 1 });
    expect(newAchievements).toContain('polyglot');
  });

  it('separates history by user', () => {
    useStats.getState().record({ ...base, userId: 'u1', score: 10 });
    useStats.getState().record({ ...base, userId: 'u2', score: 20 });
    expect(useStats.getState().historyFor('u1')).toHaveLength(1);
    expect(useStats.getState().statsFor('petitbac', 'u2').best).toBe(20);
  });
});
