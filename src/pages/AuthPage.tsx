import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useSettings } from '../store/settings';
import { Card, Button } from '../components/ui';

export function AuthPage() {
  const t = useSettings((s) => s.t);
  const navigate = useNavigate();
  const { signIn, signUp, playAsGuest, error, clearError } = useAuth();

  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    clearError();
    const ok =
      tab === 'in'
        ? await signIn(username, password)
        : await signUp(username, password);
    setBusy(false);
    if (ok) navigate('/');
  }

  return (
    <div className="stack" style={{ maxWidth: 460, margin: '0 auto' }}>
      <h1 className="center">{t('auth.welcome')}</h1>

      <Card className="stack">
        <div className="row" style={{ gap: 4 }}>
          <Button
            variant={tab === 'in' ? 'primary' : 'ghost'}
            block
            onClick={() => {
              setTab('in');
              clearError();
            }}
          >
            {t('auth.signin')}
          </Button>
          <Button
            variant={tab === 'up' ? 'primary' : 'ghost'}
            block
            onClick={() => {
              setTab('up');
              clearError();
            }}
          >
            {t('auth.signup')}
          </Button>
        </div>

        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="u">{t('auth.username')}</label>
            <input
              id="u"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="p">{t('auth.password')}</label>
            <input
              id="p"
              type="password"
              className="input"
              autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="field-error" role="alert">{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {tab === 'in' ? t('auth.signin') : t('auth.signup')}
          </Button>
        </form>
        {tab === 'up' && (
          <p className="faint">
            Le tout premier compte créé devient administrateur (accès au back-office).
          </p>
        )}
      </Card>

      <Card className="stack">
        <h3>{t('auth.guest')}</h3>
        <p className="muted">Jouez immédiatement, vos scores restent sur cet appareil.</p>
        <div className="row">
          <input
            className="input"
            placeholder="Pseudo (optionnel)"
            value={guestName}
            maxLength={20}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <Button
            variant="accent"
            onClick={() => {
              playAsGuest(guestName);
              navigate('/');
            }}
          >
            {t('auth.guest')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
