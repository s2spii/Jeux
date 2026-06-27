import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  ok,
  bad,
  blobStore,
  isValidGame,
  cleanName,
  cleanScore,
  rateLimited,
  type FnResponse,
} from './_shared';

interface Row {
  username: string;
  score: number;
  game: string;
  mode: string;
  createdAt: number;
}

const MAX_ROWS = 100;

function clientIp(event: HandlerEvent): string {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    'unknown'
  );
}

export const handler: Handler = async (event) => {
  try {
    return await route(event);
  } catch (err) {
    // Never leak a 502: surface a readable error instead.
    const message = err instanceof Error ? err.message : 'Erreur serveur.';
    return bad(500, `Classement indisponible : ${message}`);
  }
};

const route = async (event: HandlerEvent): Promise<FnResponse> => {
  const store = blobStore(event, 'leaderboard');

  if (event.httpMethod === 'GET') {
    const game = event.queryStringParameters?.game ?? '';
    if (!isValidGame(game)) return bad(400, 'Jeu invalide.');
    const rows = (await store.get(game, { type: 'json' })) as Row[] | null;
    const sorted = (rows ?? []).sort((a, b) => b.score - a.score).slice(0, 50);
    return ok({ rows: sorted });
  }

  if (event.httpMethod === 'POST') {
    if (rateLimited(`lb:${clientIp(event)}`)) return bad(429, 'Trop de requêtes.');
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(event.body ?? '{}');
    } catch {
      return bad(400, 'JSON invalide.');
    }
    const game = payload.game;
    if (!isValidGame(game)) return bad(400, 'Jeu invalide.');

    const row: Row = {
      username: cleanName(payload.username),
      score: cleanScore(payload.score),
      game,
      mode: typeof payload.mode === 'string' ? payload.mode.slice(0, 20) : 'solo',
      createdAt: Date.now(),
    };

    const existing = ((await store.get(game, { type: 'json' })) as Row[] | null) ?? [];
    // Keep only each player's best score.
    const prevBest = existing
      .filter((r) => r.username === row.username)
      .reduce((m, r) => Math.max(m, r.score), 0);
    const best = row.score >= prevBest ? row : { ...row, score: prevBest };
    const filtered = existing.filter((r) => r.username !== row.username);
    const next = [...filtered, best]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ROWS);
    await store.setJSON(game, next);

    const rank = next.findIndex((r) => r.username === row.username) + 1;
    return ok({ rank });
  }

  return bad(405, 'Méthode non autorisée.');
};
