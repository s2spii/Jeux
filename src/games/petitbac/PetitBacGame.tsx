import { useEffect, useMemo, useRef, useState } from 'react';
import { GameShell } from '../../components/GameShell';
import { Button, Badge, Card } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';
import { useSettings } from '../../store/settings';
import { useContent } from '../../store/content';
import { useCountdown } from '../../hooks/useCountdown';
import { formatClock } from '../../lib/format';
import { dailySeed } from '../../lib/rng';
import { clampInt } from '../../lib/validation';
import { categoryById, registerCategories, SPECIAL_CONSTRAINTS } from './categories';
import {
  scoreRound,
  drawLetter,
  drawCategories,
  type RoundConfig,
  type PlayerRound,
  type PlayerScore,
} from './engine';
import { OnlinePetitBac } from './OnlinePetitBac';

type Mode = 'solo' | 'local' | 'online';
type Phase = 'setup' | 'play' | 'turnEnd' | 'results';

const STATUS_LABEL: Record<string, string> = {
  unique: '10 — unique',
  shared: '5 — partagée',
  invalid: '0 — invalide',
  empty: '0 — vide',
};

export function PetitBacGame() {
  const user = useAuth((s) => s.user);
  const record = useStats((s) => s.record);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const content = useContent();

  // Make admin-defined categories resolvable in results/labels.
  useEffect(() => {
    registerCategories(content.customCategories);
  }, [content.customCategories]);

  const [mode, setMode] = useState<Mode>('solo');
  const [phase, setPhase] = useState<Phase>('setup');

  // round config
  const [duration, setDuration] = useState(90);
  const [catCount, setCatCount] = useState(6);
  const [expert, setExpert] = useState(false);
  const [daily, setDaily] = useState(false);
  const [players, setPlayers] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const [config, setConfig] = useState<RoundConfig | null>(null);
  const [special, setSpecial] = useState<string | null>(null);
  const [turn, setTurn] = useState(0); // local hot-seat current player
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<PlayerRound[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);

  const timer = useCountdown(() => finishTurn());
  const startTimeRef = useRef(0);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const rules = (
    <>
      <p>Une lettre est tirée. Remplissez chaque catégorie avec un mot commençant par cette lettre, avant la fin du chrono.</p>
      <ul>
        <li><strong>10 points</strong> — réponse valide et unique.</li>
        <li><strong>5 points</strong> — réponse valide mais partagée avec un autre joueur.</li>
        <li><strong>0 point</strong> — case vide ou réponse invalide.</li>
      </ul>
      <p>Bonus de vitesse si vous validez en avance, bonus de combo pour les bonnes réponses consécutives. Certaines lettres spéciales doublent les points !</p>
      <p className="faint">Modes : solo, local (chacun son tour sur le même appareil) et en ligne (salon partagé par code).</p>
    </>
  );

  function startRound(selectedMode: Mode) {
    const seed = daily
      ? dailySeed('petitbac')
      : `${Date.now()}-${Math.random()}`;
    const letter = drawLetter(seed, expert, content.forbiddenLetters);
    const categories = drawCategories(seed, catCount, expert, content.customCategories);
    const constraint = SPECIAL_CONSTRAINTS[letter] ?? null;
    const cfg: RoundConfig = {
      letter,
      categories,
      durationSec: duration,
      minLength: letter === 'H' ? 6 : 1,
      doubling: letter === 'Z',
    };
    setConfig(cfg);
    setSpecial(constraint);
    setMode(selectedMode);
    setSubmissions([]);
    setScores([]);
    setTurn(0);
    setAnswers({});
    setPhase('play');
    startTimeRef.current = Date.now();
    timer.start(duration);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function finishTurn() {
    if (!config) return;
    timer.stop();
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const name = mode === 'local' ? players[turn] : user?.username ?? 'Solo';
    const submission: PlayerRound = {
      id: `p${turn}`,
      name,
      answers: { ...answers },
      submittedAt: Math.min(elapsed, config.durationSec),
    };
    const nextSubs = [...submissions, submission];
    setSubmissions(nextSubs);

    if (mode === 'local' && turn + 1 < players.length) {
      setPhase('turnEnd');
    } else {
      computeResults(nextSubs, config);
    }
  }

  function nextPlayer() {
    setTurn((t) => t + 1);
    setAnswers({});
    setPhase('play');
    startTimeRef.current = Date.now();
    timer.start(duration);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function computeResults(subs: PlayerRound[], cfg: RoundConfig) {
    const result = scoreRound(cfg, subs, content.petitBacScore);
    setScores(result);
    setPhase('results');
    // Record the human player's own score in history.
    if (user) {
      const mine =
        mode === 'solo'
          ? result[0]
          : result.find((r) => r.name === user.username) ?? result[0];
      if (mine) {
        record({
          game: 'petitbac',
          userId: user.id,
          username: user.username,
          score: mine.total,
          mode: daily ? 'daily' : expert ? 'expert' : mode,
          meta: {
            letter: cfg.letter,
            maxCombo: mine.maxCombo,
            categories: cfg.categories.length,
          },
        });
      }
    }
  }

  const orderedCats = useMemo(
    () => config?.categories.map((id) => categoryById(id)!).filter(Boolean) ?? [],
    [config],
  );

  /* ------------------------------- views ------------------------------- */

  if (mode === 'online' && phase === 'setup') {
    return (
      <GameShell title="Petit Bac" emoji="✏️" rules={rules}
        toolbar={<Button size="sm" variant="ghost" onClick={() => setMode('solo')}>← Modes</Button>}>
        <OnlinePetitBac
          defaultDuration={duration}
          defaultCatCount={catCount}
          expert={expert}
        />
      </GameShell>
    );
  }

  if (phase === 'setup') {
    return (
      <GameShell title="Petit Bac" emoji="✏️" rules={rules}>
        <SetupScreen
          mode={mode}
          setMode={setMode}
          duration={duration}
          setDuration={setDuration}
          catCount={catCount}
          setCatCount={setCatCount}
          expert={expert}
          setExpert={setExpert}
          daily={daily}
          setDaily={setDaily}
          players={players}
          setPlayers={setPlayers}
          onStart={() => startRound(mode)}
        />
      </GameShell>
    );
  }

  if (phase === 'turnEnd' && mode === 'local') {
    return (
      <GameShell title="Petit Bac" emoji="✏️" rules={rules}>
        <Card className="center stack">
          <h2>Au tour suivant !</h2>
          <p className="muted">
            Passez l'appareil à <strong>{players[turn + 1]}</strong> sans regarder les
            réponses précédentes.
          </p>
          <Button variant="primary" onClick={nextPlayer}>
            {players[turn + 1]} est prêt ▶
          </Button>
        </Card>
      </GameShell>
    );
  }

  if (phase === 'results' && config) {
    return (
      <GameShell title="Petit Bac" emoji="✏️" rules={rules}>
        <ResultsScreen
          config={config}
          scores={scores}
          onReplay={() => setPhase('setup')}
        />
      </GameShell>
    );
  }

  // play
  const remaining = timer.remaining;
  const timerClass =
    remaining <= 5 ? 'danger' : remaining <= 15 ? 'warn' : '';

  const hud = config && (
    <Card className="row-between" style={{ padding: 12, flexWrap: 'wrap' }}>
      <div className="row" style={{ gap: 10 }}>
        <span
          className={reducedMotion ? '' : 'anim-pop'}
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: 'Sora, sans-serif',
            color: 'var(--accent)',
          }}
        >
          {config.letter}
        </span>
        {mode === 'local' && <Badge tone="brand">{players[turn]}</Badge>}
        {config.doubling && <Badge tone="accent">Points doublés !</Badge>}
      </div>
      <div className="row" style={{ gap: 12 }}>
        <span className={`timer-ring ${timerClass}`} style={{ fontSize: '1.4rem' }}>
          ⏱ {formatClock(remaining)}
        </span>
        <Button variant="accent" onClick={finishTurn}>
          ✋ Stop
        </Button>
      </div>
    </Card>
  );

  return (
    <GameShell title="Petit Bac" emoji="✏️" rules={rules} hud={hud}>
      {special && (
        <Card style={{ borderColor: 'var(--accent)' }}>
          <strong>✨ Lettre spéciale :</strong> {special}
        </Card>
      )}
      <form
        className="grid grid-2"
        onSubmit={(e) => {
          e.preventDefault();
          finishTurn();
        }}
      >
        {orderedCats.map((cat, i) => (
          <div key={cat.id} className="field" style={{ marginBottom: 4 }}>
            <label htmlFor={`cat-${cat.id}`} style={{ color: cat.theme }}>
              {cat.emoji} {cat.label}
            </label>
            <input
              id={`cat-${cat.id}`}
              ref={i === 0 ? firstInputRef : undefined}
              className="input"
              autoComplete="off"
              autoCapitalize="words"
              value={answers[cat.id] ?? ''}
              placeholder={`${config?.letter}…`}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [cat.id]: e.target.value }))
              }
            />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <Button type="submit" variant="primary" block>
            Valider mes réponses
          </Button>
        </div>
      </form>
    </GameShell>
  );
}

/* ------------------------------- setup UI ------------------------------- */

function SetupScreen(props: {
  mode: Mode;
  setMode: (m: Mode) => void;
  duration: number;
  setDuration: (n: number) => void;
  catCount: number;
  setCatCount: (n: number) => void;
  expert: boolean;
  setExpert: (b: boolean) => void;
  daily: boolean;
  setDaily: (b: boolean) => void;
  players: string[];
  setPlayers: (p: string[]) => void;
  onStart: () => void;
}) {
  const {
    mode, setMode, duration, setDuration, catCount, setCatCount,
    expert, setExpert, daily, setDaily, players, setPlayers, onStart,
  } = props;

  return (
    <div className="stack">
      <Card>
        <h3>Mode de jeu</h3>
        <div className="row">
          {(['solo', 'local', 'online'] as Mode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? 'primary' : 'ghost'}
              onClick={() => setMode(m)}
            >
              {m === 'solo' ? '🧍 Solo' : m === 'local' ? '👥 Local' : '🌐 En ligne'}
            </Button>
          ))}
        </div>
      </Card>

      {mode === 'local' && (
        <Card>
          <h3>Joueurs ({players.length})</h3>
          <div className="stack">
            {players.map((p, i) => (
              <div key={i} className="row">
                <input
                  className="input"
                  value={p}
                  maxLength={20}
                  onChange={(e) => {
                    const next = [...players];
                    next[i] = e.target.value;
                    setPlayers(next);
                  }}
                />
                {players.length > 2 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setPlayers(players.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            {players.length < 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlayers([...players, `Joueur ${players.length + 1}`])}
              >
                + Ajouter un joueur
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card>
        <h3>Réglages de la manche</h3>
        <div className="field">
          <label>Durée : {duration}s</label>
          <input
            type="range"
            min={30}
            max={180}
            step={10}
            value={duration}
            onChange={(e) => setDuration(clampInt(+e.target.value, 30, 180))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <label>Nombre de catégories : {catCount}</label>
          <input
            type="range"
            min={4}
            max={10}
            value={catCount}
            onChange={(e) => setCatCount(clampInt(+e.target.value, 4, 10))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="row" style={{ gap: 18 }}>
          <label className="switch">
            <input type="checkbox" checked={expert} onChange={(e) => setExpert(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span>Mode expert (catégories & lettres rares)</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={daily} onChange={(e) => setDaily(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span>Défi du jour</span>
          </label>
        </div>
      </Card>

      <Button variant="primary" size="lg" onClick={onStart}>
        {mode === 'online' ? 'Configurer le salon en ligne' : '▶ Lancer la manche'}
      </Button>
    </div>
  );
}

/* ------------------------------ results UI ------------------------------ */

export function ResultsScreen({
  config,
  scores,
  onReplay,
}: {
  config: RoundConfig;
  scores: PlayerScore[];
  onReplay: () => void;
}) {
  const ranked = [...scores].sort((a, b) => b.total - a.total);
  return (
    <div className="stack">
      <Card className="center">
        <h2>Manche terminée — lettre {config.letter}</h2>
        {ranked.length > 1 && (
          <p className="muted">
            🏆 Vainqueur : <strong>{ranked[0].name}</strong> avec {ranked[0].total} points
          </p>
        )}
      </Card>

      {ranked.map((p) => (
        <Card key={p.playerId}>
          <div className="row-between">
            <h3 style={{ margin: 0 }}>{p.name}</h3>
            <div className="row" style={{ gap: 8 }}>
              <Badge tone="accent">{p.total} pts</Badge>
              {p.maxCombo >= 2 && <Badge tone="brand">Combo x{p.maxCombo}</Badge>}
              {p.speedBonus > 0 && <Badge tone="success">+{p.speedBonus} vitesse</Badge>}
            </div>
          </div>
          <div className="divider" />
          <table className="table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Réponse</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {p.results.map((r) => (
                <tr key={r.category}>
                  <td>{categoryById(r.category)?.label ?? r.category}</td>
                  <td>{r.answer || <span className="faint">—</span>}</td>
                  <td>
                    <Badge
                      tone={
                        r.status === 'unique'
                          ? 'success'
                          : r.status === 'shared'
                          ? 'brand'
                          : 'danger'
                      }
                    >
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      <Button variant="primary" onClick={onReplay}>
        Rejouer
      </Button>
    </div>
  );
}
