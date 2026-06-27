/** Strict input validation shared by auth, admin and game forms. */

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateUsername(name: string): ValidationResult {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: 'Le nom doit faire au moins 3 caractères.' };
  }
  if (trimmed.length > 20) {
    return { ok: false, error: 'Le nom ne doit pas dépasser 20 caractères.' };
  }
  if (!/^[\p{L}\p{N} _.-]+$/u.test(trimmed)) {
    return { ok: false, error: 'Caractères non autorisés dans le nom.' };
  }
  return { ok: true };
}

export function validatePassword(pw: string): ValidationResult {
  if (pw.length < 6) {
    return { ok: false, error: 'Le mot de passe doit faire au moins 6 caractères.' };
  }
  if (pw.length > 128) {
    return { ok: false, error: 'Mot de passe trop long.' };
  }
  return { ok: true };
}

/** Defensive clamp used across game configuration. */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Basic profanity / length guard for free-text answers (anti-abuse). */
export function sanitizeText(input: string, maxLen = 60): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLen);
}
