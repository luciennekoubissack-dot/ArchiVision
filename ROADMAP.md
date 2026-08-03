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

## Phase 1 — Finaliser le backend v1

- **Auth** : compléter le flux (register si nécessaire, refresh token ou expiration gérée côté client), tests unitaires/e2e pour `auth.service` et `jwt.strategy`.
- **Organisation** : vérifier couverture complète du controller (actuellement seul le service est testé), ajouter tests controller/e2e.
- **ArchiMate & Urbanisation** : ajouter tests unitaires (`archimate.service`, `urbanisation.service`) — inexistants pour l'instant.
- **Validation** : vérifier que tous les DTO utilisent bien `class-validator` avec des règles complètes (formats, longueurs, enums).
- **Gestion d'erreurs** : filtre d'exceptions global NestJS pour réponses d'erreur cohérentes.
- **Décision multi-tenant** : trancher explicitement — soit on assume que le v1 est mono-tenant (ce que dit le `docker-compose.yml`) et on retire/désactive `TenantGuard`, soit on ajoute réellement `tenantId` au schéma Prisma et on branche le guard. Actuellement c'est un entre-deux non documenté.
- **Documentation** : corriger le README pour refléter l'état réel (retirer ou déplacer dans une section "vision future" les mentions de `apps/realtime`, `apps/worker`, CQRS, Kubernetes, etc. qui n'existent pas dans le code).

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
