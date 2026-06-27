import { useEffect, useRef, useState } from 'react';
import { GameShell } from '../../components/GameShell';
import { Button, Badge, Card, Progress } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';
import { useSettings } from '../../store/settings';
import { dailySeed } from '../../lib/rng';
import { formatClock } from '../../lib/format';
import {
  generateLevel,
  initialState,
  play,
  usePower as applyPower,
  scoreLevel,
  distance,
  POWERS,
  type Difficulty,
  type Level,
  type PlayState,
  type PowerId,
  type ParadoxKind,
} from './engine';

type Mode = 'entrainement' | 'quotidien' | 'infini' | 'classe';
type Phase = 'setup' | 'play' | 'end';

const GLYPHS = ['🟣', '🟢', '🔵', '🟠', '🔴', '🟡'];
const GLYPH_NAMES = ['violet', 'vert', 'bleu', 'orange', 'rouge', 'jaune'];

const PARADOX_LABEL: Record<ParadoxKind, string> = {
  mirror: '🪞 Miroir — les rotations sont inversées',
  inversion: '🔃 Inversion — ▲ et ▼ sont permutés',
  shift: '↔️ Décalage — les échanges portent plus loin',
  freeze: '❄️ Gel — une cellule est figée',
};

const MODE_DIFF: Record<Mode, Difficulty> = {
  entrainement: 'entrainement',
  quotidien: 'normal',
  infini: 'normal',
  classe: 'difficile',
};

export function ParadoxesGame() {
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const record = useStats((s) => s.record);
  const reducedMotion = useSettings((s) => s.reducedMotion);

  const [mode, setMode] = useState<Mode>('entrainement');
  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('entrainement');

  const [level, setLevel] = useState<Level | null>(null);
  const [state, setState] = useState<PlayState | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [runScore, setRunScore] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const seedRef = useRef('');

  // elapsed timer for ranked / daily
  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(
      () => setElapsed(Math.round((Date.now() - startRef.current) / 1000)),
      500,
    );
    return () => window.clearInterval(id);
  }, [phase]);

  function startRun(selectedMode: Mode) {
    const diff = MODE_DIFF[selectedMode];
    const effectiveDiff = selectedMode === 'entrainement' ? difficulty : diff;
    const seed =
      selectedMode === 'quotidien'
        ? dailySeed('paradoxes')
        : `${Date.now()}-${Math.random()}`;
    seedRef.current = seed;
    setMode(selectedMode);
    setRunScore(0);
    setLevelIndex(0);
    loadLevel(seed, effectiveDiff, 0);
    setPhase('play');
  }

  function loadLevel(seed: string, diff: Difficulty, index: number) {
    const lvl = generateLevel(seed, diff, index);
    setLevel(lvl);
    setState(initialState(lvl));
    setReveal(false);
    setElapsed(0);
    startRef.current = Date.now();
  }

  function doMove(op: Parameters<typeof play>[2]) {
    if (!level || !state) return;
    const res = play(level, state, op);
    if (res.blocked) {
      toast.push(res.blocked, 'danger');
      return;
    }
    setState(res.state);
    if (res.gainedEnergy) toast.push('+1 énergie paradoxale ⚡', 'success');
    if (res.paradoxTriggered) {
      toast.push(PARADOX_LABEL[res.paradoxTriggered], 'default');
    }
    if (res.state.solved) onSolved(res.state);
    else if (res.state.failed) onFailed();
  }

  function power(p: PowerId) {
    if (!level || !state) return;
    if (state.energy < POWERS[p].cost) {
      toast.push('Énergie insuffisante.', 'danger');
      return;
    }
    if (p === 'revelation') {
      setReveal(true);
      window.setTimeout(() => setReveal(false), 2500);
    }
    const next = applyPower(level, state, p);
    setState(next);
    if (next.solved) onSolved(next);
  }

  function onSolved(st: PlayState) {
    if (!level) return;
    const sec = Math.round((Date.now() - startRef.current) / 1000);
    const gained = scoreLevel(level, st, sec);
    const newTotal = runScore + gained;
    setRunScore(newTotal);

    if (mode === 'infini') {
      toast.push(`Niveau ${levelIndex + 1} résolu ! +${gained}`, 'success');
      const nextIndex = levelIndex + 1;
      setLevelIndex(nextIndex);
      loadLevel(seedRef.current, MODE_DIFF.infini, nextIndex);
    } else {
      finishRun(newTotal, true);
    }
  }

  function onFailed() {
    finishRun(runScore, false);
  }

  function finishRun(total: number, solved: boolean) {
    setPhase('end');
    if (user) {
      record({
        game: 'paradoxes',
        userId: user.id,
        username: user.username,
        score: total,
        mode,
        meta: {
          level: levelIndex + (solved ? 1 : 0),
          difficulty: level?.difficulty ?? 'normal',
          solved,
        },
      });
    }
  }

  const rules = (
    <>
      <p>
        Transformez la ligne de glyphes pour qu'elle corresponde exactement à la
        <strong> cible</strong>, avant d'épuiser votre budget de coups.
      </p>
      <ul>
        <li><strong>▲ / ▼</strong> : change la couleur d'un glyphe.</li>
        <li><strong>⇄</strong> : échange deux glyphes voisins.</li>
        <li><strong>◀ / ▶</strong> : fait pivoter toute la ligne.</li>
      </ul>
      <p>
        Attention aux <strong>paradoxes</strong> : tous les quelques coups, vos
        commandes changent de sens ! Progressez pour gagner de l'<strong>énergie</strong>{' '}
        et dépensez-la en <strong>pouvoirs temporaires</strong>.
      </p>
      <p className="faint">
        Modes : entraînement (libre), défi du jour, infini (niveaux qui s'enchaînent)
        et classé (chronométré).
      </p>
    </>
  );

  /* ------------------------------ views ------------------------------ */

  if (phase === 'setup') {
    return (
      <GameShell title="Chambre des Paradoxes" emoji="🌀" rules={rules}>
        <div className="stack">
          <Card>
            <h3>Choisissez un mode</h3>
            <div className="grid grid-2">
              <ModeCard
                title="🎓 Entraînement"
                desc="Sans pression : pas de chrono, difficulté au choix."
                onClick={() => startRun('entrainement')}
              >
                <div className="row">
                  {(['entrainement', 'normal', 'difficile', 'cauchemar'] as Difficulty[]).map(
                    (d) => (
                      <Button
                        key={d}
                        size="sm"
                        variant={difficulty === d ? 'primary' : 'ghost'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDifficulty(d);
                        }}
                      >
                        {d}
                      </Button>
                    ),
                  )}
                </div>
              </ModeCard>
              <ModeCard
                title="📅 Défi du jour"
                desc="Le même casse-tête pour tout le monde aujourd'hui."
                onClick={() => startRun('quotidien')}
              />
              <ModeCard
                title="♾️ Infini"
                desc="Des niveaux de plus en plus retors. Jusqu'où irez-vous ?"
                onClick={() => startRun('infini')}
              />
              <ModeCard
                title="🏆 Classé"
                desc="Chronométré et difficile. Pour le classement."
                onClick={() => startRun('classe')}
              />
            </div>
          </Card>
        </div>
      </GameShell>
    );
  }

  if (phase === 'end' && level && state) {
    return (
      <GameShell title="Chambre des Paradoxes" emoji="🌀" rules={rules}>
        <Card className="center stack">
          <div style={{ fontSize: '3rem' }} className={reducedMotion ? '' : 'anim-pop'}>
            {state.solved ? '✨' : '💥'}
          </div>
          <h2>{state.solved ? 'Cible atteinte !' : 'Paradoxe insoluble…'}</h2>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Badge tone="accent">{runScore} points</Badge>
            {mode === 'infini' && <Badge tone="brand">Niveau {levelIndex + 1}</Badge>}
          </div>
          <p className="muted">
            {mode === 'infini'
              ? `Vous avez franchi ${levelIndex} niveau(x).`
              : state.solved
              ? `Résolu en ${state.movesUsed} coups.`
              : 'La ligne n’a pas atteint sa cible à temps.'}
          </p>
          <Button variant="primary" onClick={() => setPhase('setup')}>
            Rejouer
          </Button>
        </Card>
      </GameShell>
    );
  }

  if (!level || !state) return null;

  const dist = distance(state.cells, level.target);
  const progress = ((level.size - dist) / level.size) * 100;
  const timed = mode === 'classe' || mode === 'quotidien';

  const hud = (
    <Card className="stack" style={{ padding: 14 }}>
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8 }}>
          <Badge tone="brand">{mode === 'infini' ? `Niveau ${levelIndex + 1}` : level.difficulty}</Badge>
          <Badge>Coups {state.movesUsed}/{level.budget}</Badge>
          <Badge tone="accent">⚡ {state.energy}</Badge>
          {timed && <Badge>⏱ {formatClock(elapsed)}</Badge>}
        </div>
        {state.activeParadox || state.frozenCell != null ? (
          <Badge tone="danger">
            {state.frozenCell != null
              ? PARADOX_LABEL.freeze
              : PARADOX_LABEL[state.activeParadox!]}
          </Badge>
        ) : (
          <Badge tone="success">Règles stables</Badge>
        )}
      </div>
      <Progress value={progress} />
    </Card>
  );

  const toolbar = (
    <Badge tone="accent">Score {runScore}</Badge>
  );

  return (
    <GameShell
      title="Chambre des Paradoxes"
      emoji="🌀"
      rules={rules}
      hud={hud}
      toolbar={toolbar}
    >
      <div className="stack">
        <GlyphLine
          label="🎯 Cible"
          cells={level.target}
          target={level.target}
          reveal
          muted
        />

        <Card>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <strong>Votre ligne</strong>
            <Button size="sm" variant="ghost" onClick={() => doMove({ type: 'rot', dir: 'left' })}>
              ◀ Pivoter
            </Button>
          </div>
          <BoardControls
            level={level}
            state={state}
            reveal={reveal}
            reducedMotion={reducedMotion}
            onInc={(i) => doMove({ type: 'inc', index: i })}
            onDec={(i) => doMove({ type: 'dec', index: i })}
            onSwap={(i) => doMove({ type: 'swap', index: i })}
          />
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <Button size="sm" variant="ghost" onClick={() => doMove({ type: 'rot', dir: 'right' })}>
              Pivoter ▶
            </Button>
          </div>
        </Card>

        <Card>
          <div className="row-between">
            <strong>Pouvoirs temporaires</strong>
            <span className="faint">Énergie : {state.energy} ⚡</span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            {(Object.keys(POWERS) as PowerId[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant="ghost"
                disabled={state.energy < POWERS[p].cost}
                onClick={() => power(p)}
                title={POWERS[p].desc}
              >
                {POWERS[p].name} ({POWERS[p].cost}⚡)
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </GameShell>
  );
}

/* ---------------------------- sub-components ---------------------------- */

function ModeCard({
  title,
  desc,
  onClick,
  children,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Card hover className="stack" onClick={onClick} style={{ cursor: 'pointer' }}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p className="faint" style={{ flex: 1 }}>
        {desc}
      </p>
      {children}
      <Button variant="primary" size="sm" onClick={onClick}>
        Jouer
      </Button>
    </Card>
  );
}

function Glyph({
  value,
  correct,
  frozen,
  reduced,
}: {
  value: number;
  correct?: boolean;
  frozen?: boolean;
  reduced?: boolean;
}) {
  return (
    <div
      className={correct && !reduced ? 'anim-pop' : ''}
      aria-label={GLYPH_NAMES[value] ?? `couleur ${value}`}
      style={{
        width: 52,
        height: 52,
        display: 'grid',
        placeItems: 'center',
        fontSize: '1.8rem',
        borderRadius: 12,
        border: `2px solid ${correct ? 'var(--success)' : 'var(--border)'}`,
        background: frozen ? 'color-mix(in srgb, var(--brand-2) 18%, transparent)' : 'var(--surface-2)',
        opacity: frozen ? 0.6 : 1,
      }}
    >
      {GLYPHS[value] ?? '⬜'}
      {frozen && <span style={{ position: 'absolute', fontSize: '0.8rem' }}>❄️</span>}
    </div>
  );
}

function GlyphLine({
  label,
  cells,
  target,
  reveal,
  muted,
}: {
  label: string;
  cells: number[];
  target: number[];
  reveal?: boolean;
  muted?: boolean;
}) {
  return (
    <Card style={{ opacity: muted ? 0.95 : 1 }}>
      <div className="faint" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
        {cells.map((c, i) => (
          <Glyph key={i} value={c} correct={reveal && c === target[i]} reduced />
        ))}
      </div>
    </Card>
  );
}

function BoardControls({
  level,
  state,
  reveal,
  reducedMotion,
  onInc,
  onDec,
  onSwap,
}: {
  level: Level;
  state: PlayState;
  reveal: boolean;
  reducedMotion: boolean;
  onInc: (i: number) => void;
  onDec: (i: number) => void;
  onSwap: (i: number) => void;
}) {
  return (
    <div className="row" style={{ gap: 4, justifyContent: 'center', alignItems: 'stretch', flexWrap: 'nowrap', overflowX: 'auto' }}>
      {state.cells.map((c, i) => (
        <div key={i} className="stack" style={{ gap: 4, alignItems: 'center' }}>
          <Button size="sm" variant="ghost" aria-label={`Incrémenter cellule ${i + 1}`} onClick={() => onInc(i)}>
            ▲
          </Button>
          <Glyph
            value={c}
            correct={reveal && c === level.target[i]}
            frozen={state.frozenCell === i}
            reduced={reducedMotion}
          />
          <Button size="sm" variant="ghost" aria-label={`Décrémenter cellule ${i + 1}`} onClick={() => onDec(i)}>
            ▼
          </Button>
          {i < state.cells.length - 1 ? (
            <Button size="sm" variant="ghost" aria-label={`Échanger cellules ${i + 1} et ${i + 2}`} onClick={() => onSwap(i)}>
              ⇄
            </Button>
          ) : (
            <div style={{ height: 30 }} />
          )}
        </div>
      ))}
    </div>
  );
}
