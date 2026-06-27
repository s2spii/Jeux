# Schéma d'architecture

Ludoteca suit une architecture **front/back séparée**, optimisée pour un
déploiement Netlify (statique + serverless). Le front est une SPA React ;
le back est constitué de fonctions serverless sans état, adossées à un
stockage clé-valeur (Netlify Blobs).

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────────┐
│                         Navigateur (client)                          │
│                                                                      │
│   React SPA (Vite)                                                   │
│   ├─ Router (React Router)                                           │
│   ├─ État global (Zustand)                                           │
│   │    ├─ auth      (comptes + invité, hash PBKDF2)                  │
│   │    ├─ settings  (thème, langue, accessibilité)                   │
│   │    ├─ stats     (historique, succès, agrégats)                   │
│   │    ├─ saves     (parties reprenables)                            │
│   │    └─ content   (contenu éditable par l'admin)                   │
│   ├─ Moteurs de jeu (purs, testables)                               │
│   │    ├─ enquete/engine.ts    (génération + solveur unicité)       │
│   │    ├─ petitbac/engine.ts   (scoring 10/5/0, combos)             │
│   │    └─ paradoxes/engine.ts  (génération réversible + paradoxes)  │
│   └─ Persistance locale : localStorage (namespacé "ludoteca:")      │
│                                                                      │
│            │  fetch /api/*  (uniquement pour le mode en ligne)       │
└────────────┼─────────────────────────────────────────────────────────┘
             │  HTTPS
┌────────────▼─────────────────────────────────────────────────────────┐
│                          Netlify (edge + CDN)                         │
│                                                                      │
│   Static hosting (dist/) ──── redirections SPA (netlify.toml)        │
│                                                                      │
│   Netlify Functions (serverless, Node)                              │
│   ├─ /api/leaderboard   GET (top scores) · POST (soumission)        │
│   └─ /api/rooms         GET (état) · POST (create/join/update)      │
│                    │                                                  │
│                    ▼                                                  │
│            Netlify Blobs (stockage clé-valeur)                       │
│            ├─ store "leaderboard" : 1 clé par jeu                    │
│            └─ store "rooms"       : 1 clé par code de salon          │
└──────────────────────────────────────────────────────────────────────┘
```

## Principes de conception

1. **Local-first.** Toute la logique de jeu et la persistance fonctionnent sans
   réseau. Les appels backend sont optionnels et **dégradent proprement**
   (`ApiResult.offline`) : l'app reste jouable hors-ligne.

2. **Moteurs purs.** Chaque jeu sépare son *moteur* (fonctions pures,
   déterministes, testées) de son *UI* (composants React). Cela permet de
   garantir et de tester des propriétés fortes (solution unique, solvabilité).

3. **Déterminisme par graine (seed).** Un PRNG seedable (`lib/rng.ts`) alimente
   la génération procédurale, les défis quotidiens (même graine pour tous un
   jour donné) et les parties partageables.

4. **Temps réel pragmatique.** Netlify ne fournit pas de WebSocket persistant ;
   le multijoueur en ligne utilise donc un **polling court** (2 s) sur un état
   de salon stocké dans Blobs. C'est le compromis adapté au modèle serverless,
   documenté et robuste (gestion des reconnexions par re-fetch idempotent).

## Communication temps réel / gestion des salons

- Un salon est identifié par un **code à 6 caractères** (`lib/id.ts`).
- L'état du salon (`phase`, `config`, `players`, `submissions`) vit dans Blobs.
- Les clients **récupèrent** l'état par polling et **émettent** des *patches*
  fusionnés côté serveur (`mergePatch`), évitant les écrasements concurrents
  des sous-objets `players` / `submissions`.
- Les salons expirent après 3 h (TTL) — nettoyage paresseux à l'accès.
- Déconnexion/reconnexion : comme l'état fait autorité côté serveur, un client
  qui revient re-synchronise simplement au prochain poll ; aucun état incohérent
  n'est conservé côté client.

## Sécurité

- Mots de passe **jamais stockés en clair** : dérivation PBKDF2-SHA256
  (120 000 itérations, sel aléatoire) via WebCrypto (`lib/crypto.ts`).
- **Validation stricte** des entrées (`lib/validation.ts`) côté client et
  re-validation/clamp côté fonctions (`netlify/functions/_shared.ts`).
- **Anti-triche / anti-abus** : scores bornés (`cleanScore`), noms assainis,
  limitation de débit best-effort (`rateLimited`).
- En-têtes de sécurité (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`) appliqués via `netlify.toml`.

## Flux d'une partie (exemple : Petit Bac en ligne)

```
Hôte ── create ──▶ /api/rooms ──▶ Blobs (phase=lobby, code=K7P2QF)
Invités ── join ─▶ /api/rooms ──▶ players[]
Hôte ── update(phase=playing) ─▶ tous voient "playing" (poll)
Chaque joueur ── update(submissions[nom]) ─▶ réponses agrégées
Hôte ── update(phase=results) ─▶ scoreRound() côté client ─▶ classement
```
