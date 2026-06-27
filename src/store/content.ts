import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Category } from '../games/petitbac/categories';
import type { CampaignCase } from '../games/enquete/campaign';
import { uuid } from '../lib/id';

/**
 * Admin-editable content layer. Everything here is managed from the back-office
 * and overlays the built-in data, so new content can be added "sans modifier le
 * code applicatif principal" (cahier des charges §10).
 */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: number;
}

export interface PetitBacScoreConfig {
  unique: number;
  shared: number;
}

interface ContentState {
  announcements: Announcement[];
  customCategories: Category[];
  customCases: CampaignCase[];
  forbiddenLetters: string[];
  petitBacScore: PetitBacScoreConfig;

  addAnnouncement: (a: Omit<Announcement, 'id' | 'createdAt'>) => void;
  toggleAnnouncement: (id: string) => void;
  removeAnnouncement: (id: string) => void;

  addCategory: (label: string, emoji: string) => void;
  removeCategory: (id: string) => void;

  addCase: (c: Omit<CampaignCase, 'seed'> & { seed?: string }) => void;
  removeCase: (seed: string) => void;

  setForbiddenLetters: (letters: string[]) => void;
  setPetitBacScore: (cfg: PetitBacScoreConfig) => void;
  reset: () => void;
}

const initial = {
  announcements: [] as Announcement[],
  customCategories: [] as Category[],
  customCases: [] as CampaignCase[],
  forbiddenLetters: [] as string[],
  petitBacScore: { unique: 10, shared: 5 } as PetitBacScoreConfig,
};

export const useContent = create<ContentState>()(
  persist(
    (set) => ({
      ...initial,

      addAnnouncement: (a) =>
        set((s) => ({
          announcements: [
            { ...a, id: uuid(), createdAt: Date.now() },
            ...s.announcements,
          ],
        })),
      toggleAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.map((x) =>
            x.id === id ? { ...x, active: !x.active } : x,
          ),
        })),
      removeAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.filter((x) => x.id !== id),
        })),

      addCategory: (label, emoji) =>
        set((s) => ({
          customCategories: [
            ...s.customCategories,
            {
              id: `custom-${uuid().slice(0, 6)}`,
              label,
              emoji: emoji || '🏷️',
              theme: '#7c5cff',
            },
          ],
        })),
      removeCategory: (id) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c.id !== id),
        })),

      addCase: (c) =>
        set((s) => ({
          customCases: [
            ...s.customCases,
            { ...c, seed: c.seed ?? `custom-${uuid().slice(0, 6)}` },
          ],
        })),
      removeCase: (seed) =>
        set((s) => ({
          customCases: s.customCases.filter((c) => c.seed !== seed),
        })),

      setForbiddenLetters: (letters) =>
        set({ forbiddenLetters: letters.map((l) => l.toUpperCase()) }),
      setPetitBacScore: (petitBacScore) => set({ petitBacScore }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'ludoteca:content',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
