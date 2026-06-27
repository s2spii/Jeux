import type { GameId } from '../types';

export interface GameMeta {
  id: GameId;
  path: string;
  emoji: string;
  glow: string;
  nameKey: 'games.enquete.name' | 'games.petitbac.name' | 'games.paradoxes.name';
  tagKey: 'games.enquete.tag' | 'games.petitbac.tag' | 'games.paradoxes.tag';
  modes: string[];
}

export const GAMES: GameMeta[] = [
  {
    id: 'enquete',
    path: '/jeux/enquete',
    emoji: '🕵️',
    glow: 'rgba(124, 92, 255, 0.35)',
    nameKey: 'games.enquete.name',
    tagKey: 'games.enquete.tag',
    modes: ['Solo', 'Campagne', 'Rejouable'],
  },
  {
    id: 'petitbac',
    path: '/jeux/petit-bac',
    emoji: '✏️',
    glow: 'rgba(34, 211, 238, 0.32)',
    nameKey: 'games.petitbac.name',
    tagKey: 'games.petitbac.tag',
    modes: ['Solo', 'Local', 'En ligne', 'Quotidien', 'Expert'],
  },
  {
    id: 'paradoxes',
    path: '/jeux/paradoxes',
    emoji: '🌀',
    glow: 'rgba(245, 165, 36, 0.30)',
    nameKey: 'games.paradoxes.name',
    tagKey: 'games.paradoxes.tag',
    modes: ['Entraînement', 'Quotidien', 'Infini', 'Classé'],
  },
];

export function getGameMeta(id: GameId): GameMeta {
  return GAMES.find((g) => g.id === id)!;
}
