import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useSettings } from '../store/settings';
import { Button } from './ui';

function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const set = useSettings((s) => s.set);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
      onClick={() => set('theme', theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </Button>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const t = useSettings((s) => s.t);

  const close = () => setOpen(false);

  return (
    <div className="app-shell">
      <a href="#main" className="sr-only">
        Aller au contenu
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" onClick={close}>
            <img src="/favicon.svg" alt="" className="brand-logo" />
            <span>Ludoteca</span>
          </Link>

          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Navigation principale">
            <NavLink to="/" end onClick={close}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/jeux" onClick={close}>
              {t('nav.games')}
            </NavLink>
            <NavLink to="/classements" onClick={close}>
              {t('nav.leaderboard')}
            </NavLink>
            <NavLink to="/regles" onClick={close}>
              {t('nav.rules')}
            </NavLink>
            <NavLink to="/profil" onClick={close}>
              {t('nav.profile')}
            </NavLink>
            <NavLink to="/reglages" onClick={close}>
              {t('nav.settings')}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" onClick={close}>
                {t('nav.admin')}
              </NavLink>
            )}
          </nav>

          <div className="spacer" />
          <ThemeToggle />
          {user ? (
            <div className="row" style={{ gap: 8 }}>
              <Link to="/profil" className="badge badge-brand" onClick={close}>
                {user.isGuest ? '👤' : '⭐'} {user.username}
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Link to="/connexion" className="btn btn-primary btn-sm" onClick={close}>
              {t('nav.login')}
            </Link>
          )}

          <button
            className="btn btn-ghost btn-sm nav-toggle"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </header>

      <main id="main" className="page">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container row-between">
          <span>© {new Date().getFullYear()} Ludoteca — plateforme de jeux.</span>
          <span className="row" style={{ gap: 14 }}>
            <Link to="/regles">Règles</Link>
            <Link to="/reglages">Accessibilité</Link>
            <a href="https://www.netlify.com" target="_blank" rel="noreferrer">
              Déployé sur Netlify
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
