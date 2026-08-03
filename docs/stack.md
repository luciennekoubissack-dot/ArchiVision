# Stack technique ArchiVision — v1 (périmètre solo, 6 semaines)

Cette stack est **figée** pour la durée du stage (23 juillet–4 septembre
2026). Ne pas en dévier sans repasser par le backlog. Si Kiro propose une
bibliothèque non listée ici, considérer cela comme un signal d'alerte, pas
une suggestion à accepter par défaut.

## Frontend

- **Angular 17+**, TypeScript strict.
- Formulaires de saisie structurée pour alimenter le référentiel.
- **Pas d'éditeur graphique interactif** (pas de MaxGraph, pas de JointJS,
  pas de glisser-déposer). Les vues ArchiMate et le POS sont du **SVG généré**
  à partir des données, affiché en lecture seule dans un composant Angular.
- Pas de NgRx en v1 — l'état reste simple (services Angular + signals ou
  RxJS basique). Réintroduire NgRx seulement si la complexité d'état le
  justifie réellement.

## Backend

- **NestJS 10**, Node.js 20 LTS, TypeScript.
- **Une seule application** : `apps/api`. Pas de `apps/realtime`, pas de
  `apps/worker` en v1 — ces découpages répondaient à un besoin de
  collaboration temps réel (Yjs/CRDT) qui est hors périmètre v1.
- Modules NestJS découplés par domaine : `OrganisationModule`,
  `ArchimateModule`, `UrbanisationModule` (voir `conventions.md`).
- Génération des vues SVG : service dédié côté backend
  (`ArchimateViewService`, `UrbanisationViewService`), pas de librairie de
  rendu graphique tierce — du SVG construit directement à partir des
  coordonnées calculées et des données du référentiel.

## Persistance

- **PostgreSQL 15** comme base relationnelle unique.
- **Prisma** comme ORM (pas TypeORM).
- **Redis** : différé. Pas nécessaire tant qu'il n'y a ni session
  multi-utilisateur ni cache à gérer en v1. Ajouter seulement si un besoin
  concret apparaît (ex. sessions JWT si l'authentification se complexifie).

## Authentification

- Authentification simple : un utilisateur, une organisation, JWT basique.
- Pas de SSO, pas de RBAC multi-rôles, pas de multi-tenant en v1.

## Infrastructure

- **Docker + Docker Compose** : deux services au minimum
  (`postgres`, `api`), `web` optionnel en conteneur ou lancé en local via
  `ng serve` pendant le développement.
- Déploiement cible v1 : démonstration locale ou sur un environnement de
  démo simple. Pas de Kubernetes en v1 (le cluster K8s existant reste
  disponible pour la roadmap V2.0, ne pas le complexifier maintenant).

## Outils

- **Git / GitHub** pour le versionnement.
- **Jest** pour les tests (préconfiguré avec NestJS).
- **npm** comme gestionnaire de paquets — vérifier systématiquement toute
  dépendance proposée par Kiro avec `npm view <paquet> versions --json`
  avant de l'installer.

## Explicitement exclu du périmètre v1

| Techno / besoin | Raison |
|---|---|
| MaxGraph / JointJS | Éditeur graphique remplacé par génération de vues SVG |
| Yjs / CRDT / apps/realtime | Collaboration temps réel hors périmètre solo |
| NgRx | Complexité d'état non justifiée en v1 |
| Redis | Pas de besoin concret identifié en v1 |
| Kubernetes | Déploiement démo suffit en v1 |
| SSO / RBAC fin / multi-tenant | Un seul utilisateur en v1 |
