# Modèle de données

Le modèle est **hybride** : les données du joueur sont persistées localement
(localStorage, namespacé `ludoteca:`) et les données partagées (classements,
salons) sont stockées côté serveur dans **Netlify Blobs** (clé-valeur JSON).

## Entités

### User
| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Identifiant unique |
| `username` | string | Pseudo (3–20 caractères) |
| `isGuest` | boolean | Compte invité (transitoire) |
| `createdAt` | number | Timestamp de création |
| `role` | `'player' \| 'admin'` | Le 1er compte créé est admin |

Stockage : `ludoteca:accounts` (`{ [usernameLower]: { user, password } }`),
mot de passe = `{ salt, hash }` (PBKDF2). Session courante : `ludoteca:session`.

### ScoreEntry (historique des scores)
| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant |
| `game` | `'enquete' \| 'petitbac' \| 'paradoxes'` | Jeu concerné |
| `userId` / `username` | string | Joueur |
| `score` | number | Score de la partie |
| `mode` | string | Mode joué (solo, online, daily…) |
| `meta` | object | Détails par jeu (durée, précision, niveau…) |
| `createdAt` | number | Timestamp |

Stockage : `ludoteca:history` (tableau, max 500 entrées).

### SaveSlot (partie reprenable)
| Champ | Type | Description |
|-------|------|-------------|
| `game` | GameId | Jeu |
| `userId` | string | Propriétaire |
| `state` | object | État sérialisé de la partie |
| `label` | string | Libellé affiché |
| `updatedAt` | number | Dernière sauvegarde |

Stockage : `ludoteca:saves` (`{ "game:userId": SaveSlot }`). Une sauvegarde
active par jeu et par utilisateur. (Utilisé par l'Enquête : autosave + reprise.)

### Achievement (succès)
Définis dans `src/data/achievements.ts` (id, jeu, titre, description,
prédicat). Les ids débloqués sont stockés dans `ludoteca:achievements`.

### UserSettings
`locale`, `theme`, `sound`, `animations`, `highContrast`, `reducedMotion`,
`fontScale`. Stockage : `ludoteca:settings`.

### Contenu administrable (`ludoteca:content`)
| Champ | Type | Description |
|-------|------|-------------|
| `announcements` | Announcement[] | Annonces affichées en accueil |
| `customCategories` | Category[] | Catégories Petit Bac ajoutées |
| `customCases` | CampaignCase[] | Énigmes ajoutées à la campagne |
| `forbiddenLetters` | string[] | Lettres interdites au tirage |
| `petitBacScore` | `{ unique, shared }` | Barème de score |

## Données de jeu (générées / statiques)

### Énigme (`EnqueteCase`)
Générée depuis une **graine** + un **template** narratif. Contient : suspects,
lieux, objets, indices (visibles + optionnels), **solution** (deux bijections
suspect→lieu et suspect→objet + coupable) et faits du crime. La solution est
**vérifiée unique** par le solveur avant toute partie (voir
[SCENARIOS_ENIGMES](./SCENARIOS_ENIGMES.md)).

### Manche Petit Bac (`RoundConfig` + `PlayerRound`)
`RoundConfig` : lettre, catégories, durée, longueur minimale, doublement.
`PlayerRound` : réponses par catégorie + instant de validation. Le scoring
produit un `PlayerScore` détaillé par catégorie (unique/partagée/invalide).

### Niveau Paradoxes (`Level` + `PlayState`)
`Level` : taille, couleurs, état de départ, **cible**, budget de coups,
période et ordre des paradoxes. Généré par application d'opérations réversibles
sur la cible (solvabilité garantie). `PlayState` : cellules, coups, énergie,
paradoxe actif, cellule gelée, résolu/échoué.

## Stockage serveur (Netlify Blobs)

### Store `leaderboard`
- **Clé** = `game` (`enquete` / `petitbac` / `paradoxes`).
- **Valeur** = `Row[]` (`{ username, score, game, mode, createdAt }`), trié
  décroissant, meilleur score par joueur, max 100 lignes.

### Store `rooms`
- **Clé** = code de salon (6 caractères).
- **Valeur** = `RoomState` (`game`, `host`, `phase`, `config`, `players`,
  `submissions`, `updatedAt`). TTL 3 h.

## Diagramme relationnel (logique)

```
User 1───* ScoreEntry *───1 Game
User 1───* SaveSlot   *───1 Game
User 1───* Achievement(débloqués)
Admin 1──* Announcement / Category / CampaignCase
Room 1───* Player ; Room 1───* Submission
Leaderboard(Game) 1───* Row(best par User)
```
