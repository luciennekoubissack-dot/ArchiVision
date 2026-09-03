# ArchiVision Backend

Backend NestJS pour ArchiVision, une plateforme de modélisation d'architecture d'entreprise conforme au référentiel Métier ArchiMate 3.2 (v1).

> Ce README décrit l'état **réel** du code. Pour la vision produit long terme (multi-tenant, temps réel, event-driven, Kubernetes...), voir la section [Roadmap / vision future](#roadmap--vision-future) et `ROADMAP.md`.

---

## Vue d'ensemble

Le v1 est volontairement restreint à un périmètre simple et solide :

- API REST monolithique (NestJS)
- PostgreSQL via Prisma
- Authentification JWT, mono-tenant (pas de multi-tenant en v1)
- Référentiel métier : Organisation, Capacités métier, couche Métier ArchiMate, Urbanisation (POS)

Structure du monorepo :

- `apps/api` : service NestJS unique (auth, organisation, ArchiMate, urbanisation, health)
- `apps/web` : frontend Angular 17 — squelette initial, pas encore d'écrans fonctionnels
- `libs/infrastructure` : accès aux données (Prisma)
- `libs/shared` : guards, décorateurs et filtres partagés

---

## Modules de `apps/api`

### Auth (`/auth`)

- `POST /auth/login` : connexion par email/mot de passe → `{ accessToken, user }`
- `GET /auth/me` : profil de l'utilisateur authentifié (nécessite `Authorization: Bearer <token>`)

### Organisations (`/organisations`)

CRUD complet (`POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).

### ArchiMate — couche Métier (`/capacites-metier`, `/elements-archimate`, `/relations-archimate`)

- Capacités métier : CRUD complet
- Éléments ArchiMate : CRUD complet, 5 types (`ACTEUR_METIER`, `ROLE_METIER`, `PROCESSUS_METIER`, `SERVICE_METIER`, `OBJET_METIER`)
- Relations ArchiMate : création, liste, suppression, 4 types (`ASSIGNATION`, `COMPOSITION`, `REALISATION`, `ASSOCIATION`)
- `GET /elements-archimate/generate-vue?organisationId=` : génère une vue ArchiMate de la couche Métier (SVG construit côté serveur, sans dépendance de rendu tierce) → `{ svg, elementCount, relationCount }`. Éléments disposés par type (une ligne par type), relations stylées selon leur sémantique (flèche pleine pour l'assignation, losange pour la composition, trait pointillé + triangle creux pour la réalisation, trait simple pour l'association).

### Urbanisation (`/applications`, `/zones-urbanisation`)

- Applications du portefeuille (criticité HAUTE/MOYENNE/BASSE)
- Zones d'urbanisation hiérarchiques (ZONE > QUARTIER > ÎLOT)
- Affectation/désaffectation d'une application à une zone
- `GET /zones-urbanisation/generate-vue?organisationId=` : génère le Plan d'Occupation des Sols (POS) en SVG — rectangles imbriqués Zone > Quartier > Îlot, applications affectées affichées en puces colorées par criticité → `{ svg, zoneCount, applicationCount }`.

### Health (`/health`)

Vérifie la connectivité à PostgreSQL.

---

## Architecture et design

### Sécurité

- JWT pour l'authentification (`JwtAuthGuard` global, `@Public()` pour les routes ouvertes)
- `class-validator` et `ValidationPipe` (whitelist + forbid non-whitelisted) pour valider toutes les entrées
- `HttpExceptionFilter` global pour un format d'erreur cohérent (ne laisse fuiter aucun détail interne sur les erreurs inattendues)
- `helmet` pour les en-têtes HTTP de sécurité

### Multi-tenant

**Non implémenté en v1.** Le référentiel actuel (`Organisation`, `CapaciteMetier`, `ElementArchimate`, `RelationArchimate`, `Application`, `ZoneUrbanisation`) n'a pas de `tenantId` — l'API sert une seule organisation logique par déploiement. Une v1 antérieure contenait un `TenantGuard`/`RolesGuard` non fonctionnels (dépendaient d'un package et de champs JWT inexistants) ; ce code mort a été retiré. Le multi-tenant réel est prévu en phase 4 de la roadmap.

---

## Installation

1. Copier le fichier de configuration :

```bash
cp .env.example .env
```

2. Installer les dépendances :

```bash
npm install
```

3. Générer le client Prisma :

```bash
npm run prisma:generate
```

4. Lancer l'API en développement :

```bash
npm run start:dev
```

---

## Procédure de lancement rapide

### Prérequis

- Node.js 22+
- npm
- Docker Desktop (pour la base de données PostgreSQL)

### 1. Préparer les variables d’environnement

```bash
cp .env.example .env
```

### 2. Installer les dépendances

```bash
npm install
cd apps/web
npm install
cd ../..
```

### 3. Démarrer la base de données

```bash
docker compose up -d postgres
```

### 4. Initialiser Prisma et la base

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Lancer l’API

```bash
npm run start:dev
```

L’API sera disponible sur http://localhost:3000.

### 6. Lancer le frontend

Dans un second terminal :

```bash
cd apps/web
npm start
```

Le frontend sera disponible sur http://localhost:4200.

### Alternative avec Docker

Pour démarrer uniquement la stack backend avec PostgreSQL :

```bash
docker compose up --build
```

Cette commande lance l’API et la base PostgreSQL, mais pas le frontend Angular.

---

## Base de données

Le schéma Prisma est défini dans `apps/api/prisma/schema.prisma`. Modèles : `User`, `Organisation`, `CapaciteMetier`, `ElementArchimate`, `RelationArchimate`, `Application`, `ZoneUrbanisation`, `ApplicationZone`.

### Seed

```bash
npm run prisma:seed
```

Initialise un utilisateur admin (`admin@archivision.local` / `Admin123!`).

Le seed crée également le compte plateforme `superadmin@archivision.local` avec
le mot de passe `SuperAdmin123!` pour accéder à l'administration des organisations.

### Régénérer le client Angular

Après une modification des contrôleurs ou DTO de l'API, démarrer l'API puis exécuter :

```bash
npm run generate:api-client
```

---

## Tests

```bash
npm test
```

Couverture actuelle : `auth`, `organisation`, `archimate`, `urbanisation` (unitaires + HTTP pour `auth` et `organisation`), `HttpExceptionFilter`.

---

## Exécution avec Docker

```bash
docker-compose up --build
```

Stack v1 : PostgreSQL + API uniquement (pas de Redis, pas de service temps réel, pas de worker).

---

## Comment utiliser

### Auth

`POST /auth/login`

```json
{
  "email": "admin@archivision.local",
  "password": "Admin123!"
}
```

Réponse :

```json
{
  "accessToken": "...",
  "user": { "id": "...", "email": "...", "nom": "..." }
}
```

### Appeler l'API sécurisée

```
Authorization: Bearer <token>
```

### Exemple de création d'organisation

`POST /organisations`

```json
{
  "nom": "K&B Groupe SARL",
  "description": "Organisation de test"
}
```

---

## Roadmap / vision future

Le détail complet est dans `ROADMAP.md`. Non implémenté aujourd'hui, envisagé pour plus tard :

- Multi-tenant réel avec Row-Level Security PostgreSQL
- `apps/realtime` (Socket.IO + Yjs) pour la collaboration temps réel
- `apps/worker` (BullMQ) pour les traitements asynchrones
- CQRS / event sourcing
- OAuth/OIDC
- Déploiement Kubernetes
- Observabilité (OpenTelemetry, Prometheus)

## Notes

Backend conçu comme une base modulaire simple à faire évoluer. La priorité v1 est un référentiel métier fiable et testé plutôt qu'une architecture distribuée prématurée.
