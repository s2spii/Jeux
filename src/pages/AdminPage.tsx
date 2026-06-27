import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useContent } from '../store/content';
import { useStats } from '../store/stats';
import { useToast } from '../components/Toasts';
import { Card, Button, Badge, StatTile } from '../components/ui';
import { TEMPLATES } from '../games/enquete/templates';
import { GAMES } from '../data/games';
import type { Difficulty } from '../games/enquete/engine';
import type { GameId } from '../types';

export function AdminPage() {
  const user = useAuth((s) => s.user);
  const content = useContent();
  const history = useStats((s) => s.history);
  const toast = useToast();

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [catEmoji, setCatEmoji] = useState('🏷️');
  const [caseName, setCaseName] = useState('');
  const [caseTemplate, setCaseTemplate] = useState(TEMPLATES[0].id);
  const [caseDiff, setCaseDiff] = useState<Difficulty>('normal');
  const [forbidden, setForbidden] = useState(content.forbiddenLetters.join(''));

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const gamesByType = GAMES.map((g) => ({
    game: g,
    count: history.filter((h) => h.game === (g.id as GameId)).length,
  }));

  return (
    <div className="stack" style={{ gap: 24 }}>
      <h1>🛠️ {`Administration`}</h1>
      <p className="muted">
        Gérez le contenu sans toucher au code : annonces, catégories, énigmes, lettres et
        barème de score.
      </p>

      {/* Stats dashboard */}
      <section>
        <h2>Statistiques de jeu</h2>
        <div className="grid grid-4">
          <StatTile value={history.length} label="Parties totales" />
          {gamesByType.map(({ game, count }) => (
            <StatTile key={game.id} value={count} label={`${game.emoji} parties`} />
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section>
        <h2>📣 Annonces & événements</h2>
        <Card className="stack">
          <div className="row">
            <input
              className="input"
              placeholder="Titre"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
            />
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="Message affiché en page d'accueil"
            value={annBody}
            onChange={(e) => setAnnBody(e.target.value)}
          />
          <div>
            <Button
              variant="primary"
              onClick={() => {
                if (!annTitle.trim()) return toast.push('Titre requis.', 'danger');
                content.addAnnouncement({ title: annTitle, body: annBody, active: true });
                setAnnTitle('');
                setAnnBody('');
                toast.push('Annonce publiée.', 'success');
              }}
            >
              Publier
            </Button>
          </div>
          <div className="stack">
            {content.announcements.map((a) => (
              <div key={a.id} className="row-between card" style={{ padding: 12 }}>
                <div>
                  <strong>{a.title}</strong> {a.active ? <Badge tone="success">active</Badge> : <Badge>masquée</Badge>}
                  <div className="faint">{a.body}</div>
                </div>
                <div className="row">
                  <Button size="sm" variant="ghost" onClick={() => content.toggleAnnouncement(a.id)}>
                    {a.active ? 'Masquer' : 'Activer'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => content.removeAnnouncement(a.id)}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Petit Bac categories */}
      <section>
        <h2>✏️ Catégories Petit Bac</h2>
        <Card className="stack">
          <div className="row">
            <input
              className="input"
              placeholder="Nom de la catégorie"
              value={catLabel}
              onChange={(e) => setCatLabel(e.target.value)}
            />
            <input
              className="input"
              style={{ maxWidth: 80 }}
              placeholder="Emoji"
              value={catEmoji}
              onChange={(e) => setCatEmoji(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={() => {
                if (!catLabel.trim()) return toast.push('Nom requis.', 'danger');
                content.addCategory(catLabel, catEmoji);
                setCatLabel('');
                toast.push('Catégorie ajoutée.', 'success');
              }}
            >
              Ajouter
            </Button>
          </div>
          <div className="tag-list">
            {content.customCategories.length === 0 && (
              <span className="faint">Aucune catégorie personnalisée.</span>
            )}
            {content.customCategories.map((c) => (
              <span key={c.id} className="badge badge-brand">
                {c.emoji} {c.label}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0 4px' }}
                  onClick={() => content.removeCategory(c.id)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </Card>
      </section>

      {/* Letters + score config */}
      <section>
        <h2>🔤 Lettres & barème</h2>
        <Card className="stack">
          <div className="field">
            <label>Lettres interdites (collées, ex. KWXYZ)</label>
            <div className="row">
              <input
                className="input"
                value={forbidden}
                onChange={(e) => setForbidden(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              />
              <Button
                variant="primary"
                onClick={() => {
                  content.setForbiddenLetters(forbidden.split(''));
                  toast.push('Lettres mises à jour.', 'success');
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
          <div className="row" style={{ gap: 18 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Points réponse unique</label>
              <input
                className="input"
                type="number"
                value={content.petitBacScore.unique}
                onChange={(e) =>
                  content.setPetitBacScore({
                    ...content.petitBacScore,
                    unique: +e.target.value,
                  })
                }
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Points réponse partagée</label>
              <input
                className="input"
                type="number"
                value={content.petitBacScore.shared}
                onChange={(e) =>
                  content.setPetitBacScore({
                    ...content.petitBacScore,
                    shared: +e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Enquete cases */}
      <section>
        <h2>🕵️ Énigmes (campagne)</h2>
        <Card className="stack">
          <div className="row">
            <input
              className="input"
              placeholder="Nom de l'affaire"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
            />
            <select
              className="select"
              value={caseTemplate}
              onChange={(e) => setCaseTemplate(e.target.value)}
            >
              {TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={caseDiff}
              onChange={(e) => setCaseDiff(e.target.value as Difficulty)}
            >
              {(['facile', 'normal', 'difficile'] as Difficulty[]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              onClick={() => {
                if (!caseName.trim()) return toast.push('Nom requis.', 'danger');
                content.addCase({
                  name: caseName,
                  templateId: caseTemplate,
                  difficulty: caseDiff,
                  brief: 'Affaire personnalisée ajoutée par l’administration.',
                });
                setCaseName('');
                toast.push('Affaire ajoutée à la campagne.', 'success');
              }}
            >
              Ajouter
            </Button>
          </div>
          <p className="faint">
            Les affaires sont générées avec solution unique garantie par le moteur — aucun
            risque de scénario insoluble.
          </p>
          <div className="stack">
            {content.customCases.map((c) => (
              <div key={c.seed} className="row-between card" style={{ padding: 12 }}>
                <div>
                  <strong>{c.name}</strong> <Badge tone="brand">{c.difficulty}</Badge>
                  <div className="faint">{c.templateId}</div>
                </div>
                <Button size="sm" variant="danger" onClick={() => content.removeCase(c.seed)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Réinitialiser tout le contenu personnalisé ?')) {
              content.reset();
              toast.push('Contenu réinitialisé.', 'success');
            }
          }}
        >
          Réinitialiser le contenu
        </Button>
      </section>
    </div>
  );
}
