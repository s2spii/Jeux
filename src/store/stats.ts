import { create } from 'zustand';
import type { GameId, ScoreEntry } from '../types';
import { storage } from '../lib/storage';
import { uuid } from '../lib/id';
import { ACHIEVEMENTS } from '../data/achievements';

const HISTORY_KEY = 'history';
const UNLOCKED_KEY = 'achievements';
const MAX_HISTORY = 500;

export interface GameStats {
  played: number;
  best: number;
  total: number;
  avg: number;
}

interface StatsState {
  history: ScoreEntry[];
  unlocked: string[];
  /** Newly unlocked achievement ids since last consume (for toasts). */
  pendingUnlocks: string[];
  load: () => void;
  record: (
    entry: Omit<ScoreEntry, 'id' | 'createdAt'>,
  ) => { entry: ScoreEntry; newAchievements: string[] };
  statsFor: (game: GameId, userId?: string) => GameStats;
  historyFor: (userId?: string) => ScoreEntry[];
  consumePending: () => void;
  clear: () => void;
}

function recomputeAchievements(
  history: ScoreEntry[],
  already: string[],
): string[] {
  const out = [...already];
  for (const def of ACHIEVEMENTS) {
    if (!out.includes(def.id) && def.test(history)) out.push(def.id);
  }
  return out;
}

export const useStats = create<StatsState>((set, get) => ({
  history: [],
  unlocked: [],
  pendingUnlocks: [],

  load: () => {
    set({
      history: storage.get<ScoreEntry[]>(HISTORY_KEY, []),
      unlocked: storage.get<string[]>(UNLOCKED_KEY, []),
    });
  },

  record: (partial) => {
    const entry: ScoreEntry = {
      ...partial,
      id: uuid(),
      createdAt: Date.now(),
    };
    const history = [entry, ...get().history].slice(0, MAX_HISTORY);
    const before = get().unlocked;
    const after = recomputeAchievements(
      history.filter((h) => h.userId === entry.userId),
      before,
    );
    const newAchievements = after.filter((a) => !before.includes(a));
    storage.set(HISTORY_KEY, history);
    storage.set(UNLOCKED_KEY, after);
    set({
      history,
      unlocked: after,
      pendingUnlocks: [...get().pendingUnlocks, ...newAchievements],
    });
    return { entry, newAchievements };
  },

  statsFor: (game, userId) => {
    const rows = get().history.filter(
      (h) => h.game === game && (!userId || h.userId === userId),
    );
    const played = rows.length;
    const best = rows.reduce((m, r) => Math.max(m, r.score), 0);
    const total = rows.reduce((s, r) => s + r.score, 0);
    return { played, best, total, avg: played ? Math.round(total / played) : 0 };
  },

  historyFor: (userId) =>
    get().history.filter((h) => !userId || h.userId === userId),

  consumePending: () => set({ pendingUnlocks: [] }),

  clear: () => {
    storage.remove(HISTORY_KEY);
    storage.remove(UNLOCKED_KEY);
    set({ history: [], unlocked: [], pendingUnlocks: [] });
  },
}));
