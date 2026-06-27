/** Shared application-wide types. */

export type GameId = 'enquete' | 'petitbac' | 'paradoxes';

export type Locale = 'fr' | 'en';

export type ThemeMode = 'dark' | 'light';

export interface User {
  id: string;
  username: string;
  /** Guests have no password and a transient flag. */
  isGuest: boolean;
  createdAt: number;
  /** Admins can access the back-office. */
  role: 'player' | 'admin';
}

/** A single completed game result, the unit of the score history. */
export interface ScoreEntry {
  id: string;
  game: GameId;
  userId: string;
  username: string;
  score: number;
  /** Free-form per-game details (duration, accuracy, level…). */
  meta: Record<string, number | string | boolean>;
  mode: string;
  createdAt: number;
}

/** A resumable saved game (one active save per game per user). */
export interface SaveSlot<T = unknown> {
  game: GameId;
  userId: string;
  state: T;
  updatedAt: number;
  label: string;
}

export interface Achievement {
  id: string;
  game: GameId | 'global';
  title: string;
  description: string;
  /** Predicate evaluated against aggregate stats. */
  unlockedAt?: number;
}

export interface UserSettings {
  locale: Locale;
  theme: ThemeMode;
  sound: boolean;
  animations: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontScale: number; // 0.9 .. 1.4
}

export interface LeaderboardRow {
  username: string;
  score: number;
  game: GameId;
  mode: string;
  createdAt: number;
}
