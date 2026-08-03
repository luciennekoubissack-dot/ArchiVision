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

### Urbanisation (`/applications`, `/zones-urbanisation`)

- Applications du portefeuille (criticité HAUTE/MOYENNE/BASSE)
- Zones d'urbanisation hiérarchiques (ZONE > QUARTIER > ÎLOT)
- Affectation/désaffectation d'une application à une zone

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

## Base de données

Le schéma Prisma est défini dans `apps/api/prisma/schema.prisma`. Modèles : `User`, `Organisation`, `CapaciteMetier`, `ElementArchimate`, `RelationArchimate`, `Application`, `ZoneUrbanisation`, `ApplicationZone`.

### Seed

```bash
npm run prisma:seed
```

Initialise un utilisateur admin (`admin@archivision.local` / `Admin123!`).

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
