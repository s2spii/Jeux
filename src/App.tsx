import { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toasts';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RulesPage } from './pages/RulesPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { EnqueteGame } from './games/enquete/EnqueteGame';
import { PetitBacGame } from './games/petitbac/PetitBacGame';
import { ParadoxesGame } from './games/paradoxes/ParadoxesGame';
import { useAuth } from './store/auth';
import { useStats } from './store/stats';
import { useSaves } from './store/saves';
import { useSettings, applySettingsToDom } from './store/settings';
import { api } from './lib/api';

/** Pushes new non-guest score entries to the online leaderboard (best-effort). */
function OnlineSync() {
  const history = useStats((s) => s.history);
  const user = useAuth((s) => s.user);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    const latest = history[0];
    if (!latest || !user || user.isGuest) return;
    if (lastId.current === null) {
      lastId.current = latest.id; // skip the backlog on first mount
      return;
    }
    if (latest.id === lastId.current) return;
    lastId.current = latest.id;
    void api.submitScore({
      game: latest.game,
      username: latest.username,
      score: latest.score,
      mode: latest.mode,
    });
  }, [history, user]);

  return null;
}

export function App() {
  const initAuth = useAuth((s) => s.init);
  const loadStats = useStats((s) => s.load);
  const loadSaves = useSaves((s) => s.load);
  const settings = useSettings();

  useEffect(() => {
    initAuth();
    loadStats();
    loadSaves();
  }, [initAuth, loadStats, loadSaves]);

  useEffect(() => {
    applySettingsToDom(settings);
  }, [settings]);

  return (
    <ToastProvider>
      <OnlineSync />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/jeux" element={<GamesPage />} />
          <Route path="/jeux/enquete" element={<EnqueteGame />} />
          <Route path="/jeux/petit-bac" element={<PetitBacGame />} />
          <Route path="/jeux/paradoxes" element={<ParadoxesGame />} />
          <Route path="/connexion" element={<AuthPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          <Route path="/classements" element={<LeaderboardPage />} />
          <Route path="/regles" element={<RulesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
