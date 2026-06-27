# Documentation technique

## Stack

- **React 18 + TypeScript** (mode strict), **Vite** pour le bundling.
- **React Router v6** pour la navigation SPA.
- **Zustand** pour l'état global (avec middleware `persist` pour les réglages
  et le contenu admin).
- **CSS maison** (design system par variables CSS) — pas de dépendance UI lourde.
- **Netlify Functions** (Node) + **Netlify Blobs** pour le backend serverless.
- **Vitest + Testing Library** (unitaire/intégration), **Playwright** (e2e).

## Conventions

- Les **moteurs de jeu** (`src/games/*/engine.ts`) sont des modules **purs et
  déterministes** : aucune dépendance React, entièrement testables. Toute règle
  de gameplay (scoring, génération, validation) y vit.
- Les **composants UI** consomment les moteurs et l'état global. Ils ne
  contiennent pas de logique de règles dupliquée.
- La **persistance** passe exclusivement par `src/lib/storage.ts` (wrapper
  localStorage tolérant aux erreurs de quota / mode privé).
- Les **accès réseau** passent par `src/lib/api.ts`, qui renvoie toujours un
  `ApiResult` (`ok` / `offline` / `error`) — jamais d'exception non gérée.

## Modules clés (`src/lib`)

| Module | Rôle |
|--------|------|
| `rng.ts` | PRNG seedable (mulberry32), `Rng` (pick/shuffle/sample), `dailySeed` |
| `id.ts` | UUID, codes de salon lisibles |
| `storage.ts` | localStorage namespacé + export/import des données |
| `crypto.ts` | Hash PBKDF2 des mots de passe (WebCrypto) |
| `validation.ts` | Validation stricte (pseudo, mot de passe, clamp, sanitize) |
| `format.ts` | Formatage durée/date + normalisation des réponses (accents) |
| `api.ts` | Client backend avec dégradation hors-ligne |

## Moteurs de jeu

### Enquête — `src/games/enquete/engine.ts`
- Génère une énigme à partir d'une graine + template narratif.
- La vérité cachée = **deux bijections** (suspect→lieu, suspect→objet).
- Un **solveur par énumération de permutations** (`solve`) compte les solutions
  consistantes avec les indices. La génération ne conserve un jeu d'indices que
  s'il rend la solution **unique** ; le jeu d'indices est ensuite **minimisé**
  (aucun indice redondant). → Garantie « solution unique et vérifiée ».
- Scoring : résolution + rapidité − indices optionnels − aides − erreurs.

### Petit Bac — `src/games/petitbac/engine.ts`
- `scoreRound` (pur, N joueurs) applique le barème **10 / 5 / 0** avec
  détection de doublons (réponses normalisées : accents, casse, espaces),
  bonus de **combo** (réponses consécutives) et bonus de **vitesse**.
- Lettres spéciales (doublement, longueur minimale) et tirage seedé pour les
  défis quotidiens.
- Barème, lettres interdites et catégories sont **surchargés par l'admin**.

### Chambre des Paradoxes — `src/games/paradoxes/engine.ts`
- Niveaux générés en appliquant des **opérations réversibles** à la cible :
  l'inverse de cette séquence est une solution garantie dans le budget.
- Les **paradoxes** (`interpret`) réécrivent le sens des commandes en cours de
  partie (miroir, inversion, gel, décalage) sans retirer l'atteignabilité.
- **Pouvoirs temporaires** alimentés par l'énergie gagnée à chaque progrès.
- Modes : entraînement, quotidien (graine du jour), infini (niveaux qui
  s'enchaînent et se durcissent), classé (chronométré).

## API backend (`/api`)

### `GET /api/leaderboard?game=<id>&mode=all`
Renvoie `{ rows: LeaderboardRow[] }` (top 50, meilleur score par joueur).

### `POST /api/leaderboard`
Corps : `{ game, username, score, mode }`. Valide/borne les valeurs,
conserve le meilleur score du joueur, renvoie `{ rank }`.

### `GET /api/rooms?code=<code>`
Renvoie `{ state }` ou 404 / 410 (expiré).

### `POST /api/rooms`
Corps : `{ action: 'create'|'join'|'update', ... }`. `update` fusionne un
*patch* (un niveau de profondeur sur `players`/`submissions`).

## Scripts npm

| Script | Effet |
|--------|-------|
| `dev` | Serveur de dev Vite |
| `netlify:dev` | Front + fonctions + Blobs en local |
| `build` | `tsc -b` puis `vite build` → `dist/` |
| `typecheck` | Vérification TypeScript |
| `lint` | ESLint |
| `test` / `test:coverage` | Vitest |
| `test:e2e` | Playwright |

## Internationalisation

`src/i18n/translations.ts` fournit des dictionnaires **FR** (langue principale)
et **EN** (coquille applicative). `translate()` retombe sur le FR si une clé EN
manque. La langue est un réglage utilisateur persistant.

## Accessibilité (mise en œuvre)

- Attributs sur `<html>` : `data-theme`, `data-contrast`, `data-motion`,
  `--font-scale`, `lang` (pilotés par `applySettingsToDom`).
- `prefers-reduced-motion` respecté en plus du réglage manuel.
- Libellés ARIA sur les contrôles de jeu, focus visibles, lien d'évitement,
  `aria-live` pour les toasts.
