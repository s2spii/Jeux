/** Small formatting helpers shared by the UI. */

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(ts: number, locale = 'fr'): string {
  return new Date(ts).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(n: number, locale = 'fr'): string {
  return n.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US');
}

/** Normalize a free-text answer for comparison (accents, case, spaces). */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/['’\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
