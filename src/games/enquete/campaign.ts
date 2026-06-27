import type { Difficulty } from './engine';

/**
 * Curated campaign: a fixed, ordered list of cases (template + seed +
 * difficulty). Because generation is deterministic and verified unique by the
 * engine tests, these seeds are guaranteed solvable and contradiction-free.
 */
export interface CampaignCase {
  seed: string;
  templateId: string;
  difficulty: Difficulty;
  name: string;
  brief: string;
}

export const CAMPAIGN: CampaignCase[] = [
  {
    seed: 'aff-001',
    templateId: 'manoir',
    difficulty: 'facile',
    name: 'Affaire n°1 — Le dîner fatal',
    brief: 'Votre première enquête. Quatre suspects, une nuit d’orage.',
  },
  {
    seed: 'aff-002',
    templateId: 'musee',
    difficulty: 'facile',
    name: 'Affaire n°2 — L’éclat dérobé',
    brief: 'Un diamant disparaît. Apprenez à croiser les indices.',
  },
  {
    seed: 'aff-003',
    templateId: 'navire',
    difficulty: 'normal',
    name: 'Affaire n°3 — Cabine 7',
    brief: 'Cinq voyageurs, un disparu. La difficulté monte d’un cran.',
  },
  {
    seed: 'aff-004',
    templateId: 'manoir',
    difficulty: 'normal',
    name: 'Affaire n°4 — Retour à Valombre',
    brief: 'Le manoir n’a pas livré tous ses secrets.',
  },
  {
    seed: 'aff-005',
    templateId: 'musee',
    difficulty: 'difficile',
    name: 'Affaire n°5 — Le casse du siècle',
    brief: 'Six suspects. Aucune marge d’erreur.',
  },
  {
    seed: 'aff-006',
    templateId: 'navire',
    difficulty: 'difficile',
    name: 'Affaire n°6 — Terminus',
    brief: 'L’enquête finale. Pour les maîtres limiers seulement.',
  },
];
