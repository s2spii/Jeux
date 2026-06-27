import { useRef } from 'react';
import { useSettings } from '../store/settings';
import { useStats } from '../store/stats';
import { useToast } from '../components/Toasts';
import { Card, Button, Switch } from '../components/ui';
import { storage } from '../lib/storage';
import type { Locale, ThemeMode } from '../types';

export function SettingsPage() {
  const s = useSettings();
  const t = s.t;
  const clearStats = useStats((x) => x.clear);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ludoteca-sauvegarde-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push('Données exportées.', 'success');
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        storage.importAll(data);
        toast.push('Données importées. Rechargez la page.', 'success');
      } catch {
        toast.push('Fichier invalide.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="stack" style={{ maxWidth: 680 }}>
      <h1>{t('nav.settings')}</h1>

      <Card className="stack">
        <h3>Apparence & langue</h3>
        <div className="field">
          <label>{t('settings.theme')}</label>
          <div className="row">
            {(['dark', 'light'] as ThemeMode[]).map((th) => (
              <Button
                key={th}
                variant={s.theme === th ? 'primary' : 'ghost'}
                onClick={() => s.set('theme', th)}
              >
                {th === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
              </Button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t('settings.language')}</label>
          <div className="row">
            {(['fr', 'en'] as Locale[]).map((l) => (
              <Button
                key={l}
                variant={s.locale === l ? 'primary' : 'ghost'}
                onClick={() => s.set('locale', l)}
              >
                {l === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
              </Button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="font">
            {t('settings.fontScale')} ({Math.round(s.fontScale * 100)}%)
          </label>
          <input
            id="font"
            type="range"
            min={0.9}
            max={1.4}
            step={0.05}
            value={s.fontScale}
            onChange={(e) => s.set('fontScale', +e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </Card>

      <Card className="stack">
        <h3>Accessibilité</h3>
        <Switch
          id="contrast"
          checked={s.highContrast}
          onChange={(v) => s.set('highContrast', v)}
          label={t('settings.contrast')}
        />
        <Switch
          id="motion"
          checked={s.reducedMotion}
          onChange={(v) => s.set('reducedMotion', v)}
          label={t('settings.motion')}
        />
        <Switch
          id="anim"
          checked={s.animations}
          onChange={(v) => s.set('animations', v)}
          label={t('settings.animations')}
        />
        <Switch
          id="sound"
          checked={s.sound}
          onChange={(v) => s.set('sound', v)}
          label={t('settings.sound')}
        />
      </Card>

      <Card className="stack">
        <h3>{t('settings.data')}</h3>
        <p className="muted">
          Vos données (comptes, scores, parties) sont stockées localement. Exportez-les
          pour les sauvegarder ou les transférer.
        </p>
        <div className="row">
          <Button variant="ghost" onClick={exportData}>
            ⬇ {t('settings.export')}
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            ⬆ {t('settings.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <div className="spacer" />
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Effacer tout votre historique et vos succès ?')) {
                clearStats();
                toast.push('Historique effacé.', 'success');
              }
            }}
          >
            {t('settings.reset')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
