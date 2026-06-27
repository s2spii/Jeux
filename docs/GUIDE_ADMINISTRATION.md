# Guide d'administration

Le back-office permet de **gérer le contenu sans modifier le code**. Il est
accessible aux comptes de rôle `admin`, via le menu **Administration** (`/admin`).

## Devenir administrateur

Le **tout premier compte créé** sur une installation devient automatiquement
administrateur. (Un compte nommé exactement `admin` reçoit aussi ce rôle.)
Le rôle est visible sur la page Profil.

> Les comptes et le contenu admin sont stockés localement dans le navigateur.
> Pour une installation multi-postes partageant le même back-office, prévoir
> une extension serverless (voir « Évolutivité » plus bas).

## Fonctions du back-office

### 📊 Statistiques de jeu
Tableau de bord du nombre de parties (total et par jeu), calculé depuis
l'historique.

### 📣 Annonces & événements
Créez des annonces (titre + message) affichées en page d'accueil. Vous pouvez
les **activer/masquer** ou les **supprimer**. Idéal pour les événements et
contenus promotionnels.

### ✏️ Catégories du Petit Bac
Ajoutez des **catégories personnalisées** (nom + emoji). Elles rejoignent le
vivier de tirage et s'affichent correctement dans les résultats. Supprimables
à tout moment.

### 🔤 Lettres & barème
- **Lettres interdites** : saisissez les lettres à exclure du tirage
  (ex. `KWXYZ`).
- **Barème** : ajustez les points d'une réponse **unique** et **partagée**
  (par défaut 10 / 5). Pris en compte immédiatement par le scoring.

### 🕵️ Énigmes (campagne)
Ajoutez des **affaires personnalisées** (nom + univers + difficulté). Elles
apparaissent dans la campagne de l'Enquête. Le moteur **garantit une solution
unique** : aucune affaire ajoutée ne peut être insoluble.

### Réinitialisation
Le bouton « Réinitialiser le contenu » efface tout le contenu personnalisé
(annonces, catégories, énigmes, lettres, barème) et restaure les valeurs par
défaut.

## Modération & sécurité

- Les entrées sont **validées** (longueurs, caractères) côté client.
- Les fonctions serverless **re-valident et bornent** les données réseau
  (scores plafonnés, noms assainis, limitation de débit) pour limiter la triche
  et les abus.

## Sauvegarde et reprise après incident

Depuis _Réglages → Mes données_, tout administrateur (ou joueur) peut
**exporter** l'intégralité des données locales en JSON et les **réimporter**
(transfert d'appareil, sauvegarde, restauration après incident).

## Évolutivité (contenu partagé serveur)

Le modèle actuel est **local-first**. Pour partager le contenu admin entre tous
les visiteurs (et pas seulement le navigateur de l'admin), ajoutez une fonction
Netlify lisant/écrivant le contenu dans un store **Netlify Blobs** dédié, sur le
modèle de `netlify/functions/leaderboard.ts`. Le store `content` côté client est
déjà structuré pour cette extension.
