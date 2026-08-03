# Référentiel ArchiVision — schéma de référence

## Principe

Le référentiel est la source unique de vérité de l'application. Chaque objet
(une organisation, une capacité, un élément ArchiMate, une application, une
zone) **n'existe qu'une seule fois** en base et est référencé par son `id`
partout où il est utilisé. Les vues (diagramme ArchiMate, POS d'urbanisation)
ne sont jamais stockées : elles sont **générées à la demande** à partir de ces
objets.

Ne pas dupliquer une information dans deux tables différentes. En cas de
doute sur où placer un champ, il appartient à l'entité la plus proche du
métier qu'il décrit, pas à la vue qui l'affichera.

## Entités du périmètre v1 (MVP, semaines 1 à 5)

### Organisation
Représente l'entreprise modélisée (ex. K&B Groupe SARL).
- `id`
- `nom`
- `description`

### CapaciteMetier
Ce que l'organisation sait faire (ex. "Gestion des formations").
- `id`
- `nom`
- `description`
- `organisationId` → Organisation

### ElementArchimate
Un élément de la couche Métier ArchiMate. Le type est **limité à 5 valeurs**
en v1, volontairement — pas les 56 types de la spécification complète.
- `id`
- `nom`
- `type` → enum : `ACTEUR_METIER` | `ROLE_METIER` | `PROCESSUS_METIER` |
  `SERVICE_METIER` | `OBJET_METIER`
- `description`
- `capaciteMetierId` → CapaciteMetier (optionnel, un élément peut ne pas être
  rattaché à une capacité précise)
- `organisationId` → Organisation

### RelationArchimate
Un lien entre deux éléments ArchiMate. Le type est **limité à 4 valeurs** en
v1.
- `id`
- `type` → enum : `ASSIGNATION` | `COMPOSITION` | `REALISATION` |
  `ASSOCIATION`
- `sourceId` → ElementArchimate
- `targetId` → ElementArchimate

### Application
Une application du portefeuille applicatif de l'organisation.
- `id`
- `nom`
- `description`
- `criticite` → enum : `HAUTE` | `MOYENNE` | `BASSE`
- `organisationId` → Organisation

### ZoneUrbanisation
Un nœud de la hiérarchie Zone > Quartier > Îlot. Auto-référencée.
- `id`
- `nom`
- `type` → enum : `ZONE` | `QUARTIER` | `ILOT`
- `parentId` → ZoneUrbanisation (nullable — null pour une Zone racine)
- `organisationId` → Organisation

### ApplicationZone (table de jointure)
Affectation d'une application à un îlot du POS.
- `applicationId` → Application
- `zoneId` → ZoneUrbanisation

## Schéma relationnel simplifié

```
Organisation 1───* CapaciteMetier 1───* ElementArchimate *───* RelationArchimate
     │                                        │
     │                                        └─ type ∈ {Acteur, Rôle, Processus, Service, Objet}
     │
     ├───* Application ──*───* ZoneUrbanisation (via ApplicationZone)
     │
     └───* ZoneUrbanisation (auto-référencée : Zone > Quartier > Îlot)
```

## Hors périmètre v1 (roadmap V1.1 / V2.0)

Ne pas générer ces entités tant que le socle ci-dessus n'est pas validé et
démontré sur K&B Groupe SARL :
- Les 51 autres types ArchiMate (couches Application, Technologie, Stratégie,
  Implémentation) et les 8 autres types de relations.
- Processus BPMN (couloirs, activités, passerelles).
- Gouvernance stratégique (Vision, Objectifs, KPI, Parties prenantes).
- Référentiel documentaire, workflow de validation, historique des
  modifications.
- Multi-tenant, RBAC fin, SSO.

## Règle pour Kiro

Un prompt = une entité ou un module, jamais l'ensemble du schéma d'un coup.
Toujours relire le `schema.prisma` généré avant de lancer une migration.
