# Catégories du Petit Bac

Source : `src/games/petitbac/categories.ts`. Les catégories peuvent être
**complétées par l'administrateur** (catégories personnalisées) sans toucher au
code.

## Catégories standard (12)

| Catégorie | Emoji |
|-----------|-------|
| Prénom | 🧑 |
| Animal | 🦊 |
| Pays | 🌍 |
| Ville | 🏙️ |
| Fruit ou légume | 🍎 |
| Métier | 👷 |
| Objet | 🔧 |
| Couleur | 🎨 |
| Sport | ⚽ |
| Célébrité | ⭐ |
| Marque | 🏷️ |
| Plante | 🌿 |

## Catégories expert (6)

Disponibles en **mode expert** (plus rares / exigeantes) :

| Catégorie | Emoji |
|-----------|-------|
| Mythologie | 🏛️ |
| Instrument de musique | 🎻 |
| Élément chimique | ⚗️ |
| Capitale | 🏰 |
| Film | 🎬 |
| Expression française | 💬 |

## Lettres

- **Pool standard** : `A B C D E F G H I J L M N O P R S T V`
  (les lettres trop difficiles sont exclues par défaut).
- **Lettres rares** (mode expert uniquement) : `K Q U W X Y Z`.
- **Lettres spéciales** (contraintes bonus) :
  - **Z** — chaque bonne réponse vaut **double**.
  - **H** — les réponses doivent faire **au moins 6 lettres**.
  - **S** — le **bonus de série (combo)** est doublé.

L'administrateur peut **interdire** certaines lettres via le back-office.

## Barème de score

| Situation | Points |
|-----------|--------|
| Réponse valide **unique** | **10** (configurable) |
| Réponse valide **partagée** | **5** (configurable) |
| Réponse **vide ou invalide** | **0** |
| Bonus de **combo** | +2 par bonne réponse consécutive (×2 si lettre « S ») |
| Bonus de **vitesse** | +0,5 × secondes restantes (si au moins 1 point) |

Une réponse est **valide** si, après normalisation (accents, casse, espaces et
ponctuation ignorés), elle commence par la lettre tirée et respecte la longueur
minimale éventuelle.
