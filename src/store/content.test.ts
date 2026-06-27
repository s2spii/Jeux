import { describe, it, expect, beforeEach } from 'vitest';
import { useContent } from './content';

function reset() {
  useContent.getState().reset();
  localStorage.clear();
}

describe('content store (admin)', () => {
  beforeEach(reset);

  it('publishes and toggles announcements', () => {
    useContent.getState().addAnnouncement({ title: 'Tournoi', body: 'Ce week-end', active: true });
    const ann = useContent.getState().announcements;
    expect(ann).toHaveLength(1);
    useContent.getState().toggleAnnouncement(ann[0].id);
    expect(useContent.getState().announcements[0].active).toBe(false);
    useContent.getState().removeAnnouncement(ann[0].id);
    expect(useContent.getState().announcements).toHaveLength(0);
  });

  it('manages custom Petit Bac categories', () => {
    useContent.getState().addCategory('Super-héros', '🦸');
    const cats = useContent.getState().customCategories;
    expect(cats).toHaveLength(1);
    expect(cats[0].label).toBe('Super-héros');
    useContent.getState().removeCategory(cats[0].id);
    expect(useContent.getState().customCategories).toHaveLength(0);
  });

  it('adds custom enquete cases with a generated seed', () => {
    useContent.getState().addCase({
      name: 'Affaire test',
      templateId: 'manoir',
      difficulty: 'normal',
      brief: 'x',
    });
    const cases = useContent.getState().customCases;
    expect(cases).toHaveLength(1);
    expect(cases[0].seed).toBeTruthy();
  });

  it('updates forbidden letters and score config', () => {
    useContent.getState().setForbiddenLetters(['k', 'w']);
    expect(useContent.getState().forbiddenLetters).toEqual(['K', 'W']);
    useContent.getState().setPetitBacScore({ unique: 12, shared: 4 });
    expect(useContent.getState().petitBacScore.unique).toBe(12);
  });
});
