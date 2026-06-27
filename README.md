# 🎮 Ludoteca — Plateforme de jeux en ligne

Ludoteca est une plateforme de jeux web moderne, responsive et accessible,
proposant **trois jeux complets** jouables en solo, en local et en ligne :

| Jeu | Description | Modes |
|-----|-------------|-------|
| 🕵️ **Le Cabinet des Énigmes** | Enquête logique « un coupable parmi des suspects », à solution unique vérifiée | Solo, Campagne, Rejouable |
| ✏️ **Petit Bac** | Une lettre, des catégories, le chrono tourne | Solo, Local, En ligne, Quotidien, Expert |
| 🌀 **Chambre des Paradoxes** | Casse-tête original où les règles changent en cours de partie | Entraînement, Quotidien, Infini, Classé |

Le projet est conçu comme un **produit fini** : architecture claire, tests
(unitaires, intégration, e2e), accessibilité, back-office d'administration,
sauvegardes, classements et **déploiement Netlify en un clic**.

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev          # serveur de développement Vite (http://localhost:5173)
```

Pour activer les fonctionnalités **en ligne** (salons multijoueurs, classements
partagés) en local, utilisez le CLI Netlify :

```bash
npm i -g netlify-cli
netlify dev          # sert le front + les fonctions serverless + Netlify Blobs
```

> Sans backend, l'application reste **100 % jouable** en solo et en local ; les
> fonctionnalités en ligne se désactivent proprement avec un message clair.

## 🧪 Qualité

```bash
npm run typecheck    # vérification TypeScript stricte
npm run lint         # ESLint
npm run test         # tests unitaires + intégration (Vitest)
npm run test:coverage
npm run test:e2e     # tests end-to-end (Playwright)
npm run build        # build de production
```

## ☁️ Déploiement sur Netlify

Le dépôt contient déjà un [`netlify.toml`](./netlify.toml) prêt à l'emploi.

1. Connectez le dépôt à Netlify (ou `netlify init`).
2. Build command : `npm run build` · Publish directory : `dist` ·
   Functions directory : `netlify/functions` (déjà configuré).
3. Aucune variable d'environnement obligatoire. **Netlify Blobs** (stockage des
   classements et salons) est activé automatiquement sur Netlify.
4. Déployez. La redirection SPA et les routes `/api/*` → fonctions sont gérées
   par `netlify.toml`.

```bash
netlify deploy --build --prod
```

## 🗂️ Structure du projet

```
.
├── index.html                 # point d'entrée
├── netlify.toml               # config de build + redirections + headers
├── netlify/functions/         # backend serverless (leaderboard, rooms)
├── public/                    # assets statiques (favicon)
├── e2e/                       # tests Playwright
├── src/
│   ├── components/            # UI partagée (Layout, primitives, toasts…)
│   ├── data/                  # méta-données (jeux, succès)
│   ├── games/                 # les trois jeux (moteur + UI + tests)
│   │   ├── enquete/
│   │   ├── petitbac/
│   │   └── paradoxes/
│   ├── hooks/                 # hooks réutilisables
│   ├── i18n/                  # traductions FR / EN
│   ├── lib/                   # utilitaires (rng, storage, crypto, validation…)
│   ├── pages/                 # pages routées
│   ├── store/                 # état global (Zustand) : auth, stats, saves…
│   └── styles/                # design system (CSS)
└── docs/                      # documentation (voir ci-dessous)
```

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| [Documentation technique](./docs/DOCUMENTATION_TECHNIQUE.md) | Stack, conventions, moteurs de jeu, API |
| [Architecture](./docs/ARCHITECTURE.md) | Schéma d'architecture front/back |
| [Modèle de données](./docs/MODELE_DONNEES.md) | Entités, stockage, schémas |
| [Guide utilisateur](./docs/GUIDE_UTILISATEUR.md) | Comment jouer à chaque jeu |
| [Guide d'administration](./docs/GUIDE_ADMINISTRATION.md) | Back-office, gestion du contenu |
| [Plan de tests](./docs/PLAN_DE_TESTS.md) | Stratégie et couverture des tests |
| [Scénarios d'énigmes](./docs/SCENARIOS_ENIGMES.md) | Liste et garanties de solution unique |
| [Catégories du Petit Bac](./docs/CATEGORIES_PETIT_BAC.md) | Catalogue complet |
| [Rapport de recette](./docs/RAPPORT_RECETTE.md) | Vérification des critères d'acceptation |

## 🛠️ Stack technique

- **Frontend** : React 18 + TypeScript + Vite, React Router, Zustand
- **Design** : design system CSS maison (thèmes sombre/clair, contraste, etc.)
- **Backend** : Netlify Functions (serverless) + Netlify Blobs (stockage KV)
- **Tests** : Vitest + Testing Library + Playwright
- **Hébergement** : Netlify (statique + serverless)

## ♿ Accessibilité

Mode sombre/clair, contraste élevé, réduction des animations, taille de texte
ajustable, navigation clavier complète, libellés ARIA, et `prefers-reduced-motion`.

## 📄 Licence

MIT.
