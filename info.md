# Rapport d'état du projet ArchiVision

> **Date du rapport :** 27 juillet 2026  
> **Version du projet :** 0.1.0  
> **Période de stage :** 23 juillet – 4 septembre 2026 (6 semaines)

---

## 1. Vue d'ensemble

**ArchiVision** est une plateforme de modélisation d'architecture d'entreprise. Elle permet de construire et maintenir un **référentiel unique** (organisation, capacités métier, éléments ArchiMate, portefeuille applicatif, zones d'urbanisation) et de **générer des vues** (diagrammes ArchiMate, Plan d'Occupation du Système — POS) à partir de ces données.

Le cas d'usage de référence est **K&B Groupe SARL**, une organisation fictive utilisée pour valider le MVP.

### Objectif v1 (MVP)

| Objectif | Description |
|---|---|
| Référentiel structuré | CRUD sur les entités métier définies dans `docs/referentiel.md` |
| Vues générées | SVG produit côté backend, affiché en lecture seule dans Angular |
| Périmètre solo | Un utilisateur, une organisation, JWT basique |
| Pas d'éditeur graphique | Pas de glisser-déposer, pas de MaxGraph/JointJS |

---

## 2. Stack technique

| Couche | Technologie | Version observée |
|---|---|---|
| Backend | NestJS | 11.1.x |
| Frontend | Angular | 17.3.x |
| Langage | TypeScript | 5.9 (API) / 5.4 (web) |
| Base de données | PostgreSQL | 15 |
| ORM | Prisma | 7.9.x |
| Authentification | JWT + Passport + bcrypt | — |
| Tests backend | Jest + Supertest | 29.7.x |
| Tests frontend | Karma + Jasmine | — |
| Conteneurisation | Docker + Docker Compose | — |
| Gestionnaire de paquets | npm | — |

> **Note :** La documentation (`docs/stack.md`) mentionne NestJS 10 et Node.js 20 LTS. Le projet utilise en pratique NestJS 11 et Node 22 dans le Dockerfile.

### Explicitement hors périmètre v1

Redis, NgRx, Kubernetes, SSO/RBAC multi-rôles, multi-tenant, collaboration temps réel (Yjs/CRDT), éditeurs graphiques interactifs.

---

## 3. Structure du dépôt

```
ArchiVision/
├── apps/
│   ├── api/                        # API NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Schéma référentiel v1 (source de vérité)
│   │   │   ├── seed.ts             # Données de démonstration K&B
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── organisation/       # Module actif (branché dans AppModule)
│   │       ├── prisma/             # PrismaService local (adapter pg)
│   │       └── modules/            # Modules écrits mais non branchés
│   │           ├── auth/
│   │           ├── archimate/
│   │           ├── urbanisation/
│   │           └── health/
│   └── web/                        # Application Angular (squelette)
│       └── src/app/
├── libs/
│   ├── infrastructure/             # PrismaService partagé, extension tenant (legacy)
│   └── shared/                     # Guards JWT, décorateurs (partiellement legacy)
├── docs/
│   ├── referentiel.md
│   ├── stack.md
│   └── conventions.md
├── prisma/                         # ⚠ Ancien schéma multi-tenant (legacy)
├── docker-compose.yml
├── Dockerfile.api
├── docker/Dockerfile.api           # ⚠ Ancien Dockerfile (legacy)
├── nest-cli.json
├── package.json
└── tsconfig.base.json
```

**Type de monorepo :** NestJS monorepo avec bibliothèques partagées (`@archivision/infrastructure`, `@archivision/shared`).

---

## 4. État d'avancement global

```
Semaine 1 (en cours) — Fondations backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[████████░░░░░░░░░░░░░░░░░░░░] ~30 %

Référentiel Prisma     ████████████████████ 100 %
Migration BDD          ████████████████████ 100 %
Seed de démo           ████████████████████ 100 %
OrganisationModule     ████████████████████ 100 %
AuthModule             ████████████████░░░░  80 % (code écrit, non branché)
ArchimateModule        ████████████████░░░░  80 % (code écrit, non branché)
UrbanisationModule     ████████████████░░░░  80 % (code écrit, non branché)
HealthModule           ████████████████░░░░  80 % (code écrit, non branché)
Vues SVG               ░░░░░░░░░░░░░░░░░░░░   0 %
Frontend Angular       ████░░░░░░░░░░░░░░░░  20 % (squelette uniquement)
Git / versioning       ░░░░░░░░░░░░░░░░░░░░   0 % (dépôt non initialisé)
```

---

## 5. Base de données et référentiel

### Schéma Prisma (`apps/api/prisma/schema.prisma`)

Le schéma couvre **l'intégralité du référentiel v1** défini dans `docs/referentiel.md` :

| Modèle | Statut | Description |
|---|---|---|
| `User` | ✅ Défini | Authentification (hors référentiel métier) |
| `Organisation` | ✅ Défini + seed | Entreprise modélisée |
| `CapaciteMetier` | ✅ Défini + seed | Capacités de l'organisation |
| `ElementArchimate` | ✅ Défini + seed | 5 types (couche Métier) |
| `RelationArchimate` | ✅ Défini + seed | 4 types de relations |
| `Application` | ✅ Défini + seed | Portefeuille applicatif |
| `ZoneUrbanisation` | ✅ Défini + seed | Hiérarchie Zone > Quartier > Îlot |
| `ApplicationZone` | ✅ Défini + seed | Affectation application ↔ îlot |

### Enums

- **TypeElement :** `ACTEUR_METIER`, `ROLE_METIER`, `PROCESSUS_METIER`, `SERVICE_METIER`, `OBJET_METIER`
- **TypeRelation :** `ASSIGNATION`, `COMPOSITION`, `REALISATION`, `ASSOCIATION`
- **Criticite :** `HAUTE`, `MOYENNE`, `BASSE`
- **TypeZone :** `ZONE`, `QUARTIER`, `ILOT`

### Migration

- **Migration active :** `20260727150535_init_referentiel_v1` (27/07/2026)
- **Configuration Prisma :** pointe vers `apps/api/prisma/schema.prisma` dans `package.json`

### Seed (`apps/api/prisma/seed.ts`)

Données de démonstration préchargées :

| Entité | Exemple |
|---|---|
| Utilisateur | `admin@archivision.local` / `Admin123!` |
| Organisation | K&B Groupe SARL (`org-demo-001`) |
| Capacités | Gestion des formations, Gestion RH |
| Éléments ArchiMate | Responsable Formation → Planifier une formation |
| Relation | ASSIGNATION (acteur → processus) |
| Application | SIRH (criticité HAUTE) |
| Zones | Zone RH > Îlot Formation |
| Affectation | SIRH → Îlot Formation |

**Commande :** `npm run prisma:seed`

---

## 6. Backend API

### Module actif : Organisation

Seul `OrganisationModule` est **branché** dans `AppModule` et **compilé** par TypeScript.

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/organisations` | Créer une organisation | Non |
| `GET` | `/organisations` | Lister les organisations | Non |
| `GET` | `/organisations/:id` | Détail d'une organisation | Non |
| `PATCH` | `/organisations/:id` | Mettre à jour | Non |
| `DELETE` | `/organisations/:id` | Supprimer (204) | Non |

**Qualité :** DTOs validés (`class-validator`), gestion 404, tests unitaires et d'intégration HTTP complets.

### Modules écrits mais non actifs

Ces modules existent dans `apps/api/src/modules/` mais sont **exclus de la compilation** (`tsconfig.app.json` → `"exclude": ["src/modules/**"]`) et **non importés** dans `AppModule`.

#### AuthModule

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/login` | Connexion (email + mot de passe → JWT) |
| `GET` | `/auth/me` | Profil utilisateur courant (JWT requis) |

#### ArchimateModule (JWT requis)

| Ressource | Routes CRUD |
|---|---|
| Capacités métier | `/capacites-metier` |
| Éléments ArchiMate | `/elements-archimate` |
| Relations ArchiMate | `/relations-archimate` |

Fonctionnalités implémentées : filtrage par `organisationId` et `type`, inclusion des relations, détachement de capacité via `null`.

#### UrbanisationModule (JWT requis)

| Ressource | Routes CRUD |
|---|---|
| Applications | `/applications` |
| Zones d'urbanisation | `/zones-urbanisation` |
| Affectations POS | `POST /zones-urbanisation/affecter`, `DELETE /zones-urbanisation/:zoneId/applications/:applicationId` |

Fonctionnalités implémentées : arbre hiérarchique de zones, gestion des conflits d'affectation (409).

#### HealthModule

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | Vérification API + connexion PostgreSQL |

### Services de vues SVG

**Non implémentés.** Prévus par la stack (`ArchimateViewService`, `UrbanisationViewService`) — génération de SVG côté backend à partir des données du référentiel.

### Configuration runtime

- **Port :** 3000 (configurable via `PORT`)
- **Validation globale :** `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- **Sécurité HTTP :** Helmet
- **Variables d'environnement :** `.env.example` fourni (`DATABASE_URL`, `JWT_SECRET`, `PORT`)

---

## 7. Frontend Angular

### État actuel : squelette minimal

| Élément | Statut |
|---|---|
| Projet Angular 17 standalone | ✅ Initialisé |
| `HttpClient` configuré | ✅ |
| Routes | ❌ Tableau vide (`routes: []`) |
| Composants métier | ❌ Aucun (organisation, archimate, urbanisation) |
| Services API | ❌ Aucun |
| Authentification UI | ❌ Non implémentée |
| Affichage SVG | ❌ Non implémenté |

Le composant racine affiche uniquement un titre « ArchiVision » et une description.

**Commandes :**
- `cd apps/web && npm start` — serveur de dev
- `cd apps/web && npm test` — tests Karma (2 tests basiques sur AppComponent)

---

## 8. Bibliothèques partagées (`libs/`)

### `@archivision/shared`

| Fichier | Statut | Usage v1 |
|---|---|---|
| `JwtAuthGuard` | ✅ Utilisable | Guards des modules auth/archimate/urbanisation |
| `CurrentUser` / `AuthUser` | ✅ Utilisable | Endpoint `/auth/me` |
| `TenantGuard` | ⚠ Legacy | Référence `@archivision/tenant-context` (inexistant) |
| `RolesGuard` | ⚠ Legacy | Conçu pour RBAC multi-rôles (hors v1) |
| `Public` decorator | ⚠ Non exporté | Présent mais absent de `index.ts` |

### `@archivision/infrastructure`

| Fichier | Statut | Usage v1 |
|---|---|---|
| `PrismaService` | ⚠ Partiel | Version basique sans adapter `pg` |
| `tenant-scoping.extension.ts` | ⚠ Legacy | Modèles multi-tenant (`Workspace`, `ArchitectureModel`) absents du schéma v1 |

> **Incohérence :** `OrganisationModule` utilise le `PrismaService` local (`apps/api/src/prisma/`) avec l'adapter `@prisma/adapter-pg`, tandis que les autres modules importent `@archivision/infrastructure` qui n'utilise pas cet adapter.

---

## 9. Tests

### Backend (Jest)

```
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

| Fichier | Couverture |
|---|---|
| `organisation.controller.spec.ts` | Tests HTTP (POST, GET, PATCH, DELETE, validation 400, 404) |
| `organisation.service.spec.ts` | Tests unitaires du service |

**Modules non testés :** auth, archimate, urbanisation, health.

### Frontend (Karma/Jasmine)

2 tests basiques sur `AppComponent` (création + titre).

### Build

```
npm run build   → ✅ Succès (compile OrganisationModule uniquement)
npm test        → ✅ 18/18 tests passent
```

---

## 10. Infrastructure et déploiement

### Docker Compose (`docker-compose.yml`)

| Service | Image / Build | Port | Statut |
|---|---|---|---|
| `postgres` | postgres:15 | 5433 → 5432 | ✅ Configuré |
| `api` | Dockerfile.api | 3000 | ⚠ À vérifier |

### Problèmes Docker identifiés

1. **`Dockerfile.api`** copie `prisma/` à la racine, alors que le schéma actif est dans `apps/api/prisma/`.
2. **`docker/Dockerfile.api`** est un ancien Dockerfile (Node 20, structure obsolète).
3. Le service `web` n'est pas conteneurisé (conforme à la stack : optionnel, `ng serve` en local).

### Démarrage local (recommandé)

```bash
# 1. Base de données
docker compose up postgres -d

# 2. Variables d'environnement
cp .env.example .env

# 3. Migration + seed
npm run prisma:migrate
npm run prisma:seed

# 4. API
npm run start:dev

# 5. Frontend (autre terminal)
cd apps/web && npm start
```

---

## 11. Versionnement Git

| Élément | Statut |
|---|---|
| Dépôt Git | ❌ **Non initialisé** |
| `.gitignore` | ✅ Présent (node_modules, dist, .env, etc.) |
| Branches | — |
| Historique de commits | — |

La convention Git est documentée dans `docs/conventions.md` (`feature/organisation-crud`, commits impératifs) mais pas encore appliquée.

---

## 12. Documentation existante

| Fichier | Contenu | Qualité |
|---|---|---|
| `docs/referentiel.md` | Schéma métier v1, entités, enums, règles | ✅ Complet |
| `docs/stack.md` | Stack figée, exclusions v1 | ✅ Complet |
| `docs/conventions.md` | Structure, modules, API REST, Git, ordre de construction | ✅ Complet |
| `info.md` | Ce rapport d'état | ✅ |
| README.md | — | ❌ Absent |

---

## 13. Dette technique et incohérences

### Critiques (bloquent l'intégration)

| # | Problème | Impact | Action recommandée |
|---|---|---|---|
| 1 | `src/modules/**` exclu de `tsconfig.app.json` | Auth, Archimate, Urbanisation, Health ne compilent pas | Retirer l'exclusion ou déplacer les modules |
| 2 | `AppModule` n'importe que `OrganisationModule` | Seul le CRUD Organisation est accessible | Brancher Auth, Archimate, Urbanisation, Health |
| 3 | Double emplacement Prisma (`prisma/` vs `apps/api/prisma/`) | Confusion, Dockerfile obsolète | Supprimer `prisma/` racine (legacy multi-tenant) |
| 4 | Deux `PrismaService` différents | Comportement incohérent entre modules | Unifier sur un seul service avec adapter pg |

### Modérées

| # | Problème | Impact |
|---|---|---|
| 5 | Guards legacy (`TenantGuard`, `RolesGuard`, `tenant-scoping.extension`) | Code mort, références à des packages inexistants |
| 6 | `dist/` contient des artefacts obsolètes (`modules/`) | Confusion lors du debug |
| 7 | Organisation sans authentification, autres modules avec JWT | Incohérence de sécurité |
| 8 | Pas de README à la racine | Difficulté d'onboarding |
| 9 | Dépôt Git non initialisé | Pas de traçabilité |

### Mineures

| # | Problème |
|---|---|
| 10 | `docs/stack.md` mentionne NestJS 10, projet en NestJS 11 |
| 11 | `HealthModule` n'enregistre pas `PrismaService` dans ses providers |
| 12 | Frontend : dépendances installées séparément dans `apps/web/` |

---

## 14. Roadmap et prochaines étapes

Basé sur l'ordre de construction défini dans `docs/conventions.md` et l'état actuel :

### Immédiat (fin semaine 1)

- [ ] Initialiser le dépôt Git et premier commit
- [ ] Résoudre l'exclusion `src/modules/**` dans tsconfig
- [ ] Brancher tous les modules backend dans `AppModule`
- [ ] Unifier le `PrismaService` (adapter pg)
- [ ] Nettoyer le legacy (`prisma/` racine, guards tenant, Dockerfile obsolète)
- [ ] Valider manuellement tous les endpoints (curl/Postman)
- [ ] Ajouter des tests pour Auth, Archimate, Urbanisation

### Semaines 2–3

- [ ] Implémenter `ArchimateViewService` (génération SVG)
- [ ] Implémenter `UrbanisationViewService` (génération SVG POS)
- [ ] Endpoints `/elements-archimate/generate-vue` et équivalent urbanisation

### Semaines 4–5

- [ ] Frontend : authentification (login, interceptor JWT)
- [ ] Frontend : formulaires CRUD (organisation, capacités, éléments, applications, zones)
- [ ] Frontend : composants d'affichage SVG (lecture seule)

### Semaine 6

- [ ] Jeu de données complet K&B Groupe SARL
- [ ] Démo bout en bout
- [ ] Documentation utilisateur / README

---

## 15. Résumé exécutif

ArchiVision est un projet de stage bien **cadré documentairement** (référentiel, stack, conventions) et **avancé sur les fondations data** (schéma Prisma complet, migration, seed de démonstration). Le premier module backend (`OrganisationModule`) est **fonctionnel, testé et compilé**.

Cependant, une **part significative du backend est écrite mais non intégrée** : les modules Auth, Archimate, Urbanisation et Health existent en code source mais sont exclus de la compilation et non branchés dans l'application. Des **artefacts legacy** d'une architecture multi-tenant antérieure subsistent (schéma Prisma racine, guards tenant, extension de scoping).

Le **frontend est au stade squelette** (conformément au plan : ne pas commencer avant qu'un module backend soit validé). Les **vues SVG**, cœur fonctionnel de la démo, ne sont pas encore implémentées.

**Priorité absolue :** finaliser l'intégration backend (brancher les modules, unifier Prisma, nettoyer le legacy, initialiser Git) avant de poursuivre vers les vues SVG et le frontend.

---

*Rapport généré automatiquement à partir de l'analyse du code source, de la documentation et des tests exécutés le 27/07/2026.*
