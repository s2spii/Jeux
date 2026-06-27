import { useState } from 'react';
import { GAMES } from '../data/games';
import { useSettings } from '../store/settings';
import { Card, Button } from '../components/ui';
import type { GameId } from '../types';

const RULES: Record<GameId, { title: string; how: string[]; tips: string[] }> = {
  enquete: {
    title: '🕵️ Le Cabinet des Énigmes',
    how: [
      'Une victime, plusieurs suspects. Chacun se trouvait dans un lieu unique et portait un objet unique.',
      'Les faits du crime vous donnent le lieu et l’objet du coupable.',
      'Lisez les indices, remplissez les deux grilles de déduction (✗ pour exclure, ✓ pour confirmer).',
      'Le coupable est le seul suspect qui réunit le lieu ET l’objet du crime.',
      'Accusez quand vous êtes sûr : une erreur coûte des points.',
    ],
    tips: [
      'Commencez par les indices « lien » qui relient un lieu à un objet.',
      'Vérifiez la cohérence de vos déductions à tout moment.',
      'Les indices optionnels et les aides coûtent des points : utilisez-les avec parcimonie.',
    ],
  },
  petitbac: {
    title: '✏️ Petit Bac',
    how: [
      'Une lettre est tirée au sort. Remplissez chaque catégorie avec un mot commençant par cette lettre.',
      'Validez avant la fin du chrono (ou cliquez sur Stop).',
      '10 points pour une réponse valide et unique, 5 si elle est partagée, 0 si vide/invalide.',
      'Bonus de vitesse, bonus de combo, et lettres spéciales qui doublent les points.',
    ],
    tips: [
      'En local, passez l’appareil à chaque joueur sans regarder les réponses précédentes.',
      'En ligne, partagez le code du salon pour jouer à plusieurs.',
      'Le mode expert ajoute des catégories et des lettres rares.',
    ],
  },
  paradoxes: {
    title: '🌀 Chambre des Paradoxes',
    how: [
      'Transformez la ligne de glyphes pour qu’elle corresponde à la cible.',
      '▲/▼ change une couleur, ⇄ échange deux voisins, ◀/▶ fait pivoter la ligne.',
      'Tous les quelques coups, un paradoxe inverse le sens de vos commandes.',
      'Progressez pour gagner de l’énergie et dépensez-la en pouvoirs temporaires.',
      'Atteignez la cible avant d’épuiser votre budget de coups.',
    ],
    tips: [
      'Anticipez les paradoxes : un coup « inversé » peut vous rapprocher du but.',
      'Gardez de l’énergie pour le pouvoir « Stase » quand un paradoxe vous bloque.',
      'En mode infini, l’efficacité prime : résolvez en peu de coups.',
    ],
  },
};

export function RulesPage() {
  const t = useSettings((s) => s.t);
  const [game, setGame] = useState<GameId>('enquete');
  const r = RULES[game];

  return (
    <div className="stack">
      <h1>{t('nav.rules')} & tutoriel</h1>
      <div className="row" style={{ gap: 8 }}>
        {GAMES.map((g) => (
          <Button
            key={g.id}
            variant={game === g.id ? 'primary' : 'ghost'}
            onClick={() => setGame(g.id as GameId)}
          >
            {g.emoji} {t(g.nameKey)}
          </Button>
        ))}
      </div>

      <Card className="stack">
        <h2>{r.title}</h2>
        <div className="grid grid-2">
          <div>
            <h3>Comment jouer</h3>
            <ol className="stack" style={{ paddingLeft: 18, gap: 6 }}>
              {r.how.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Conseils</h3>
            <ul className="stack" style={{ paddingLeft: 18, gap: 6 }}>
              {r.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h3>⌨️ Accessibilité</h3>
        <p className="muted">
          Tous les jeux sont jouables au clavier (Tab pour naviguer, Entrée/Espace pour
          activer). Activez le contraste élevé, la réduction des animations ou agrandissez
          le texte dans les <a href="/reglages">réglages</a>.
        </p>
      </Card>
    </div>
  );
}
