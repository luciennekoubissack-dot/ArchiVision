# ArchiVision — Plan de réalisation

Ce document liste ce qui reste à faire pour amener ArchiVision d'un backend "référentiel métier" fonctionnel à une plateforme utilisable, en s'appuyant sur l'état réel du code (pas sur la vision long terme du README).

> **Pivot du 2026-08-03 :** le périmètre a été revu avec le porteur de projet — voir `docs/cahier.md` (vision fusionnée). Le multi-tenant, les rôles utilisateurs, les services d'entreprise/organigramme et les objectifs stratégiques **entrent** dans le périmètre réel (ils étaient classés Phase 4/hors-périmètre plus bas dans ce document avant cette date — la Phase 1 ci-dessous, tranchée mono-tenant le matin même, est donc partiellement obsolète, conservée telle quelle pour l'historique). Voir Phase 1bis.

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

## Phase 1bis — Multi-tenant (2026-08-03, ajoutée après le pivot)

Revient sur la décision mono-tenant de la Phase 1 (même jour). Voir `docs/cahier.md` section 7 pour la justification sécurité (isolation par JWT, pas par paramètre client).

- Migration Prisma : `User.organisationId` (FK, requis) + `User.role` (enum `ARCHITECTE`/`DIRIGEANT`/`REPRESENTANT`/`COLLABORATEUR`) + `User.serviceId` (optionnel).
- Nouvelles tables : `Service` (hiérarchique, auto-référencée comme `ZoneUrbanisation`) et `Objectif` (simple, rattachée à l'organisation).
- `POST /auth/register` : crée une `Organisation` + son premier `User` en une transaction.
- Guard d'isolation tenant : résout `organisationId` depuis le JWT, l'injecte dans les requêtes du référentiel — les endpoints existants qui acceptent `organisationId` en query param doivent être audités (actuellement le client le fournit librement, faille dès que plusieurs organisations coexistent).
- `ServiceViewService` (organigramme généré) — même pattern que `ArchimateViewService`/`UrbanisationViewService`.
- CRUD Membres (scopé organisation, réservé au rôle Architecte).
- Endpoint d'export JSON du référentiel.

## Phase 2 — Construire le frontend

- ~~Rédiger les specs dans `.kiro/specs/archivision-frontend/requirements.md`~~ Fait (2026-08-03, révisé le même jour après le pivot) — 19 exigences, voir `docs/cahier.md` et `requirements.md`.
- **État constaté (2026-08-03) :** un premier frontend est apparu en parallèle de ce travail de cadrage (auth, organisations, vue ArchiMate, dashboard, pages statiques). Le composant `ArchimateComponent` est solide et consomme correctement l'API de génération de vue. Le reste nécessite une revue : contenu marketing (accueil, à propos, comment-utiliser) décrivant des fonctionnalités hors périmètre (BPMN, gouvernance, "tenant" au sens SaaS visiteur) à réécrire selon `docs/cahier.md` ; `proxy.conf.json` mal configuré (port 3001 au lieu de 3000, non référencé dans `angular.json`) ; dashboard à reconstruire avec de vraies données (Exigence 15) ; formulaire Organisation avec des champs (`secteur`/`taille`/`pays`/`logoUrl`) déjà ajoutés au schéma mais sans migration.
- Authentification et inscription (Exigence 1), guard de routes, sidebar (Exigence 2).
- Écrans CRUD : Organisation courante, Membres, Services/Organigramme, Objectifs, Capacités métier, Éléments ArchiMate, Relations, Applications, Zones d'urbanisation.
- Couche service Angular pour consommer l'API (HttpClient + intercepteur JWT) — déjà amorcée (`auth.service.ts`, `organisation.service.ts`, `archimate.service.ts`).
- Tableau de bord avec KPIs réels et graphiques (`ng2-charts`).
- Design : charte bleu/blanc/noir, logo fourni, responsive.

## Phase 3 — Qualité et mise en production

- Tests e2e backend (Supertest) sur les parcours critiques.
- Tests e2e frontend (Cypress/Playwright) sur les parcours critiques.
- CI (lint + tests) sur chaque push/PR.
- Dockerfile pour le frontend + mise à jour du `docker-compose.yml` pour inclure le frontend en v1 (actuellement absent du compose).
- Gestion des variables d'environnement (`.env.example` à créer si absent, vérifié).
- Initialiser un dépôt git si ce n'est pas déjà fait (aucun `.git` détecté dans le dossier).

## Phase 4 — Évolutions (vision long terme, à ne traiter qu'une fois le v1 stable)

- ~~Multi-tenant réel~~ Déplacé en Phase 1bis (2026-08-03) — plus une évolution différée, périmètre réel.
- Row-Level Security PostgreSQL (l'isolation Phase 1bis se fait au niveau applicatif/guard, pas encore en RLS base de données).
- `apps/realtime` (Socket.IO + Yjs) pour la collaboration temps réel sur les modèles.
- `apps/worker` (BullMQ) pour les traitements asynchrones.
- CQRS / event sourcing (`OutboxEvent`, `EventLog`) si le besoin de projections/audit se confirme.
- OAuth/OIDC en remplacement ou complément du login email/mot de passe.
- Déploiement Kubernetes (manifests `k8s/` à écrire).
- Observabilité : OpenTelemetry, Prometheus.

---

## Priorité recommandée

1. Phase 1 (fiabiliser l'existant) — c'est le socle, sans ça le reste repose sur du sable.
2. Phase 1bis (multi-tenant) — condition préalable à tout le reste : le référentiel actuel n'isole pas les données par organisation, et Phase 2/3 en dépendent directement.
3. Phase 2 (frontend) — sans interface, le produit n'est pas démontrable/utilisable.
4. Phase 3 (qualité/déploiement) — en parallèle de la phase 2 dès que possible.
5. Phase 4 — le reste, au fil de l'eau.
