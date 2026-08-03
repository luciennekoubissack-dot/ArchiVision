# Conventions ArchiVision

## Structure du dépôt

```
archivision/
├── apps/
│   ├── api/                  # NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── organisation/
│   │       ├── archimate/
│   │       ├── urbanisation/
│   │       └── main.ts
│   └── web/                  # Angular
│       └── src/app/
│           ├── organisation/
│           ├── archimate/
│           └── urbanisation/
├── docker-compose.yml
└── docs/
    ├── referentiel.md
    ├── stack.md
    └── conventions.md
```

Ne pas créer `apps/realtime` ni `apps/worker` en v1 (voir `stack.md`).

## Convention des modules NestJS

Un module = un domaine du référentiel. Chaque module suit la même
structure interne :

```
src/archimate/
├── archimate.module.ts
├── archimate.controller.ts
├── archimate.service.ts
└── dto/
    ├── create-element.dto.ts
    └── update-element.dto.ts
```

Un seul module par prompt Kiro. Ne jamais demander "génère tous les
modules" en une fois — cela dilue le contrôle et augmente le risque de
dépendances inventées.

## Convention Prisma

- Modèles en **PascalCase** singulier (`ElementArchimate`, pas
  `elements_archimate` ni `ElementsArchimate`).
- Champs en **camelCase** (`organisationId`, pas `organisation_id`).
- Enums en **SCREAMING_SNAKE_CASE** pour les valeurs (`ACTEUR_METIER`).
- Une migration = un changement logique cohérent, nommée explicitement
  (`npx prisma migrate dev --name add_zone_urbanisation`), jamais
  `--name update` ou `--name fix`.

## Convention API REST

- Ressources au pluriel : `/organisations`, `/capacites-metier`,
  `/elements-archimate`, `/relations-archimate`, `/applications`,
  `/zones-urbanisation`.
- Verbes HTTP standards (GET, POST, PATCH, DELETE) — pas de verbes dans
  l'URL (`/elements-archimate/generate-vue` est acceptable pour une action
  qui ne correspond pas à un CRUD simple, mais reste l'exception, pas la
  règle).
- Réponses JSON avec les `id` des relations, jamais d'objets imbriqués
  dupliqués (respecter le principe « un objet, une seule source »).

## Convention Git

- Branches : `feature/organisation-crud`, `feature/vue-archimate`, etc.
- Commits : message court à l'impératif (`Ajoute le CRUD ElementArchimate`,
  pas `updates` ni `wip`).
- Un commit après chaque étape validée manuellement (voir boucle de
  validation ci-dessous) — ne pas laisser plusieurs modules non testés
  s'accumuler avant de committer.

## Boucle de validation obligatoire après chaque génération Kiro

1. Le code compile.
2. L'application démarre sans erreur.
3. Un test manuel rapide de l'endpoint ou du composant généré (curl,
   Postman, ou navigation dans l'interface).
4. Si le prompt touchait `package.json` : vérifier chaque nouvelle
   dépendance avec `npm view <paquet> versions --json` avant de continuer.
5. Commit.

Ne pas passer à l'étape suivante du backlog tant que cette boucle n'est pas
terminée sur l'étape en cours.

## Ordre de construction (rappel semaine 1)

1. `schema.prisma` complet du référentiel — relu et validé avant migration.
2. Migration Prisma.
3. `OrganisationModule` (CRUD simple, premier module pour valider le
   pipeline de bout en bout).
4. `ArchimateModule` (éléments puis relations).
5. `UrbanisationModule` (zones puis affectation d'applications).

Ne pas commencer le frontend avant qu'au moins un module backend complet
(`OrganisationModule`) soit fonctionnel et testé.
