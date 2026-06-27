import { Link } from 'react-router-dom';
import { GAMES } from '../data/games';
import { useSettings } from '../store/settings';
import { useStats } from '../store/stats';
import { useAuth } from '../store/auth';
import { useContent } from '../store/content';
import { Card, Badge } from '../components/ui';

export function HomePage() {
  const t = useSettings((s) => s.t);
  const user = useAuth((s) => s.user);
  const history = useStats((s) => s.history);
  const announcements = useContent((s) =>
    s.announcements.filter((a) => a.active),
  );

  const totalGames = history.length;

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="hero">
        <Badge tone="brand">Solo · Local · En ligne</Badge>
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}. {t('home.cta')}.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/jeux" className="btn btn-primary btn-lg">
            🎮 {t('common.play')}
          </Link>
          {!user && (
            <Link to="/connexion" className="btn btn-ghost btn-lg">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </section>

      {announcements.length > 0 && (
        <div className="stack">
          {announcements.map((a) => (
            <Card key={a.id} style={{ borderColor: 'var(--accent)' }}>
              <strong>📣 {a.title}</strong>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                {a.body}
              </p>
            </Card>
          ))}
        </div>
      )}

      <section>
        <h2>Nos jeux</h2>
        <div className="grid grid-3">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              to={g.path}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
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
      </section>

      <section className="grid grid-4">
        <Card className="center">
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{GAMES.length}</div>
          <div className="muted">Jeux jouables</div>
        </Card>
        <Card className="center">
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalGames}</div>
          <div className="muted">Parties enregistrées</div>
        </Card>
        <Card className="center">
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>∞</div>
          <div className="muted">Énigmes générées</div>
        </Card>
        <Card className="center">
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>3</div>
          <div className="muted">Modes en ligne</div>
        </Card>
      </section>

      <section>
        <Card className="stack">
          <h2>Pourquoi Ludoteca ?</h2>
          <div className="grid grid-2">
            <div>
              <h4>♿ Pensé pour tous</h4>
              <p className="muted">
                Mode sombre, contraste élevé, réduction des animations, taille de
                texte ajustable et navigation au clavier.
              </p>
            </div>
            <div>
              <h4>📱 Responsive</h4>
              <p className="muted">
                Une expérience fluide sur ordinateur, tablette et mobile.
              </p>
            </div>
            <div>
              <h4>💾 Progression sauvegardée</h4>
              <p className="muted">
                Reprenez vos parties, suivez vos scores et débloquez des succès.
              </p>
            </div>
            <div>
              <h4>🧩 Solutions garanties</h4>
              <p className="muted">
                Chaque énigme et chaque casse-tête est vérifié comme soluble et à
                solution unique.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
