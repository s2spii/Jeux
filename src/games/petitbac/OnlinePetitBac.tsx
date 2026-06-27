import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Badge, Card } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';
import { api } from '../../lib/api';
import { isValidShareCode } from '../../lib/id';
import { categoryById } from './categories';
import { drawLetter, drawCategories, scoreRound, type RoundConfig } from './engine';
import { ResultsScreen } from './PetitBacGame';

type RoomPhase = 'lobby' | 'playing' | 'results';

interface RoomState {
  game: 'petitbac';
  host: string;
  phase: RoomPhase;
  config: RoundConfig & { seed: string };
  players: Record<string, { name: string; joinedAt: number }>;
  submissions: Record<string, { answers: Record<string, string>; submittedAt: number }>;
}

const POLL_MS = 2000;

/**
 * Online Petit Bac: a shared room identified by a 6-char code, backed by the
 * Netlify Functions + Blobs API. Real-time-ish via short polling, which is the
 * pragmatic fit for Netlify's serverless model. If the backend is unreachable
 * (pure `vite dev`), the component clearly says so and stays out of the way.
 */
export function OnlinePetitBac({
  defaultDuration,
  defaultCatCount,
  expert,
}: {
  defaultDuration: number;
  defaultCatCount: number;
  expert: boolean;
}) {
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const record = useStats((s) => s.record);
  const name = user?.username ?? 'Invité';

  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [offline, setOffline] = useState(false);
  const startRef = useRef(0);
  const recordedRef = useRef(false);

  const isHost = room?.host === name;

  /* ---------------------------- polling ---------------------------- */
  const refresh = useCallback(async () => {
    if (!code) return;
    const res = await api.getRoom(code);
    if (res.offline) {
      setOffline(true);
      return;
    }
    if (res.ok && res.data) setRoom(res.data.state as RoomState);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [code, refresh]);

  // Record own score once when results appear.
  useEffect(() => {
    if (room?.phase === 'results' && !recordedRef.current && user) {
      recordedRef.current = true;
      const subs = Object.entries(room.submissions).map(([pid, s]) => ({
        id: pid,
        name: pid,
        answers: s.answers,
        submittedAt: s.submittedAt,
      }));
      const scored = scoreRound(room.config, subs);
      const mine = scored.find((s) => s.name === name);
      if (mine) {
        record({
          game: 'petitbac',
          userId: user.id,
          username: user.username,
          score: mine.total,
          mode: 'online',
          meta: { letter: room.config.letter, maxCombo: mine.maxCombo },
        });
      }
    }
  }, [room, user, name, record]);

  async function createRoom() {
    const seed = `${Date.now()}-${Math.random()}`;
    const config: RoundConfig & { seed: string } = {
      seed,
      letter: drawLetter(seed, expert),
      categories: drawCategories(seed, defaultCatCount, expert),
      durationSec: defaultDuration,
      minLength: 1,
      doubling: false,
    };
    const res = await api.createRoom({ game: 'petitbac', host: name, config });
    if (res.offline) return setOffline(true);
    if (res.ok && res.data) {
      setCode(res.data.code);
      setRoom(res.data.state as RoomState);
      toast.push(`Salon créé : ${res.data.code}`, 'success');
    } else {
      toast.push(res.error ?? 'Erreur', 'danger');
    }
  }

  async function join() {
    const c = joinCode.trim().toUpperCase();
    if (!isValidShareCode(c)) return toast.push('Code invalide.', 'danger');
    const res = await api.joinRoom(c, name);
    if (res.offline) return setOffline(true);
    if (res.ok && res.data) {
      setCode(c);
      setRoom(res.data.state as RoomState);
    } else {
      toast.push(res.error ?? 'Salon introuvable.', 'danger');
    }
  }

  async function startGame() {
    if (!code) return;
    await api.updateRoom(code, name, { phase: 'playing', startedAt: Date.now() });
    startRef.current = Date.now();
    refresh();
  }

  async function submit() {
    if (!code || !room) return;
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    setSubmitted(true);
    await api.updateRoom(code, name, {
      submissions: {
        [name]: { answers, submittedAt: Math.min(elapsed, room.config.durationSec) },
      },
    });
    toast.push('Réponses envoyées.', 'success');
    refresh();
  }

  async function reveal() {
    if (!code) return;
    await api.updateRoom(code, name, { phase: 'results' });
    refresh();
  }

  // start timer locally when room enters playing
  useEffect(() => {
    if (room?.phase === 'playing' && startRef.current === 0) {
      startRef.current = Date.now();
    }
  }, [room?.phase]);

  /* ----------------------------- views ----------------------------- */

  if (offline) {
    return (
      <Card className="stack">
        <h3>🌐 Mode en ligne indisponible</h3>
        <p className="muted">
          Le backend des salons n'est pas joignable. En production sur Netlify,
          les fonctions serverless gèrent les salons. En local, lancez{' '}
          <span className="kbd">netlify dev</span> pour activer le mode en ligne.
        </p>
        <p className="faint">Les modes Solo et Local restent pleinement jouables.</p>
      </Card>
    );
  }

  if (!code) {
    return (
      <div className="grid grid-2">
        <Card className="stack">
          <h3>Créer un salon</h3>
          <p className="muted">Vous serez l'hôte et lancerez la manche.</p>
          <Button variant="primary" onClick={createRoom}>
            Créer un salon
          </Button>
        </Card>
        <Card className="stack">
          <h3>Rejoindre un salon</h3>
          <input
            className="input"
            placeholder="Code à 6 caractères"
            value={joinCode}
            maxLength={8}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <Button variant="accent" onClick={join}>
            Rejoindre
          </Button>
        </Card>
      </div>
    );
  }

  if (!room) return <Card>Connexion au salon…</Card>;

  if (room.phase === 'lobby') {
    const playerList = Object.values(room.players);
    return (
      <Card className="stack">
        <div className="row-between">
          <h3>Salon {code}</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard?.writeText(
                `${location.origin}/jeux/petit-bac?room=${code}`,
              );
              toast.push('Lien copié !', 'success');
            }}
          >
            🔗 Copier le lien
          </Button>
        </div>
        <p className="muted">Partagez le code <strong>{code}</strong> à vos amis.</p>
        <div className="tag-list">
          {playerList.map((p) => (
            <Badge key={p.name} tone="brand">
              {p.name === room.host ? '👑 ' : ''}
              {p.name}
            </Badge>
          ))}
        </div>
        {isHost ? (
          <Button variant="primary" onClick={startGame} disabled={playerList.length < 1}>
            ▶ Lancer la manche
          </Button>
        ) : (
          <p className="faint">En attente du lancement par l'hôte…</p>
        )}
      </Card>
    );
  }

  if (room.phase === 'playing') {
    const cats = room.config.categories.map((id) => categoryById(id)!);
    return (
      <div className="stack">
        <Card className="row-between">
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
            {room.config.letter}
          </span>
          <Badge>{Object.keys(room.submissions).length} réponse(s) reçue(s)</Badge>
        </Card>
        {submitted ? (
          <Card className="center stack">
            <h3>✓ Réponses envoyées</h3>
            <p className="muted">En attente des autres joueurs…</p>
            {isHost && (
              <Button variant="accent" onClick={reveal}>
                Clôturer et révéler les scores
              </Button>
            )}
          </Card>
        ) : (
          <form
            className="grid grid-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {cats.map((cat) => (
              <div key={cat.id} className="field">
                <label style={{ color: cat.theme }}>
                  {cat.emoji} {cat.label}
                </label>
                <input
                  className="input"
                  autoComplete="off"
                  value={answers[cat.id] ?? ''}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [cat.id]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <Button type="submit" variant="primary" block>
                Envoyer mes réponses
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // results
  const subs = Object.entries(room.submissions).map(([pid, s]) => ({
    id: pid,
    name: pid,
    answers: s.answers,
    submittedAt: s.submittedAt,
  }));
  const scored = scoreRound(room.config, subs);
  return (
    <ResultsScreen
      config={room.config}
      scores={scored}
      onReplay={() => {
        setCode(null);
        setRoom(null);
        setSubmitted(false);
        recordedRef.current = false;
        startRef.current = 0;
      }}
    />
  );
}
