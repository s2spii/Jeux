import { useEffect, useState } from 'react';
import { GameShell } from '../../components/GameShell';
import { Button, Badge, Card, Modal, EmptyState } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { useAuth } from '../../store/auth';
import { useStats } from '../../store/stats';
import { useSaves } from '../../store/saves';
import { useSettings } from '../../store/settings';
import { useContent } from '../../store/content';
import { formatDuration } from '../../lib/format';
import { DeductionGrid, cycleMark, type Mark } from './DeductionGrid';
import { CAMPAIGN } from './campaign';
import {
  generateCase,
  scoreCase,
  explainSolution,
  type Difficulty,
  type EnqueteCase,
} from './engine';

type Phase = 'setup' | 'play' | 'verdict';

interface SavedState {
  seed: string;
  difficulty: Difficulty;
  templateId: string;
  mode: string;
  marksLieu: Record<string, Mark>;
  marksObjet: Record<string, Mark>;
  revealed: string[];
  hintsUsed: number;
  wrongAccusations: number;
  notes: string;
  startedAt: number;
}

const SAVE_LABEL = 'Enquête en cours';

export function EnqueteGame() {
  const user = useAuth((s) => s.user);
  const record = useStats((s) => s.record);
  const saves = useSaves();
  const toast = useToast();
  const reducedMotion = useSettings((s) => s.reducedMotion);

  const [phase, setPhase] = useState<Phase>('setup');
  const [caseData, setCaseData] = useState<EnqueteCase | null>(null);
  const [mode, setMode] = useState('campagne');
  const [marksLieu, setMarksLieu] = useState<Record<string, Mark>>({});
  const [marksObjet, setMarksObjet] = useState<Record<string, Mark>>({});
  const [revealed, setRevealed] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAccusations, setWrongAccusations] = useState(0);
  const [notes, setNotes] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [solved, setSolved] = useState(false);

  const existingSave = user ? saves.get<SavedState>('enquete', user.id) : null;

  function beginCase(c: EnqueteCase, m: string, restore?: SavedState) {
    setCaseData(c);
    setMode(m);
    setMarksLieu(restore?.marksLieu ?? {});
    setMarksObjet(restore?.marksObjet ?? {});
    setRevealed(restore?.revealed ?? []);
    setHintsUsed(restore?.hintsUsed ?? 0);
    setWrongAccusations(restore?.wrongAccusations ?? 0);
    setNotes(restore?.notes ?? '');
    setStartedAt(restore?.startedAt ?? Date.now());
    setPhase('play');
  }

  function persist(next?: Partial<SavedState>) {
    if (!user || !caseData) return;
    const state: SavedState = {
      seed: caseData.seed,
      difficulty: caseData.difficulty,
      templateId: caseData.templateId,
      mode,
      marksLieu,
      marksObjet,
      revealed,
      hintsUsed,
      wrongAccusations,
      notes,
      startedAt,
      ...next,
    };
    saves.save('enquete', user.id, state, SAVE_LABEL);
  }

  // Autosave whenever meaningful progress changes.
  useEffect(() => {
    if (phase === 'play') persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksLieu, marksObjet, revealed, hintsUsed, wrongAccusations, notes]);

  function toggle(kind: 'lieu' | 'objet', ri: number, ci: number) {
    const key = `${ri}-${ci}`;
    if (kind === 'lieu') {
      setMarksLieu((m) => ({ ...m, [key]: cycleMark(m[key] ?? '') }));
    } else {
      setMarksObjet((m) => ({ ...m, [key]: cycleMark(m[key] ?? '') }));
    }
  }

  function revealClue(id: string) {
    if (revealed.includes(id)) return;
    setRevealed((r) => [...r, id]);
    toast.push('Indice supplémentaire révélé (−80 pts).');
  }

  function useHint() {
    if (!caseData) return;
    // Reveal one correct positive fact not yet marked.
    const n = caseData.suspects.length;
    for (let s = 0; s < n; s++) {
      const trueLieu = caseData.solution.lieu[s];
      const key = `${s}-${trueLieu}`;
      if (marksLieu[key] !== 'yes') {
        setMarksLieu((m) => ({ ...m, [key]: 'yes' }));
        setHintsUsed((h) => h + 1);
        toast.push(
          `Aide : ${caseData.suspects[s]} était dans ${caseData.lieux[trueLieu]} (−120 pts).`,
        );
        return;
      }
    }
    toast.push('Plus aucune aide nécessaire, la grille des lieux est complète !');
  }

  /** Coherence check against the solution (flags wrong "✓" marks). */
  function checkCoherence() {
    if (!caseData) return;
    const conflicts: string[] = [];
    const n = caseData.suspects.length;
    for (let s = 0; s < n; s++) {
      for (let l = 0; l < n; l++) {
        if (marksLieu[`${s}-${l}`] === 'yes' && caseData.solution.lieu[s] !== l) {
          conflicts.push(
            `${caseData.suspects[s]} n'était pas dans ${caseData.lieux[l]}.`,
          );
        }
        if (marksObjet[`${s}-${l}`] === 'yes' && caseData.solution.objet[s] !== l) {
          conflicts.push(
            `${caseData.suspects[s]} ne portait pas ${caseData.objets[l]}.`,
          );
        }
      }
    }
    if (conflicts.length === 0) {
      toast.push('✓ Aucune contradiction détectée dans vos déductions.', 'success');
    } else {
      toast.push(`⚠ ${conflicts.length} contradiction(s) : ${conflicts[0]}`, 'danger');
    }
  }

  function accuse(suspectIdx: number) {
    if (!caseData) return;
    setAccuseOpen(false);
    if (suspectIdx === caseData.solution.culprit) {
      const score = scoreCase({
        solved: true,
        durationMs: Date.now() - startedAt,
        hintsUsed,
        optionalCluesRevealed: revealed.length,
        wrongAccusations,
        difficulty: caseData.difficulty,
      });
      setFinalScore(score.total);
      setSolved(true);
      if (user) {
        record({
          game: 'enquete',
          userId: user.id,
          username: user.username,
          score: score.total,
          mode,
          meta: {
            solved: true,
            hintsUsed,
            difficulty: caseData.difficulty,
            durationSec: Math.round((Date.now() - startedAt) / 1000),
          },
        });
        saves.clear('enquete', user.id);
      }
      setPhase('verdict');
    } else {
      setWrongAccusations((w) => w + 1);
      toast.push(
        `Ce n'est pas ${caseData.suspects[suspectIdx]}. Reprenez vos indices… (−150 pts)`,
        'danger',
      );
    }
  }

  function giveUp() {
    if (!caseData) return;
    setFinalScore(0);
    setSolved(false);
    if (user) {
      record({
        game: 'enquete',
        userId: user.id,
        username: user.username,
        score: 0,
        mode,
        meta: { solved: false, hintsUsed, difficulty: caseData.difficulty },
      });
      saves.clear('enquete', user.id);
    }
    setPhase('verdict');
  }

  /* ----------------------------- render ----------------------------- */

  const rules = (
    <>
      <p>
        Une victime, plusieurs suspects. Chaque suspect se trouvait dans un{' '}
        <strong>lieu</strong> unique et portait un <strong>objet</strong> unique.
      </p>
      <p>
        Les <strong>faits du crime</strong> vous indiquent le lieu et l'objet du
        coupable. À l'aide des indices, remplissez les grilles de déduction pour
        identifier le seul suspect qui réunit ces deux conditions.
      </p>
      <ul>
        <li>Cliquez sur une case pour la marquer ✗ (exclu) puis ✓ (confirmé).</li>
        <li>Révélez des indices optionnels ou demandez une aide… au prix de points.</li>
        <li>Vérifiez la cohérence de vos déductions à tout moment.</li>
        <li>Accusez quand vous êtes certain : une erreur coûte des points.</li>
      </ul>
      <p className="faint">
        Score = résolution + rapidité − indices optionnels − aides − erreurs.
      </p>
    </>
  );

  if (phase === 'setup') {
    return (
      <GameShell title="Le Cabinet des Énigmes" emoji="🕵️" rules={rules}>
        <SetupScreen
          existingSave={existingSave}
          onResume={() => {
            if (!existingSave) return;
            const s = existingSave.state as SavedState;
            const c = generateCase(s.seed, s.difficulty, s.templateId);
            beginCase(c, s.mode, s);
          }}
          onStartCampaign={(seed, templateId, difficulty) =>
            beginCase(generateCase(seed, difficulty, templateId), 'campagne')
          }
          onStartRandom={(difficulty) =>
            beginCase(
              generateCase(`r-${Date.now()}-${Math.random()}`, difficulty),
              'rejouable',
            )
          }
        />
      </GameShell>
    );
  }

  if (phase === 'verdict' && caseData) {
    const explanation = explainSolution(caseData);
    return (
      <GameShell title={caseData.title} emoji="🕵️" rules={rules}>
        <Card className="stack" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }} className={reducedMotion ? '' : 'anim-pop'}>
            {solved ? '🎉' : '🔍'}
          </div>
          <h2>{solved ? 'Affaire résolue !' : 'Affaire classée'}</h2>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Badge tone={solved ? 'success' : 'danger'}>
              {solved ? 'Coupable démasqué' : 'Non résolu'}
            </Badge>
            <Badge tone="accent">{finalScore} points</Badge>
          </div>
          <div className="divider" />
          <div style={{ textAlign: 'left' }}>
            <h3>La solution</h3>
            {explanation.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => setPhase('setup')}>
              Nouvelle enquête
            </Button>
          </div>
        </Card>
      </GameShell>
    );
  }

  if (!caseData) return null;

  const visibleClues = caseData.clues.filter((c) => !c.optional);
  const optionalClues = caseData.clues.filter((c) => c.optional);

  const hud = (
    <Card className="row-between" style={{ padding: 12, flexWrap: 'wrap' }}>
      <div className="row" style={{ gap: 10 }}>
        <Badge tone="brand">{caseData.difficulty}</Badge>
        <Badge>🕒 {formatDuration(Date.now() - startedAt)}</Badge>
        {hintsUsed > 0 && <Badge tone="danger">Aides : {hintsUsed}</Badge>}
        {wrongAccusations > 0 && (
          <Badge tone="danger">Erreurs : {wrongAccusations}</Badge>
        )}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <Button size="sm" variant="ghost" onClick={useHint}>
          💡 Aide
        </Button>
        <Button size="sm" variant="ghost" onClick={checkCoherence}>
          ✔ Vérifier
        </Button>
        <Button size="sm" variant="accent" onClick={() => setAccuseOpen(true)}>
          ⚖ Accuser
        </Button>
      </div>
    </Card>
  );

  return (
    <GameShell title={caseData.title} emoji="🕵️" rules={rules} hud={hud}>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card>
            <h3>🗞️ L'affaire</h3>
            <p>{caseData.intro}</p>
            <p className="muted">
              <strong>Faits établis :</strong> le crime concernant {caseData.victim}{' '}
              s'est produit dans <strong>{caseData.lieux[caseData.crimeLieu]}</strong>,
              et le coupable portait{' '}
              <strong>{caseData.objets[caseData.crimeObjet]}</strong>.
            </p>
          </Card>

          <Card>
            <h3>🔎 Indices</h3>
            <ul className="stack" style={{ paddingLeft: 18, gap: 6 }}>
              {visibleClues.map((c) => (
                <li key={c.id}>
                  {c.text}{' '}
                  <span className="faint">
                    [{c.category}]
                  </span>
                </li>
              ))}
            </ul>
            {optionalClues.length > 0 && (
              <>
                <div className="divider" />
                <strong className="faint">Indices optionnels (coûtent des points)</strong>
                <ul className="stack" style={{ paddingLeft: 18, gap: 6, marginTop: 8 }}>
                  {optionalClues.map((c) =>
                    revealed.includes(c.id) ? (
                      <li key={c.id}>{c.text}</li>
                    ) : (
                      <li key={c.id}>
                        <Button size="sm" variant="ghost" onClick={() => revealClue(c.id)}>
                          Révéler un indice (−80)
                        </Button>
                      </li>
                    ),
                  )}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <h3>📝 Notes</h3>
            <textarea
              className="input"
              rows={4}
              placeholder="Vos hypothèses, recoupements, intuitions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>
        </div>

        <div className="stack">
          <DeductionGrid
            caption="Suspects × Lieux"
            rows={caseData.suspects}
            cols={caseData.lieux}
            marks={marksLieu}
            onToggle={(ri, ci) => toggle('lieu', ri, ci)}
            highlightCol={caseData.crimeLieu}
          />
          <DeductionGrid
            caption="Suspects × Objets"
            rows={caseData.suspects}
            cols={caseData.objets}
            marks={marksObjet}
            onToggle={(ri, ci) => toggle('objet', ri, ci)}
            highlightCol={caseData.crimeObjet}
          />
          <Button variant="ghost" onClick={giveUp}>
            Abandonner et voir la solution
          </Button>
        </div>
      </div>

      <Modal open={accuseOpen} onClose={() => setAccuseOpen(false)} title="Désigner le coupable">
        <p className="muted">
          Qui réunit les deux faits du crime ? Une erreur vous coûtera des points.
        </p>
        <div className="stack">
          {caseData.suspects.map((s, i) => (
            <Button key={s} variant="ghost" block onClick={() => accuse(i)}>
              {s}
            </Button>
          ))}
        </div>
      </Modal>
    </GameShell>
  );
}

/* ------------------------------- setup UI ------------------------------- */

function SetupScreen({
  existingSave,
  onResume,
  onStartCampaign,
  onStartRandom,
}: {
  existingSave: { state: unknown } | null;
  onResume: () => void;
  onStartCampaign: (seed: string, templateId: string, difficulty: Difficulty) => void;
  onStartRandom: (difficulty: Difficulty) => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const customCases = useContent((s) => s.customCases);
  const campaign = [...CAMPAIGN, ...customCases];

  return (
    <div className="stack">
      {existingSave && (
        <Card className="row-between">
          <div>
            <strong>Reprendre votre enquête</strong>
            <div className="faint">Une partie sauvegardée est disponible.</div>
          </div>
          <Button variant="primary" onClick={onResume}>
            ▶ Reprendre
          </Button>
        </Card>
      )}

      <Card>
        <h3>📁 Campagne</h3>
        <p className="muted">Six affaires de difficulté croissante, vérifiées et solubles.</p>
        <div className="grid grid-3">
          {campaign.map((c) => (
            <Card key={c.seed} hover className="stack">
              <div className="row-between">
                <strong>{c.name}</strong>
                <Badge tone="brand">{c.difficulty}</Badge>
              </div>
              <p className="faint" style={{ flex: 1 }}>
                {c.brief}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartCampaign(c.seed, c.templateId, c.difficulty)}
              >
                Enquêter
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      <Card>
        <h3>🎲 Partie rejouable</h3>
        <p className="muted">
          Une affaire générée aléatoirement : nouveaux suspects, lieux, objets et
          indices à chaque fois. Solution unique garantie.
        </p>
        <div className="row">
          {(['facile', 'normal', 'difficile'] as Difficulty[]).map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? 'primary' : 'ghost'}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </Button>
          ))}
          <div className="spacer" />
          <Button variant="accent" onClick={() => onStartRandom(difficulty)}>
            Générer une enquête
          </Button>
        </div>
      </Card>

      {!existingSave && (
        <EmptyState
          icon="🕵️"
          title="Prêt à mener l'enquête ?"
          hint="Choisissez une affaire de campagne ou générez une partie unique."
        />
      )}
    </div>
  );
}
