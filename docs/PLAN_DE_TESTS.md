# Plan de tests

## Stratégie

La qualité repose sur trois niveaux complémentaires :

1. **Tests unitaires** — moteurs de jeu et utilitaires (fonctions pures).
   C'est là que sont vérifiées les **propriétés fortes** (solution unique,
   solvabilité, barème).
2. **Tests d'intégration** — composants React rendus avec leurs stores, pour
   vérifier les parcours réels (jouer une manche, résoudre une enquête).
3. **Tests end-to-end** — Playwright sur le build de production, pour les
   parcours critiques bout-en-bout (navigation, invité, lancement de partie).

Outils : **Vitest** + **Testing Library** (1 & 2), **Playwright** (3).

## Couverture des moteurs (propriétés critiques)

| Fichier | Vérifie notamment |
|---------|-------------------|
| `lib/rng.test.ts` | Déterminisme par graine, bornes, shuffle non destructif |
| `lib/format.test.ts` | Normalisation des réponses (accents/casse/espaces) |
| `lib/validation.test.ts` | Validation pseudo/mot de passe, clamp, sanitize |
| `games/enquete/engine.test.ts` | **Solution unique** sur 36+ cas, **minimalité** des indices, reproductibilité, scoring |
| `games/petitbac/engine.test.ts` | Barème **10/5/0**, doublons, combo, vitesse, doublement, tirages déterministes |
| `games/paradoxes/engine.test.ts` | **Solvabilité dans le budget** (BFS) sur les 4 difficultés, réversibilité des ops, paradoxes, scoring |

## Tests d'intégration (UI + état)

| Fichier | Scénario |
|---------|----------|
| `store/auth.test.ts` | Inscription (1er = admin), doublons, mots de passe faibles, connexion, invité |
| `store/stats.test.ts` | Enregistrement, agrégats, déblocage de succès, séparation par utilisateur |
| `store/content.test.ts` | Annonces, catégories, énigmes, lettres, barème (back-office) |
| `games/petitbac/PetitBacGame.test.tsx` | Jouer une manche solo → résultats + score enregistré ; passage en mode local |
| `games/enquete/EnqueteGame.test.tsx` | **Résoudre une affaire de campagne** via l'UI (accusation du bon suspect) |
| `games/paradoxes/ParadoxesGame.test.tsx` | Lancer l'entraînement, enregistrer un coup, choisir une difficulté |

## Tests end-to-end (`e2e/smoke.spec.ts`)

Exécutés sur le **build de production** (`vite preview`), projets `chromium` et
`mobile` (Pixel 5) :

- La page d'accueil présente les trois jeux.
- Jouer en invité puis lancer une manche de Petit Bac → écran de résultats.
- Ouvrir une enquête de campagne (faits + bouton Accuser visibles).
- Bascule du thème clair/sombre.
- Lancement du défi du jour de la Chambre des Paradoxes.

## Exécution

```bash
npm run test           # unitaires + intégration (Vitest)
npm run test:coverage  # + rapport de couverture (v8)
npm run test:e2e       # end-to-end (Playwright)
npm run typecheck      # TypeScript strict
npm run lint           # ESLint
```

> Environnements avec un navigateur pré-installé : passez
> `PW_CHROMIUM_PATH=/chemin/vers/chrome` (la config Playwright en tient compte).

## Résultats de référence

- **70 tests** unitaires + intégration : ✅ tous au vert.
- **5 parcours e2e** (×2 navigateurs) : ✅ au vert.
- Couverture concentrée sur la logique critique (moteurs, stores, libs) : les
  garanties de **solution unique** (Enquête) et de **solvabilité** (Paradoxes)
  sont prouvées par des tests dédiés.
- `typecheck` et `lint` : ✅ sans erreur.

## Cas limites couverts

- Réponses accentuées / espacées équivalentes (doublons Petit Bac).
- Budget de coups épuisé sans résolution (échec Paradoxes).
- Stockage indisponible / quota dépassé (wrapper `storage` tolérant).
- Backend injoignable → dégradation hors-ligne (mode local préservé).
- Entrées invalides (pseudo/mot de passe) rejetées avec message.
