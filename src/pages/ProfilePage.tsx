import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useStats } from '../store/stats';
import { useSettings } from '../store/settings';
import { Card, Badge, StatTile, EmptyState } from '../components/ui';
import { GAMES, getGameMeta } from '../data/games';
import { ACHIEVEMENTS } from '../data/achievements';
import { formatDate } from '../lib/format';
import type { GameId } from '../types';

export function ProfilePage() {
  const t = useSettings((s) => s.t);
  const locale = useSettings((s) => s.locale);
  const user = useAuth((s) => s.user);
  const { statsFor, historyFor, unlocked } = useStats();

  if (!user) {
    return (
      <div className="stack">
        <EmptyState
          icon="🔐"
          title="Connectez-vous pour voir votre profil"
          hint="Créez un compte ou jouez en invité."
        />
        <div className="center">
          <Link to="/connexion" className="btn btn-primary">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    );
  }

  const history = historyFor(user.id).slice(0, 30);
  const totalScore = historyFor(user.id).reduce((s, h) => s + h.score, 0);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row-between">
        <div>
          <h1 style={{ marginBottom: 4 }}>{user.username}</h1>
          <Badge tone={user.isGuest ? 'default' : 'brand'}>
            {user.isGuest ? 'Invité' : user.role === 'admin' ? 'Administrateur' : 'Joueur'}
          </Badge>
        </div>
      </div>

      <section>
        <h2>{t('profile.stats')}</h2>
        <div className="grid grid-4">
          <StatTile value={historyFor(user.id).length} label={t('profile.gamesPlayed')} />
          <StatTile value={totalScore.toLocaleString()} label={t('profile.totalScore')} />
          <StatTile value={unlocked.length} label={t('profile.achievements')} />
          <StatTile value={GAMES.length} label="Jeux disponibles" />
        </div>
      </section>

      <section>
        <h2>Par jeu</h2>
        <div className="grid grid-3">
          {GAMES.map((g) => {
            const s = statsFor(g.id as GameId, user.id);
            return (
              <Card key={g.id} className="stack">
                <div className="row">
                  <span style={{ fontSize: '1.6rem' }}>{g.emoji}</span>
                  <strong>{t(g.nameKey)}</strong>
                </div>
                <div className="row-between">
                  <span className="muted">{t('profile.gamesPlayed')}</span>
                  <strong>{s.played}</strong>
                </div>
                <div className="row-between">
                  <span className="muted">{t('profile.bestScore')}</span>
                  <strong>{s.best}</strong>
                </div>
                <div className="row-between">
                  <span className="muted">Moyenne</span>
                  <strong>{s.avg}</strong>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2>{t('profile.achievements')}</h2>
        <div className="grid grid-3">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            return (
              <Card
                key={a.id}
                className="row"
                style={{ opacity: got ? 1 : 0.5, gap: 12 }}
              >
                <span style={{ fontSize: '1.8rem' }}>{got ? '🏆' : '🔒'}</span>
                <div>
                  <strong>{a.title}</strong>
                  <div className="faint">{a.description}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2>{t('profile.history')}</h2>
        {history.length === 0 ? (
          <EmptyState title="Aucune partie pour le moment" hint="Lancez un jeu !" />
        ) : (
          <Card style={{ overflowX: 'auto', padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Jeu</th>
                  <th>Mode</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{formatDate(h.createdAt, locale)}</td>
                    <td>
                      {getGameMeta(h.game).emoji} {t(getGameMeta(h.game).nameKey)}
                    </td>
                    <td>{h.mode}</td>
                    <td><strong>{h.score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
