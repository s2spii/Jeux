/**
 * Namespaced, schema-safe localStorage wrapper with graceful degradation.
 * All persisted data flows through here so storage is testable and resilient
 * to private-mode / quota errors (requirement: "sauvegarde et reprise").
 */

const PREFIX = 'ludoteca:';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      return safeParse<T>(localStorage.getItem(PREFIX + key), fallback);
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      // Quota exceeded or storage disabled — fail soft.
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },

  /** Keys (without prefix) currently stored by the app. */
  keys(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
    } catch {
      /* ignore */
    }
    return out;
  },

  /** Export every app key as a single object (for backups). */
  exportAll(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of this.keys()) out[k] = this.get(k, null);
    return out;
  },

  /** Restore from a backup object produced by exportAll. */
  importAll(data: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(data)) this.set(k, v);
  },
};
