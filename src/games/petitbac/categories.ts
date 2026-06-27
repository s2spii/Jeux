/**
 * Petit Bac content: category catalog (standard + expert), the playable letter
 * pool, and "special" letters that add a constraint to the round. Categories
 * carry a visual theme used by the UI ("thèmes visuels selon la catégorie").
 */

export interface Category {
  id: string;
  label: string;
  emoji: string;
  theme: string; // CSS color token
  expert?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'prenom', label: 'Prénom', emoji: '🧑', theme: '#7c5cff' },
  { id: 'animal', label: 'Animal', emoji: '🦊', theme: '#2dd4bf' },
  { id: 'pays', label: 'Pays', emoji: '🌍', theme: '#22d3ee' },
  { id: 'ville', label: 'Ville', emoji: '🏙️', theme: '#f5a524' },
  { id: 'fruit-legume', label: 'Fruit ou légume', emoji: '🍎', theme: '#f87171' },
  { id: 'metier', label: 'Métier', emoji: '👷', theme: '#fbbf24' },
  { id: 'objet', label: 'Objet', emoji: '🔧', theme: '#a78bfa' },
  { id: 'couleur', label: 'Couleur', emoji: '🎨', theme: '#34d399' },
  { id: 'sport', label: 'Sport', emoji: '⚽', theme: '#60a5fa' },
  { id: 'celebrite', label: 'Célébrité', emoji: '⭐', theme: '#f472b6' },
  { id: 'marque', label: 'Marque', emoji: '🏷️', theme: '#fb923c' },
  { id: 'plante', label: 'Plante', emoji: '🌿', theme: '#4ade80' },
  // Expert / rarer categories
  { id: 'mythologie', label: 'Mythologie', emoji: '🏛️', theme: '#c084fc', expert: true },
  { id: 'instrument', label: 'Instrument de musique', emoji: '🎻', theme: '#38bdf8', expert: true },
  { id: 'element-chimique', label: 'Élément chimique', emoji: '⚗️', theme: '#2dd4bf', expert: true },
  { id: 'capitale', label: 'Capitale', emoji: '🏰', theme: '#f59e0b', expert: true },
  { id: 'film', label: 'Film', emoji: '🎬', theme: '#ef4444', expert: true },
  { id: 'expression', label: 'Expression française', emoji: '💬', theme: '#818cf8', expert: true },
];

export const STANDARD_CATEGORIES = CATEGORIES.filter((c) => !c.expert);
export const EXPERT_CATEGORIES = CATEGORIES.filter((c) => c.expert);

/** Runtime registry for admin-defined categories so labels resolve everywhere. */
const runtimeCategories: Category[] = [];

export function registerCategories(cats: Category[]): void {
  for (const c of cats) {
    if (!runtimeCategories.some((r) => r.id === c.id)) runtimeCategories.push(c);
  }
}

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id) ?? runtimeCategories.find((c) => c.id === id);
}

/** Letters that are fun and fair to play (excludes near-impossible ones). */
export const LETTER_POOL = 'ABCDEFGHIJLMNOPRSTV'.split('');

/** Rare letters allowed only in expert mode. */
export const HARD_LETTERS = 'KQUWXYZ'.split('');

export interface SpecialLetter {
  letter: string;
  constraint: string;
  /** extra validator: e.g. min length */
  minLength?: number;
}

/**
 * A handful of letters that, when drawn, add a twist for bonus points.
 * The constraint is enforced softly (validation + scoring bonus).
 */
export const SPECIAL_CONSTRAINTS: Record<string, string> = {
  Z: 'Lettre rare : chaque bonne réponse vaut double !',
  H: 'Mot muet : les réponses doivent faire au moins 6 lettres.',
  S: 'Série : visez un combo, le bonus de série est doublé.',
};
