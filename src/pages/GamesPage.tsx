import { Link } from 'react-router-dom';
import { GAMES } from '../data/games';
import { useSettings } from '../store/settings';
import { Card } from '../components/ui';

export function GamesPage() {
  const t = useSettings((s) => s.t);
  return (
    <div className="stack">
      <h1>{t('nav.games')}</h1>
      <p className="muted">Choisissez un jeu pour commencer une partie.</p>
      <div className="grid grid-3">
        {GAMES.map((g) => (
          <Link key={g.id} to={g.path} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card hover className="game-card" style={{ ['--card-glow' as string]: g.glow }}>
              <div className="game-emoji" aria-hidden="true">
                {g.emoji}
              </div>
              <h3>{t(g.nameKey)}</h3>
              <p className="muted" style={{ flex: 1 }}>
                {t(g.tagKey)}
              </p>
              <div className="tag-list">
                {g.modes.map((m) => (
                  <span key={m} className="badge">
                    {m}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
