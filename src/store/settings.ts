import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSettings } from '../types';
import { translate, type TranslationKey } from '../i18n/translations';

interface SettingsState extends UserSettings {
  set: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  reset: () => void;
  t: (key: TranslationKey) => string;
}

const defaults: UserSettings = {
  locale: 'fr',
  theme: 'dark',
  sound: true,
  animations: true,
  highContrast: false,
  reducedMotion: false,
  fontScale: 1,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set({ ...defaults }),
      t: (key) => translate(get().locale, key),
    }),
    {
      name: 'ludoteca:settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        locale: s.locale,
        theme: s.theme,
        sound: s.sound,
        animations: s.animations,
        highContrast: s.highContrast,
        reducedMotion: s.reducedMotion,
        fontScale: s.fontScale,
      }),
    },
  ),
);

/** Apply settings to the document root (theme, contrast, motion, font scale). */
export function applySettingsToDom(s: UserSettings): void {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
  root.style.setProperty('--font-scale', String(s.fontScale));
  root.lang = s.locale;
}
