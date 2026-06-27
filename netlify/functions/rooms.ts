import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  ok,
  bad,
  blobStore,
  isValidGame,
  cleanName,
  rateLimited,
  type FnResponse,
} from './_shared';

/**
 * Online room store for live (polled) multiplayer. State is a free-form object
 * the client owns; the server enforces structure, merges patches one level
 * deep (players / submissions), and expires stale rooms.
 */
interface RoomState {
  game: string;
  host: string;
  phase: string;
  config: unknown;
  players: Record<string, { name: string; joinedAt: number }>;
  submissions: Record<string, unknown>;
  startedAt?: number;
  updatedAt: number;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL = 1000 * 60 * 60 * 3; // 3 hours

function newCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function mergePatch(state: RoomState, patch: Record<string, unknown>): RoomState {
  const next: RoomState = { ...state };
  for (const [key, value] of Object.entries(patch)) {
    if (
      (key === 'players' || key === 'submissions') &&
      value &&
      typeof value === 'object'
    ) {
      next[key] = { ...(state[key] as object), ...(value as object) } as never;
    } else if (['phase', 'startedAt', 'config'].includes(key)) {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  next.updatedAt = Date.now();
  return next;
}

export const handler: Handler = async (event) => {
  try {
    return await route(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur.';
    return bad(500, `Salon indisponible : ${message}`);
  }
};

const route = async (event: HandlerEvent): Promise<FnResponse> => {
  const store = blobStore(event, 'rooms');

  if (event.httpMethod === 'GET') {
    const code = (event.queryStringParameters?.code ?? '').toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) return bad(400, 'Code invalide.');
    const state = (await store.get(code, { type: 'json' })) as RoomState | null;
    if (!state) return bad(404, 'Salon introuvable.');
    return ok({ state });
  }

  if (event.httpMethod === 'POST') {
    if (rateLimited(`rooms:${event.headers['x-forwarded-for'] ?? 'x'}`, 60)) {
      return bad(429, 'Trop de requêtes.');
    }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(event.body ?? '{}');
    } catch {
      return bad(400, 'JSON invalide.');
    }
    const action = payload.action;

    if (action === 'create') {
      if (!isValidGame(payload.game)) return bad(400, 'Jeu invalide.');
      const host = cleanName(payload.host);
      const code = newCode();
      const state: RoomState = {
        game: payload.game,
        host,
        phase: 'lobby',
        config: payload.config ?? null,
        players: { [host]: { name: host, joinedAt: Date.now() } },
        submissions: {},
        updatedAt: Date.now(),
      };
      await store.setJSON(code, state);
      return ok({ code, state });
    }

    const code = String(payload.code ?? '').toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) return bad(400, 'Code invalide.');
    const state = (await store.get(code, { type: 'json' })) as RoomState | null;
    if (!state) return bad(404, 'Salon introuvable.');
    if (Date.now() - state.updatedAt > ROOM_TTL) {
      await store.delete(code);
      return bad(410, 'Salon expiré.');
    }

    if (action === 'join') {
      const name = cleanName(payload.username);
      state.players[name] = { name, joinedAt: Date.now() };
      state.updatedAt = Date.now();
      await store.setJSON(code, state);
      return ok({ state });
    }

    if (action === 'update') {
      const patch = (payload.patch ?? {}) as Record<string, unknown>;
      const next = mergePatch(state, patch);
      await store.setJSON(code, next);
      return ok({ state: next });
    }

    return bad(400, 'Action inconnue.');
  }

  return bad(405, 'Méthode non autorisée.');
};
