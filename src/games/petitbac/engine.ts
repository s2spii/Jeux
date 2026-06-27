/**
 * Petit Bac scoring engine. Pure functions so the rules are fully testable.
 *
 * Base rules (per the spec):
 *   - valid & unique answer ........ 10 points
 *   - valid & shared answer ........  5 points
 *   - empty or invalid answer ......  0 points
 * Plus creative layers: speed bonus, combo bonus, and special-letter doubling.
 */
import { Rng } from '../../lib/rng';
import { normalizeAnswer } from '../../lib/format';
import {
  LETTER_POOL,
  HARD_LETTERS,
  STANDARD_CATEGORIES,
  EXPERT_CATEGORIES,
} from './categories';

export type AnswerStatus = 'unique' | 'shared' | 'invalid' | 'empty';

export interface PlayerRound {
  id: string;
  name: string;
  /** answers keyed by category id */
  answers: Record<string, string>;
  /** seconds elapsed when the player submitted (for speed bonus) */
  submittedAt?: number;
}

export interface RoundConfig {
  letter: string;
  categories: string[];
  durationSec: number;
  minLength: number;
  /** special-letter doubling */
  doubling: boolean;
}

/** Admin-configurable point values (defaults follow the spec: 10 / 5). */
export interface ScoreConfig {
  unique: number;
  shared: number;
}

const DEFAULT_SCORE: ScoreConfig = { unique: 10, shared: 5 };

export interface CategoryResult {
  category: string;
  answer: string;
  status: AnswerStatus;
  points: number;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  results: CategoryResult[];
  basePoints: number;
  comboBonus: number;
  speedBonus: number;
  maxCombo: number;
  total: number;
}

/** Is an answer valid for the round's letter and constraints? */
export function isValidAnswer(
  answer: string,
  letter: string,
  minLength = 1,
): boolean {
  const norm = normalizeAnswer(answer);
  if (norm.length === 0) return false;
  if (norm.replace(/\s/g, '').length < minLength) return false;
  const want = normalizeAnswer(letter);
  return norm.startsWith(want);
}

/**
 * Score one completed round for any number of players (>=1).
 * Duplicate detection compares normalized answers across players.
 */
export function scoreRound(
  config: RoundConfig,
  players: PlayerRound[],
  scoreConfig: ScoreConfig = DEFAULT_SCORE,
): PlayerScore[] {
  const factor = config.doubling ? 2 : 1;

  // Count normalized valid answers per category across all players.
  const counts: Record<string, Record<string, number>> = {};
  for (const cat of config.categories) {
    counts[cat] = {};
    for (const p of players) {
      const raw = p.answers[cat] ?? '';
      if (isValidAnswer(raw, config.letter, config.minLength)) {
        const key = normalizeAnswer(raw);
        counts[cat][key] = (counts[cat][key] ?? 0) + 1;
      }
    }
  }

  return players.map((p) => {
    const results: CategoryResult[] = [];
    let basePoints = 0;
    let combo = 0;
    let maxCombo = 0;
    let comboBonus = 0;

    for (const cat of config.categories) {
      const raw = (p.answers[cat] ?? '').trim();
      let status: AnswerStatus;
      let points = 0;
      if (raw.length === 0) {
        status = 'empty';
      } else if (!isValidAnswer(raw, config.letter, config.minLength)) {
        status = 'invalid';
      } else {
        const key = normalizeAnswer(raw);
        const shared = counts[cat][key] > 1;
        status = shared ? 'shared' : 'unique';
        points = (shared ? scoreConfig.shared : scoreConfig.unique) * factor;
      }

      if (status === 'unique' || status === 'shared') {
        combo += 1;
        maxCombo = Math.max(maxCombo, combo);
        // Combo bonus: +2 per consecutive valid answer beyond the first.
        if (combo >= 2) comboBonus += 2 * (config.doubling ? 2 : 1);
      } else {
        combo = 0;
      }

      basePoints += points;
      results.push({ category: cat, answer: raw, status, points });
    }

    // Speed bonus: reward finishing early (solo & competitive alike).
    let speedBonus = 0;
    if (p.submittedAt != null && basePoints > 0) {
      const remaining = Math.max(0, config.durationSec - p.submittedAt);
      speedBonus = Math.round(remaining * 0.5);
    }

    return {
      playerId: p.id,
      name: p.name,
      results,
      basePoints,
      comboBonus,
      speedBonus,
      maxCombo,
      total: basePoints + comboBonus + speedBonus,
    };
  });
}

/* ------------------------------ letter draw ----------------------------- */

export function drawLetter(
  seed: string | number,
  expert = false,
  forbidden: string[] = [],
): string {
  const rng = new Rng(`letter:${seed}`);
  const base = expert ? [...LETTER_POOL, ...HARD_LETTERS] : LETTER_POOL;
  const forbiddenSet = new Set(forbidden.map((l) => l.toUpperCase()));
  const pool = base.filter((l) => !forbiddenSet.has(l));
  return rng.pick(pool.length ? pool : base);
}

/** Pick `count` distinct categories for a round, optionally with admin extras. */
export function drawCategories(
  seed: string | number,
  count: number,
  expert = false,
  extra: { id: string }[] = [],
): string[] {
  const rng = new Rng(`cats:${seed}`);
  const base = expert
    ? [...STANDARD_CATEGORIES, ...EXPERT_CATEGORIES]
    : STANDARD_CATEGORIES;
  const pool = [...base.map((c) => ({ id: c.id })), ...extra];
  return rng.sample(pool, Math.min(count, pool.length)).map((c) => c.id);
}
