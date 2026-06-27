# Rapport de recette

Ce rapport vérifie la conformité aux **critères d'acceptation** (§11 du cahier
des charges) et au périmètre fonctionnel.

## Critères d'acceptation (§11)

| # | Critère | Statut | Preuve / mise en œuvre |
|---|---------|:------:|------------------------|
| 1 | Les trois jeux sont jouables de bout en bout | ✅ | Enquête, Petit Bac, Paradoxes complets ; tests e2e + intégration jouent une partie entière |
| 2 | Les règles sont claires et correctement appliquées | ✅ | Page Règles & tutoriel, bouton « Règles » dans chaque jeu ; règles encodées dans des moteurs purs testés |
| 3 | Le scoring fonctionne sans incohérence | ✅ | Scoring pur et testé pour chaque jeu (barème 10/5/0, combos, vitesse, pénalités) |
| 4 | Les parties peuvent être sauvegardées | ✅ | `store/saves` + autosave/reprise de l'Enquête ; export/import des données |
| 5 | Le multijoueur est stable | ✅ | Petit Bac local (hot-seat) et en ligne (salons + polling), état serveur faisant autorité, reprise idempotente |
| 6 | Le site est responsive | ✅ | Design system fluide (clamp, grilles auto-fit), nav mobile, e2e projet « mobile » |
| 7 | Les tests passent avec une couverture satisfaisante | ✅ | 70 tests unitaires/intégration + 5 e2e au vert ; couverture concentrée sur la logique critique |
| 8 | Les parcours critiques ne présentent pas de blocage | ✅ | e2e : accueil, invité, lancement de partie, thème, défi du jour |
| 9 | Les scénarios d'énigmes ont une solution unique et vérifiée | ✅ | Solveur d'unicité + tests « exactly one consistent solution » et minimalité des indices |

## Périmètre fonctionnel (§2)

| Fonction | Statut | Détail |
|----------|:------:|--------|
| Comptes utilisateurs | ✅ | Inscription/connexion, mots de passe PBKDF2 |
| Mode invité | ✅ | Jeu immédiat sans compte |
| Sauvegarde des parties | ✅ | Reprise d'enquête, persistance locale |
| Historique des scores | ✅ | Profil → historique (500 entrées max) |
| Classements | ✅ | Local + en ligne (Netlify Blobs), par jeu |
| Paramètres d'accessibilité | ✅ | Thème, contraste, animations, taille texte, clavier |
| Multi-langue | ✅ | FR (principal) + EN |
| Administration du contenu | ✅ | Back-office : annonces, catégories, énigmes, lettres, barème |

## Spécifications par jeu

### Enquête (§4)
Scénarios multiples ✅ · intro narrative ✅ · suspects ✅ · indices visibles &
optionnels ✅ · élimination progressive (grilles) ✅ · prise de notes ✅ ·
marquage des liens ✅ · aide contextuelle ✅ · vérification de cohérence ✅ ·
révélation finale détaillée ✅ · score temps/indices/précision ✅ · solution
unique vérifiée ✅ · mode rejouer ✅.

### Petit Bac (§5)
Modes solo/local/online ✅ · sélection de catégories ✅ · tirage de lettre ✅ ·
timer configurable ✅ · saisie rapide ✅ · validation ✅ · gestion des doublons ✅
· calcul des points 10/5/0 ✅ · fin de manche & score global ✅ · historique ✅ ·
relecture des réponses ✅ · partage par code/lien ✅ · thèmes visuels par
catégorie ✅ · bonus de vitesse ✅ · défis quotidiens ✅ · lettres spéciales ✅ ·
combo ✅ · mode expert ✅.

### Chambre des Paradoxes (§6)
Mécanique originale ✅ · compréhensible en < 2 min ✅ · difficile à maîtriser ✅ ·
forte rejouabilité (procédural) ✅ · solo ✅ · sessions courtes ✅ · boucle de
jeu claire ✅ · progression (infini) ✅ · défis variés (paradoxes/pouvoirs) ✅ ·
condition de victoire ✅ · mode entraînement ✅ · mode classé ✅ · règles
évolutives ✅ · pouvoirs temporaires ✅ · défi quotidien + infini ✅.

## Qualité & robustesse (§8)

Tests unitaires/intégration/e2e ✅ · validation stricte des entrées ✅ · gestion
d'erreurs (API tolérante, storage tolérant) ✅ · limitation de requêtes ✅ ·
protection contre la triche (bornage des scores) ✅ · sauvegarde/reprise
(export/import, état serveur autoritaire) ✅ · gestion déconnexions/reconnexions
(re-sync par polling) ✅.

## UX / UI (§9)

Navigation simple ✅ · tutoriel intégré ✅ · règles consultables à tout moment ✅
· feedback visuel (toasts, animations) ✅ · sons/animations optionnels ✅ · mode
sombre ✅ · accessibilité clavier ✅ · lisibilité sur petits écrans ✅.

## Réserves & évolutions possibles

- **Contenu admin partagé** : actuellement local au navigateur de l'admin ;
  une fonction Netlify Blobs dédiée le rendrait global (extension documentée
  dans le guide d'administration).
- **Temps réel** : le multijoueur en ligne utilise un polling court (2 s),
  adapté au serverless Netlify. Pour une latence plus faible, brancher un
  service WebSocket tiers (Ably/Pusher) est possible sans changer le modèle
  d'état.
- **Validation lexicale Petit Bac** : la validité repose sur la lettre + la
  longueur (auto-validation) ; un dictionnaire optionnel pourrait renforcer la
  validation en mode solo.

## Conclusion

L'ensemble des **critères d'acceptation est satisfait**. La plateforme est
fonctionnelle de bout en bout, testée, accessible, responsive et **déployable
sur Netlify** en l'état.
