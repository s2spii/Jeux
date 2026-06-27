/**
 * Thin client for the Netlify Functions backend (global leaderboard + online
 * rooms). Every call degrades gracefully: when the backend is unreachable
 * (e.g. `vite dev` without `netlify dev`), callers receive a clear `offline`
 * result instead of throwing, so the app stays fully usable locally.
 */
import type { GameId, LeaderboardRow } from '../types';

const BASE = '/api';

export interface ApiResult<T> {
  ok: boolean;
  offline?: boolean;
  data?: T;
  error?: string;
}

async function call<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, offline: true, error: 'Backend indisponible (mode local).' };
  }
}

export const api = {
  submitScore: (payload: {
    game: GameId;
    username: string;
    score: number;
    mode: string;
  }) =>
    call<{ rank: number }>('/leaderboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getLeaderboard: (game: GameId, mode = 'all') =>
    call<{ rows: LeaderboardRow[] }>(
      `/leaderboard?game=${encodeURIComponent(game)}&mode=${encodeURIComponent(mode)}`,
    ),

  createRoom: (payload: {
    game: GameId;
    host: string;
    config: unknown;
  }) =>
    call<{ code: string; state: unknown }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...payload }),
    }),

  joinRoom: (code: string, username: string) =>
    call<{ state: unknown }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'join', code, username }),
    }),

  getRoom: (code: string) =>
    call<{ state: unknown }>(`/rooms?code=${encodeURIComponent(code)}`),

  updateRoom: (code: string, username: string, patch: unknown) =>
    call<{ state: unknown }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', code, username, patch }),
    }),
};
