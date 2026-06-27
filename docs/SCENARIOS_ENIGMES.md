# Scénarios d'énigmes

Source : `src/games/enquete/templates.ts` (univers narratifs) et
`src/games/enquete/campaign.ts` (campagne).

## Garantie de solution unique

Chaque énigme est un **puzzle logique** habillé d'un récit. La vérité cachée est
constituée de deux bijections (chaque suspect est dans **un** lieu et porte
**un** objet). Les **faits du crime** désignent le lieu et l'objet du coupable ;
le coupable est l'unique suspect réunissant les deux.

Le générateur :
1. tire une solution complète depuis une graine ;
2. construit un vivier d'indices **vrais** ;
3. n'en retient qu'un sous-ensemble **rendant la solution unique** (vérifié par
   un solveur qui énumère les permutations) ;
4. **minimise** ce sous-ensemble (aucun indice redondant).

Cette propriété est **vérifiée automatiquement** par les tests
(`src/games/enquete/engine.test.ts`) sur de nombreuses graines et les trois
difficultés : « every generated case has exactly one consistent solution » et
« mandatory clue set is minimal ». Une partie ne peut donc jamais être
contradictoire ou insoluble.

## Univers narratifs (templates)

| Id | Titre | Pitch |
|----|-------|-------|
| `manoir` | **Le Manoir de Valombre** | Une nuit d'orage, le maître des lieux est retrouvé sans vie. |
| `musee` | **Vol au Musée des Lumières** | Le diamant Étoile-du-Sud disparaît ; cinq employés avaient les clés. |
| `navire` | **Disparition sur l'Orient-Express** | Un passager s'évanouit dans la nuit enneigée. |

Chaque univers fournit un casting de suspects, des lieux et des objets ; le
générateur en échantillonne `N` (4 à 6 selon la difficulté).

## Campagne (6 affaires, difficulté croissante)

| # | Affaire | Univers | Difficulté |
|---|---------|---------|------------|
| 1 | Le dîner fatal | Manoir | facile (4 suspects) |
| 2 | L'éclat dérobé | Musée | facile (4 suspects) |
| 3 | Cabine 7 | Orient-Express | normal (5 suspects) |
| 4 | Retour à Valombre | Manoir | normal (5 suspects) |
| 5 | Le casse du siècle | Musée | difficile (6 suspects) |
| 6 | Terminus | Orient-Express | difficile (6 suspects) |

Les affaires de campagne utilisent des **graines fixes** : reproductibles et
donc pré-validées par les tests.

## Mode « rejouer »

Le mode **rejouable** génère une affaire à partir d'une graine aléatoire :
nouveaux suspects, lieux, objets et indices à chaque partie, tout en conservant
la garantie de solution unique. Difficulté au choix (facile / normal / difficile).

## Fonctionnalités d'enquête disponibles

- Introduction narrative et faits du crime.
- Liste de suspects, indices **visibles** et indices **optionnels** (à révéler
  contre des points).
- **Grilles de déduction** suspect×lieu et suspect×objet (prise de notes,
  élimination progressive, marquage des liens).
- **Aide contextuelle** (révèle un fait vrai) et **vérification de cohérence**
  (signale les déductions contradictoires).
- Bloc-notes libre.
- **Révélation finale** avec explication détaillée et score.
- **Sauvegarde / reprise** automatique de l'enquête en cours.
