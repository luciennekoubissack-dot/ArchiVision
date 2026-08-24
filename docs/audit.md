# Audit ArchiVision — journal continu

Ce fichier est un journal vivant. Chaque entrée correspond à un passage
d'audit (sécurité, performance, ergonomie, qualité de code) réalisé à un
instant donné du projet. On n'efface jamais une entrée précédente : on
ajoute une nouvelle entrée datée, en notant ce qui a été corrigé depuis la
dernière fois et ce qui reste ou apparaît.

Légende de sévérité : 🔴 bloquant avant prod · 🟠 important · 🟡 à planifier · ⚪ non vérifié / hors périmètre code.

---

## 2026-08-18 — Audit initial

Stack observée : NestJS 11 + Prisma 7 + PostgreSQL côté API
(`apps/api`), Angular 17 côté front (`apps/web`), libs partagées
(`libs/shared`, `libs/infrastructure`), Docker Compose pour le dev.

### Points forts constatés

- Comparaison en temps constant au login pour éviter le timing attack sur
  l'énumération d'emails — [auth.service.ts:20](../apps/api/src/modules/auth/auth.service.ts#L20).
- Isolation multi-tenant cohérente : chaque service filtre systématiquement
  par `organisationId` (ex. [objectif.service.ts](../apps/api/src/modules/objectif/objectif.service.ts)).
- `SuperAdminGuard` empêche explicitement les fuites cross-tenant entre
  `SUPERADMIN` et les routes tenant — [superadmin.guard.ts](../libs/shared/src/guards/superadmin.guard.ts).
- RBAC (`@Roles()` + `RolesGuard`) posé sur la quasi-totalité des
  contrôleurs métier, pas seulement l'admin.
- `ValidationPipe` strict (`whitelist`, `forbidNonWhitelisted`, `transform`)
  et filtre d'exceptions global qui ne laisse fuiter aucune stack trace ni
  message Prisma brut — [http-exception.filter.ts](../apps/api/src/filters/http-exception.filter.ts).
- `.env` correctement ignoré par git, aucun secret commité.

### 🔴 Sécurité — à corriger avant mise en production

1. **Upload public non authentifié** — [uploads.controller.ts:9](../apps/api/src/modules/uploads/uploads.controller.ts#L9)
   (`@Post('logo') @Public()`). Aucune auth, aucun rate-limit, et le SVG est
   accepté ([uploads.config.ts:14](../apps/api/src/modules/uploads/uploads.config.ts#L14)) alors qu'il peut embarquer du
   JS exécutable si le fichier est ouvert directement. Risque : DoS par
   saturation disque + XSS stocké potentiel.
   → Retirer `@Public()`, exiger le JWT, sortir `svg` de la whitelist ou le
   sanitiser (ex. DOMPurify côté serveur).

2. **Secret JWT avec fallback en dur** — présent à deux endroits :
   [jwt.strategy.ts:14](../apps/api/src/modules/auth/jwt.strategy.ts#L14) et
   [auth.module.ts:18](../apps/api/src/modules/auth/auth.module.ts#L18)
   (`config.get('JWT_SECRET') ?? 'secretKey'`). Si la variable d'env est
   absente en prod, l'API démarre avec un secret public connu de quiconque
   lit le repo → falsification de token possible, y compris SUPERADMIN.
   → Faire échouer le démarrage si `JWT_SECRET` est absent, jamais de
   valeur par défaut pour un secret cryptographique.

3. **Aucun rate-limiting** sur `/auth/login`, `/auth/register`,
   `/uploads/logo`. Pas de `@nestjs/throttler` dans les dépendances.
   → L'ajouter, quelques lignes suffisent.

4. **Token JWT en `localStorage`** — [auth.service.ts:148](../apps/web/src/app/auth.service.ts#L148).
   Volable par tout XSS. Les usages actuels d'`[innerHTML]` sont limités à
   une table statique d'icônes SVG (pas de donnée utilisateur — vérifié
   dans [app-shell.component.ts:438](../apps/web/src/app/app-shell.component.ts#L438)), donc risque faible
   aujourd'hui, mais architecture fragile si un futur écran affiche du
   contenu utilisateur en HTML brut.
   → À terme, migrer vers cookie `httpOnly` + `SameSite=Strict` + CSRF
   (changement lourd, à planifier, pas urgent).

5. **Secrets par défaut dans `docker-compose.yml`** (`postgres/postgres`,
   `JWT_SECRET:-changeme-in-production`). Acceptable en dev, dangereux si
   déployé tel quel.

### 🟠 Performance

1. **Pas de lazy-loading Angular** — [app.routes.ts](../apps/web/src/app/app.routes.ts) importe tous les
   composants statiquement (dashboard, canevas, BPMN, urbanisation,
   roadmap...), y compris les librairies lourdes `chart.js` et `konva`.
   Signe révélateur : le budget de bundle a déjà été relevé à 900 kB
   warning / 1.3 MB erreur dans [angular.json:39-44](../apps/web/angular.json#L39-L44) (défaut Angular CLI :
   500 kB / 1 MB).
   → Passer les routes lourdes en `loadComponent`.

2. **Pas de compression HTTP** côté API (`main.ts` n'utilise pas
   `compression()`).

3. **Listes non paginées** — tous les `findMany` des services renvoient
   l'intégralité de la table filtrée par organisation, sans `skip`/`take`.
   Pas critique aujourd'hui vu le volume de données, deviendra un problème
   à l'échelle.

### 🟡 Ergonomie du code / maintenabilité

1. `apps/web/src/app` est un dossier plat avec ~55 fichiers (composants,
   services, guards, interceptors mélangés), contrairement au backend qui
   est bien organisé en modules par feature.
2. Angular 17, trois majeures derrière la dernière stable (Angular 20).
   Pas urgent mais à budgétiser avant que l'écart ne se creuse.

### ⚪ UX utilisateur — non vérifié

Jugement basé sur le code uniquement, pas sur un parcours réel dans le
navigateur (pas encore testé : inscription, wizard, canevas BPMN/ArchiMate,
responsive, accessibilité). À faire lors d'un prochain passage.

### Plan d'action priorisé (état au 2026-08-18)

| Priorité | Action | Statut |
|---|---|---|
| 🔴 | Retirer `@Public()` de `/uploads/logo`, sortir/sanitiser le SVG | à faire |
| 🔴 | Supprimer le fallback `'secretKey'`, échec au boot si absent | à faire |
| 🔴 | `@nestjs/throttler` sur `/auth/*` et `/uploads/*` | à faire |
| 🟠 | `app.use(compression())` | à faire |
| 🟠 | Lazy-load des routes lourdes (canevas, bpmn, urbanisation) | à faire |
| 🟡 | Réorganiser `apps/web/src/app` en dossiers par feature | à faire |
| 🟡 | Migrer le token vers cookie `httpOnly` + CSRF | à faire |
| 🟡 | Pagination des `findMany` | à faire |

---

## 2026-08-21 — Refonte de l'IA produit (10 modules ADM) + module Opportunités & Solutions

Deux chantiers livrés dans la même session : le module "Opportunités &
Solutions" (phase E de l'ADM, entièrement nouveau — `Solution`,
`CritereEvaluation`, `EvaluationScore`), puis une restructuration complète
de la navigation pour refléter le cycle ADM TOGAF A→H : renommage de
"Stratégie de l'organisation" → "Prelim / Préparation de l'organisation"
et "Procédure" → "Vision" (avec ajout d'exigences fonctionnelles/non
fonctionnelles, diagramme de vision filtré, import/export Excel),
enrichissement d'Architecture Métier (3 onglets : BPMN, ArchiMate,
structure organisationnelle) et d'Architecture Technologique (nouveau
canevas Konva de diagramme de déploiement), renommage d'Architecture
Système et Migration Planning, et création de 3 modules entièrement
nouveaux : Mise en œuvre, Gouvernance (politiques, matrice de conformité,
gestion des changements, rapport), Évaluation et amélioration continue
(import Excel/CSV d'enquêtes, rapport avec graphique Chart.js).

### Points forts constatés

- **Réutilisation disciplinée** : chaque nouvel écran a été construit en
  copiant un pattern déjà validé dans le repo (CRUD façon
  `objectifs.component.ts`, matrice façon la propre matrice
  d'évaluation d'Opportunités, vue SVG façon `vues.component.ts`,
  canevas Konva façon `applications-canevas.component.ts`) plutôt que
  d'inventer de nouvelles conventions — la base de code reste homogène
  malgré l'ampleur du changement.
- **Tests systématiques maintenus** : les 2 nouveaux modules backend
  (Gouvernance, Évaluation) ont chacun leur couverture `.spec.ts`
  complète (service + contrôleur HTTP, y compris les cas 403
  cross-role) ; suite passée de 231 à 266 tests, aucune régression.
- **Vérification de bout en bout réelle** : au-delà du build/tests
  automatisés, chaque flux a été rejoué dans le navigateur (créer une
  solution → la marquer Retenue → vérifier qu'elle apparaît dans Mise
  en œuvre ; créer une politique → noter une conformité → vérifier le
  comptage dans le Rapport ; importer un CSV d'enquête). Cette
  vérification a payé : voir bugs ci-dessous, invisibles aux tests
  unitaires seuls.

### 🔴 Bugs réels trouvés et corrigés pendant cette session

1. **`Solution.create()`/`update()` sans `include: { scores: true }`** —
   [solution.service.ts](../apps/api/src/modules/opportunites/solution.service.ts).
   Une solution fraîchement créée ou éditée revenait sans son tableau
   `scores`, faisant planter `noteMoyenne()`/`initMatrixRow()` côté
   frontend (`Cannot read properties of undefined`). Le popover de
   création restait bloqué sur "Création…" sans jamais se fermer.
   Trouvé uniquement en testant la création réelle dans le navigateur —
   les tests unitaires mockaient la réponse Prisma donc ne l'auraient
   jamais révélé.
2. **`excel.util.ts` corrompait les accents à l'import** —
   `readAsBinaryString` + `XLSX.read(..., {type:'binary'})` mésinterprète
   l'UTF-8 des CSV, transformant "Répondant"/"Catégorie" en
   "RÃ©pondant"/"CatÃ©gorie" → aucune ligne ne matchait jamais les
   en-têtes attendus, échec silencieux de tout import sur une
   application **entièrement en français**. Corrigé en lisant les CSV
   via `readAsText` (UTF-8 natif) et les `.xlsx`/`.xls` via
   `readAsArrayBuffer` + `{type:'array'}`. Ce bug touchait les 3 écrans
   d'import (Vision, Prelim implicitement via export, Évaluation) — un
   seul correctif dans l'utilitaire partagé a suffi.

**Enseignement** : les deux bugs étaient invisibles en lecture de code et
en tests unitaires (mocks Prisma, pas de vrai fichier CSV) — seule
l'exécution réelle dans le navigateur, avec de vraies données
accentuées, les a révélés. À reproduire systématiquement pour tout
futur écran d'import/export.

### 🟡 Simplifications assumées (à surveiller)

- **Architecture Métier** n'a pas de lien 1-à-1 processus↔éléments
  ArchiMate en base (absent du schéma) — le module montre les 3
  livrables (BPMN, ArchiMate, organigramme) côte à côte plutôt que
  filtrés par processus sélectionné. Extension possible mais non faite
  ici (chantier séparé, nécessiterait une nouvelle relation).
- **Diagramme de déploiement** ne rend pas les Applications comme
  boîtes déplaçables indépendantes : `Application.positionX/Y` est déjà
  utilisé par le diagramme de composants (Architecture Système) — les
  réutiliser aurait fait interférer les deux diagrammes. Les
  applications déployées sont listées à l'intérieur de la boîte
  `TechComponent` (comme les services dans les boîtes du diagramme de
  composants), seul `TechComponent.positionX/Y` est déplaçable/persisté.
- **Gouvernance "suivi de conformité"** est scopé aux `Solution`
  uniquement (pas aux projets/éléments ArchiMate) — décision prise pour
  rester cohérent avec le flux Opportunités → Mise en œuvre →
  Gouvernance déjà en place, à réévaluer si le besoin s'étend.

### Plan d'action priorisé (mise à jour au 2026-08-21)

Aucun des points 🔴/🟠/🟡 de l'entrée du 2026-08-18 n'a été traité dans
cette session (hors périmètre — c'était une session de fonctionnalités,
pas de durcissement sécurité/perf). Ils restent valables tels quels.
S'y ajoute, du fait de la croissance rapide du produit :

| Priorité | Action | Statut |
|---|---|---|
| 🟡 | Bundle dev passé de ~898 kB à 3.78 MB depuis le premier audit (ajout de 6 modules, 3 canevas Konva, Chart.js déjà compté) — le lazy-loading des routes (déjà recommandé le 2026-08-18) devient plus urgent à mesure que l'app grossit | à faire |
| 🟡 | Lien processus↔éléments ArchiMate pour un vrai filtrage par processus dans Architecture Métier, si le besoin se confirme | à évaluer |

## 2026-08-24 — Génération de diagrammes BPMN à partir des processus Vision + extension du vocabulaire BPMN

### Ce qui a été fait

- **Génération automatique de diagrammes BPMN** : Architecture Métier
  affiche désormais, pour chaque processus défini dans Vision (toutes
  catégories confondues), un diagramme BPMN généré côté serveur
  (nouveau `BpmnViewService`, même pattern SVG-brut sans librairie
  cliente que `ArchimateViewService`) plutôt que de dupliquer la saisie.
  Positionnement : position enregistrée par l'éditeur Konva si elle
  existe, sinon repli en cascade gauche→droite avec passage à la ligne
  au-delà de 1000px de large — un processus de plusieurs dizaines
  d'étapes reste lisible sans étalement infini.
- **Extension du vocabulaire BPMN** (`TypeBpmn` : 6 → 9 valeurs +
  `PASSERELLE_INCLUSIVE`, `PASSERELLE_EVENEMENTIELLE`,
  `SOUS_PROCESSUS` ; + 2 classificateurs optionnels
  `DeclencheurEvenement` sur les événements et `TypeTache` sur les
  tâches). Choix architectural : plutôt que d'exploser `TypeBpmn` en
  dizaines de valeurs combinées (`EVENEMENT_FIN_MESSAGE`,
  `EVENEMENT_FIN_ERREUR`...), reprise du pattern déjà validé pour
  `categorieExigence` sur `ElementArchimate` — un type de base inchangé
  + un classificateur optionnel qui pilote uniquement l'icône. Recherche
  BPMN 2.0 menée avant implémentation pour s'assurer que le découpage
  (7 déclencheurs, 7 natures de tâche, 4 passerelles) correspond à la
  norme réelle plutôt qu'à une extrapolation ad hoc.
- **Trois surfaces tenues synchronisées** pour le même vocabulaire :
  génération SVG serveur ([bpmn-view.service.ts](../apps/api/src/modules/bpmn/bpmn-view.service.ts)),
  éditeur interactif Konva ([bpmn-canevas.component.ts](../apps/web/src/app/bpmn-canevas.component.ts)),
  et DTOs de validation. Les glyphes (enveloppe, horloge, éclair,
  triangle, personnage, engrenage, etc.) sont dessinés deux fois — une
  fois en chaînes SVG côté serveur, une fois en formes Konva côté
  client — avec les mêmes coordonnées et couleurs, pour que ce que
  l'utilisateur dessine dans l'éditeur ressemble exactement au diagramme
  généré.
- **Processus de démonstration reconstruit** ("Démonstration —
  vocabulaire BPMN complet", 22 éléments, 23 flux) pour couvrir la
  totalité du vocabulaire : les 9 types, les 7 déclencheurs, les 7
  natures de tâche — vérifié à la fois via `bpmn-view.service.spec.ts`
  (7 tests dédiés) et en rejouant la génération + la création manuelle
  d'éléments dans le navigateur.

### Point de vigilance

- Cette extension **duplique intentionnellement** la logique de dessin
  d'icônes entre backend (chaînes SVG) et frontend (formes Konva) faute
  de langage de description partagé entre les deux runtimes — tout
  nouveau déclencheur/nature de tâche futur nécessitera de modifier les
  deux fichiers en parallèle, avec le risque de désynchronisation
  visuelle si l'un des deux est oublié. Pas de correctif proposé ici
  (changer d'approche, ex. un descripteur de glyphe unique interprété
  différemment par les deux moteurs de rendu, serait un chantier séparé
  et non justifié pour l'ampleur actuelle du vocabulaire).

## 2026-08-24 (suite) — Édition des processus, correctif de mise en page, identité visuelle globale, refonte de la notation ArchiMate

### 🔴 Bug réel trouvé et corrigé : cartes de processus qui débordent

- **`bpmn.component.ts`** (liste des processus, module Vision) :
  `.list` utilisait `display: grid` sans `grid-template-columns` — la
  colonne implicite se dimensionnait alors sur le contenu le plus large
  plutôt que sur la largeur de la carte. Une description de processus
  un peu longue (`white-space: nowrap` pour l'ellipse) suffisait à
  forcer une ligne à ~1495px de large *à l'intérieur* d'une carte de
  481px, faisant sortir le bouton « Supprimer » très à droite, hors de
  sa carte. Repéré visuellement par l'utilisateur, confirmé en mesurant
  les rects DOM réels dans le navigateur. Corrigé par
  `grid-template-columns: minmax(0, 1fr)` sur `.list` + `min-width: 0`
  sur `.list-item` — classique "flexbox/grid overflow" quand un
  descendant en `nowrap` n'a pas de contrainte de largeur explicite en
  amont.
- **Bug latent découvert en même temps** : les `<select>` natifs liés
  via `[value]="expr"` sur l'élément `<select>` lui-même (plutôt que
  `[selected]` sur chaque `<option>` généré par `*ngFor`) affichaient
  systématiquement la première option au lieu de la valeur réellement
  liée — un travers connu d'Angular quand le binding de valeur du
  `<select>` s'applique avant que ses `<option>` enfants existent dans
  le DOM. Corrigé dans `bpmn.component.ts` (2 select) et
  `bpmn-canevas.component.ts` (6 select, ajoutés dans la session
  précédente). Le même motif existe encore dans 8 autres fichiers
  (`architecture-metier`, `gouvernance`, `technologie`, `donnees`,
  `canevas`, `urbanisation`, `roadmap`, `register`) — non corrigés ici
  (hors périmètre de cette session), signalé comme tâche de fond.

### Fonctionnalité ajoutée : consultation/édition des processus

- Bouton « Modifier » (icône crayon) sur chaque carte de processus et
  dans le panneau de détail, ouvrant une bulle pré-remplie
  (nom/description/catégorie) qui appelle `bpmnService.update()`
  (l'endpoint existait déjà côté API, seule l'IHM manquait). Le panneau
  de détail affiche désormais aussi la catégorie et la description
  complètes, pas seulement le nom.

### Identité visuelle globale

- Police changée pour **Times New Roman** (`body { font-family }`) sur
  toute l'application, import Google Fonts « Manrope » retiré de
  `index.html` (plus utilisé).
- Taille de base réduite via `html { font-size }` (16px navigateur →
  valeur réduite) : comme la quasi-totalité des paddings/gaps/tailles
  de police des composants sont exprimés en `rem`, ce seul levier
  rétrécit l'ensemble des composants de façon homogène sans retoucher
  chaque fichier — au prix de ne pas réduire les rares tailles fixées
  en `px` (rayons de bordure, largeurs de panneaux type `.palette`).

### Refonte de la notation des diagrammes ArchiMate

- `archimate-view.service.ts` (génération SVG serveur du diagramme
  Motivation + Métier) revu pour se rapprocher de la notation Archi
  officielle illustrée par `archimate-template.png` :
  pictogramme distinctif **en haut à droite** de chaque boîte (position
  standard, le générateur le plaçait auparavant en haut à gauche) pour
  les 9 types (acteur = silhouette, rôle = pilule sur tige, processus =
  chevron, service = flèche arrondie, objet métier = icône « classe »
  à bandeau, exigence = flèche en pointillés dans le coin coupé, but =
  cible, principe = fanion, vision = œil) ; étiquette de type textuelle
  supprimée au profit du seul nom de l'élément, réparti sur 2 lignes
  maximum (repris du motif `wrap()` déjà utilisé pour BPMN) pour
  matcher le rendu du gabarit de référence ; couleurs de couche
  affinées (violet motivation, jaune métier) pour rester lisibles sans
  glisser vers un lavande presque blanc ; relation d'assignation
  complétée d'un petit disque plein à la source (notation officielle),
  en plus de la flèche déjà correcte à la cible.
- Portée volontairement limitée aux 9 types Motivation/Métier déjà
  modélisés (`TypeElement` du schéma) — les couches Application et
  Technologie ont leurs propres générateurs dédiés
  (`applications-canevas`, `technologie` : diagrammes de composants et
  de déploiement), non touchés ici.
- Vérifié : `archimate-view.service.spec.ts` (5 tests, dont 2 mis à
  jour pour le nouveau wrap sur 2 lignes) + suite complète (278/278) ;
  diagramme régénéré et inspecté dans le navigateur (couleurs, formes,
  pictogrammes, retour à la ligne des noms longs) sur les données
  existantes de l'organisation de démonstration.
