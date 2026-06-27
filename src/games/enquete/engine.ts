/**
 * Investigation engine.
 *
 * A case is a logic-grid puzzle wearing a narrative costume. The hidden truth
 * is two bijections over the cast of N suspects:
 *   - lieu[s]  : the location where suspect s was
 *   - objet[s] : the object suspect s carried
 * The crime is committed by the suspect whose (lieu, objet) match the known
 * crime facts. Clues constrain the bijections. The generator only keeps a clue
 * set once the brute-force solver proves the solution is UNIQUE — satisfying
 * the spec requirement "chaque scénario a une solution unique et vérifiée".
 */
import { Rng } from '../../lib/rng';
import { getTemplate, type EnqueteTemplate } from './templates';

export type ClueKind =
  | 'pos-lieu'
  | 'neg-lieu'
  | 'pos-objet'
  | 'neg-objet'
  | 'link'
  | 'neg-link';

export interface Clue {
  id: string;
  kind: ClueKind;
  /** indices into the relevant arrays */
  suspect?: number;
  lieu?: number;
  objet?: number;
  text: string;
  /** Optional/hidden clues cost points to reveal. */
  optional: boolean;
  category: 'lieu' | 'objet' | 'lien' | 'mobile';
}

export interface Solution {
  lieu: number[]; // lieu[suspect] = lieu index
  objet: number[]; // objet[suspect] = objet index
  culprit: number;
}

export interface EnqueteCase {
  id: string;
  seed: string;
  templateId: string;
  title: string;
  intro: string;
  victim: string;
  difficulty: Difficulty;
  suspects: string[];
  lieux: string[];
  objets: string[];
  motive: string;
  /** Known crime facts revealed to the player. */
  crimeLieu: number;
  crimeObjet: number;
  clues: Clue[];
  solution: Solution;
  /** Number of mandatory (non-optional) clues, for scoring baselines. */
  baseClueCount: number;
}

export type Difficulty = 'facile' | 'normal' | 'difficile';

const DIFF_N: Record<Difficulty, number> = {
  facile: 4,
  normal: 5,
  difficile: 6,
};

/* ----------------------------- permutations ----------------------------- */

function* permutations(n: number): Generator<number[]> {
  const arr = Array.from({ length: n }, (_, i) => i);
  const c = new Array(n).fill(0);
  yield arr.slice();
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const k = i % 2 === 0 ? 0 : c[i];
      [arr[i], arr[k]] = [arr[k], arr[i]];
      yield arr.slice();
      c[i]++;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
}

/* ------------------------------- solver --------------------------------- */

function lieuClueOk(clue: Clue, lieu: number[]): boolean {
  switch (clue.kind) {
    case 'pos-lieu':
      return lieu[clue.suspect!] === clue.lieu;
    case 'neg-lieu':
      return lieu[clue.suspect!] !== clue.lieu;
    default:
      return true;
  }
}

function objetClueOk(clue: Clue, objet: number[]): boolean {
  switch (clue.kind) {
    case 'pos-objet':
      return objet[clue.suspect!] === clue.objet;
    case 'neg-objet':
      return objet[clue.suspect!] !== clue.objet;
    default:
      return true;
  }
}

function linkClueOk(clue: Clue, lieu: number[], objet: number[]): boolean {
  if (clue.kind !== 'link' && clue.kind !== 'neg-link') return true;
  // suspect at lieu L is the one with lieu[s] === clue.lieu
  const suspectAtLieu = lieu.findIndex((l) => l === clue.lieu);
  const carries = objet[suspectAtLieu] === clue.objet;
  return clue.kind === 'link' ? carries : !carries;
}

/**
 * Count consistent (lieu, objet) assignments, stopping at `limit`.
 * Returns the first solution found and the count (capped at limit).
 */
export function solve(
  clues: Clue[],
  n: number,
  limit = 2,
): { count: number; first?: { lieu: number[]; objet: number[] } } {
  const lieuClues = clues.filter((c) => c.kind === 'pos-lieu' || c.kind === 'neg-lieu');
  const objetClues = clues.filter((c) => c.kind === 'pos-objet' || c.kind === 'neg-objet');
  const linkClues = clues.filter((c) => c.kind === 'link' || c.kind === 'neg-link');

  const validLieu: number[][] = [];
  for (const p of permutations(n)) {
    if (lieuClues.every((c) => lieuClueOk(c, p))) validLieu.push(p.slice());
  }
  const validObjet: number[][] = [];
  for (const p of permutations(n)) {
    if (objetClues.every((c) => objetClueOk(c, p))) validObjet.push(p.slice());
  }

  let count = 0;
  let first: { lieu: number[]; objet: number[] } | undefined;
  for (const lieu of validLieu) {
    for (const objet of validObjet) {
      if (linkClues.every((c) => linkClueOk(c, lieu, objet))) {
        if (!first) first = { lieu, objet };
        count++;
        if (count >= limit) return { count, first };
      }
    }
  }
  return { count, first };
}

/* ------------------------------ clue text ------------------------------- */

function clueText(
  kind: ClueKind,
  tpl: { suspects: string[]; lieux: string[]; objets: string[] },
  s: number,
  l: number,
  o: number,
): string {
  const S = tpl.suspects[s];
  const L = tpl.lieux[l];
  const O = tpl.objets[o];
  switch (kind) {
    case 'pos-lieu':
      return `${S} se trouvait dans ${L}.`;
    case 'neg-lieu':
      return `${S} n'a jamais mis les pieds dans ${L}.`;
    case 'pos-objet':
      return `${S} avait ${O} en sa possession.`;
    case 'neg-objet':
      return `${S} n'a jamais touché ${O}.`;
    case 'link':
      return `La personne présente dans ${L} portait ${O}.`;
    case 'neg-link':
      return `La personne présente dans ${L} ne portait pas ${O}.`;
  }
}

/* ------------------------------ generator ------------------------------- */

function buildCluePool(
  rng: Rng,
  tpl: EnqueteTemplate,
  sol: Solution,
  n: number,
): Clue[] {
  const pool: Clue[] = [];
  let id = 0;
  const add = (
    kind: ClueKind,
    category: Clue['category'],
    s: number,
    l: number,
    o: number,
  ) => {
    pool.push({
      id: `c${id++}`,
      kind,
      suspect: kind.includes('lieu') || kind.includes('objet') ? s : undefined,
      lieu: kind.includes('lieu') || kind.includes('link') ? l : undefined,
      objet: kind.includes('objet') || kind.includes('link') ? o : undefined,
      text: clueText(kind, tpl, s, l, o),
      optional: false,
      category,
    });
  };

  for (let s = 0; s < n; s++) {
    // true positives
    add('pos-lieu', 'lieu', s, sol.lieu[s], 0);
    add('pos-objet', 'objet', s, 0, sol.objet[s]);
    // a couple of true negatives per suspect
    for (let k = 0; k < n; k++) {
      if (k !== sol.lieu[s]) add('neg-lieu', 'lieu', s, k, 0);
      if (k !== sol.objet[s]) add('neg-objet', 'objet', s, 0, k);
    }
  }
  // link clues for every lieu
  for (let l = 0; l < n; l++) {
    const s = sol.lieu.findIndex((x) => x === l);
    add('link', 'lien', s, l, sol.objet[s]);
    // a false-link (true negative) for variety
    const wrongO = (sol.objet[s] + 1) % n;
    add('neg-link', 'lien', s, l, wrongO);
  }
  return rng.shuffle(pool);
}

/** Greedily assemble a minimal clue set that yields a unique solution. */
function selectClues(rng: Rng, pool: Clue[], n: number): Clue[] {
  // Prefer a balanced mix: start with link + positive clues, then fill.
  const ordered = [
    ...pool.filter((c) => c.kind === 'link'),
    ...pool.filter((c) => c.kind === 'pos-lieu' || c.kind === 'pos-objet'),
    ...pool.filter((c) => c.kind === 'neg-lieu' || c.kind === 'neg-objet'),
    ...pool.filter((c) => c.kind === 'neg-link'),
  ];

  const chosen: Clue[] = [];
  for (const clue of ordered) {
    if (solve(chosen, n, 2).count === 1) break;
    chosen.push(clue);
    if (solve(chosen, n, 2).count === 1) break;
  }
  // Minimize: drop clues that aren't needed for uniqueness.
  const minimized: Clue[] = chosen.slice();
  for (let i = minimized.length - 1; i >= 0; i--) {
    const without = minimized.filter((_, idx) => idx !== i);
    if (solve(without, n, 2).count === 1) minimized.splice(i, 1);
  }
  return rng.shuffle(minimized);
}

export function generateCase(
  seed: string,
  difficulty: Difficulty = 'normal',
  templateId?: string,
): EnqueteCase {
  const rng = new Rng(`enquete:${seed}:${difficulty}`);
  const tpl = templateId
    ? getTemplate(templateId)
    : rng.pick([
        'manoir',
        'musee',
        'navire',
      ].map((id) => getTemplate(id)));

  const n = DIFF_N[difficulty];
  const suspects = rng.sample(tpl.suspects, n);
  const lieux = rng.sample(tpl.lieux, n);
  const objets = rng.sample(tpl.objets, n);

  const localTpl: EnqueteTemplate = { ...tpl, suspects, lieux, objets };

  // Random solution (two bijections) + culprit.
  const lieuPerm = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const objetPerm = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const culprit = rng.int(0, n - 1);
  const solution: Solution = { lieu: lieuPerm, objet: objetPerm, culprit };

  const pool = buildCluePool(rng, localTpl, solution, n);
  let clues = selectClues(rng, pool, n);

  // Promote a few extra true clues to "optional indices" the player can buy.
  const extras = pool
    .filter((p) => !clues.some((c) => c.id === p.id))
    .filter((p) => p.kind === 'pos-lieu' || p.kind === 'pos-objet' || p.kind === 'link')
    .slice(0, 3)
    .map((c) => ({ ...c, optional: true }));
  clues = [...clues, ...extras];

  return {
    id: `${tpl.id}-${seed}`,
    seed,
    templateId: tpl.id,
    title: tpl.title,
    intro: tpl.intro,
    victim: tpl.victim,
    difficulty,
    suspects,
    lieux,
    objets,
    motive: rng.pick(tpl.motives),
    crimeLieu: lieuPerm[culprit],
    crimeObjet: objetPerm[culprit],
    clues,
    solution,
    baseClueCount: clues.filter((c) => !c.optional).length,
  };
}

/* ------------------------------ scoring --------------------------------- */

export interface EnqueteScoreInput {
  solved: boolean;
  durationMs: number;
  hintsUsed: number;
  optionalCluesRevealed: number;
  wrongAccusations: number;
  difficulty: Difficulty;
}

export interface EnqueteScore {
  total: number;
  breakdown: { label: string; value: number }[];
}

export function scoreCase(input: EnqueteScoreInput): EnqueteScore {
  const diffBonus = { facile: 1, normal: 1.4, difficile: 1.9 }[input.difficulty];
  const base = input.solved ? Math.round(1000 * diffBonus) : 0;

  const timeBonus = input.solved
    ? Math.max(0, 600 - Math.floor(input.durationMs / 1000) * 2)
    : 0;
  const hintPenalty = input.hintsUsed * 120;
  const cluePenalty = input.optionalCluesRevealed * 80;
  const wrongPenalty = input.wrongAccusations * 150;

  const total = Math.max(
    0,
    base + timeBonus - hintPenalty - cluePenalty - wrongPenalty,
  );

  return {
    total,
    breakdown: [
      { label: 'Résolution', value: base },
      { label: 'Rapidité', value: timeBonus },
      { label: 'Indices optionnels', value: -cluePenalty },
      { label: 'Aides', value: -hintPenalty },
      { label: 'Mauvaises accusations', value: -wrongPenalty },
    ],
  };
}

/** Human-readable solution walkthrough for the final reveal. */
export function explainSolution(c: EnqueteCase): string[] {
  const lines: string[] = [];
  const culprit = c.solution.culprit;
  lines.push(
    `Le coupable est ${c.suspects[culprit]}, mû par ${c.motive}.`,
  );
  lines.push(
    `Les faits établissent que le crime a eu lieu dans ${c.lieux[c.crimeLieu]}, et que le coupable portait ${c.objets[c.crimeObjet]}.`,
  );
  lines.push(
    `Or les indices démontrent que ${c.suspects[culprit]} se trouvait dans ${c.lieux[c.crimeLieu]} et détenait ${c.objets[c.crimeObjet]} : c'est donc bien la seule personne qui réunit les deux conditions.`,
  );
  return lines;
}
