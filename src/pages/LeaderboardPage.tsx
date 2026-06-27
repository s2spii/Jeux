import { useEffect, useState } from 'react';
import { useStats } from '../store/stats';
import { useSettings } from '../store/settings';
import { GAMES, getGameMeta } from '../data/games';
import { Card, Button, Badge, EmptyState } from '../components/ui';
import { api } from '../lib/api';
import type { GameId, LeaderboardRow } from '../types';

function localTop(history: ReturnType<typeof useStats.getState>['history'], game: GameId) {
  const best: Record<string, number> = {};
  for (const h of history) {
    if (h.game !== game) continue;
    best[h.username] = Math.max(best[h.username] ?? 0, h.score);
  }
  return Object.entries(best)
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

export function LeaderboardPage() {
  const t = useSettings((s) => s.t);
  const history = useStats((s) => s.history);
  const [game, setGame] = useState<GameId>('enquete');
  const [scope, setScope] = useState<'local' | 'online'>('local');
  const [onlineRows, setOnlineRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (scope !== 'online') return;
    setLoading(true);
    setOffline(false);
    api.getLeaderboard(game).then((res) => {
      setLoading(false);
      if (res.offline) {
        setOffline(true);
        setOnlineRows([]);
      } else if (res.ok && res.data) {
        setOnlineRows(res.data.rows);
      }
    });
  }, [scope, game]);

  const rows =
    scope === 'local'
      ? localTop(history, game)
      : (onlineRows ?? []).map((r) => ({ username: r.username, score: r.score }));

  return (
    <div className="stack">
      <h1>{t('leaderboard.title')}</h1>

      <div className="row" style={{ gap: 8 }}>
        {GAMES.map((g) => (
          <Button
            key={g.id}
            variant={game === g.id ? 'primary' : 'ghost'}
            onClick={() => setGame(g.id as GameId)}
          >
            {g.emoji} {t(g.nameKey)}
          </Button>
        ))}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <Button
          size="sm"
          variant={scope === 'local' ? 'accent' : 'ghost'}
          onClick={() => setScope('local')}
        >
          {t('leaderboard.local')}
        </Button>
        <Button
          size="sm"
          variant={scope === 'online' ? 'accent' : 'ghost'}
          onClick={() => setScope('online')}
        >
          {t('leaderboard.online')}
        </Button>
      </div>

      {scope === 'online' && offline && (
        <Card>
          <strong>Classement en ligne indisponible.</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Déployez sur Netlify (ou lancez <span className="kbd">netlify dev</span>) pour
            activer les classements partagés. Le classement local reste disponible.
          </p>
        </Card>
      )}

      {loading ? (
        <Card>{t('common.loading')}</Card>
      ) : rows.length === 0 ? (
        <EmptyState icon="🏅" title={t('leaderboard.empty')} />
      ) : (
        <Card style={{ overflowX: 'auto', padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Joueur</th>
                <th>{getGameMeta(game).emoji} Meilleur score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.username + i}>
                  <td className="rank">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td>{r.username}</td>
                  <td>
                    <Badge tone="accent">{r.score}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
