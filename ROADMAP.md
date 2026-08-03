# ArchiVision — Plan de réalisation

Ce document liste ce qui reste à faire pour amener ArchiVision d'un backend "référentiel métier" fonctionnel à une plateforme utilisable, en s'appuyant sur l'état réel du code (pas sur la vision long terme du README).

---

## État actuel (acquis)

- Backend NestJS + Prisma/PostgreSQL : modules `auth`, `organisation`, `archimate` (capacités métier, éléments, relations — couche Métier ArchiMate uniquement), `urbanisation` (applications, zones ZONE/QUARTIER/ÎLOT).
- Schéma Prisma cohérent, une migration initiale (`init_referentiel_v1`), seed de base.
- Guards JWT, `RolesGuard`/`TenantGuard` écrits mais non branchés sur le schéma de données (pas de `tenantId`).
- Tests unitaires sur `organisation`.
- Docker Compose v1 (Postgres + API uniquement).
- Frontend Angular 17 : projet initialisé, `app.routes.ts` vide, aucun composant métier, aucune spec rédigée dans `.kiro/specs`.

---

## Phase 1 — Finaliser le backend v1 ✅ (2026-08-03)

- ~~**Auth** : tests unitaires/e2e pour `auth.service` et `jwt.strategy`.~~ Fait — `auth.service.spec.ts`, `auth.controller.spec.ts` (HTTP), `jwt.strategy.spec.ts`.
- ~~**Organisation** : ajouter tests controller/e2e.~~ Fait — `organisation.controller.spec.ts`.
- ~~**ArchiMate & Urbanisation** : ajouter tests unitaires.~~ Fait — `archimate.service.spec.ts`, `urbanisation.service.spec.ts`.
- ~~**Validation** : DTO avec `class-validator`.~~ Fait — tous les DTO (dont `LoginDto`) valident formats/enums/longueurs.
- ~~**Gestion d'erreurs** : filtre d'exceptions global.~~ Fait — `HttpExceptionFilter`, testé.
- ~~**Décision multi-tenant**~~ Tranché : v1 mono-tenant. `TenantGuard`, `RolesGuard`, `tenant-scoping.extension.ts` étaient déjà non branchés (dead code) et ont été supprimés du dépôt le 2026-08-03 (ils n'étaient plus que des stubs marqués "à supprimer manuellement"). Le multi-tenant réel reste en phase 4.
- ~~**Documentation**~~ README à jour avec l'état réel.

**86/86 tests passent, `npm run build` et `npm run start:dev` fonctionnent.** Corrections apportées le 2026-08-03 :
- `apps/api/tsconfig.app.json` avait un `rootDir` invalide (antislash JSON) qui cassait totalement `npm run build` (45 erreurs TS6059) dès que tous les modules ont été branchés — `npm test` ne l'exposait pas car Jest compile via `ts-jest`/`moduleNameMapper`, pas via `tsc`.
- `tsconfig.base.json` mappait `@archivision/*` vers les fichiers `.ts` sources (extension incluse) ; à l'exécution le JS compilé tentait de `require()` un fichier `.ts` inexistant pour Node. Chemins corrigés sans extension.
- `AuthModule` n'importait pas `PrismaModule` → tests HTTP en échec.
- `import * as bcrypt from 'bcrypt'` cassait `jest.spyOn(bcrypt, 'compare')` (namespace TypeScript gelé) → `import bcrypt from 'bcrypt'`.
- `Dockerfile.api` copiait/exécutait le mauvais schéma Prisma (`prisma/` racine, legacy) et un mauvais chemin `main.js` (`dist/apps/api/apps/api/...` après le premier correctif) ; corrigé. Build Docker validé structurellement (étapes `COPY`/`npm ci` passent) mais non vérifié de bout en bout dans cet environnement (réseau instable pendant `npm ci` en conteneur).
- Dossier `prisma/` racine (schéma legacy antérieur, non référencé par `package.json`) et paire `docker/Dockerfile.api` + `docker/docker-compose.yml` (Node 20, script `build:api` inexistant) supprimés — doublons morts des versions racine actuelles.
- Fichiers `.js`/`.d.ts` parasites (résidus d'anciens builds ratés) nettoyés dans `apps/api/src` et `libs/*/src`.

## Phase 2 — Construire le frontend

- Rédiger les specs dans `.kiro/specs/archivision-frontend/requirements.md` (actuellement vide) avant de coder.
- Authentification : page de login, stockage du token, guard de routes.
- Écrans CRUD : Organisations, Capacités métier, Éléments ArchiMate, Relations, Applications, Zones d'urbanisation.
- Couche service Angular pour consommer l'API (HttpClient + intercepteur JWT).
- **Visualisation ArchiMate** : c'est le cœur de la valeur produit — un éditeur/visualiseur graphique des éléments et relations (ex. via une lib de diagrammes : joint.js, GoJS, ou une solution custom SVG/Canvas). À cadrer précisément, c'est la pièce la plus complexe du frontend.
- **Visualisation urbanisation** : cartographie applicative (POS - Plan d'Occupation des Sols) montrant zones/quartiers/îlots et applications affectées.
- UI de base : layout, navigation, gestion des erreurs API, retours utilisateur (toasts/messages).

## Phase 3 — Qualité et mise en production

- Tests e2e backend (Supertest) sur les parcours critiques.
- Tests e2e frontend (Cypress/Playwright) sur les parcours critiques.
- CI (lint + tests) sur chaque push/PR.
- Dockerfile pour le frontend + mise à jour du `docker-compose.yml` pour inclure le frontend en v1 (actuellement absent du compose).
- Gestion des variables d'environnement (`.env.example` à créer si absent, vérifié).
- Initialiser un dépôt git si ce n'est pas déjà fait (aucun `.git` détecté dans le dossier).

## Phase 4 — Évolutions (vision long terme du README, à ne traiter qu'une fois le v1 stable)

- Multi-tenant réel avec Row-Level Security PostgreSQL.
- `apps/realtime` (Socket.IO + Yjs) pour la collaboration temps réel sur les modèles.
- `apps/worker` (BullMQ) pour les traitements asynchrones.
- CQRS / event sourcing (`OutboxEvent`, `EventLog`) si le besoin de projections/audit se confirme.
- OAuth/OIDC en remplacement ou complément du login email/mot de passe.
- Déploiement Kubernetes (manifests `k8s/` à écrire).
- Observabilité : OpenTelemetry, Prometheus.

---

## Priorité recommandée

1. Phase 1 (fiabiliser l'existant) — c'est le socle, sans ça le reste repose sur du sable.
2. Phase 2 (frontend) — sans interface, le produit n'est pas démontrable/utilisable.
3. Phase 3 (qualité/déploiement) — en parallèle de la phase 2 dès que possible.
4. Phase 4 — uniquement si le contexte (stage, délais) le permet ; sinon la documenter comme roadmap post-v1.
