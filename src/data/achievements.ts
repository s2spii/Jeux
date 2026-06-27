import type { GameId, ScoreEntry } from '../types';

export interface AchievementDef {
  id: string;
  game: GameId | 'global';
  title: string;
  description: string;
  /** Evaluated against the full score history of the current user. */
  test: (history: ScoreEntry[]) => boolean;
}

function countFor(history: ScoreEntry[], game: GameId): number {
  return history.filter((h) => h.game === game).length;
}

function bestFor(history: ScoreEntry[], game: GameId): number {
  return history
    .filter((h) => h.game === game)
    .reduce((m, h) => Math.max(m, h.score), 0);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps',
    game: 'global',
    title: 'Premiers pas',
    description: 'Terminer une première partie, tous jeux confondus.',
    test: (h) => h.length >= 1,
  },
  {
    id: 'polyglot',
    game: 'global',
    title: 'Touche-à-tout',
    description: 'Jouer au moins une fois à chacun des trois jeux.',
    test: (h) =>
      new Set(h.map((e) => e.game)).size >= 3,
  },
  {
    id: 'marathon',
    game: 'global',
    title: 'Marathonien',
    description: 'Cumuler 25 parties terminées.',
    test: (h) => h.length >= 25,
  },
  {
    id: 'detective-rookie',
    game: 'enquete',
    title: 'Limier débutant',
    description: 'Résoudre une première enquête.',
    test: (h) => h.some((e) => e.game === 'enquete' && e.meta.solved === true),
  },
  {
    id: 'detective-ace',
    game: 'enquete',
    title: 'Fin limier',
    description: 'Résoudre une enquête sans utiliser un seul indice optionnel.',
    test: (h) =>
      h.some(
        (e) =>
          e.game === 'enquete' &&
          e.meta.solved === true &&
          e.meta.hintsUsed === 0,
      ),
  },
  {
    id: 'detective-master',
    game: 'enquete',
    title: 'Maître enquêteur',
    description: 'Résoudre 5 enquêtes différentes.',
    test: (h) =>
      h.filter((e) => e.game === 'enquete' && e.meta.solved === true).length >=
      5,
  },
  {
    id: 'bac-100',
    game: 'petitbac',
    title: 'Centurion',
    description: 'Marquer au moins 100 points sur une manche de Petit Bac.',
    test: (h) => bestFor(h, 'petitbac') >= 100,
  },
  {
    id: 'bac-combo',
    game: 'petitbac',
    title: 'En série',
    description: 'Atteindre un combo de 6 bonnes réponses consécutives.',
    test: (h) =>
      h.some(
        (e) => e.game === 'petitbac' && Number(e.meta.maxCombo ?? 0) >= 6,
      ),
  },
  {
    id: 'bac-regular',
    game: 'petitbac',
    title: 'Habitué du Bac',
    description: 'Jouer 10 manches de Petit Bac.',
    test: (h) => countFor(h, 'petitbac') >= 10,
  },
  {
    id: 'paradox-survivor',
    game: 'paradoxes',
    title: 'Survivant',
    description: 'Atteindre le niveau 5 en mode infini.',
    test: (h) =>
      h.some((e) => e.game === 'paradoxes' && Number(e.meta.level ?? 0) >= 5),
  },
  {
    id: 'paradox-daily',
    game: 'paradoxes',
    title: 'Rituel quotidien',
    description: 'Terminer un défi quotidien de la Chambre des Paradoxes.',
    test: (h) =>
      h.some((e) => e.game === 'paradoxes' && e.mode === 'daily'),
  },
  {
    id: 'paradox-legend',
    game: 'paradoxes',
    title: 'Briseur de règles',
    description: 'Dépasser 2000 points en mode infini.',
    test: (h) => bestFor(h, 'paradoxes') >= 2000,
  },
];
