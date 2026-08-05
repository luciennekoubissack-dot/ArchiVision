# ArchiVision — Vision produit fusionnée

> **Statut :** version fusionnée (2026-08-03) du document de vision initial
> (ambitieux, ci-dessous historiquement appelé "EAMP complet") et du Cahier
> des Charges Technique officiel du stage. Les arbitrages ont été validés
> avec le porteur du projet. Ce document est la **référence produit actuelle**
> — `docs/stack.md`, `docs/referentiel.md` et `docs/conventions.md` restent
> les références **techniques** figées, à mettre à jour en cohérence avec
> les décisions ci-dessous plutôt que d'être contredites par elles.
>
> Ce qui a changé par rapport à la version précédente de ce document : le
> multi-tenant, les rôles utilisateurs, les services d'entreprise et les
> objectifs stratégiques sont **entrés** dans le périmètre réel. Le BPMN,
> l'éditeur graphique interactif, NgRx, la collaboration temps réel (Yjs)
> et la collaboration inter-entreprises restent **hors périmètre**.

---

## 1. Vision du produit

ArchiVision est une plateforme **multi-organisations** de modélisation
d'architecture d'entreprise. Chaque organisation cliente y documente sa
propre architecture (stratégie, métier, applicatif) selon les principes
TOGAF/ArchiMate, dans un référentiel structuré et isolé des autres
organisations.

**Principe fondateur, non négociable :** le référentiel est la source
unique de vérité. Les vues (diagramme ArchiMate, organigramme, Plan
d'Occupation des Sols) ne sont **jamais dessinées à la main** — elles sont
**générées automatiquement** à partir des données saisies via des
formulaires structurés. L'objectif du produit n'est pas de fournir un
outil de dessin, mais de permettre à une organisation de **comprendre**
son architecture et à ses membres de **collaborer en interne** dessus
(dirigeant, architecte, représentant, collaborateur).

L'application couvre le suivi **As-Is** (état actuel documenté dans le
référentiel) — le **To-Be** (cible) et l'analyse d'écarts formalisée sont
une piste d'enrichissement documentée en section 8, pas un engagement v1.

---

## 2. Parcours utilisateur

### Inscription et création d'organisation

1. Un visiteur s'inscrit : email, mot de passe, nom.
2. Dans la foulée, il crée son organisation : nom, description, secteur,
   taille, pays, logo — c'est le premier objet du référentiel.
3. Il devient automatiquement le premier utilisateur de cette
   organisation, avec un rôle qui lui donne les pleins pouvoirs (Architecte
   ou Dirigeant — voir section 3).
4. Il peut ensuite créer des comptes pour ses collègues (représentants,
   collaborateurs, autres architectes) rattachés à la même organisation.

Il n'y a pas de notion de "Super Administrateur multi-tenant SaaS" en v1 :
chaque organisation gère ses propres membres, aucun rôle transverse
n'administre plusieurs organisations à la fois.

### Utilisation courante

1. Structurer l'organisation : services/départements (hiérarchie), membres
   rattachés à chaque service.
2. Documenter la stratégie : objectifs de l'organisation.
3. Documenter le métier : capacités métier, éléments ArchiMate (acteurs,
   rôles, processus, services métier, objets métier), relations entre eux.
4. Documenter le patrimoine applicatif : applications/produits, criticité.
5. Documenter l'urbanisation : zones, quartiers, îlots, affectation des
   applications aux îlots.
6. Consulter les vues générées : organigramme, vue ArchiMate, POS —
   jamais éditées à la main, toujours régénérées depuis le référentiel à
   jour.
7. Exporter (JSON du référentiel, SVG/PNG des vues) pour partage ou
   archivage.

---

## 3. Profils utilisateurs (rôles v1)

| Rôle | Description | Droits |
|---|---|---|
| **Architecte** | Pilote la démarche, modélise le référentiel | Lecture/écriture complète sur le référentiel de son organisation, gestion des membres |
| **Dirigeant** | Consulte la vision d'ensemble, valide les orientations | Lecture complète, écriture sur Stratégie/Objectifs, consultation des vues et tableaux de bord |
| **Représentant** | Porte-parole d'un service, contribue aux données de son périmètre | Lecture/écriture limitée à son service et aux objets qu'il a créés |
| **Collaborateur** | Contribue ponctuellement, consulte | Lecture sur son organisation, écriture limitée (ex. mise à jour de fiches qui le concernent) |

Hors périmètre v1, documentés comme piste (section 8) : matrice de
permissions fine par module, workflow de validation/approbation,
collaboration inter-organisations.

---

## 4. Modèle de données

### 4.1 Cœur (Organisation & Utilisateurs)

| Table | Champs clés | Relations |
|---|---|---|
| `Organisation` | id, nom, description, secteur, taille, pays, logoUrl | 1-N vers tout le référentiel |
| `User` | id, organisationId, email, passwordHash, nom, role (ARCHITECTE / DIRIGEANT / REPRESENTANT / COLLABORATEUR), serviceId (optionnel) | N-1 vers Organisation, N-1 vers Service |
| `Service` | id, organisationId, nom, description, parentId (auto-référencé) | hiérarchie Direction > Département > Service, membres = `User[]` |

### 4.2 Stratégie (allégé par rapport à la vision initiale)

| Table | Champs clés |
|---|---|
| `Objectif` | id, organisationId, nom, description |

Volontairement **pas** de tables séparées `drivers`/`goals`/`principles`/
`stakeholders` — un `Objectif` simple suffit au périmètre v1. L'arbre
complet motivation → stratégie reste une piste d'enrichissement (section 8).

### 4.3 Architecture métier (déjà en place, inchangé)

`CapaciteMetier`, `ElementArchimate` (5 types dont `SERVICE_METIER` — les
"services métier" au sens ArchiMate, à ne pas confondre avec l'entité
`Service` de la section 4.1 qui représente un département/service
**organisationnel**), `RelationArchimate` (4 types). Voir `docs/referentiel.md`.

### 4.4 Urbanisation (déjà en place, inchangé)

`Application`, `ZoneUrbanisation` (hiérarchie Zone > Quartier > Îlot),
`ApplicationZone`. Voir `docs/referentiel.md`.

---

## 5. Modules fonctionnels (sidebar)

1. **Tableau de bord** — KPIs réels de l'organisation courante (nombre
   d'éléments, d'applications, de zones, de membres ; activité récente),
   avec des graphiques (voir section 6).
2. **Organisation** — informations générales, membres et rôles, services
   (CRUD hiérarchique), organigramme (vue générée).
3. **Stratégie** — objectifs de l'organisation.
4. **Architecture métier** — capacités, éléments ArchiMate, relations.
5. **Portefeuille applicatif** — applications/produits (CRUD).
6. **Urbanisation** — zones, POS, affectations.
7. **Vues générées** — vue ArchiMate, organigramme, POS, avec export
   SVG/PNG.
8. **Paramètres** — profil utilisateur, sécurité.

Explicitement **hors** de cette liste : module BPMN, éditeur de canevas
graphique, module Gouvernance/workflow de validation, module Gap
Analysis/Roadmap, module Rapports PDF/Word avancés, module Collaboration
temps réel.

---

## 6. Stack technique (confirmée, sans changement de cap)

Reprend intégralement `docs/stack.md` — aucune des libs de la version
initiale (NgRx, JointJS+/AntV X6/Konva, bpmn-js, Yjs, AG Grid, ngx-gantt,
workspace Nx) n'entre dans le périmètre v1. Seul ajout : une librairie de
graphiques pour le tableau de bord.

| Besoin | Choix | Justification |
|---|---|---|
| Graphiques (dashboard) | **Chart.js**, utilisé directement (sans wrapper `ng2-charts`) | Léger, mature, suffisant pour des KPIs (barres/donut/courbes). `ng2-charts` a été écarté après vérification : toutes ses versions récentes imposent `@angular/cdk` en peer dependency, une dépendance supplémentaire non justifiée pour un seul graphique — Chart.js s'utilise directement dans un composant standalone (`ViewChild` sur un `<canvas>` + `new Chart(...)`) sans ce détour. Alternative à ngx-charts (D3, plus lourd) ou ApexCharts, sans justification suffisante pour leur poids |
| Génération de vues | SVG construit côté backend (déjà implémenté) | Inchangé — voir `ArchimateViewService`, `UrbanisationViewService`, et le futur `ServiceViewService` (organigramme) |
| Export | JSON du référentiel (nouveau) + SVG/PNG des vues (déjà prévu) | Pas de format d'interopérabilité lourd (ArchiMate Exchange Format, BPMN XML) sans éditeur complet en face |

---

## 7. Sécurité multi-tenant — point d'attention critique

Le passage au multi-tenant change la donne sur un point précis : la plupart
des endpoints actuels (`GET /elements-archimate?organisationId=...`, etc.)
font confiance à un paramètre fourni par le client. C'est sans risque en
mono-tenant (une seule organisation existe), mais devient une **fuite de
données inter-organisations** dès que plusieurs organisations coexistent
dans la même base — n'importe quel utilisateur authentifié pourrait lire
les données d'une autre organisation en changeant ce paramètre.

**Exigence non négociable de l'implémentation :** l'`organisationId` de
l'utilisateur doit être porté par le JWT (résolu à la connexion), jamais
par un paramètre de requête modifiable côté client. Un guard doit l'imposer
sur chaque route qui touche au référentiel.

---

## 8. Pistes d'enrichissement (hors engagement v1, ordre indicatif)

- **Fil d'activité** : journal des créations/modifications (qui, quoi,
  quand) — apporte de la collaboration interne sans le poids du temps réel.
- **Recherche globale** dans le référentiel (éléments, applications, zones,
  services).
- **Comparateur As-Is/To-Be léger** : dupliquer un référentiel en
  "brouillon cible" et comparer deux instantanés côte à côte — version
  simplifiée du Gap Analysis de la vision initiale.
- **Tableau de bord différencié par rôle** : vue synthétique pour le
  Dirigeant, vue détaillée pour l'Architecte, vue "mes tâches" pour le
  Collaborateur.
- **Workflow de validation léger** : un Représentant propose une
  modification, un Architecte l'approuve — sans aller jusqu'au comité
  d'architecture de la vision initiale.
- **Notifications in-app** basiques (ex. "un membre a modifié votre
  service").

---

## 9. Design

- Charte graphique : **bleu, blanc, noir**.
- Logo fourni (`apps/web/src/assets/logo.png`).
- Responsive obligatoire.
- Inspiration de maquettes fournies : sidebar sombre + cards pour le
  tableau de bord, écran de connexion en deux volets (image de marque à
  gauche, formulaire à droite).
