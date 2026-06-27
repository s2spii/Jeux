import { create } from 'zustand';
import type { GameId, SaveSlot } from '../types';
import { storage } from '../lib/storage';

const SAVES_KEY = 'saves';

function key(game: GameId, userId: string): string {
  return `${game}:${userId}`;
}

interface SavesState {
  saves: Record<string, SaveSlot>;
  load: () => void;
  save: <T>(game: GameId, userId: string, state: T, label: string) => void;
  get: <T>(game: GameId, userId: string) => SaveSlot<T> | null;
  clear: (game: GameId, userId: string) => void;
}

export const useSaves = create<SavesState>((set, get) => ({
  saves: {},

  load: () => {
    set({ saves: storage.get<Record<string, SaveSlot>>(SAVES_KEY, {}) });
  },

  save: (game, userId, state, label) => {
    const saves = { ...get().saves };
    saves[key(game, userId)] = {
      game,
      userId,
      state,
      label,
      updatedAt: Date.now(),
    };
    storage.set(SAVES_KEY, saves);
    set({ saves });
  },

  get: <T,>(game: GameId, userId: string) => {
    return (get().saves[key(game, userId)] as SaveSlot<T> | undefined) ?? null;
  },

  clear: (game, userId) => {
    const saves = { ...get().saves };
    delete saves[key(game, userId)];
    storage.set(SAVES_KEY, saves);
    set({ saves });
  },
}));
