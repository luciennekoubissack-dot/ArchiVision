# Audit ArchiVision : journal continu

Ce fichier est un journal vivant. Chaque entrée correspond à un passage
d'audit (sécurité, performance, ergonomie, qualité de code) réalisé à un
instant donné du projet. On n'efface jamais une entrée précédente : on
ajoute une nouvelle entrée datée, en notant ce qui a été corrigé depuis la
dernière fois et ce qui reste ou apparaît.

Légende de sévérité : 🔴 bloquant avant prod · 🟠 important · 🟡 à planifier · ⚪ non vérifié / hors périmètre code.

---

## 2026-08-18 : Audit initial

Stack observée : NestJS 11 + Prisma 7 + PostgreSQL côté API
(`apps/api`), Angular 17 côté front (`apps/web`), libs partagées
(`libs/shared`, `libs/infrastructure`), Docker Compose pour le dev.

### Points forts constatés

- Comparaison en temps constant au login pour éviter le timing attack sur
  l'énumération d'emails ([auth.service.ts:20](../apps/api/src/modules/auth/auth.service.ts#L20)).
- Isolation multi-tenant cohérente : chaque service filtre systématiquement
  par `organisationId` (ex. [objectif.service.ts](../apps/api/src/modules/objectif/objectif.service.ts)).
- `SuperAdminGuard` empêche explicitement les fuites cross-tenant entre
  `SUPERADMIN` et les routes tenant ([superadmin.guard.ts](../libs/shared/src/guards/superadmin.guard.ts)).
- RBAC (`@Roles()` + `RolesGuard`) posé sur la quasi-totalité des
  contrôleurs métier, pas seulement l'admin.
- `ValidationPipe` strict (`whitelist`, `forbidNonWhitelisted`, `transform`)
  et filtre d'exceptions global qui ne laisse fuiter aucune stack trace ni
  message Prisma brut ([http-exception.filter.ts](../apps/api/src/filters/http-exception.filter.ts)).
- `.env` correctement ignoré par git, aucun secret commité.

### 🔴 Sécurité : à corriger avant mise en production

1. **Upload public non authentifié** ([uploads.controller.ts:9](../apps/api/src/modules/uploads/uploads.controller.ts#L9))
   (`@Post('logo') @Public()`). Aucune auth, aucun rate-limit, et le SVG est
   accepté ([uploads.config.ts:14](../apps/api/src/modules/uploads/uploads.config.ts#L14)) alors qu'il peut embarquer du
   JS exécutable si le fichier est ouvert directement. Risque : DoS par
   saturation disque + XSS stocké potentiel.
   → Retirer `@Public()`, exiger le JWT, sortir `svg` de la whitelist ou le
   sanitiser (ex. DOMPurify côté serveur).

2. **Secret JWT avec fallback en dur**, présent à deux endroits :
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

4. **Token JWT en `localStorage`** ([auth.service.ts:148](../apps/web/src/app/auth.service.ts#L148)).
   Volable par tout XSS. Les usages actuels d'`[innerHTML]` sont limités à
   une table statique d'icônes SVG (pas de donnée utilisateur, vérifié
   dans [app-shell.component.ts:438](../apps/web/src/app/app-shell.component.ts#L438)), donc risque faible
   aujourd'hui, mais architecture fragile si un futur écran affiche du
   contenu utilisateur en HTML brut.
   → À terme, migrer vers cookie `httpOnly` + `SameSite=Strict` + CSRF
   (changement lourd, à planifier, pas urgent).

5. **Secrets par défaut dans `docker-compose.yml`** (`postgres/postgres`,
   `JWT_SECRET:-changeme-in-production`). Acceptable en dev, dangereux si
   déployé tel quel.

### 🟠 Performance

1. **Pas de lazy-loading Angular** : [app.routes.ts](../apps/web/src/app/app.routes.ts) importe tous les
   composants statiquement (dashboard, canevas, BPMN, urbanisation,
   roadmap...), y compris les librairies lourdes `chart.js` et `konva`.
   Signe révélateur : le budget de bundle a déjà été relevé à 900 kB
   warning / 1.3 MB erreur dans [angular.json:39-44](../apps/web/angular.json#L39-L44) (défaut Angular CLI :
   500 kB / 1 MB).
   → Passer les routes lourdes en `loadComponent`.

2. **Pas de compression HTTP** côté API (`main.ts` n'utilise pas
   `compression()`).

3. **Listes non paginées** : tous les `findMany` des services renvoient
   l'intégralité de la table filtrée par organisation, sans `skip`/`take`.
   Pas critique aujourd'hui vu le volume de données, deviendra un problème
   à l'échelle.

### 🟡 Ergonomie du code / maintenabilité

1. `apps/web/src/app` est un dossier plat avec ~55 fichiers (composants,
   services, guards, interceptors mélangés), contrairement au backend qui
   est bien organisé en modules par feature.
2. Angular 17, trois majeures derrière la dernière stable (Angular 20).
   Pas urgent mais à budgétiser avant que l'écart ne se creuse.

### ⚪ UX utilisateur : non vérifié

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

## 2026-08-21 : Refonte de l'IA produit (10 modules ADM) + module Opportunités & Solutions

Deux chantiers livrés dans la même session : le module "Opportunités &
Solutions" (phase E de l'ADM, entièrement nouveau : `Solution`,
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
  d'inventer de nouvelles conventions : la base de code reste homogène
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

1. **`Solution.create()`/`update()` sans `include: { scores: true }`**
   ([solution.service.ts](../apps/api/src/modules/opportunites/solution.service.ts)).
   Une solution fraîchement créée ou éditée revenait sans son tableau
   `scores`, faisant planter `noteMoyenne()`/`initMatrixRow()` côté
   frontend (`Cannot read properties of undefined`). Le popover de
   création restait bloqué sur "Création…" sans jamais se fermer.
   Trouvé uniquement en testant la création réelle dans le navigateur.
   Les tests unitaires mockaient la réponse Prisma donc ne l'auraient
   jamais révélé.
2. **`excel.util.ts` corrompait les accents à l'import** :
   `readAsBinaryString` + `XLSX.read(..., {type:'binary'})` mésinterprète
   l'UTF-8 des CSV, transformant "Répondant"/"Catégorie" en
   "RÃ©pondant"/"CatÃ©gorie" → aucune ligne ne matchait jamais les
   en-têtes attendus, échec silencieux de tout import sur une
   application **entièrement en français**. Corrigé en lisant les CSV
   via `readAsText` (UTF-8 natif) et les `.xlsx`/`.xls` via
   `readAsArrayBuffer` + `{type:'array'}`. Ce bug touchait les 3 écrans
   d'import (Vision, Prelim implicitement via export, Évaluation) : un
   seul correctif dans l'utilitaire partagé a suffi.

**Enseignement** : les deux bugs étaient invisibles en lecture de code et
en tests unitaires (mocks Prisma, pas de vrai fichier CSV) : seule
l'exécution réelle dans le navigateur, avec de vraies données
accentuées, les a révélés. À reproduire systématiquement pour tout
futur écran d'import/export.

### 🟡 Simplifications assumées (à surveiller)

- **Architecture Métier** n'a pas de lien 1-à-1 processus↔éléments
  ArchiMate en base (absent du schéma) : le module montre les 3
  livrables (BPMN, ArchiMate, organigramme) côte à côte plutôt que
  filtrés par processus sélectionné. Extension possible mais non faite
  ici (chantier séparé, nécessiterait une nouvelle relation).
- **Diagramme de déploiement** ne rend pas les Applications comme
  boîtes déplaçables indépendantes : `Application.positionX/Y` est déjà
  utilisé par le diagramme de composants (Architecture Système) : les
  réutiliser aurait fait interférer les deux diagrammes. Les
  applications déployées sont listées à l'intérieur de la boîte
  `TechComponent` (comme les services dans les boîtes du diagramme de
  composants), seul `TechComponent.positionX/Y` est déplaçable/persisté.
- **Gouvernance "suivi de conformité"** est scopé aux `Solution`
  uniquement (pas aux projets/éléments ArchiMate), décision prise pour
  rester cohérent avec le flux Opportunités → Mise en œuvre →
  Gouvernance déjà en place, à réévaluer si le besoin s'étend.

### Plan d'action priorisé (mise à jour au 2026-08-21)

Aucun des points 🔴/🟠/🟡 de l'entrée du 2026-08-18 n'a été traité dans
cette session (hors périmètre : c'était une session de fonctionnalités,
pas de durcissement sécurité/perf). Ils restent valables tels quels.
S'y ajoute, du fait de la croissance rapide du produit :

| Priorité | Action | Statut |
|---|---|---|
| 🟡 | Bundle dev passé de ~898 kB à 3.78 MB depuis le premier audit (ajout de 6 modules, 3 canevas Konva, Chart.js déjà compté), le lazy-loading des routes (déjà recommandé le 2026-08-18) devient plus urgent à mesure que l'app grossit | à faire |
| 🟡 | Lien processus↔éléments ArchiMate pour un vrai filtrage par processus dans Architecture Métier, si le besoin se confirme | à évaluer |

## 2026-08-24 : Génération de diagrammes BPMN à partir des processus Vision + extension du vocabulaire BPMN

### Ce qui a été fait

- **Génération automatique de diagrammes BPMN** : Architecture Métier
  affiche désormais, pour chaque processus défini dans Vision (toutes
  catégories confondues), un diagramme BPMN généré côté serveur
  (nouveau `BpmnViewService`, même pattern SVG-brut sans librairie
  cliente que `ArchimateViewService`) plutôt que de dupliquer la saisie.
  Positionnement : position enregistrée par l'éditeur Konva si elle
  existe, sinon repli en cascade gauche→droite avec passage à la ligne
  au-delà de 1000px de large : un processus de plusieurs dizaines
  d'étapes reste lisible sans étalement infini.
- **Extension du vocabulaire BPMN** (`TypeBpmn` : 6 → 9 valeurs +
  `PASSERELLE_INCLUSIVE`, `PASSERELLE_EVENEMENTIELLE`,
  `SOUS_PROCESSUS` ; + 2 classificateurs optionnels
  `DeclencheurEvenement` sur les événements et `TypeTache` sur les
  tâches). Choix architectural : plutôt que d'exploser `TypeBpmn` en
  dizaines de valeurs combinées (`EVENEMENT_FIN_MESSAGE`,
  `EVENEMENT_FIN_ERREUR`...), reprise du pattern déjà validé pour
  `categorieExigence` sur `ElementArchimate` : un type de base inchangé
  + un classificateur optionnel qui pilote uniquement l'icône. Recherche
  BPMN 2.0 menée avant implémentation pour s'assurer que le découpage
  (7 déclencheurs, 7 natures de tâche, 4 passerelles) correspond à la
  norme réelle plutôt qu'à une extrapolation ad hoc.
- **Trois surfaces tenues synchronisées** pour le même vocabulaire :
  génération SVG serveur ([bpmn-view.service.ts](../apps/api/src/modules/bpmn/bpmn-view.service.ts)),
  éditeur interactif Konva ([bpmn-canevas.component.ts](../apps/web/src/app/bpmn-canevas.component.ts)),
  et DTOs de validation. Les glyphes (enveloppe, horloge, éclair,
  triangle, personnage, engrenage, etc.) sont dessinés deux fois : une
  fois en chaînes SVG côté serveur, une fois en formes Konva côté
  client, avec les mêmes coordonnées et couleurs, pour que ce que
  l'utilisateur dessine dans l'éditeur ressemble exactement au diagramme
  généré.
- **Processus de démonstration reconstruit** ("Démonstration :
  vocabulaire BPMN complet", 22 éléments, 23 flux) pour couvrir la
  totalité du vocabulaire : les 9 types, les 7 déclencheurs, les 7
  natures de tâche, vérifié à la fois via `bpmn-view.service.spec.ts`
  (7 tests dédiés) et en rejouant la génération + la création manuelle
  d'éléments dans le navigateur.

### Point de vigilance

- Cette extension **duplique intentionnellement** la logique de dessin
  d'icônes entre backend (chaînes SVG) et frontend (formes Konva) faute
  de langage de description partagé entre les deux runtimes : tout
  nouveau déclencheur/nature de tâche futur nécessitera de modifier les
  deux fichiers en parallèle, avec le risque de désynchronisation
  visuelle si l'un des deux est oublié. Pas de correctif proposé ici
  (changer d'approche, ex. un descripteur de glyphe unique interprété
  différemment par les deux moteurs de rendu, serait un chantier séparé
  et non justifié pour l'ampleur actuelle du vocabulaire).

## 2026-08-24 (suite) : édition des processus, correctif de mise en page, identité visuelle globale, refonte de la notation ArchiMate

### 🔴 Bug réel trouvé et corrigé : cartes de processus qui débordent

- **`bpmn.component.ts`** (liste des processus, module Vision) :
  `.list` utilisait `display: grid` sans `grid-template-columns` : la
  colonne implicite se dimensionnait alors sur le contenu le plus large
  plutôt que sur la largeur de la carte. Une description de processus
  un peu longue (`white-space: nowrap` pour l'ellipse) suffisait à
  forcer une ligne à ~1495px de large *à l'intérieur* d'une carte de
  481px, faisant sortir le bouton « Supprimer » très à droite, hors de
  sa carte. Repéré visuellement par l'utilisateur, confirmé en mesurant
  les rects DOM réels dans le navigateur. Corrigé par
  `grid-template-columns: minmax(0, 1fr)` sur `.list` + `min-width: 0`
  sur `.list-item` : classique "flexbox/grid overflow" quand un
  descendant en `nowrap` n'a pas de contrainte de largeur explicite en
  amont.
- **Bug latent découvert en même temps** : les `<select>` natifs liés
  via `[value]="expr"` sur l'élément `<select>` lui-même (plutôt que
  `[selected]` sur chaque `<option>` généré par `*ngFor`) affichaient
  systématiquement la première option au lieu de la valeur réellement
  liée, un travers connu d'Angular quand le binding de valeur du
  `<select>` s'applique avant que ses `<option>` enfants existent dans
  le DOM. Corrigé dans `bpmn.component.ts` (2 select) et
  `bpmn-canevas.component.ts` (6 select, ajoutés dans la session
  précédente). Le même motif existe encore dans 8 autres fichiers
  (`architecture-metier`, `gouvernance`, `technologie`, `donnees`,
  `canevas`, `urbanisation`, `roadmap`, `register`), non corrigés ici
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
  chaque fichier, au prix de ne pas réduire les rares tailles fixées
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
  modélisés (`TypeElement` du schéma) : les couches Application et
  Technologie ont leurs propres générateurs dédiés
  (`applications-canevas`, `technologie` : diagrammes de composants et
  de déploiement), non touchés ici.
- Vérifié : `archimate-view.service.spec.ts` (5 tests, dont 2 mis à
  jour pour le nouveau wrap sur 2 lignes) + suite complète (278/278) ;
  diagramme régénéré et inspecté dans le navigateur (couleurs, formes,
  pictogrammes, retour à la ligne des noms longs) sur les données
  existantes de l'organisation de démonstration.

## 2026-08-24 (suite 2) : nettoyage de données de démonstration, robustesse des relations ArchiMate, style d'écriture

### 🔴 Bug de données trouvé et corrigé : relations ArchiMate dupliquées

- L'organisation de démonstration contenait des doublons accumulés au
  fil des sessions de test : 3 exemplaires de l'élément "Vision" et 2
  de l'élément "Objectif" portant exactement le même nom, plus un
  élément parasite nommé "deux" (valeur de menu déroulant tapée par
  erreur dans un champ nom lors d'un test manuel), reliés par 10
  relations quasi identiques (4 associations superposées entre la même
  paire, 6 autres entre une autre paire). Toutes ces relations
  partageant les mêmes coordonnées, elles se superposaient en un
  amalgame illisible de traits et d'étiquettes répétées dans le
  diagramme généré. Nettoyé après confirmation de l'utilisateur :
  doublons supprimés, 10 relations réduites à 2 (une par paire réelle).
- Correctif de robustesse associé dans `archimate-view.service.ts` :
  quand plusieurs relations relient légitimement la même paire
  source→cible (ex. une association et une réalisation), elles sont
  désormais dessinées en arc plutôt que superposées exactement, pour
  qu'un futur cas similaire reste lisible sans intervention manuelle.
- Étiquette de type flottante retirée sur chaque trait de relation
  (« association », « composition »...) : la notation ArchiMate
  officielle distingue les relations uniquement par le style du trait
  et la pointe, pas par du texte, et cette étiquette systématique
  n'existe pas dans le gabarit de référence `archimate-template.png`.

### 🟡 Style d'écriture : suppression du tiret cadratin

- L'utilisateur a signalé l'usage systématique du tiret cadratin (« — »)
  dans le texte généré (documentation, noms de données créées comme le
  processus de démonstration BPMN). Ce fichier en contenait 41
  occurrences, réécrites avec deux-points, virgules ou phrases séparées.
  Règle retenue pour la suite : plus de tiret cadratin dans le contenu
  généré, quel qu'il soit.

## 2026-08-24 (suite 3) : traitement des points 🟠 performance de l'audit initial

Sur demande explicite de l'utilisateur ("commence par la performance"),
traitement de 2 des 3 points 🟠 ouverts depuis le 2026-08-18.

### Compression HTTP

- `compression()` (package `compression`) ajouté dans
  [main.ts](../apps/api/src/main.ts), juste après `helmet()`. Vérifié en
  observant l'en-tête `Content-Encoding: gzip` sur une réponse JSON de
  taille significative (le SVG généré d'un processus BPMN).

### Lazy-loading des routes Angular

- [app.routes.ts](../apps/web/src/app/app.routes.ts) : toutes les routes
  de fonctionnalité (sous le shell authentifié et sous `/admin`) sont
  passées de `component:` à `loadComponent: () => import(...)`. Restent
  eagers uniquement `HomeComponent`, `LoginComponent`, `AppShellComponent`
  et `NotFoundComponent`, nécessaires dès le premier rendu.
- Effet mesuré : bundle initial de production passé de ~3,83 Mo (raw, la
  totalité de l'app agrégée dans `main.js`) à 338,66 Ko (94,93 Ko
  transférés après compression), largement sous le budget de 900 Ko
  d'avertissement posé dans `angular.json`. Les librairies lourdes
  (`konva`, `chart.js`, `xlsx`) ne sont plus chargées qu'à la navigation
  vers l'écran qui les utilise réellement (vérifié dans le navigateur :
  `canevas` et `dashboard` chargent bien leurs chunks à la demande, sans
  erreur console, avec des requêtes réseau 200 fraîches).
- Corrigé au passage : `vision.component.ts` contenait une méthode
  `exportGroupe()` orpheline (référençant des getters supprimés lors du
  retrait du sous-onglet Exigences fonctionnelles/non fonctionnelles,
  demandé par l'utilisateur juste avant), qui bloquait la compilation.

### Non traité dans cette session

- **Pagination des `findMany`** : laissé de côté volontairement. Contrairement
  aux deux points ci-dessus, c'est un changement de contrat d'API qui
  toucherait chaque service backend avec liste (`skip`/`take` + réponse
  enveloppée `{ items, total }` ou équivalent) et chaque écran frontend
  consommateur (gestion de pagination dans l'UI). Ampleur et risque de
  régression nettement supérieurs aux deux correctifs ci-dessus ; à
  cadrer avec l'utilisateur avant de s'y lancer plutôt qu'à traiter en
  une passe non demandée.

### Vérifié

- Suite backend complète : 278/278.
- `tsc --noEmit` backend et frontend : aucune erreur.
- Build production frontend : aucun avertissement de budget.
- Navigateur : dashboard (Chart.js) et canevas (Konva) rechargés et
  fonctionnels après le passage en lazy-loading.

## 2026-08-24 (suite 4) : traitement des points 🔴 sécurité de l'audit initial

Sur demande explicite de l'utilisateur ("réglons la sécurité"), 3 des 5
points 🔴 ouverts depuis le 2026-08-18.

### 1. Upload de logo public

- L'audit suggérait de retirer `@Public()` de `/uploads/logo`. Vérifié
  avant de le faire : cet endpoint est appelé pendant l'inscription
  ([register.component.ts](../apps/web/src/app/register.component.ts)),
  *avant* qu'un compte/JWT n'existe, donc le rendre authentifié aurait
  cassé l'inscription. Traité le risque réel (XSS stocké) plutôt que le
  symptôme littéral de l'audit : SVG retiré des types acceptés
  ([uploads.config.ts](../apps/api/src/modules/uploads/uploads.config.ts))
  puisqu'un SVG peut embarquer du `<script>` exécuté à l'ouverture directe
  du fichier, alors que PNG/JPEG/WEBP ne le peuvent pas. Le `accept` des
  deux `<input type="file">` correspondants (inscription + Prelim) mis à
  jour en cohérence.
- Le risque de saturation disque par upload répété (toujours d'actualité
  sur un endpoint public) est couvert par le rate-limiting ci-dessous.

### 2. Secret JWT par défaut

- `jwt.strategy.ts` et `auth.module.ts` utilisaient
  `config.get('JWT_SECRET') ?? 'secretKey'`. Nouvelle fonction partagée
  `requireJwtSecret()` ([libs/shared/src/utils/require-jwt-secret.ts](../libs/shared/src/utils/require-jwt-secret.ts))
  qui lève une erreur explicite au démarrage si la variable est absente,
  utilisée aux deux endroits. `docker-compose.yml` mis en cohérence :
  `JWT_SECRET: ${JWT_SECRET:-changeme-in-production}` remplacé par
  `${JWT_SECRET:?...}` (Compose refuse de démarrer le service sans la
  variable exportée), sinon le nouveau garde-fou côté code n'aurait servi
  à rien pour un déploiement via Compose.
- Deux tests mettaient l'ancien comportement sous test et ont dû être
  corrigés : `jwt.strategy.spec.ts` attendait explicitly qu'une absence de
  secret *ne lève pas* d'erreur (inversé) ; `auth.controller.spec.ts`
  construisait son module de test avec `ignoreEnvFile: true` et aucun
  `JWT_SECRET` de substitution, donc échouait à la compilation du module
  (corrigé en injectant un secret de test via `ConfigModule.forRoot({
  load: [...] })`).

### 3. Rate-limiting

- `@nestjs/throttler` ajouté : limite globale par défaut (100 req/min)
  dans [app.module.ts](../apps/api/src/app.module.ts) en défense en
  profondeur, et limite stricte dédiée (5 req/min) sur `/auth/login` et
  `/auth/register` via `@Throttle()` sur
  [auth.controller.ts](../apps/api/src/modules/auth/auth.controller.ts),
  plus 10 req/min sur `/uploads/logo`. Vérifié en conditions réelles : 5
  tentatives de login échouées passent, la 6e renvoie `429`.

### Non traités dans cette session

- **Token JWT en `localStorage`** : l'audit le marque déjà "pas urgent,
  changement lourd, à planifier" (migration vers cookie `httpOnly` +
  CSRF touche l'intégralité du flux d'auth frontend/backend). Laissé de
  côté pour la même raison que la pagination : à cadrer explicitement
  avant de s'y lancer.
- **Mot de passe Postgres par défaut** dans `docker-compose.yml`
  (`POSTGRES_PASSWORD: postgres`, sans variable d'env). Seul le
  `JWT_SECRET` a été durci ici (impact direct : forge de token) ; le mot
  de passe Postgres reste en dur, risque moindre tant que le port
  Postgres n'est exposé qu'en local, mais à corriger avant tout
  déploiement réel du Compose fourni.

### Vérifié

- Suite backend complète : 278/278 (après correction des 2 tests
  devenus obsolètes).
- `tsc --noEmit` backend et frontend : aucune erreur.
- Build production frontend inchangé (338,66 Ko initial).
- En conditions réelles sur le serveur dev : upload SVG rejeté (`400`),
  upload PNG accepté (`201`), 6e tentative de login en moins d'une
  minute rejetée (`429`).

## 2026-08-24 (suite 5) : liens applicatifs visibles dans l'inventaire (Architecture Système)

Sur relecture d'un extrait de cahier des charges pour le module
Architecture Système, écart constaté : "Inventaire des applications de
l'entreprise, description et de leurs liens" n'était que partiellement
couvert. Le diagramme de composants (`applications-canevas.component.ts`)
permet déjà de créer des `ApplicationEchange` (interactions entre
systèmes) en reliant deux applications à la souris, mais ces liens
étaient invisibles depuis le Portefeuille (tableau d'inventaire) et la
fiche détail d'une application, alors que le modèle de données et
l'API existaient déjà pour les deux sens de la relation
(`echangesSource`/`echangesTarget`).

- Backend ([urbanisation.service.ts](../apps/api/src/modules/urbanisation/urbanisation.service.ts)) :
  `findAllApplications()` inclut désormais `echangesSource`/`echangesTarget`
  dans `_count` ; `findOneApplication()` inclut les échanges eux-mêmes
  (avec le nom de l'application à l'autre bout du lien).
- Frontend ([applications.component.ts](../apps/web/src/app/applications.component.ts)) :
  colonne « Liens » ajoutée au tableau du Portefeuille ; section « Liens
  applicatifs » ajoutée à la fiche détail (sens de la relation `→`/`←`,
  nom de l'autre application, description/protocole, bouton Retirer
  réutilisant `deleteEchange()` déjà exposé par le service).
- Le diagramme de composants restait la seule fonctionnalité déjà
  couverte par le cahier des charges (modélisation des applications,
  interactions entre systèmes) ; seule la visibilité dans l'inventaire
  manquait.

### Vérifié

- `tsc --noEmit` backend et frontend, build frontend : aucune erreur.
- Suite backend complète : 278/278 (aucun test n'asserte la forme exacte
  de l'`include` Prisma modifié, donc pas de régression).
- En conditions réelles : 2 applications créées, un échange créé entre
  elles → colonne Liens à 1 des deux côtés, section détail affichant
  « → Portail RH · Synchronisation des comptes · REST » ; clic sur
  Retirer → lien supprimé, compteur repassé à 0 des deux côtés. Données
  de test nettoyées après vérification.

## 2026-08-25 : retrait du champ criticité sur Application

Sur demande explicite de l'utilisateur, suppression complète du champ
`criticite` (enum `Criticite` : HAUTE/MOYENNE/BASSE) porté par
`Application` depuis toutes les couches du produit :

- **Schéma** : colonne `criticite` et enum `Criticite` supprimés
  (migration `remove_application_criticite`).
- **Backend** : `criticite` retiré des DTOs create/update d'application
  et de `ApplicationItemDto` (assistant d'inscription).
  `urbanisation-view.service.ts` (diagramme des zones d'urbanisation)
  coloriait chaque puce d'application selon sa criticité (rouge/orange/
  vert) : remplacé par une couleur neutre unique, `CRITICITE_COLOR`
  supprimé.
- **Frontend** : colonne et badge « Criticité » retirés du Portefeuille
  (`applications.component.ts`), sélecteurs retirés des formulaires de
  création/édition et de la fiche détail ; le diagramme de composants
  Konva (`applications-canevas.component.ts`) affichait une pastille de
  couleur par criticité sur chaque boîte, retirée. Le graphique "Applications
  par criticité" du tableau de bord n'avait plus de sens sans la donnée
  sous-jacente : carte retirée entièrement (pas de métrique de
  remplacement inventée). Sélecteur de criticité retiré de l'étape 6 de
  l'assistant d'inscription.
- Effet de bord repéré en cours de route : `this.applications` dans
  `dashboard.component.ts` n'était plus lu que par le graphique
  supprimé : champ mort retiré aussi, plutôt que laissé traîner.

### Vérifié

- `tsc --noEmit` backend et frontend, build frontend (dev + production) :
  aucune erreur.
- Suite backend complète : 277/277 (278 moins le test qui vérifiait la
  distinction de couleur par criticité, devenu sans objet).
- Balayage final (`grep -r "riticit"` sur `apps/api/src`, `apps/web/src`,
  `apps/api/prisma`) : aucune occurrence restante.
- Navigateur : Portefeuille sans colonne Criticité, fiche détail sans
  le champ, diagramme de composants Konva rendu sans erreur (canvas
  présent), tableau de bord sans le graphique retiré, requêtes réseau
  fraîches toutes en 200.

## 2026-08-25 : nouveau diagramme d'architecture applicative (module Architecture Système)

Sur demande explicite de l'utilisateur, ajout d'un diagramme distinct du
« diagramme de composants » déjà existant (qui ne couvrait que les
applications et leurs échanges) : le nouveau diagramme d'architecture
applicative élargit le vocabulaire à 7 types d'éléments (utilisateur
interne, utilisateur externe, composant applicatif, base de données,
système externe, infrastructure, sécurité) et 4 types de flux (API,
données, authentification, réseau), avec génération, création,
modification et suppression complètes. Recherche menée avant conception
(conventions de diagrammes d'architecture applicative : rectangles pour
les services, cylindres pour les bases de données, traits pleins/
pointillés selon la nature du flux, regroupement en couches colorées) et
inspiration du gabarit fourni par l'utilisateur
(`diagramme-d'architecture-applicative.png`, style « couches colorées »
façon outil de recommandation).

- **Modèle de données** : `ArchiApplicativeElement` / `ArchiApplicativeFlux`,
  volontairement indépendants du portefeuille `Application` existant
  (même précaution que `TechDeploiement` : deux diagrammes ne doivent pas
  se disputer les mêmes coordonnées `positionX/Y`).
- **Backend** : nouveau module `architecture-applicative` (DTOs, service,
  contrôleur, `ArchitectureApplicativeViewService` pour le SVG généré),
  suivant exactement le pattern déjà en place pour BPMN/ArchiMate/
  Urbanisation. Le générateur SVG regroupe les éléments en 5 bandes
  colorées (Utilisateurs / Composants applicatifs / Données / Systèmes
  externes / Infrastructure & sécurité), dessine les bases de données en
  cylindre plutôt qu'en rectangle, style chaque flux selon sa nature
  (couleur + pointillés pour l'authentification), et génère une légende
  couleurs + types de flux en bas du diagramme.
- **Frontend** : nouvel onglet « Architecture applicative » dans
  Architecture Système, avec deux sous-onglets : Éditeur (canevas Konva
  interactif : glisser-déposer depuis une palette de 7 types, liaison par
  points d'ancrage pour créer un flux, modification/suppression au survol,
  mêmes glyphes que le SVG généré) et Diagramme généré (bouton Générer/
  Effacer/Exporter, identique au patron déjà utilisé pour le diagramme
  ArchiMate).

### 🔴 Bug réel trouvé et corrigé : nouvelle route absente du proxy dev

- `apps/web/proxy.conf.json` liste explicitement chaque préfixe de route à
  transférer vers l'API (`/applications`, `/bpmn-processus`, etc.) : la
  nouvelle route `/architecture-applicative` n'y figurait pas, donc le
  serveur de dev Angular renvoyait 404 sur toute requête vers ce module
  au lieu de la relayer vers l'API sur le port 3000, bien que l'API
  elle-même répondait correctement en accès direct. Repéré en testant la
  création réelle d'un élément dans le navigateur (le formulaire restait
  ouvert sans erreur visible). Entrée ajoutée au fichier de proxy ; un
  redémarrage du serveur de dev Angular est nécessaire pour qu'il soit
  pris en compte (la configuration du proxy n'est lue qu'au démarrage).

### Vérifié

- `tsc --noEmit` backend et frontend, build frontend dev + production :
  aucune erreur, aucun avertissement de budget (338,66 Ko initial,
  inchangé, le nouveau canevas est chargé paresseusement avec le reste
  du module Architecture Système).
- Suite backend complète : 292/292 (15 nouveaux tests pour le module).
- En conditions réelles dans le navigateur : création d'un élément de
  chacun des 7 types via glisser-déposer, 6 flux créés entre eux,
  diagramme généré affichant le bon décompte (7 éléments, 6 flux), les 5
  bandes colorées, le cylindre de la base de données, et la légende
  complète (types d'éléments + types de flux). Données de test nettoyées
  après vérification (éléments et flux à zéro en fin de session).

---

## 2026-08-25 : unification du design des listes sur le patron « Architecture Système »

Demande explicite : toutes les sections affichant une liste doivent
reprendre la même présentation que les listes du module Architecture
Système (tableau `<table class="table">` avec en-tête, lignes zébrées par
la bordure du bas, colonne d'actions à droite avec icônes rondes), au
lieu du patron `<ul class="list"><li class="list-item">` en cartes
utilisé jusque-là dans le reste de l'application.

### Fichiers convertis

- `gouvernance.component.ts` : listes Politiques et Demandes de
  changement.
- `donnees.component.ts` : liste Relations (les Entités, qui imbriquent
  un tableau d'attributs et un formulaire d'ajout par carte, sont
  conservées telles quelles : ce n'est pas une liste plate mais un
  éditeur imbriqué).
- `evaluation.component.ts` : liste Commentaires du rapport d'évaluation.
- `mise-en-oeuvre.component.ts` : liste Solutions retenues, y compris le
  champ de commentaire de suivi (zone de texte libre), placé dans une
  cellule dédiée plutôt que traité comme un cas à part.
- `bpmn.component.ts` et `bpmn-vues.component.ts` : sélecteur de
  processus (par catégorie pilotage/métier/support), lignes de tableau
  cliquables avec surbrillance de la ligne sélectionnée à la place de la
  bordure de carte.
- `ecarts.component.ts` : même sélecteur de processus converti ; les deux
  colonnes de comparaison AS-IS/TO-BE, qui ne sont pas une liste CRUD
  mais une vue de diff côte à côte, sont conservées telles quelles.
- `roadmap.component.ts` : liste Projets.
- `organisation.component.ts` : les deux listes Parties prenantes
  (popover de consultation et popover de gestion) ; le tableau Membres
  utilisait déjà ce patron et n'a pas changé.

### Exclusions délibérées (non touchées)

- `technologie.component.ts` : cartes de composants avec sous-liste de
  déploiements imbriquée.
- `register.component.ts` et `wizard.component.ts` : listes « chips » de
  construction pas à pas dans un assistant multi-étapes, pas des listes
  d'entités.
- Les colonnes de comparaison AS-IS/TO-BE d'`ecarts.component.ts`.

### Vérifié

- Build frontend développement : aucune erreur de compilation.
- Dans le navigateur (données réelles du jeu K&B Groupe) : chaque liste
  convertie affiche correctement ses colonnes et son contenu ; le clic
  sur une ligne du sélecteur de processus (Vision et Analyse des écarts)
  déclenche bien la sélection et l'affichage du panneau de détail,
  identique au comportement précédent avec `<li>` ; les popovers Parties
  prenantes (consultation et gestion, avec bouton Retirer) s'ouvrent et
  affichent les données correctement.

---

## 2026-08-26 : 🔴 Bug réel trouvé et corrigé : gel du navigateur sur l'onglet Matrice d'évaluation

Signalé par l'utilisateur : l'application se figeait systématiquement en
ouvrant l'onglet « Matrice d'évaluation » du module Opportunités &
solutions. Reproduit à l'identique dans un navigateur de test : l'onglet
devenait totalement non réactif (plus aucune commande, y compris la
lecture du DOM, ne répondait) dès l'ouverture de cet onglet, sans erreur
visible dans la console avant le gel.

### Diagnostic

Isolé par bissection successive du template (désactivation temporaire de
sections avec `*ngIf="false"`) : le graphique « Comparaison des notes
moyennes » (`opportunites.component.ts`, canevas Chart.js créé par
`renderChart()`) est seul responsable. Le graphique se construit
correctement dans un premier temps (confirmé par des traces de
diagnostic), mais l'option `responsive: true` de Chart.js, combinée à la
façon dont ce canevas particulier est inséré dans le DOM (au sein d'un
`*ngIf` sur l'onglet, créé après un `setTimeout`), déclenche une boucle
de recalcul de taille qui ne se stabilise jamais et bloque le fil
d'exécution du navigateur. Le graphique équivalent d'`evaluation.
component.ts` (onglet Rapport d'évaluation), construit avec le même
patron mais sans `responsive: true` posant problème dans son propre
contexte, ne présente pas ce défaut : preuve que le bug est spécifique à
ce composant et non un problème général de Chart.js dans l'application.

### Correctif

`opportunites.component.ts`, méthode `renderChart()` : taille du canevas
fixée une seule fois à la création (largeur du conteneur, hauteur
260px) via les attributs `width`/`height` du `<canvas>`, puis
`responsive: false` dans les options Chart.js. Le graphique ne se
redimensionne plus automatiquement au redimensionnement de la fenêtre,
ce qui est un compromis acceptable au vu du gain (le module redevient
utilisable) ; aucun autre graphique de l'application n'a ce problème,
aucun autre changement n'était donc nécessaire.

### Vérifié

- Build frontend développement : aucune erreur.
- Reproduit le gel dans un navigateur de test avant correctif (page
  totalement non réactive) puis confirmé sa disparition après correctif,
  à la fois avec un jeu de données dégénéré (2 solutions sans aucune
  note) et avec un jeu réel (1 critère ajouté, notes 2 et 5 saisies puis
  enregistrées, graphique redessiné sans incident). Données de test
  supprimées après vérification (critère et notes remis à zéro).

---

## 2026-08-26 (suite) : diagramme de composants généré + hiérarchie visuelle des sous-onglets

Deux demandes de l'utilisateur, illustrées par une capture d'écran du
module Architecture Système : (1) l'onglet « Diagramme de composants »
n'avait ni structure Éditeur/Diagramme généré ni diagramme généré du
tout, contrairement à « Diagramme d'architecture applicative » ; (2) sur
toutes les pages à deux niveaux d'onglets, le second niveau (sous-onglets)
avait exactement le même design que le premier, rendant la hiérarchie peu
lisible.

### Diagramme de composants généré (fonctionnalité manquante)

Aucun générateur SVG statique n'existait pour le diagramme de composants
UML (Application + ApplicationEchange) : seul l'éditeur interactif
(`applications-canevas.component.ts`) permettait de le visualiser, sans
pendant « Générer/Effacer/Exporter » ni sous-onglets, contrairement à
tous les autres diagrammes de l'application.

- `urbanisation-view.service.ts` : nouvelle méthode `generateComponents()`
  reprenant exactement la notation visuelle de l'éditeur (boîte
  «component» à bandeau bleu marine, liste de services à puces,
  relations UML lollipop/socket) et les mêmes constantes de tailles
  (BOX_W=190, HEADER_H=30…) pour que diagramme généré et éditeur restent
  visuellement identiques. Position enregistrée réutilisée si présente,
  sinon repli en cascade avec passage à la ligne (MAX_ROW_WIDTH=1000),
  même patron que `bpmn-view.service.ts`.
- `urbanisation.controller.ts` : route `GET /applications/generate-vue`
  (placée avant `GET /applications/:id` pour ne pas être capturée par le
  paramètre `:id`).
- `urbanisation.service.ts` (frontend) : `generateComponentsView()`.
- `applications.component.ts` : l'onglet « Diagramme de composants »
  gagne désormais les mêmes sous-onglets Éditeur/Diagramme généré que
  « Diagramme d'architecture applicative », avec les mêmes actions
  Générer/Effacer/Exporter SVG/Exporter PNG.
- 4 nouveaux tests dans `urbanisation-view.service.spec.ts` (rendu avec
  services, positions enregistrées respectées, échange avec extrémité
  absente ignoré, état vide).

### Hiérarchie visuelle des onglets à deux niveaux

`styles.scss` : les sous-onglets (`.sub-tabs`, utilisés ici et dans
`architecture-metier.component.ts`) perdent la carte blanche flottante
avec ombre portée au profit d'un fond uni gris clair sans ombre, des
pastilles plus petites, et une couleur d'accent (bleu primaire) au lieu
du noir pour l'état actif, le premier niveau reste inchangé (carte
blanche, noir). Un seul point de correction global suffit : ces sous-
onglets n'avaient aucun style propre au-delà d'une marge, ils héritaient
entièrement du style des onglets principaux.

### Vérifié

- Suite backend `urbanisation` : 39/39.
- Build frontend développement : aucune erreur.
- `GET /applications/generate-vue` testé en direct (curl) : 6
  applications, 6 échanges, SVG contenant bien le bandeau «component»,
  les services à puces et les libellés d'échange.
- Dans le navigateur : l'onglet Diagramme de composants affiche
  désormais Éditeur (canevas interactif, inchangé) et Diagramme généré
  (génération, résumé, rendu SVG identique à l'éditeur) ; le nouveau
  style des sous-onglets est bien présent dans la feuille de style
  chargée par le navigateur (fond gris uni, pas d'ombre, confirmé par
  inspection directe des règles CSS correspondantes) et ne casse pas les
  sous-onglets déjà existants (Architecture applicative, Architecture
  métier › Diagramme ArchiMate).

---

## 2026-08-26 (suite 2) : nouvel audit complet

Nouveau passage d'audit demandé explicitement par l'utilisateur, un peu
plus d'une semaine et beaucoup de fonctionnalités après le précédent
(audit initial du 2026-08-18, traité en partie le 2026-08-24 : suite 3
pour la performance, suite 4 pour la sécurité). Depuis, la base de code
a nettement grossi : refonte de la notation ArchiMate, extension du
vocabulaire BPMN, nouveau module Architecture applicative complet
(modèle, service, générateur SVG, éditeur Konva), nouveau générateur de
diagramme de composants, unification du design des listes sur une
dizaine de fichiers, et un correctif de gel navigateur. Ce passage
revérifie les points encore ouverts de l'audit initial et audite ce qui
a été ajouté depuis.

### Points forts confirmés ou nouveaux

- **Discipline d'échappement XSS maintenue malgré une surface bien plus
  grande.** L'audit initial notait que `[innerHTML]` + `bypassSecurityTrustHtml`
  n'était utilisé que pour une table statique d'icônes. Ce n'est plus le
  cas : 6 écrans rendent désormais du SVG généré côté serveur contenant
  du texte utilisateur (noms d'applications, de services, d'éléments,
  libellés de flux/échanges...) via ce même mécanisme. Vérifié ligne par
  ligne : les 5 générateurs SVG backend
  ([archimate-view.service.ts](../apps/api/src/modules/archimate/archimate-view.service.ts),
  [service-view.service.ts](../apps/api/src/modules/service/service-view.service.ts),
  [bpmn-view.service.ts](../apps/api/src/modules/bpmn/bpmn-view.service.ts),
  [architecture-applicative-view.service.ts](../apps/api/src/modules/architecture-applicative/architecture-applicative-view.service.ts),
  [urbanisation-view.service.ts](../apps/api/src/modules/urbanisation/urbanisation-view.service.ts))
  font systématiquement passer chaque champ utilisateur par `escape()` ou
  `wrap()` (qui échappe en interne) avant de l'insérer dans un `<text>` :
  aucun point d'injection trouvé sur l'ensemble des générateurs. Bon
  signe, mais ça déplace le curseur de risque du point 4 ci-dessous : un
  seul oubli d'`escape()` dans un futur générateur deviendrait un vol de
  token JWT exploitable (le token reste en `localStorage`, voir plus
  bas), pas juste un défaut d'affichage.
- Isolation multi-tenant toujours cohérente sur le nouveau module
  Architecture applicative : chaque méthode de
  [architecture-applicative.service.ts](../apps/api/src/modules/architecture-applicative/architecture-applicative.service.ts)
  filtre ou vérifie `organisationId`, y compris pour les flux (vérifie
  que source *et* cible appartiennent à l'organisation avant de créer un
  lien, même patron que `createEchange` côté urbanisation).
- RBAC (`@Roles(ADMINISTRATEUR, ARCHITECTE)`) posé sur toutes les routes
  de mutation du nouveau module, DTOs entièrement validés
  (`@IsUUID`, `@MaxLength`, `@IsEnum`...).
- Aucune nouvelle route `@Public()` introduite depuis l'audit initial :
  toujours les 4 mêmes (`/auth/login`, `/auth/register`, `/health`,
  `/uploads/logo`), pas d'élargissement de la surface non authentifiée.
- Le filtre d'exceptions global a été revérifié en conditions réelles
  cette semaine, pas seulement en test : pendant la panne PostgreSQL du
  2026-08-26 (Docker Desktop arrêté), les réponses 500 renvoyées au
  client étaient bien génériques (`"Erreur interne du serveur"`), sans
  jamais laisser fuiter le `PrismaClientKnownRequestError` ni le chemin
  de fichier présents dans les logs serveur.
- Lazy-loading toujours respecté : le bundle initial de production reste
  à 338,95 Ko malgré tous les modules ajoutés depuis (aucun des
  nouveaux écrans n'a été laissé en chargement eager par erreur).
- Suite de tests backend : 296/296 (contre 278 à l'audit précédent, donc
  18 tests nets ajoutés avec les nouvelles fonctionnalités), `tsc --noEmit`
  propre côté API et web.

### 🔴 Sécurité : toujours ouvert

1. **Token JWT en `localStorage`** : toujours vrai
   ([auth.service.ts](../apps/web/src/app/auth.service.ts)). Le
   raisonnement "risque faible aujourd'hui" de l'audit initial est à
   nuancer : voir le point ci-dessus sur la surface `[innerHTML]` qui
   s'est nettement élargie. Toujours pas urgent au sens strict (aucune
   faille XSS actuelle trouvée), mais l'écart entre "pas urgent" et
   "devient risqué au prochain oubli" s'est réduit. À planifier plus
   sérieusement plutôt qu'à repousser indéfiniment.
2. **Mot de passe PostgreSQL par défaut** dans
   [docker-compose.yml](../docker-compose.yml)
   (`POSTGRES_PASSWORD: postgres`, en dur, sans variable d'env),
   toujours non traité malgré le durcissement du `JWT_SECRET` en suite 4.
   Incohérent d'avoir sécurisé un secret et pas l'autre dans le même
   fichier.

### 🟠 Performance : un point traité, un toujours ouvert

- Compression HTTP et lazy-loading (suite 3) : toujours en place, non
  régressés.
- **Listes non paginées** : toujours aucun `skip`/`take` sur l'ensemble
  des `findMany` du backend, y compris les modules ajoutés depuis
  (vérifié par recherche exhaustive). Le volume de données réel actuel
  ne le rend pas urgent, mais le nombre de modules concernés a augmenté.

### 🟡 Qualité de code

1. `apps/web/src/app` est passé de ~55 à **77 fichiers** à plat depuis
   l'audit initial, le problème identifié alors ne s'est pas résorbé,
   il s'est aggravé avec chaque nouveau module.
2. Angular 17 inchangé, l'écart avec la dernière version stable s'est
   mécaniquement creusé d'une semaine supplémentaire.
3. **Nouveau** : `npx jest` termine avec l'avertissement « A worker
   process has failed to exit gracefully... Active timers can also
   cause this ». Les 296 tests passent malgré tout, mais un timer ou une
   connexion non fermée proprement dans un test (ou son setup) mériterait
   un passage avec `--detectOpenHandles` pour identifier la source avant
   que ça ne ralentisse durablement la CI.

### ⚪ UX utilisateur : partiellement vérifié depuis

Contrairement à l'audit initial (jugement uniquement sur le code),
plusieurs parcours réels ont été vérifiés en navigateur au fil des
sessions récentes (création/édition/suppression sur la plupart des
modules, génération des 5 diagrammes, responsive mobile sur les écrans
les plus récents). Restent non vérifiés : accessibilité (lecteurs
d'écran, navigation clavier complète), et le comportement du menu
mobile (`☰`) n'a pas pu être confirmé visuellement en fin de session
précédente faute d'un environnement de test qui compose réellement les
frames, à confirmer manuellement.

### Plan d'action priorisé (état au 2026-08-26)

| Priorité | Action | Statut |
|---|---|---|
| 🔴 | Retirer `@Public()` de `/uploads/logo`, sortir/sanitiser le SVG | **fait** (SVG retiré des types acceptés, suite 4) |
| 🔴 | Supprimer le fallback `'secretKey'`, échec au boot si absent | **fait** (`requireJwtSecret()`, suite 4) |
| 🔴 | `@nestjs/throttler` sur `/auth/*` et `/uploads/*` | **fait** (suite 4) |
| 🔴 | Migrer le token vers cookie `httpOnly` + CSRF | à planifier (priorité légèrement relevée) |
| 🔴 | Mot de passe PostgreSQL par défaut dans `docker-compose.yml` | à faire |
| 🟠 | `app.use(compression())` | **fait** (suite 3) |
| 🟠 | Lazy-load des routes lourdes | **fait** (suite 3) |
| 🟠 | Pagination des `findMany` | à faire, ampleur inchangée |
| 🟡 | Réorganiser `apps/web/src/app` en dossiers par feature | à faire, plus urgent qu'avant (77 fichiers) |
| 🟡 | Mise à jour Angular | à budgétiser |
| 🟡 | Diagnostiquer le worker Jest qui ne se termine pas proprement | à faire |
| ⚪ | Audit accessibilité complet | à faire |
| ⚪ | Confirmer visuellement l'ouverture du menu mobile ☰ | à faire |

### Vérifié

- Suite backend complète : 296/296.
- `tsc --noEmit` backend (`tsconfig.app.json`) et frontend : aucune
  erreur.
- Build production frontend : 338,95 Ko initial, aucun avertissement de
  budget.
- Recherche exhaustive de nouvelles routes `@Public()` : aucune.
- Recherche exhaustive de `skip`/`take` dans les services backend :
  aucun résultat, confirmant l'absence de pagination.
- Recherche exhaustive des `<text>` dans les 5 générateurs SVG :
  chaque champ utilisateur passe par `escape()` ou `wrap()`.
- Panne PostgreSQL réelle du jour (voir échange précédent) utilisée
  comme test grandeur nature du filtre d'exceptions : confirmé qu'aucun
  détail Prisma ne fuit au client en conditions réelles de panne.

---

## 2026-08-26 (suite 3) : traitement des points ouverts, priorisés par sévérité

Sur demande de l'utilisateur ("règle tous ces points"). Angular abandonné
("on reste sur la version actuelle") ; pagination et réorganisation des
dossiers frontend repoussées (projet à clôturer, pas le moment pour des
refactors larges) ; les deux points 🔴 traités.

- **Mot de passe PostgreSQL par défaut** : même traitement que
  `JWT_SECRET` (suite 4) : `docker-compose.yml` exige désormais
  `POSTGRES_PASSWORD` au démarrage. Secret réel tourné en place
  (`ALTER USER`, sans perte de données) et `.env` régénéré, puisque les
  deux secrets locaux étaient encore littéralement les placeholders de
  `.env.example`.
- **Token JWT en `localStorage`** : migré vers un cookie `access_token`
  httpOnly posé à la connexion
  ([auth-cookies.ts](../libs/shared/src/utils/auth-cookies.ts)),
  invisible en JS. L'en-tête `Authorization: Bearer` reste accepté en
  parallèle ([jwt.strategy.ts](../apps/api/src/modules/auth/jwt.strategy.ts))
  pour les clients non-navigateur (scripts, tests), le frontend Angular
  ne stockant plus le token nulle part. Protection CSRF en double
  soumission ajoutée ([csrf.guard.ts](../libs/shared/src/guards/csrf.guard.ts)) :
  cookie `XSRF-TOKEN` lisible + en-tête `X-XSRF-TOKEN` renvoyé
  automatiquement par Angular (`withXsrfConfiguration()`), vérifiés par
  un garde global sur toute mutation authentifiée par cookie. Nouvelle
  route `POST /auth/logout` (efface les deux cookies côté serveur).

### Vérifié

- Suite backend complète : 305/305 (9 tests ajoutés, aucun cassé).
- `tsc --noEmit` backend, build frontend : aucune erreur.
- En navigateur, session vidée au préalable : connexion →
  `document.cookie` ne montre que `XSRF-TOKEN`, `localStorage` sans
  trace de JWT. Création (`POST` → 201) et suppression (`DELETE` → 204)
  réelles acceptées par le garde CSRF. Déconnexion → cookies et
  `localStorage` vidés, `/dashboard` redirige vers la connexion
  (session invalidée côté serveur). Reconnexion finale pour laisser la
  session dans un état normal.

---

## 2026-08-28 : audit de clôture

Aucun code n'a changé depuis la suite 3 (2026-08-26) : ce passage
revérifie que rien n'a régressé plutôt que de refaire un audit complet
depuis zéro (déjà fait le 2026-08-26, cf. entrée "nouvel audit complet").

### État de sécurité

- 🔴 Token JWT en `localStorage` : **traité** (cookie httpOnly + CSRF,
  suite 3).
- 🔴 Mot de passe PostgreSQL par défaut : **traité** (suite 3).
- 🔴 Upload logo public, secret JWT par défaut, absence de
  rate-limiting : **traités** (suite 4, 2026-08-24).
- Il ne reste aucun point 🔴 ouvert dans ce journal.

### Dette technique assumée, pas oubliée

- 🟠 Pagination des listes backend : toujours absente. Repoussée
  délibérément le 2026-08-26 (clôture du projet le jour même, pas le
  moment pour un changement de contrat d'API touchant tous les
  services et tous les écrans consommateurs).
- 🟡 `apps/web/src/app` à plat (77 fichiers) et Angular 17 (l'utilisateur
  a choisi explicitement de ne pas migrer) : inchangés, laissés tels
  quels par décision assumée plutôt que par oubli.

### Vérifié

- Suite backend complète : 305/305, inchangé depuis suite 3.
- `tsc --noEmit` backend, build production frontend : aucune erreur,
  aucun avertissement de budget.
- Session réelle en navigateur : connexion, tableau de bord avec
  données réelles, déconnexion/reconnexion fonctionnelles.

### Conclusion de ce cycle d'audit

Sur les 5 points 🔴 sécurité identifiés le 2026-08-18, les 5 sont
traités. Les points restants (pagination, organisation des dossiers,
version d'Angular) sont des choix de dette technique assumés plutôt que
des angles morts non identifiés : la distinction compte pour la suite
du projet : ils ne sont pas "non vus", ils sont "vus et reportés", avec
la raison de chaque report tracée dans ce journal.

---

## 2026-08-28 (suite) : réorganisation de `apps/web/src/app` en dossiers par fonctionnalité

Traitement du point 🟡 laissé ouvert. Les 77 fichiers à plat sont
répartis en 23 dossiers par fonctionnalité, sur le même principe que
`apps/api/src/modules/` : `core` (bootstrap, shell, routes), `auth`,
`shared` (toast, confirm-dialog, utils), `public` (pages avant
connexion), `admin`, `dashboard`, `assistant`, puis un dossier par
étape de l'ADM TOGAF (`organisation`, `vision`, `architecture-metier`,
`donnees`, `urbanisation`, `architecture-systeme`, `technologie`,
`ecarts`, `opportunites`, `roadmap`, `mise-en-oeuvre`, `gouvernance`,
`evaluation`), plus `canevas`, `vues`, `parametres`.

Exécuté par script plutôt qu'à la main (déplacement des 77 fichiers +
réécriture automatique des chemins d'import relatifs à partir d'une
table de correspondance fichier → dossier), pour éliminer le risque
d'erreur humaine sur un changement aussi mécanique et répétitif.
`main.ts` mis à jour pour les deux imports qui pointaient dans
`app/` depuis l'extérieur.

### Vérifié

- `tsc --noEmit` (app et spec) : aucune erreur du premier coup, avant
  toute correction manuelle.
- Build développement : mêmes tailles de bundle qu'avant (aucune
  fonctionnalité perdue ou dupliquée dans le découpage en chunks).
- Suite backend complète (non concernée par ce changement) : 305/305,
  inchangé.
- Serveur de dev redémarré à froid (pas de rechargement à chaud, pour
  éliminer tout état de watcher obsolète) : session persistée par le
  cookie httpOnly, tableau de bord avec données réelles. Onglet
  navigateur neuf testé sur les routes qui traversent le plus de
  dossiers (`/architecture-systeme` → importe `urbanisation`,
  `/assistant` → importe 6 composants d'autres dossiers, `/canevas` →
  importe 4 services d'autres dossiers, `/architecture-metier` →
  importe `bpmn-vues` depuis `vision`) : aucune erreur console, contenu
  réel affiché correctement partout.
- Repéré au passage, sans lien avec ce changement : un rechargement
  complet de page (pas une navigation interne à l'app) sur
  `/admin/dashboard` renvoie le JSON 404 de l'API au lieu de la coquille
  Angular, parce que `/admin` figure aussi comme préfixe de route API
  dans `proxy.conf.json` (routes `/admin/organisations`, `/admin/stats`
  du contrôleur admin backend) et capture la requête avant qu'elle
  n'atteigne le routeur Angular. Préexistant, non déclenché par la
  navigation normale dans l'application (clic sur un lien plutôt que
  rechargement complet), donc non corrigé dans cette passe : à noter
  pour une prochaine session.

---

## 2026-08-28 : pagination des listes, backend et frontend

Traitement du second point 🟠 laissé ouvert (reporté le 2026-08-26).
Contrairement à la réorganisation des dossiers, ce changement touche un
contrat d'API consommé par des dizaines d'écrans, dont plusieurs
utilisent la même liste pour deux usages différents (tableau paginé
d'un côté, canevas interactif, export Excel, graphique agrégé ou source
de menu déroulant de l'autre). Une pagination appliquée sans discernement
aurait cassé silencieusement ces autres usages. Le travail a donc été
fait en deux temps nettement séparés : la capacité backend partout où
c'est sûr, puis le branchement frontend seulement là où c'est sûr.

### Backend : capacité de pagination, opt-in et rétrocompatible

Nouveau dans `libs/shared` : `PaginationQueryDto` (`page`, `pageSize`,
validés et bornés à 200) et `paginateFindMany()`, qui enveloppe un
appel Prisma `findMany` + `count`. Le contrat choisi : le paramètre
`pagination` est optionnel sur chaque méthode de service concernée.
Absent, la méthode renvoie exactement le tableau complet d'avant
(aucun changement de comportement pour les appelants existants).
Présent, elle renvoie `{ items, total, page, pageSize }`.

Appliqué à 16 services / une vingtaine d'endpoints : `admin`
(organisations, utilisateurs), `archimate` (éléments), `bpmn`
(processus), `donnees` (entités, relations), `evaluation` (réponses
d'enquête), `gouvernance` (politiques, changements, conformité),
`objectif`, `opportunites` (solutions, critères), `parties-prenantes`,
`roadmap`, `technologie`, `urbanisation` (applications), `membres`.

Un cas particulier a nécessité une DTO combinée plutôt qu'un
`@Query()` supplémentaire : `ValidationPipe({ whitelist: true,
forbidNonWhitelisted: true })` rejette tout paramètre de requête non
déclaré sur le DTO validé, donc un endpoint qui a déjà un filtre
(`?type=...`, `?statut=...`) en plus de la pagination a besoin d'un DTO
qui hérite de `PaginationQueryDto` et ajoute son propre champ, pas de
deux `@Query()` séparés sur la même route. Repéré avant d'écrire le
code fautif en vérifiant par avance les contrôleurs à modifier.

### Frontend : 17 écrans branchés avec un vrai pager

Un composant réutilisable (`app-pagination`) est maintenant relié au
backend sur 17 tableaux/listes à travers l'application : Admin >
Organisations, Admin > Utilisateurs, Organisation > Membres,
Organisation > Objectifs, Organisation > Parties prenantes,
Architecture métier > Capacités, Éléments et Relations, Gouvernance >
Politiques et Demandes de changement, Évaluation > Réponses, Migration
Planning > Projets, Opportunités > Solutions, Architecture des données
> Entités et Relations, Architecture Système > Applications
(Portefeuille), Architecture technologique > Composants.

Le premier passage (4 écrans : Admin Organisations/Utilisateurs,
Membres, Relations ArchiMate) avait été fait le 2026-08-26 sous
contrainte de temps, en laissant les 13 autres comme dette documentée
avec la liste des conflits d'usage double identifiés. En reprenant ce
travail, la plupart de ces conflits se sont révélés traitables avec le
même patron déjà validé plutôt que bloquants :

- **Cas le plus fréquent (11 écrans)** : la liste sert de tableau ET
  de source pour autre chose ailleurs dans l'app (menu déroulant,
  canevas interactif, export Excel, graphique, frise chronologique,
  matrice de conformité/évaluation). Résolu en gardant la méthode de
  service d'origine (non paginée) intacte pour cet autre usage, et en
  ajoutant une méthode `...Paginated()` distincte pour le tableau.
  Exemples : `capacitesAll`/`elementsAll` pour les menus déroulants du
  formulaire Relations d'Architecture métier ; `solutionsAll` pour les
  lignes de la Matrice et le graphique de comparaison dans
  Opportunités ; `politiquesAll` pour les en-têtes de colonnes de la
  matrice de conformité ; `reponsesAll` pour la note moyenne et le
  graphique d'Évaluation ; `projetsAll` pour la frise chronologique de
  Roadmap.
- **Faux conflit découvert en cours de route (4 écrans)** : Données
  (Entités/Relations), Applications (Portefeuille) et Technologie
  (Composants) avaient été classés comme bloqués par leur canevas
  interactif Konva, mais en lisant le code, le canevas de chacun
  (`donnees-canevas`, `applications-canevas`,
  `technologie-canevas.component.ts`) appelle en réalité le service
  directement et indépendamment du composant parent — il ne partage
  aucun état avec le tableau du composant parent. Paginer le tableau du
  parent n'affecte donc pas le canevas : aucun découpage de méthode
  n'était nécessaire, seulement l'ajout de `listPaginated()`.

Vérifié en navigateur sur les données réelles de K&B Groupe : Éléments
ArchiMate affiche 43 éléments sur 3 pages ; le menu déroulant
Source/Cible du formulaire Relations liste bien les 43 éléments (pas
seulement les 20 de la page affichée) ; la matrice de conformité
affiche la bonne colonne même avec une seule politique en base ; le
graphique de comparaison des notes moyennes s'affiche sans erreur avec
2 solutions ; Relations ArchiMate (22 au total) et Membres (6, sans
pager car sous `pageSize`) déjà vérifiés le 2026-08-26 restent
corrects après les changements ultérieurs.

### Dette technique assumée, pas oubliée

🟡 3 cas restent délibérément sans pagination, pour des raisons de
forme d'interface plutôt que de simple découpage de méthode :

- **Opportunités > Critères d'évaluation** : présentés comme une liste
  de puces (chips), pas un tableau ; sert aussi d'en-têtes de colonnes
  de la matrice. Le nombre de critères est structurellement petit
  (une poignée par organisation) et l'UI en puces ne se prête pas à un
  pager classique.
- **Vision > Processus BPMN** : la liste est scindée en 3 tableaux
  simultanés par catégorie (Pilotage / Métier / Support), affichés côte
  à côte. Paginer le tableau à plat brouillerait ce découpage (une page
  couperait arbitrairement une catégorie au milieu). Un vrai pager
  correct demanderait 3 paginations indépendantes (une par catégorie,
  combinant filtre de type + pagination comme pour les Éléments
  ArchiMate) : une restructuration à part entière, pas encore faite.
- **Urbanisation > Zones (hiérarchie Zone > Quartier > Îlot)** :
  structure arborescente, pas une liste à plat ; un pager n'a pas de
  sens tant que l'arbre entier n'est pas chargé pour se reconstruire.

### Vérifié

- Suite backend complète : 311/311, aucune régression (inchangée
  depuis le premier passage : ce second passage n'a modifié que du
  code frontend, aucun endpoint n'a eu besoin d'un changement backend
  supplémentaire, la capacité de pagination était déjà en place
  partout).
- `tsc --noEmit` backend et frontend : aucune erreur, après chaque
  écran branché.
- Build frontend (`ng build --configuration development`) : aucune
  erreur, tailles de bundle stables.
- Navigateur : session réelle sur les données K&B Groupe, écrans
  vérifiés en détail ci-dessus, aucune erreur console nouvelle.

---

## 2026-08-31 : conversion API First (contrat OpenAPI, versioning, client généré)

L'utilisateur a demandé si l'application était API First. Réponse à ce
moment-là : non, backend-serves-frontend classique (pas de Swagger, pas
de versioning, pas de CORS, DTOs validés mais non documentés). Il a
demandé la conversion complète, en trois paliers.

### Palier 1 : documentation OpenAPI

`@nestjs/swagger` (v11.4.7, compatible avec le Nest 11 déjà en place)
installé et configuré dans `main.ts` : `DocumentBuilder` + Swagger UI
sur `/api/docs`, schéma Bearer nommé `access-token` (seul praticable
pour « Try it out » : `CsrfGuard` laisse passer les requêtes Bearer
sans jeton CSRF, contrairement au flux cookie du frontend Angular).

Chaque DTO de requête a reçu `@ApiProperty`/`@ApiPropertyOptional` (69
classes), chaque contrôleur `@ApiTags`/`@ApiOperation`/`@ApiBearerAuth`
(24 contrôleurs, 140 endpoints). Travail mécanique volumineux, réparti
sur 7 agents en parallèle par groupe de modules.

Un deuxième passage a documenté les réponses (`@ApiOkResponse` /
`@ApiCreatedResponse` / `@ApiNoContentResponse`), avec création d'une
classe « entity » par forme de réponse réellement renvoyée par chaque
service (vérifiée contre la clause Prisma `include`/`select` du
service, pas devinée) : sans ça, un client généré depuis le contrat
n'aurait eu que des retours `void`. À nouveau réparti sur 7 agents.

Un décorateur partagé `ApiPaginatedResponse` (`libs/shared`) documente
la pagination opt-in en texte plutôt qu'en second schéma JSON : OpenAPI
3 ne permet pas d'attacher deux schémas à un seul code 200 sur une même
opération sans un `oneOf` qui forcerait chaque appel généré à
discriminer `Array.isArray(...)`, y compris les appels qui n'utilisent
jamais la pagination. Le contrat documenté et généré reste donc le
tableau complet ; le mode paginé (`{items,total,page,pageSize}`) est
décrit en prose et récupéré côté client par un cast explicite.

Deux bugs réels trouvés et corrigés après coup, pas seulement des
détails cosmétiques :
- **Collision de noms** : `admin/entities/organisation.entity.ts` et
  `organisation/entities/organisation.entity.ts` définissaient chacun
  une classe `OrganisationEntity` différente. Swagger indexe ses schémas
  par nom de classe à travers toute l'appli : la seconde écrasait
  silencieusement la première dans le document généré. Renommée en
  `SuperAdminOrganisationEntity` côté admin.
- **Types nullable non inférés** : `@ApiPropertyOptional({..., nullable:
  true })` sans `type:` explicite sur un champ `string | null` produit
  un schéma vide `{}` (la métadonnée `design:type` de TypeScript ne
  distingue pas les membres d'un type union). Touchait 89 champs dans 31
  fichiers `entities/dto`, à cause d'un exemple donné aux agents qui
  omettait `type:`. Corrigé par un script Node ciblé plutôt qu'une
  nouvelle passe d'agents, avec re-scan de zéro occurrence restante.

### Palier 2 : versioning et CORS

Toutes les routes sont passées sous `/api/v1` (`app.setGlobalPrefix`),
`/uploads` reste hors préfixe (fichiers statiques, en dehors du routeur
Nest). CORS explicite (`app.enableCors`) avec origine configurable via
`FRONTEND_ORIGIN` (`.env`, défaut `http://localhost:4201`) et
`credentials: true` pour le cookie de session.

Côté frontend, `proxy.conf.json` a d'abord reçu un `pathRewrite` par
route pour absorber le nouveau préfixe sans toucher au code (27
entrées), puis a été simplifié à deux entrées (`/api/v1` en
passthrough, `/uploads`) une fois la migration du palier 3 terminée et
plus aucun appel ne visant les anciennes routes à plat.

### Palier 3 : client Angular généré depuis le contrat

`ng-openapi-gen` génère un client dans `apps/web/src/app/api-client/`
(157 modèles, 24 groupes de fonctions, une fonction par endpoint) à
partir de `http://localhost:3000/api/docs-json`, régénérable via
`npm run generate:api-client`. Choisi plutôt qu'openapi-generator car
il émet des fonctions qui prennent `HttpClient` en paramètre : l'
intercepteur d'authentification existant (cookie, redirection sur 401)
et la config XSRF d'Angular continuent de fonctionner sans changement.

Les 22 services `*.service.ts` qui appelaient `HttpClient` directement
sont devenus des enveloppes fines autour de ce client généré, sans
changer un seul nom de méthode ni de type exporté exposé aux
composants (aucun fichier composant modifié). Pattern systématique :
- Types réexportés en alias du modèle généré quand la forme correspond
  exactement (`export type Objectif = ObjectifEntity`).
- Interface manuscrite conservée telle quelle quand le modèle généré
  diverge (champ requis côté généré mais optionnel en réalité, ou
  inverse) plutôt que de forcer un alias trompeur ; plusieurs cas réels
  rencontrés et documentés dans le code (ex. `ApplicationEchange` dans
  `urbanisation.service.ts`, `BpmnProcessus`/`BpmnElement` dans
  `bpmn.service.ts` à cause de formes différentes selon l'endpoint).
- Méthode paginée : cast `r.body as unknown as Paginated<X>`, seule
  incohérence assumée entre le contrat documenté (tableau) et le
  comportement réel opt-in.

Migration faite par 13 agents en parallèle au total (répartis en deux
vagues : la première a échoué à mi-parcours sur une limite de session,
mais les fichiers déjà écrits avant l'échec étaient corrects et
compilaient ; la seconde vague a repris exactement là où la première
s'était arrêtée sans dupliquer de travail).

### Vérifié

- Suite backend complète : 311/311, aucune régression sur l'ensemble
  du travail (annotations Swagger, renommage, correctifs de type,
  versioning, CORS).
- `tsc --noEmit` backend et frontend : aucune erreur, y compris sur le
  client généré (157 modèles) et les 22 services réécrits.
- `ng build --configuration development` : aucune erreur, tailles de
  bundle stables.
- `POST /api/v1/auth/login` avec les identifiants K&B Groupe, jeton
  Bearer obtenu et utilisé pour appeler un endpoint protégé et une
  mutation (POST) : confirme que Swagger UI est réellement utilisable
  pour « Try it out » et que Bearer contourne bien le CSRF comme prévu.
- Navigateur, session réelle K&B Groupe : connexion/déconnexion/
  reconnexion, tableau de bord, Vision (BPMN : liste, sélection d'un
  processus, éditeur de canevas, diagramme de vision), Architecture
  métier (Relations paginées sur 22 lignes/2 pages, menu déroulant
  Source/Cible avec les 43 éléments complets malgré la pagination du
  tableau), Gouvernance (matrice de conformité, rapport agrégé, cycle
  complet créer/supprimer une politique), Opportunités (matrice
  d'évaluation, graphique), Données (entités avec attributs imbriqués,
  relations avec source/cible résolus), Architecture Système
  (portefeuille d'applications, éditeur de diagramme d'architecture
  applicative), Architecture technologique (composants avec
  déploiements imbriqués et leur application), Migration Planning
  (frise chronologique), Organisation (membres, structures,
  génération d'organigramme, identité, parties prenantes) : toutes les
  routes migrées vérifiées avec de vraies données, aucune régression.

---

## 2026-08-31 (suite) : audit du chantier API First

Nouvel audit demandé juste après la conversion API First, spécifiquement
pour chercher ce qu'un chantier aussi large (135 fichiers touchés, 12
agents en parallèle sur deux vagues) aurait pu introduire comme
anomalie sans que la vérification fonctionnelle du moment ne le voie.
Cinq angles creusés en parallèle : sécurité, qualité du client généré,
qualité de la migration frontend, performance/bundle, tests et code
mort. Aucun point 🔴 trouvé.

### Points forts confirmés

- Aucune collision de nom de classe restante (la seule trouvée,
  `OrganisationEntity`, a été corrigée pendant le chantier lui-même).
- Aucun schéma Swagger vide restant (vérifié en interrogeant
  `/api/docs-json` directement, 158 schémas, zéro `properties: {}`).
- Bundle stable (1.39 Mo initial, inchangé), tree-shaking du client
  généré confirmé correct (aucune fonction importée depuis le barrel
  `functions.ts`, ce qui aurait tout embarqué d'un coup).
- Gestion d'erreur HTTP inchangée : les fonctions générées ne font
  qu'un `filter`/`map` sur les événements de progression, aucun
  `catchError` qui avalerait une erreur silencieusement.
- `HttpExceptionFilter` toujours étanche (aucune fuite de stack trace
  ou de détail Prisma), indépendant des changements récents.
- Suite de tests intacte (311/311) : les classes "entity" Swagger sont
  purement déclaratives (jamais instanciées, jamais retournées par un
  handler), donc structurellement incapables de casser un test qui
  passait déjà.

### 🟠 Important

1. **`ApplicationEchange` : le cast masque une vraie divergence
   backend/type** (`apps/web/src/app/urbanisation/urbanisation.service.ts`).
   `createEchange()` renvoie la réponse brute de
   `prisma.applicationEchange.create({ data: dto })` côté backend
   (`apps/api/src/modules/urbanisation/urbanisation.service.ts:219`),
   **sans** `include: { source, target }` : les champs `source`/`target`
   sont donc réellement absents (`undefined`) sur la réponse de
   création. Le type généré (`EchangeEntity`) le reflète correctement
   en les marquant optionnels, mais le service frontend les caste
   `as unknown as ApplicationEchange`, un type manuscrit qui les exige
   non-nuls, pour rester compatible avec `listEchanges()` (qui, lui,
   a bien l'`include` et renvoie ces champs). Ce défaut existait déjà
   avant la migration (l'ancien code faisait
   `this.http.post<ApplicationEchange>(...)`, même optimisme), donc ce
   n'est pas une régression, mais le cast le rend maintenant invisible
   au typage : le seul appelant actuel
   (`applications-canevas.component.ts:541-553`) ignore la réponse et
   recharge la liste, donc aucun impact aujourd'hui, mais un futur appel
   qui lirait `result.source.nom` juste après une création plantera.
   Correction propre : ajouter l'`include` manquant côté backend
   (aligner `createEchange` sur `listEchanges`), ou distinguer un type
   de retour dédié pour la création.
2. **Même risque, latent, sur `admin.service.ts`** :
   `AdminOrganisationActionResultEntity.organisation` (renvoyé par
   valider/rejeter) est un `SuperAdminOrganisationEntity` sans `_count`,
   casté vers `OrganisationAdmin` qui l'exige. Sans impact actuel (le
   seul appelant ne lit que `.email`), même remède si un jour un
   composant lit `_count` sur ce résultat.

### 🟡 À planifier

1. **CORS sans échec explicite si `FRONTEND_ORIGIN` est absent**
   (`apps/api/src/main.ts`) : retombe silencieusement sur
   `http://localhost:4201` au lieu de refuser de démarrer, contrairement
   à `requireJwtSecret` qui lui est strict. Sans risque de sécurité
   direct (une origine de repli restrictive n'ouvre rien), mais un
   oubli de configuration en production se traduirait par un frontend
   bloqué sans message clair plutôt que par un échec de démarrage
   explicite.
2. **`/api/docs` et `/api/docs-json` ne passent pas par le
   `ThrottlerGuard`** : Swagger monte ses routes directement sur
   l'adaptateur HTTP, hors du pipeline de guards Nest. Voulu pour
   l'authentification (doc publique, cohérent), mais signifie aussi
   qu'aucune limite de débit ne s'applique à ces deux routes. Risque
   faible (endpoints de lecture seule, pas de calcul lourd), mais à
   surveiller si la doc devient une cible de scraping.
3. **13 des 140 fonctions générées ne sont appelées par aucun
   service**, dont `GET /api/v1/auth/me`
   (`apps/api/src/modules/auth/auth.controller.ts`) : le frontend
   restaure l'utilisateur courant depuis `localStorage` sans jamais
   revalider auprès du serveur au chargement de page. Les 12 autres
   sont des `findOne` par id jamais utilisés par une UI qui ne
   travaille qu'en listes. Ni bug ni régression, mais vaut la peine de
   décider explicitement : endpoint mort à retirer, ou fonctionnalité
   de revalidation à ajouter (recommandé pour `/auth/me`, pour détecter
   une session serveur expirée ou un compte désactivé côté serveur
   sans attendre le prochain appel API qui échoue).
4. **Incohérence de nommage FR/EN dans le module admin** :
   `AdminUtilisateurOrganisationRefEntity` (français) et
   `AdminOrganisationUserRefEntity` (anglais) pour un concept
   symétrique, créées par le même agent. Purement cosmétique, à
   uniformiser sur le français au prochain passage dans ce module.
5. **Un cast non commenté** dans
   `apps/web/src/app/auth/auth.service.ts` (`uploadLogo`) : contrairement
   aux casts similaires d'`admin.service.ts`/`urbanisation.service.ts`
   qui expliquent pourquoi, celui-ci ne dit pas que c'est pour lever le
   `| null` de `StrictHttpResponse`. Cosmétique, à documenter ou
   remplacer par `r.body!`.
6. **Confirmation d'une dette déjà connue** : `health.controller.ts`
   reste sans `@ApiOkResponse` (seul contrôleur dans ce cas), et 13
   contrôleurs sur 22 n'ont toujours pas de `*.controller.spec.ts`
   dédié (couverture faite au niveau service dans ce projet, pattern
   préexistant, pas une régression du chantier Swagger).
7. **Doublon de requêtes `list()`/`listPaginated()` confirmé
   préexistant, pas aggravé** : plusieurs composants
   (`gouvernance.component.ts`, `opportunites.component.ts`) chargent
   les deux variantes en parallèle au démarrage (une pour les
   statistiques/la matrice, une pour le tableau paginé). Daté du
   commit `pagination`, antérieur à ce chantier ; reste un vrai sujet
   de perf à traiter séparément (dériver les stats du tableau, ou
   fournir un agrégat côté backend).

### Vérifié

- `npx jest --silent` : 311/311, inchangé.
- Recherche exhaustive de classes dupliquées sur tout `apps/api/src` et
  `libs/shared/src` : aucune.
- Interrogation directe de `/api/docs-json` (158 schémas) : aucun
  schéma vide.
- `ng build --configuration development` : 1.39 Mo initial, stable.
- CsrfGuard : le contournement Bearer confirmé sûr (un site tiers ne
  peut pas forcer l'ajout d'un en-tête `Authorization` sur une requête
  cross-site sans déclencher un preflight CORS, lui-même bloqué par
  l'origine unique configurée).
- `uploadLogo` : confirmé fonctionnel malgré le typage généré `Blob`
  (un `File` du DOM hérite de `Blob`, le nom de fichier est préservé
  par le navigateur au moment de la construction du `FormData`).

### Corrections apportées le jour même

Tous les points 🟠 et une partie des points 🟡 de cet audit ont été
corrigés dans la foulée plutôt que reportés :

- **`createEchange` (🟠)** : ajout de l'`include: { source, target }`
  manquant sur le `prisma.applicationEchange.create()`
  (`apps/api/src/modules/urbanisation/urbanisation.service.ts`),
  aligné sur `listEchanges`. `EchangeEntity.source`/`target` sont
  passés de facultatifs à requis en conséquence. Côté frontend,
  `ApplicationEchange` devient un simple alias du type généré, les
  deux casts `as unknown as` disparaissent. Vérifié par un appel API
  réel : création d'un échange, `source.nom`/`target.nom` bien
  présents dans la réponse, nettoyé ensuite.
- **`valider`/`rejeter` (🟠)** : ajout de l'`include: { _count: {
  select: { users: true } } }` manquant sur les deux
  `prisma.organisation.update()`
  (`apps/api/src/modules/admin/admin.service.ts`), aligné sur
  `listOrganisations`. Nouvelle entité
  `SuperAdminOrganisationWithCountEntity` pour documenter cette forme
  exacte. Côté frontend, `OrganisationActionResult` devient un alias
  direct, les deux casts disparaissent. Vérifié par un appel API réel
  en tant que superadmin (`rejeter` sur une organisation de test) :
  `_count.users` bien présent dans la réponse.
- **CORS sans échec explicite (🟡)** : nouvel utilitaire
  `requireFrontendOrigin` (`libs/shared/src/utils/require-frontend-origin.ts`),
  même principe que `requireJwtSecret` : l'API refuse de démarrer si
  `FRONTEND_ORIGIN` est absent, au lieu de retomber sur
  `localhost:4201`.
- **Swagger non limité en débit (🟡)** : limiteur maison en mémoire
  (`libs/shared/src/middleware/simple-rate-limit.middleware.ts`, pas
  de Redis dans cette stack) posé sur `/api/docs` et `/api/docs-json`
  (60 requêtes/minute, budget partagé entre les deux). Bug trouvé et
  corrigé en le testant : `app.use('/api/docs', ...)` seul ne couvre
  pas `/api/docs-json` (Express exige une frontière de segment `/`
  après le préfixe, absente entre « docs » et « -json »), d'où le
  montage explicite sur les deux chemins. Vérifié par bombardement de
  65 requêtes : 429 déclenché exactement à la 60ᵉ sur chacune des deux
  routes.
- **`GET /auth/me` jamais appelé (🟡)** : nouvelle méthode
  `AuthService.refreshMe()` (`apps/web/src/app/auth/auth.service.ts`),
  appelée une fois au démarrage de l'app
  (`apps/web/src/app/core/app.component.ts`) quand un utilisateur est
  déjà en mémoire via `localStorage`. Revalide la session en
  arrière-plan sans bloquer le rendu ; une réponse 401 déclenche une
  déconnexion locale, toute autre erreur (réseau, etc.) est ignorée
  pour ne pas déconnecter l'utilisateur sur un problème transitoire.
  Vérifié : un appel `GET /api/v1/auth/me` part bien automatiquement
  au chargement de l'app.
- **Incohérence FR/EN dans le module admin (🟡)** : `AdminOrganisationUserRefEntity`
  renommée en `AdminUtilisateurRefEntity`, cohérente avec
  `AdminUtilisateurOrganisationRefEntity` du même module.
- **Cast non commenté dans `uploadLogo` (🟡)** : supprimé purement et
  simplement (`apps/web/src/app/auth/auth.service.ts`) ; le type
  généré correspondait déjà exactement, le cast ne servait à rien.
- **`health.controller.ts` sans doc de réponse (🟡)** : `@ApiOkResponse`
  et nouvelle `HealthCheckResultEntity` ajoutées, pour cohérence avec
  les 23 autres contrôleurs.

Volontairement non traités maintenant, car explicitement qualifiés de
dette antérieure au chantier API First et à traiter séparément dans
cet audit même : le doublon de requêtes `list()`/`listPaginated()`
dans `gouvernance.component.ts`/`opportunites.component.ts`, et
l'absence de `*.controller.spec.ts` sur 13 contrôleurs (stratégie de
test du projet, pas une régression).

### Vérifié (corrections)

- `npx jest --silent` : 311/311 après mise à jour des deux assertions
  `admin.service.spec.ts` qui vérifiaient l'appel Prisma exact
  (ajout de l'`include` attendu).
- `tsc --noEmit` backend et frontend : aucune erreur.
- `ng build --configuration development` : 1.39 Mo initial, stable.
- Spec OpenAPI régénérée puis client Angular régénéré : `EchangeEntity`
  a bien `source`/`target` requis, `SuperAdminOrganisationEntity` a
  disparu du spec (attendu : plus aucun endpoint ne la référence
  directement, elle reste inlinée dans ses deux sous-types via
  l'héritage TypeScript, comportement normal de `@nestjs/swagger`,
  pas une régression).

## 2026-08-31 (suite 2) : mise en place de la CI

Demande explicite : automatiser ce que la boucle de vérification de ce
chantier a toujours fait à la main (tests, typecheck, build), pour ne
plus dépendre de le redemander à chaque changement.

### Mise en place

- `.github/workflows/ci.yml` : deux jobs indépendants sur `push`/`pull_request`
  vers `main`, `api` et `web`, chacun `typecheck` → `test` → `build`.
- `npm run typecheck` ajouté côté racine (`tsc -p apps/api/tsconfig.app.json
  --noEmit`) et côté `apps/web` (`tsc -p tsconfig.app.json --noEmit`) :
  scripts qui n'existaient pas encore, alors que c'est la commande la
  plus rejouée à la main tout au long de ce journal.
- Job `api` : variables d'environnement factices (`JWT_SECRET`,
  `FRONTEND_ORIGIN`, `DATABASE_URL`) posées juste pour satisfaire
  `requireJwtSecret`/`requireFrontendOrigin` et `prisma generate` ; les
  311 tests mockent Prisma et ne se connectent à aucune vraie base,
  donc pas de service Postgres en CI pour l'instant (à revoir seulement
  si des tests d'intégration/e2e apparaissent un jour).
- Job `web` : nouveau script `test:ci` (`ng test --watch=false
  --browsers=ChromeHeadlessCI`) et un `customLauncher` dédié dans
  `karma.conf.js` (`--no-sandbox --disable-gpu`, nécessaire en
  conteneur CI).

### Bugs trouvés en vérifiant la CI localement

- **`karmaConfig` absent de `angular.json` (🟠, propre à la CI)** :
  `angular.json` ne référençait aucun `karmaConfig` sur la cible
  `test`, donc le builder Angular ignorait totalement `karma.conf.js`
  et le `customLauncher` fraîchement ajouté n'était jamais chargé
  (« Cannot load browser "ChromeHeadlessCI": it is not registered »).
  Corrigé en ajoutant `"karmaConfig": "karma.conf.js"` aux options de
  la cible `test`.
- **`app.component.spec.ts` cassé depuis le chantier API First (🟠,
  trou de la boucle de vérification)** : en exécutant réellement
  `ng test` pour la première fois de tout ce chantier (la boucle de
  vérification habituelle s'arrêtait à `tsc --noEmit` + `ng build`,
  jamais aux tests unitaires Angular), le seul spec Angular du projet
  échouait avec `NullInjectorError: No provider for HttpClient!`.
  Cause : l'ajout de `AuthService.refreshMe()` dans `AppComponent`
  (entrée précédente, le jour même) fait désormais dépendre
  `AppComponent` de `HttpClient` via `AuthService`, sans que le
  `TestBed` du spec ne le fournisse. Corrigé en ajoutant
  `provideHttpClient()`/`provideHttpClientTesting()` aux providers du
  test. Une vraie régression fonctionnelle introduite plus tôt dans la
  journée, invisible tant que personne ne lançait `ng test`.

### Constat honnête, pas corrigé maintenant

`apps/web/src/app/core/app.component.spec.ts` est **l'unique fichier de
spec de tout le frontend Angular** : c'est le stub généré par défaut
par `ng generate`, jamais complété. Autrement dit, la couverture de
test frontend est quasi nulle, à l'opposé du backend (311 tests,
44 suites). La CI rejouera ce seul test à chaque push, mais elle ne
protège aujourd'hui contre pratiquement aucune régression côté
composants/services Angular. 🟡 à traiter dans un futur audit dédié,
distinct de la mise en place de la CI elle-même.

### Vérifié

- `npx prisma generate` avec les variables factices de CI : OK.
- `npm run typecheck` (racine, backend) : aucune erreur.
- `npm test` (racine, backend) : 311/311, avec uniquement les
  variables d'environnement factices de CI (pas de `.env` local).
- `npm run build` (racine, backend, `nest build api`) : OK.
- `npm run typecheck` (`apps/web`) : aucune erreur.
- `npm run test:ci` (`apps/web`, ChromeHeadlessCI) : 1/1 après le
  correctif du spec.
- `npm run build` (`apps/web`, `ng build`) : bundle initial ~346 Ko
  brut / ~97 Ko transféré, généré sans erreur.

## 2026-08-31 (suite 3) : couverture de tests (contrôleurs backend + services frontend) et doublon de requêtes

Traitement des 3 points de dette explicitement laissés ouverts par les
deux entrées précédentes : le doublon `list()`/`listPaginated()`, les
13 contrôleurs backend sans `*.controller.spec.ts`, et la couverture
frontend quasi nulle (un seul spec dans tout `apps/web`).

### Doublon de requêtes : traité partiellement, par examen au cas par cas

En relisant `gouvernance.component.ts` et `opportunites.component.ts`,
le doublon `list()`/`listPaginated()` s'est révélé moins large que
l'audit précédent ne le laissait penser : `politiquesAll`
(gouvernance) et `solutionsAll` (opportunites) sont réellement
nécessaires en plus de la liste paginée, car ils alimentent une
matrice/un graphique qui ont besoin de l'ensemble des lignes, pas
d'une page. Seul `changementsAll` (gouvernance, onglet Rapport) était
un vrai doublon évitable : il ne servait qu'à calculer deux nombres
(total, nombre "en cours").

Corrigé en ajoutant un agrégat côté backend plutôt qu'en chargeant la
liste complète :
- `GET /demandes-changement/stats` (`changement.controller.ts`,
  `changement.service.ts`) : deux `count()` Prisma (total, et
  `statut IN (PROPOSE, APPROUVE)`), nouvelle
  `ChangementStatsEntity`.
- Client Angular régénéré, `ChangementService.list()` remplacé par
  `stats()`, `GouvernanceComponent` n'a plus de champ `changementsAll`
  ni de `loadChangementsAll()`.

`politiquesAll`/`solutionsAll` sont volontairement laissés tels quels :
ce n'est pas un doublon à corriger, c'est un besoin fonctionnel réel.

### Contrôleurs backend : les 13 manquants sont maintenant couverts

Travail délégué à des agents en parallèle (gabarit imposé :
`changement.controller.spec.ts` et `vision-canvas.controller.spec.ts`
existants). Deux vagues ont été nécessaires : la première (13 tâches
lancées d'un coup) a échoué à mi-parcours sur une limite de session
API, la seconde (4 puis 3 tâches, par prudence) a fini le travail.
Résultat : `admin`, `archimate`, `architecture-applicative`, `bpmn`,
`canevas`, `donnees`, `health`, `parties-prenantes`, `roadmap`,
`service`, `technologie`, `uploads`, `urbanisation` ont chacun leur
spec HTTP désormais. Suite backend : 44 → 57 suites, 311 → 463 tests.

**Bug trouvé et corrigé (dans les tests, pas le code de prod)** :
`donnees.controller.spec.ts` et `bpmn.controller.spec.ts` utilisaient
des UUID factices du type `11111111-1111-1111-1111-111111111111`,
syntaxiquement proches d'un UUID mais invalides au sens strict RFC
4122 (le nibble de variante, 17ᵉ caractère, doit être 8/9/a/b ; ici
c'était `1`). `class-validator`/`@IsUUID()` les rejetait avec un 400
inattendu. Corrigé en changeant ce caractère (`...-8111-...`).

**Anomalies de conception notées, non corrigées** (signalées par les
agents, à trancher séparément) : `CanevasController`, `ArchimateController`
et `UrbanisationController` n'ont aucun `@UseGuards(RolesGuard)` /
`@Roles(...)`, contrairement à la plupart des autres contrôleurs
d'écriture. Le seul filtre actuel est l'effet de bord de
`requireOrganisationId()` (403 si `organisationId` est `null`, ce qui
n'arrive qu'aux Superadmins) : aucun rôle authentifié avec une
organisation n'est donc actuellement empêché de créer/modifier/supprimer
sur ces 3 ressources. À vérifier si c'est voulu.

### Services frontend : passage d'1 à 24 fichiers de spec

Un gabarit (`changement.service.spec.ts`, `TestBed` +
`provideHttpClient()`/`provideHttpClientTesting()` +
`HttpTestingController`, URLs vérifiées contre les `.PATH` des
fonctions générées) écrit à la main puis répliqué par agents sur les
23 autres services (dont les 2 sans HTTP, `toast.service.ts` et
`confirm-dialog.service.ts`, adaptés à leur propre logique). `auth.service.ts`
et `urbanisation.service.ts` traités individuellement (état/`localStorage`
pour le premier, 19 méthodes pour le second). Suite frontend : 1 → 161
tests, tous verts, deux exécutions consécutives sans flakiness.

**Bug de compilation trouvé et déjà résolu en cours de route** : une
version intermédiaire de `urbanisation.service.spec.ts` avait un mock
`EchangeEntity` sans `createdAt` (champ requis par le modèle généré) ;
corrigé par l'agent qui l'a écrit avant la fin de sa propre
vérification, confirmé propre par une exécution indépendante après
coup.

**Tiret cadratin trouvé dans 5 fichiers neufs** (`architecture-applicative.controller.spec.ts`,
`bpmn.controller.spec.ts`, `donnees.controller.spec.ts`,
`roadmap.controller.spec.ts`, `service.controller.spec.ts`) : les
agents avaient fidèlement recopié le tour de phrase « (200) — lecture
ouverte » déjà présent dans le gabarit imposé (`objectif.controller.spec.ts`),
antérieur à la convention du projet. Remplacé par « (200) : lecture
ouverte » dans ces 5 fichiers neufs uniquement ; le gabarit existant et
les dizaines d'autres occurrences historiques de tirets cadratins dans
le reste du code n'ont pas été touchées (hors périmètre de cette
session, pas une régression introduite ici).

### Incident en cours de route : connexion utilisateur cassée (500)

Pendant ce chantier, l'utilisateur a signalé un vrai 500 sur
`POST /auth/login`. Diagnostic immédiat par lecture des logs du
serveur de dev : `PrismaClientKnownRequestError`, "Authentication
failed against the database server". Cause : lors d'un redémarrage
précédent du serveur (pour régénérer le client OpenAPI après l'ajout
de `getStats`), le mot de passe PostgreSQL exporté à la main était
celui, générique, de `.env.example` (`ChangeMeSecurely`) et non le
vrai mot de passe du `.env` local. Corrigé en relançant le serveur
sans écraser les variables d'environnement (lecture normale du
`.env`). Vérifié par un appel direct à `/auth/login` (401 sur des
identifiants inconnus, plus de 500).

**Deuxième incident, enchaîné** : le serveur de dev tournait en mode
`--watch` (`nest start --watch`) pendant que plusieurs agents
ajoutaient des fichiers sous `apps/api/src`, provoquant des
recompilations en rafale. Le bug de watch-mode déjà documenté le
2026-08-26 (`tree-kill` qui échoue à libérer le port avant le
rebind, `EADDRINUSE`) s'est reproduit plusieurs fois, jusqu'à un
véritable crash du processus (plus de simple ralentissement). Corrigé
en basculant sur une instance sans `--watch` (`npm run start`) le
temps que les agents terminent d'écrire des fichiers de test, stable
depuis. Ce bug de watch-mode reste un point de dette non résolu à la
racine (voir entrée du 2026-08-26), seulement contourné ici.

### Vérifié

- Backend : `npm run typecheck`, `npx jest --silent` (57 suites, 463
  tests), `npm run build` : tout propre.
- Frontend : `npm run typecheck`, `npm run test:ci` exécuté deux fois
  de suite (161/161 les deux fois, pas de flakiness résiduelle),
  `npm run build` : tout propre.
- `/api/v1/auth/login` : 401 sur identifiants invalides (confirmé
  après correctif, sur l'instance sans `--watch`).

## 2026-08-31 (suite 4) : refonte UX des écrans de diagramme

Demande utilisateur en 8 points sur l'ergonomie des modules de diagramme
(assistant renommé, boutons de téléchargement, export du diagramme de
vision, affichage automatique, fusion éditeur/diagramme, diagramme de
déploiement). Traité directement, sans plan intermédiaire, avec
vérification navigateur à chaque étape.

### 1. Renommage « Assistant d'architecture » → « Révision »

`apps/web/src/app/core/app-shell.component.ts` : libellé de navigation
changé, icône `wand` (baguette) remplacée par `search` (loupe, déjà
présente dans le jeu d'icônes). Le fil d'Ariane utilise le même libellé
que la nav, donc corrigé du même coup. Route et composant (`/assistant`,
`WizardComponent`) inchangés. Vérifié en navigateur, connecté.

### 2 et 4. Un seul bouton de téléchargement, diagramme affiché sans clic

Nouveau composant partagé `apps/web/src/app/shared/download-menu.component.ts`
(`<app-download-menu [formats]="..." (download)="...">`) : un bouton
unique avec menu déroulant de formats, remplace partout la paire
« Exporter SVG » / « Exporter PNG ». Appliqué aux 5 écrans identifiés
avec ce doublon (recherche exhaustive faite au préalable, voir
ci-dessous) :
- `architecture-systeme/applications.component.ts` : diagramme de
  composants ET diagramme d'architecture applicative.
- `architecture-metier/architecture-metier.component.ts` : diagramme
  ArchiMate.
- `architecture-metier/bpmn-vues.component.ts` : viewer BPMN (en plus,
  `select()` génère maintenant le diagramme immédiatement au lieu
  d'effacer l'affichage).
- `vues/vues.component.ts` : ses 3 onglets (ArchiMate/Organigramme/POS).

Sur ces 5 écrans, la génération se déclenche désormais automatiquement
(`ngOnInit`, ou à la sélection d'un processus/onglet) : le bouton
« Générer » devient « Rafraîchir le diagramme » et ne sert plus qu'à
recalculer après une modification. Les boutons « Effacer » ont été
retirés (plus de sens dans un modèle où le diagramme est toujours
affiché). Petit nettoyage au passage : les noms de fichiers exportés
n'avaient pas tous d'extension (`'diagramme-de-composants'` sans
`.svg`/`.png`) — uniformisé partout.

**Pas touché, volontairement** : `donnees-canevas.component.ts` et
`technologie-canevas.component.ts` (canevas Konva déjà « live », sans
bouton Générer ni export car aucune génération SVG backend n'y est
câblée) ; `canevas/canevas.component.ts` (déjà un seul bouton PNG,
implémentation propre à lui, pas le doublon visé par la demande).

### 3. Export du diagramme de vision (PDF/CSV/Excel)

Constat en explorant `vision/vision.component.ts` : l'onglet
« Diagramme de vision » n'est pas un diagramme SVG mais une grille de
8 blocs de texte (façon Business Model Canvas) — il n'avait
strictement aucun export, ni bouton de téléchargement. Ajouté :
- `downloadCsv()` et `downloadPdf()` dans `shared/download.util.ts`
  (le PDF utilise la nouvelle dépendance `jspdf@^4.2.1`, texte simple
  avec retour à la ligne automatique, pas de mise en page graphique).
- `VisionComponent.exportVision(format)` : PDF via `downloadPdf`, CSV
  via `downloadCsv`, Excel via `exportToExcel` (déjà utilisé ailleurs
  dans ce même fichier pour les exigences).
- Le même `<app-download-menu>` que les diagrammes SVG, configuré
  avec les formats `pdf`/`csv`/`excel` au lieu de `svg`/`png`.

### 5. « Diagramme UML » → « Diagramme de classe »

`apps/web/src/app/donnees/donnees.component.ts` : simple renommage de
libellé d'onglet. Recherche faite pour les autres mentions de UML dans
le code (`archimate`/`urbanisation`/`technologie`) : ce sont des
commentaires décrivant d'autres types de diagrammes (composants,
déploiement), sans rapport, non touchés.

### 6. Champs du formulaire « Ajouter une application » vs colonnes de la liste

Ambiguïté initiale : le formulaire de création
(`architecture-systeme/applications.component.ts`) n'a que
Nom/Description ; les 3 colonnes supplémentaires de la liste
(Services, Liens, Affectations) sont des compteurs de relations gérés
depuis d'autres écrans (fiche application, canevas de composants,
module urbanisation), donc structurellement impossibles à renseigner
à la création. Question posée à l'utilisateur plutôt que deviné :
réponse = simplifier la liste plutôt qu'enrichir le formulaire.

Colonnes « Services », « Liens » et « Affectations » retirées du
tableau du Portefeuille : ne restent que Nom/Description, identiques
au formulaire de création/modification. Ces informations restent
consultables en détail depuis la fiche application (bouton
« Consulter »), qui les affichait déjà explicitement. `linkCount()`
supprimé (méthode devenue sans appelant).

### 7. Fusion éditeur/diagramme généré

Recherche exhaustive (agent dédié) : le couple exact de sous-onglets
« Éditeur » / « Diagramme généré » n'existe que dans
`applications.component.ts` (diagramme de composants et architecture
applicative) ; les autres modules soit n'ont pas d'éditeur canevas
(ArchiMate : 3 onglets CRUD formulaire), soit sont déjà un canevas
unique sans onglet séparé (données, déploiement technologique, BPMN
dans le module Vision).

Pour les deux paires concernées : sous-onglets supprimés, l'éditeur
(canevas Konva, avec ou sans palette) s'affiche désormais directement,
suivi en dessous d'une section « diagramme généré » qui se charge
automatiquement (point 4) et se rafraîchit à chaque modification du
canevas (`(changed)` déjà émis par les deux composants canevas,
maintenant câblé pour déclencher `generateDiagramme()`/`generateArchi()`
en plus du rechargement de la liste).

### 8. Conformité UML du diagramme de déploiement

`technologie/technologie-canevas.component.ts` (rendu Konva
entièrement frontend, aucune génération SVG backend pour ce module) :
trois écarts identifiés par rapport à la norme UML2 (OMG UML
Superstructure) et corrigés :
- **Stéréotype de nœud invalide** : « nœud » seul n'est pas un
  stéréotype UML valide (Node est déjà la métaclasse). Remplacé par
  «device» pour le matériel physique (Serveur, Réseau) et
  «execution environment» pour un environnement d'exécution logique
  (Cloud, Base de données, Middleware).
- **Mauvaise métaclasse pour les applications déployées** : elles
  étaient dessinées comme des Composants (icône à deux encoches,
  stéréotype «component» implicite). Un livrable déployé sur un nœud
  est un Artefact en UML2 : nouvelle icône (rectangle à coin plié,
  façon document) et stéréotype «artifact» explicite.
- **Relation nœud→artefact non conforme** : simple trait pointillé
  sans sémantique. Remplacé par une dépendance de déploiement en
  bonne et due forme : flèche pointillée à pointe ouverte, étiquetée
  «deploy».
- **Non traité, nécessite un changement backend** : les vrais chemins
  de communication UML (association entre deux Nœuds, représentant
  une liaison réseau/physique) sont absents du diagramme — aucune
  relation nœud-à-nœud n'est modélisée aujourd'hui. Une piste
  existante mais non exploitée : dériver ces chemins des échanges
  applicatifs (`ApplicationEchange`) entre applications hébergées sur
  des nœuds différents ; nécessite de charger le détail complet de
  chaque application déployée (`échangesSource`/`échangesTarget`),
  actuellement absent de `GET /applications` (liste) et disponible
  seulement via `GET /applications/:id` (N+1 non souhaitable sans un
  nouvel endpoint d'agrégat). Laissé de côté, à traiter séparément si
  le besoin se confirme.

### Vérifié

- Frontend : `npm run typecheck`, `npm run build` (avertissements
  CommonJS de `jspdf`/`html2canvas`/`canvg`, attendus et sans
  gravité), `npm run test:ci` : 161/161, inchangé.
- Navigateur (connecté en admin de test) : nav « Révision » avec loupe
  confirmée par inspection du DOM ; diagramme de composants et
  d'architecture applicative affichés sans clic sur Générer, un seul
  bouton de téléchargement (menu SVG/PNG vérifié) ; diagramme
  ArchiMate et diagrammes BPMN idem ; export vision PDF/CSV/Excel
  déclenché sans erreur console ; diagramme de déploiement : stéréotypes
  et flèches «deploy» confirmés en inspectant l'arbre d'objets Konva
  directement (`Konva.stages[0].find(...)`), captures d'écran non
  disponibles dans cet environnement (pane navigateur non composité).

## 2026-08-31 (suite 5) : bouton de téléchargement hors du diagramme de vision, palette sur tous les canevas

Deux retours utilisateur après la refonte précédente.

### Bouton de téléchargement du diagramme de vision mal placé

Il était dans `.vc-header` (le bandeau sombre des questions de
motivation), donc visuellement à l'intérieur de la carte du diagramme.
Déplacé dans un `.page-header` classique au-dessus de la section `.vc`,
même emplacement que le bouton d'export Excel de l'onglet Exigences du
même composant. Vérifié : `app-download-menu` n'est plus contenu dans
`section.vc`.

### Palette de glisser-déposer manquante sur 3 canevas

Demande : toutes les entrées à ajouter avec un diagramme doivent
suivre le même modèle que la palette « Étapes BPMN » (glisser une
icône typée depuis un panneau latéral). Deux canevas l'avaient déjà
(`architecture-applicative-canevas.component.ts`,
`vision/bpmn-canevas.component.ts`) ; trois ne l'avaient pas et
créaient leurs éléments uniquement via un popover-formulaire sur un
onglet séparé :

- `architecture-systeme/applications-canevas.component.ts` (diagramme
  de composants) : palette à une seule entrée « Application » (pas de
  sous-type dans ce domaine), glisser-déposer ouvre un formulaire
  Nom/Description puis crée via `createApplication` avec la position
  du dépôt.
- `donnees/donnees-canevas.component.ts` (diagramme de classe) :
  palette à une entrée « Entité de données », formulaire
  Nom/Description/Propriétaire.
- `technologie/technologie-canevas.component.ts` (diagramme de
  déploiement) : palette à 5 entrées (les `TypeTechComponent`
  existants : Serveur/Réseau/Cloud/Base de données/Middleware, un
  swatch de couleur reprenant `TYPE_COLOR` au lieu d'une icône dédiée),
  formulaire Nom/Justification.

Les trois suivent le même schéma que la palette BPMN déjà en place :
`dragstart` pose un type dans `DataTransfer`, `drop` calcule la
position dans les coordonnées du stage (en tenant compte du zoom/pan
Konva) et ouvre un petit formulaire modal ; la confirmation crée
l'élément avec `positionX`/`positionY` déjà corrects, sans étape de
repositionnement manuel après coup.

**Bugs trouvés et corrigés pendant l'implémentation** (avant tout
affichage, via vérification navigateur systématique) :
- `donnees.service.ts`/`technologie.service.ts` : la route de création
  ne fait pas d'`include` (`attributs`, `deploiements` respectivement),
  contrairement à la route de liste. Le rendu Konva de ces deux
  canevas accède directement à `entity.attributs.length` /
  `comp.deploiements.forEach(...)` sans optional chaining : créer un
  élément depuis la palette aurait fait planter le rendu juste après
  la création (`Cannot read properties of undefined`). Corrigé côté
  frontend en normalisant la réponse de création (`attributs: created.attributs ?? []`,
  `deploiements: created.deploiements ?? []`) plutôt que de modifier
  le contrat backend.
- `technologie-canevas.component.ts` n'avait pas de `@Output() changed`
  (contrairement à `applications-canevas`/`donnees-canevas`, déjà
  câblés vers leurs onglets CRUD voisins) : créer un composant depuis
  la palette du canevas laissait l'onglet « Composants » affiché avec
  une liste périmée (chargée une seule fois à l'initialisation du
  composant parent, jamais rafraîchie en changeant d'onglet). Ajouté
  `@Output() changed` + émission après création, câblé côté
  `technologie.component.ts` vers `loadComponents()`. Vérifié en
  navigateur : création d'un composant test depuis le canevas, retour
  sur l'onglet Composants sans recharger la page, le nouveau composant
  y apparaît immédiatement ; testé et nettoyé (élément de test
  supprimé après vérification).

**Non traité, signalé pour arbitrage** : le module ArchiMate
(`architecture-metier.component.ts`) a un onglet « Diagramme » (SVG
généré) mais pas de canevas interactif du tout : ses éléments
(capacités, éléments, relations) se créent via 3 onglets de listes
CRUD classiques, pas de glisser-déposer. Les éléments ArchiMate
existent bien sur un canevas ailleurs (module générique `/canevas`,
qui les gère en même temps que d'autres couches), mais pas depuis
`architecture-metier` lui-même. Convertir ce module en éditeur canevas
serait une refonte structurelle bien plus large (remplacer 3 écrans
de listes fonctionnels par un éditeur graphique) que les 3 ajouts de
palette faits ici : laissé de côté tant que ce n'est pas explicitement
demandé.

### Vérifié

- `npm run typecheck`, `npm run build`, `npm run test:ci` (161/161) :
  tout propre.
- Navigateur : les 3 nouvelles palettes affichent bien leurs entrées
  (« Application », « Entité de données », les 5 types de composants
  technologiques) ; glisser-déposer simulé par dispatch de vrais
  `DragEvent`/`DataTransfer` (le clic seul ne déclenche pas le drag
  HTML5 natif) sur le diagramme de déploiement : formulaire modal
  ouvert avec le bon type, création confirmée, nouveau nœud visible
  dans l'arbre Konva, synchronisation avec l'onglet Composants
  vérifiée, élément de test supprimé après coup.

## 2026-08-31 (suite 6) : téléchargement sur tous les diagrammes

Demande explicite : plus aucun écran de diagramme ne doit être sans
export. Trois canevas Konva purement « live » (pas de génération SVG
backend, le canevas EST le diagramme) n'avaient toujours aucun bouton
de téléchargement après les deux passes précédentes :
`donnees-canevas.component.ts`, `technologie-canevas.component.ts`,
`vision/bpmn-canevas.component.ts` (l'éditeur BPMN lui-même, distinct
du visualiseur `bpmn-vues.component.ts` qui, lui, avait déjà son export
SVG/PNG backend depuis la suite précédente).

Ajouté : nouvel utilitaire `downloadDataUrl(dataUrl, filename)` dans
`shared/download.util.ts` (déclenche le téléchargement d'une data URL,
typiquement `stage.toDataURL()` d'un canevas Konva ; même mécanique
que celle déjà utilisée par `canevas/canevas.component.ts`, non
touché ici car il permettait déjà le téléchargement, juste avec sa
propre implémentation). Sur les 3 écrans concernés : `<app-download-menu>`
avec un seul format (PNG, seul format qu'un canevas Konva peut
produire nativement, pas de vrai export SVG possible sans un rendu
serveur dédié), placé dans un `.page-header` au-dessus du canevas,
export via `this.stage.toDataURL({ pixelRatio: 2 })`.

Note sur le doublon volontaire : le processus BPMN édité dans
`vision/bpmn-canevas.component.ts` peut aussi être exporté en SVG/PNG
depuis Architecture métier ▸ Diagrammes BPMN (le rendu backend du même
processus), sur un écran différent. Ajouter l'export directement sur
l'écran d'édition évite d'obliger l'utilisateur à changer de module
juste pour télécharger ce qu'il est en train de modifier.

### Vérifié

- `npm run typecheck`, `npm run build`, `npm run test:ci` (161/161) :
  tout propre.
- Navigateur : les 3 nouveaux boutons de téléchargement déclenchent un
  export PNG sans erreur console, sur le diagramme de classe, le
  diagramme de déploiement et l'éditeur de processus BPMN (testé sur
  le processus « Traitement de commande »).

## 2026-08-31 (suite 7) : conformité TOGAF de l'analyse des écarts (objectifs AS-IS/TO-BE)

Demande explicite : pouvoir définir un objectif TO-BE en fonction d'un
objectif AS-IS, pour permettre une vraie comparaison dans le module
Analyse des écarts. Avant ce travail, `Objectif` (module Préparation de
l'organisation) n'avait aucune notion d'AS-IS/TO-BE : ni statut, ni
lien d'évolution, contrairement à quasiment toutes les autres entités
architecturales du projet (BPMN, ArchiMate, données, applications, qui
ont toutes un champ `statut: StatutElement`).

### Modèle de données

Migration `20260831153905_add_objectif_statut_as_is_to_be` : ajout sur
`Objectif` de `statut StatutElement @default(LES_DEUX)` (réutilise
l'enum déjà existant, cohérent avec le reste du schéma) et d'une
auto-relation `objectifAsIsId` (nullable, `onDelete: SetNull`) reliant
un objectif TO-BE à l'objectif AS-IS dont il est l'évolution.

### Backend (`objectif.service.ts`, DTOs, entité)

- `CreateObjectifDto`/`UpdateObjectifDto` : `statut` et `objectifAsIsId`
  optionnels.
- Validation métier (`assertValidEvolution`) : un lien `objectifAsIsId`
  n'est accepté que si (1) l'objectif courant est bien TO_BE, (2) la
  cible n'est pas lui-même, (3) l'objectif AS-IS référencé existe, dans
  la même organisation, et est lui-même de statut AS_IS (pas TO_BE, pas
  LES_DEUX). Toute violation → 400.
- `update()` : si le statut change et n'est plus TO_BE, `objectifAsIsId`
  est automatiquement remis à `null` (évite un objectif AS-IS ou
  LES_DEUX avec un lien d'évolution obsolète en base).
- `findAll`/`findOne`/`create`/`update` incluent désormais
  `objectifAsIs`/`objectifsToBe` (référence légère : id/nom/statut) en
  une seule requête, pour que le frontend construise sa matrice sans
  N+1.
- 7 nouveaux tests (service + contrôleur), y compris les cas de rejet
  (lien sur un TO-BE, lien vers un objectif introuvable, lien vers une
  source qui n'est pas AS-IS).

### Frontend

- `organisation/objectifs.component.ts` : formulaires de création/édition
  avec sélecteur de statut (Les deux/AS-IS/TO-BE) et, uniquement quand
  statut = TO-BE, un second sélecteur « Objectif AS-IS d'origine »
  alimenté par la liste complète des objectifs AS-IS existants (pas
  seulement la page courante). Colonne Statut ajoutée à la liste et à
  l'export Excel.
- `ecarts/ecarts.component.ts` : nouvel onglet « Objectifs », matrice
  d'écarts au format TOGAF classique (Baseline AS-IS / Target TO-BE /
  État), calculée ainsi :
  - AS-IS avec évolution(s) déclarée(s) → **Modifié** (Target = les
    objectifs TO-BE liés).
  - AS-IS sans évolution → **Éliminé**.
  - LES_DEUX → **Conservé** (affiché des deux côtés : c'est le même
    élément, inchangé).
  - TO-BE sans origine déclarée → **Nouveau**.
  4 compteurs de synthèse (Conservés/Éliminés/Modifiés/Nouveaux), en
  plus de l'onglet Processus existant (BPMN, inchangé).

### Vérifié

- Backend : `npm run typecheck`, `npx jest --silent` (57 suites, 470
  tests, +7 vs la suite précédente), `npm run build` : tout propre.
- Frontend : `npm run typecheck`, `npm run build`, `npm run test:ci`
  (161/161) : tout propre.
- Bug de tooling rencontré et résolu en cours de route : après
  régénération du client OpenAPI (nouveaux champs `statut`/`objectifAsIs`/
  `objectifsToBe`), le serveur `ng serve` de prévisualisation gardait une
  build en mémoire ne reconnaissant pas ces champs (`ObjectifEntity` vue
  comme son ancienne forme), malgré des fichiers sur disque à jour et un
  `ng build` ponctuel propre en parallèle. Résolu en redémarrant le
  serveur de dev (`preview_stop`/`preview_start`) plutôt qu'en cherchant
  à forcer un rechargement, cause exacte non identifiée (probablement
  un cache webpack incremental qui n'invalide pas un fichier déjà suivi
  dont seul le contenu change via un outil externe).
- Navigateur (bout en bout, avec nettoyage des données de test après
  coup) : création d'un objectif AS-IS « Gestion papier des dossiers »,
  puis d'un objectif TO-BE « Gestion numérique des dossiers » relié à
  lui via le sélecteur d'origine ; vérifié que la liste affiche bien
  « ← Gestion papier des dossiers » sur la ligne TO-BE ; matrice
  d'écarts confirmée : la paire apparaît en **Modifié**, l'objectif
  LES_DEUX préexistant en **Conservé** (affiché des deux côtés après
  le correctif ci-dessus), compteurs de synthèse corrects (1 Conservé,
  0 Éliminé, 1 Modifié, 0 Nouveau).

## 2026-08-31 (suite 8) : couverture de l'analyse des écarts sur les 4 autres domaines

Suite à l'échange sur la conformité TOGAF de ce module (l'analyse des
écarts porte normalement sur les phases B/C/D, pas uniquement sur les
processus et les objectifs) : extension de la même matrice d'écarts
aux 4 domaines qui portent déjà un champ `statut` (AS_IS/TO_BE/LES_DEUX)
mais n'étaient couverts par aucun écran de comparaison : Architecture
métier (éléments ArchiMate), Données (entités), Applicatif
(applications), Technologique (composants). Aucune migration ni
changement backend nécessaire : le champ existait déjà partout, seul
manquait l'écran de comparaison.

### Généralisation du code (`ecarts.component.ts`)

Le type `GapRow` (créé pour les Objectifs) a été généralisé de
`{ asIs: Objectif | null; toBe: Objectif[] }` vers `{ asIs: GapItem | null;
toBe: GapItem[] }` avec `GapItem = { id: string; nom: string }`, pour
être réutilisable par n'importe quel domaine. Un état par domaine
(`GapDomainState`) remplace les 6 propriétés à plat qui n'existaient
auparavant que pour les objectifs ; `domains: Record<DomainTab,
GapDomainState>` centralise l'état des 5 onglets domaines (Processus
reste à part, structurellement différent : comparaison par processus
sélectionné, pas une matrice globale).

Deux constructeurs de lignes :
- `buildObjectifRows()` (inchangé) : le seul domaine avec un lien
  d'évolution explicite (`objectifAsIsId`), donc le seul capable de
  produire l'état **Modifié**.
- `buildSimpleGapRows()` (nouveau, générique) : pour les 4 domaines
  sans lien d'évolution entre un élément AS-IS précis et son
  successeur TO-BE — LES_DEUX → Conservé, AS_IS → Éliminé, TO_BE →
  Nouveau. **Modifié** n'est structurellement pas déductible pour ces
  domaines sans données de correspondance (voir plus bas).

Le template affiche une seule section générique pilotée par
`currentDomain`/`domainLabel`/`emptyMessage` (getters basés sur
`mainTab`), au lieu de dupliquer 5 fois un bloc de matrice quasi
identique.

### Limite assumée, pas corrigée ici

Contrairement aux Objectifs, les éléments ArchiMate, entités de
données, applications et composants technologiques n'ont **aucune**
auto-relation « évolue depuis » en base : deux enregistrements AS_IS
et TO_BE portant des noms différents ne peuvent pas être associés
automatiquement, même s'ils représentent conceptuellement le même
élément qui change de forme. Ces 4 domaines ne produiront donc jamais
de ligne « Modifié », seulement Conservé/Éliminé/Nouveau — ce qui reste
pleinement conforme à la matrice d'écarts TOGAF classique (qui n'a que
ces 3 états dans sa version de base ; « Modifié » est un enrichissement
propre aux objectifs, ajouté dans l'entrée précédente). Ajouter la même
auto-relation à ces 4 entités serait cohérent mais représente un
changement de schéma bien plus large (4 migrations, 4 formulaires à
enrichir) : laissé de côté tant que ce n'est pas demandé explicitement.

### Vérifié

- `npm run typecheck`, `npm run build`, `npm run test:ci` (161/161) :
  tout propre.
- Navigateur : les 4 nouveaux onglets chargent et affichent leur
  matrice sans erreur (Architecture métier : 43 éléments, tous
  Conservés ; Données : 5 entités ; Applicatif : 6 applications ;
  Technologique : 6 composants, tous Conservés dans le jeu de données
  de démonstration actuel, qui ne contient encore aucun AS_IS/TO_BE
  explicite sur ces domaines). Des erreurs 500 historiques sur
  `/api/v1/capacites-metier` et `/api/v1/elements-archimate` sont
  restées dans l'historique de la console du navigateur depuis une
  session de test antérieure (avant un redémarrage backend) ; confirmé
  qu'elles ne se reproduisent pas maintenant (contenu affiché correct,
  et `curl` direct sur les mêmes routes répond normalement).

---

## 2026-09-01 : lien entre l'analyse des écarts et les solutions (module Opportunités)

Suite de l'entrée précédente : le module Opportunités & solutions
(Phase E de l'ADM) ne pointait vers aucun écart identifié en amont, un
`Solution` n'ayant aucun lien avec la matrice d'écarts. Objectif : rendre
explicite quel(s) écart(s) une solution candidate adresse, dans les deux
sens (depuis une solution, et depuis la matrice d'écarts elle-même).

### Schéma (`schema.prisma`)

Prisma ne supporte pas de clé étrangère polymorphe native (un
`SolutionGap` peut pointer vers un `Objectif`, un `ElementArchimate`, une
`DataEntity`, une `Application` ou un `TechComponent` selon le domaine).
Plutôt que 5 colonnes FK nullables ou une fausse table mère commune, choix
assumé d'un instantané dénormalisé : `SolutionGap { domaine: DomaineEcart,
elementId: string, elementNom: string }`, sans intégrité référentielle
depuis le côté élément source (une suppression de l'élément d'origine
laisse un lien orphelin mais toujours affichable). Nouvel enum
`DomaineEcart` (OBJECTIF/METIER/DONNEES/APPLICATIF/TECHNOLOGIQUE).
Contrainte `@@unique([solutionId, domaine, elementId])` pour éviter les
doublons. Migration `20260831165051_add_solution_gap_links`.

### Backend (`opportunites/`)

`SolutionService.updateGaps()` remplace tous les liens d'une solution en
une transaction (`deleteMany` + `createMany`), même convention que
`updateScores()` déjà en place. `SolutionService.listGaps()` sert la vue
inverse : tous les écarts déjà adressés, toutes solutions confondues (sert
au calcul de couverture côté Analyse des écarts). Route `GET
/solutions/gaps` déclarée **avant** `GET /solutions/:id` dans le
contrôleur (même piège Express déjà rencontré et corrigé ailleurs dans ce
projet : une route littérale après une route `:id` se ferait avaler comme
valeur de paramètre) — un test dédié vérifie explicitement que
`solution.findUnique` n'est pas appelé sur cette route pour détecter une
régression de ce type. Suite `solution.service.spec.ts` /
`solution.controller.spec.ts` étendue en conséquence.

### Frontend

- `GapAnalysisService` (déjà extrait dans l'entrée précédente pour
  `ecarts.component.ts`) exporte maintenant aussi
  `DOMAIN_TO_DOMAINE_ECART`, la correspondance entre l'onglet de domaine
  de l'UI et l'enum backend — évite de dupliquer cette table dans les deux
  écrans qui en ont besoin.
- `opportunites.component.ts` : nouveau sélecteur d'écarts par solution
  (bouton « Écarts adressés » sur chaque ligne). Chaque ligne de la
  matrice TOGAF est réduite à un ou plusieurs « candidats » sélectionnables
  (le ou les éléments TO-BE visés, ou l'élément AS-IS seul pour un écart
  Éliminé sans cible). Sélection multi-domaines cumulée dans un brouillon,
  envoyée en un seul appel à l'enregistrement.
- `ecarts.component.ts` : nouvelle colonne « Solution » sur la matrice
  (badge Adressé/Non adressé) et un 5ᵉ indicateur de synthèse « Non
  adressés par une solution », calculés à partir de
  `SolutionService.listGaps()`.

### Bug trouvé et corrigé pendant la vérification navigateur

Le sélecteur d'écarts appelait `candidatesFor(gapsDomain)` directement
dans le `*ngFor` du template. Angular réévalue une expression de méthode à
chaque cycle de détection de changement ; comme `candidatesFor()`
reconstruit un nouveau tableau (et de nouveaux objets) à chaque appel, et
qu'aucun `trackBy` n'était fourni, Angular détruisait et recréait les
cases à cocher à chaque cycle déclenché par l'événement `(change)`
lui-même : la coche visuelle apparaissait un instant puis revenait à
l'état précédent, et le tableau de sélection interne restait vide.
Corrigé en calculant la liste de candidats une seule fois (propriété
`gapsCandidates`, recalculée uniquement à l'ouverture ou au changement de
domaine) et en ajoutant un `trackBy` par `elementId`. Ce type de piège
(appel de méthode coûteux ou non idempotent directement dans un
`*ngFor`/`*ngIf` de template) n'avait pas d'occurrence connue ailleurs
dans le projet à ce jour, mais reste à surveiller.

### Vérifié

- Backend : suite complète du module `opportunites` (19/19), suite
  complète `apps/api` (475/475 avant ce correctif de bug frontend, non
  affectée par un changement purement Angular), `nest build` propre.
- Frontend : `npm run typecheck`, `npm run build`, `npm run test:ci`
  (163/163) propres après le correctif.
- Navigateur : lien créé depuis « Externaliser le support N1 » vers
  l'objectif « Digitaliser la gestion administrative », visible
  immédiatement dans la fiche solution (« Écarts adressés ») et dans
  Analyse des écarts (badge Adressé, compteur Non adressés passé à 0) ;
  lien retiré ensuite pour ne pas polluer le jeu de données de
  démonstration.

---

## 2026-09-01 : accès bloqué avant validation superadmin, panneau de revue, e-mail SMTP réel

### 🔴 Sécurité : faille corrigée

Depuis la refonte du workflow superadmin (voir 2026-08-06), le statut
`EN_ATTENTE` d'une organisation ne bloquait plus rien : `POST /auth/register`
([auth.service.ts](../apps/api/src/modules/auth/auth.service.ts)) connectait
immédiatement l'utilisateur, aucun guard ni le login ne lisait le statut, et
le commentaire du service l'assumait explicitement. N'importe qui pouvait
donc s'inscrire et utiliser toute l'application sans revue humaine.

Corrigé :

- Nouveau guard global `OrganisationStatusGuard`
  ([organisation-status.guard.ts](../libs/shared/src/guards/organisation-status.guard.ts)),
  enregistré en 5ᵉ `APP_GUARD` après `JwtAuthGuard`
  ([app.module.ts](../apps/api/src/app.module.ts)). Renvoie 403
  (`code: ORGANISATION_NON_VALIDEE`) tant que `organisation.statut !== VALIDEE`.
  Exemptions : routes `@Public()`, `SUPERADMIN`, et routes marquées
  `@AllowPendingOrganisation()`
  ([allow-pending-organisation.decorator.ts](../libs/shared/src/decorators/allow-pending-organisation.decorator.ts))
  posé sur `GET /auth/me` et `GET /organisations/me` pour permettre au
  frontend d'afficher un écran d'attente si une session est révoquée après
  coup.
- `login()` refuse aussi la connexion (403, même `code`) si l'organisation
  n'est pas validée. Le `SUPERADMIN`, sans organisation, reste exempté.
- `register()` n'ouvre plus de session : `setAuthCookies` retiré du
  contrôleur, réponse réduite à `{ organisation, message }`
  ([auth-response.entity.ts](../apps/api/src/modules/auth/entities/auth-response.entity.ts)).
- `HttpExceptionFilter`
  ([http-exception.filter.ts](../libs/shared/src/filters/http-exception.filter.ts))
  propage désormais un champ `code` optionnel quand l'exception en fournit un.

### Champs de revue rendus obligatoires

`RegisterDto` ([register.dto.ts](../apps/api/src/modules/auth/dto/register.dto.ts)) :
`secteur`, `pays`, `vision` passent de facultatifs à requis ; nouveau champ
`ville` requis. Nouvelle colonne `Organisation.ville`
([schema.prisma](../apps/api/prisma/schema.prisma), migration
`20260901091014_add_organisation_ville`, nullable en base pour ne pas casser
l'existant, obligation portée par le DTO et par le contrôle de complétude).

Frontend inscription
([register.component.ts](../apps/web/src/app/auth/register.component.ts)) :
champ Ville ajouté, Secteur/Pays rendus obligatoires, textarea « Objectif »
(= `vision`) déplacé de l'étape 2 à l'étape 1 pour regrouper toutes les
informations de revue sous le gate `validateEntreprise()`. Après soumission,
plus de redirection vers l'app : nouvelle page publique `/inscription-recue`
([inscription-recue.component.ts](../apps/web/src/app/auth/inscription-recue.component.ts)).

### Panneau de revue superadmin

`AdminService.valider()`
([admin.service.ts](../apps/api/src/modules/admin/admin.service.ts)) contrôle
la complétude avant de valider : `nom, secteur, pays, ville, vision` non vides
+ un compte `ADMINISTRATEUR`. Sinon `BadRequestException` listant les champs
manquants.

Frontend
([admin-organisations.component.ts](../apps/web/src/app/admin/admin-organisations.component.ts)) :
le bouton « Détails » devient « Vérifier » sur les lignes `EN_ATTENTE` et
ouvre un bloc de revue structuré (Nom, Localisation, Secteur, Responsable,
Objectif) avec la liste des champs manquants. Bouton « Valider » désactivé
tant que la revue est incomplète, « Rejeter » à côté. `auth.interceptor.ts`
déconnecte proprement sur un 403 `ORGANISATION_NON_VALIDEE` hors route d'auth.

### E-mail SMTP réel

Nouveau `MailModule` / `MailService`
([mail.service.ts](../apps/api/src/modules/mail/mail.service.ts)) sur
`nodemailer`. Config via `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). Repli automatique en mode simulé
(`[MAIL:SIMULÉ]` journalisé) si `SMTP_HOST` est absent, pour ne pas casser le
dev local / la CI / les tests. `valider()` envoie un e-mail contenant
`<FRONTEND_ORIGIN>/login` ; `rejeter()` envoie une notification sans lien.

### 🟡 Restant / non traité

- Toujours aucune vérification d'identité réelle de l'entreprise (Kbis,
  annuaire d'entreprises, double opt-in e-mail) : la revue superadmin reste
  une relecture visuelle des informations auto-déclarées. À planifier si le
  périmètre l'exige.
- Le JWT ne porte pas le statut de l'organisation : le guard fait un
  `findUnique` léger (une colonne) par requête tenant. Acceptable à cette
  échelle ; à revoir si le volume de requêtes augmente fortement.

### Vérifié

- Backend : `nest build` propre ; suite complète `apps/api` 487/487
  (nouveau `organisation-status.guard.spec.ts`, specs `auth` / `admin`
  réécrites pour le nouveau comportement).
- Frontend : `npm run typecheck` propre ; `npm run test:ci` 163/163 ; client
  API régénéré (`npm run generate:api-client`).
- Bout en bout contre Postgres : inscription sans `ville` → 400 ; inscription
  complète → 201 `EN_ATTENTE` sans `accessToken` ; login du compte → 403
  `ORGANISATION_NON_VALIDEE` ; login superadmin → 200 ; `valider` → 200
  `VALIDEE` + e-mail (simulé) vers l'admin avec le lien `/login` ; re-login
  du compte → 200 avec `accessToken`. Organisation de test supprimée ensuite
  pour ne garder que K&B Groupe SARL.

---

## 2026-09-01 : le module Urbanisation s'aligne sur les autres, le POS revient dans son module

### Constat

Le module Urbanisation était le seul à ne pas suivre la structure commune
des autres écrans métier (`donnees`, `technologie`, `architecture-metier`,
`architecture-systeme`) : pas de question d'étape en tête, pas d'onglets,
et surtout le diagramme généré (« POS ») vivait dans un module tiers
(`vues`, aux côtés d'ArchiMate et de l'organigramme) alors que tous les
autres modules embarquent leur diagramme comme un onglet interne. En
prime, le rendu POS était une simple grille carrée des zones racines, sans
rapport avec le gabarit d'urbanisation attendu (bandes Échange / Ressource
& Support, colonnes Pilotage & Contrôle / Données transverses, cœur
Opération).

### Frontend

- [urbanisation.component.ts](../apps/web/src/app/urbanisation/urbanisation.component.ts) :
  passage à la structure commune. Question d'étape (`p.step-question`) +
  trois onglets « Zones » / « Affectations » / « Plan d'occupation des
  sols ». Les deux premiers reprennent à l'identique l'arbre Zone >
  Quartier > Îlot et le formulaire d'affectation existants. Le troisième
  embarque le diagramme généré avec le même patron que les autres écrans
  de vue (bouton rafraîchir en icône, `app-download-menu` SVG/PNG,
  conteneur `.svg-container`). Le plan est régénéré automatiquement après
  toute création/suppression de zone ou affectation (`invalidatePos()`).
- [vues.component.ts](../apps/web/src/app/vues/vues.component.ts) : l'onglet
  « POS (urbanisation) » est retiré. `VueTab` se réduit à `archimate` /
  `organigramme`, la dépendance `UrbanisationService` disparaît du module.
  Le raccourci « Plan d'occupation des sols » de l'assistant pointait déjà
  vers `/urbanisation`, il est donc désormais cohérent.

### Backend

[urbanisation-view.service.ts](../apps/api/src/modules/urbanisation/urbanisation-view.service.ts),
méthode `generate()` réécrite : rendu figé du gabarit POS à cinq couches
toujours toutes affichées. L'application remplit les couches
automatiquement : chaque zone racine est rattachée à une couche via des
mots-clés de son nom (`POS_LAYER_KEYWORDS`, comparaison sans accent et en
minuscules), avec repli sur « Opération » pour toute zone non reconnue.
Les zones d'Opération sont numérotées comme des quartiers. Les helpers
existants (`renderNode`, `renderAppChips`, `gridCells`, comptages,
état vide) et `generateComponents()` sont inchangés ; le contrat
`UrbanisationVueEntity` (`svg` / `zoneCount` / `applicationCount`) ne
bouge pas.

### Limite assumée

Le rattachement par mot-clé est heuristique : une zone au nom sans indice
(« Zone 1 ») tombera dans Opération. Un champ `couche` explicite sur
`ZoneUrbanisation` serait plus fiable mais impose une migration + la
régénération du client API ; non retenu ici, à rouvrir si la répartition
automatique se révèle trop approximative sur des données réelles.

### Vérifié

- Backend : `npm run typecheck` propre ; suite `apps/api` module
  `urbanisation` 61/61 (3 nouveaux tests sur le gabarit POS et le
  rattachement par mot-clé).
- Frontend : `npx tsc -p tsconfig.app.json --noEmit` propre ;
  `ng build` (development) propre ; specs web `urbanisation` 20/20.
- Rendu : SVG de contrôle généré sur un jeu de zones représentatif
  (Échanges partenaires, Pilotage décisionnel, Ventes, Production,
  Référentiels de données, Support RH et Finance) : les six zones se
  répartissent dans les bonnes couches, Ventes/Production numérotées 1 et
  2 au centre, débordement d'applications « +1 autre » conservé.

---

## 2026-09-01 (suite) : nouvel audit de sécurité pré-déploiement

Audit demandé explicitement par l'utilisateur pour avoir confiance dans la
sécurité de l'application au moment du déploiement. Portée : revue des
correctifs de sécurité déjà tracés dans ce journal (aucune régression
trouvée), revue ciblée du chantier en cours non commité au moment de
l'audit (blocage d'accès avant validation superadmin, e-mail SMTP réel,
voir entrée précédente), `npm audit` sur les dépendances de production, et
les artefacts de déploiement (`Dockerfile.api`, `docker-compose.yml`)
jamais revus jusqu'ici dans ce journal.

### 🔴 Sécurité : trouvé et corrigé

1. **`nodemailer@6.10.1` : deux failles hautes gravité.** `npm audit`
   révèle que la version installée du tout nouveau `MailModule`
   ([mail.service.ts](../apps/api/src/modules/mail/mail.service.ts))
   est concernée par
   [GHSA-p6gq-j5cr-w38f](https://github.com/advisories/GHSA-p6gq-j5cr-w38f)
   (l'option `raw` au niveau message contourne
   `disableFileAccess`/`disableUrlAccess`, lecture de fichier arbitraire et
   SSRF, CVSS 7.1) et
   [GHSA-rcmh-qjqh-p98v](https://github.com/advisories/GHSA-rcmh-qjqh-p98v)
   (déni de service par récursion dans l'analyseur d'adresses, CVSS 7.5).
   Le code actuel n'utilise pas l'option `raw` et le destinataire (`to`)
   provient toujours d'une adresse validée par `@IsEmail()` en base, jamais
   d'une entrée libre au moment de l'envoi — donc pas d'exploitation
   trouvée aujourd'hui — mais la dépendance elle-même reste vulnérable, et
   un futur usage de `raw` ou un contournement de la validation rendrait
   la faille directement exploitable. Corrigé : mise à jour vers
   `nodemailer@9.1.0` (`@types/nodemailer@7`), seule version corrigeant les
   deux avis. Migration majeure mais sans impact sur l'usage réduit qu'en
   fait ce projet (`createTransport`/`sendMail` avec `to`/`from`/`subject`/`text`).

### 🟠 Important : trouvé et corrigé

2. **`Dockerfile.api` ne construisait plus l'image du tout** (bug
   préexistant, découvert en vérifiant le correctif suivant, sans lien
   avec le chantier du jour). `RUN npx prisma generate` échouait
   systématiquement à l'étape `[builder 8/9]` : la CLI Prisma 7 installée
   (`prisma@7.9.0`) ne lit plus le champ historique
   `package.json#prisma.schema` (utilisé avec succès en local tout au long
   de ce journal, mais uniquement parce que les commandes y sont lancées
   depuis `apps/api`, où `./prisma/schema.prisma` correspond à
   l'emplacement par défaut) ; sans argument `--schema` explicite et hors
   des emplacements par défaut, elle échoue. Un déploiement Docker de
   l'image telle quelle était donc impossible. Corrigé : `--schema
   apps/api/prisma/schema.prisma` explicite sur la commande. Reconstruction
   complète vérifiée (voir plus bas).
3. **Conteneur API exécuté en `root`** (`Dockerfile.api`) : aucune
   directive `USER`, alors que l'image `node:22-alpine` fournit déjà un
   utilisateur non privilégié (`node`, uid 1000). Corrigé : `RUN mkdir -p
   apps/api/uploads && chown -R node:node /app` puis `USER node` en fin
   d'étape d'exécution (le dossier d'upload doit lui appartenir, l'app y
   écrit les logos à l'exécution).
4. **`docker-compose.yml` : `FRONTEND_ORIGIN` avait un repli silencieux**
   (`${FRONTEND_ORIGIN:-http://localhost:4201}`), contrairement à
   `JWT_SECRET`/`POSTGRES_PASSWORD` qui utilisent `:?` pour refuser de
   démarrer si absents. Ce repli neutralisait exactement la protection
   apportée par `requireFrontendOrigin()` côté code (suite du 2026-08-31) :
   le conteneur recevait toujours une valeur, donc le contrôle de code ne
   voyait jamais l'absence de configuration. Pas de faille d'ouverture
   (le repli reste restrictif, pas un joker `*`), mais un oubli de
   configuration se traduirait par un frontend silencieusement bloqué
   plutôt que par un conteneur qui refuse de démarrer avec un message
   clair. Corrigé : `:?` comme les deux autres secrets requis.
5. **`docker-compose.yml` ne transmettait aucune variable `SMTP_*` au
   service `api`** : le tout nouveau `MailService` y basculerait donc
   systématiquement en mode simulé (organisations validées/rejetées sans
   jamais recevoir l'e-mail réel), quel que soit le contenu du `.env` de
   l'opérateur, simplement parce que les variables n'étaient pas
   déclarées dans le bloc `environment:`. Corrigé : `SMTP_HOST`,
   `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
   ajoutées avec repli explicite (`:-`, ces variables restent facultatives
   par conception du service).
6. **Port Postgres publié sur toutes les interfaces réseau de l'hôte**
   (`'5433:5432'`) : le conteneur `api` atteint Postgres via le réseau
   Docker interne (`postgres:5432`) et n'a pas besoin de ce port publié
   sur l'hôte ; en production, sur une machine avec une IP publique et
   sans pare-feu, ce mapping expose la base directement à internet, avec
   pour seule protection le mot de passe Postgres. Corrigé : liaison
   explicite à `127.0.0.1:5433:5432`.
7. **`RegisterDto` : aucune borne de taille sur les 7 tableaux
   d'amorçage optionnels** (`objectifs`, `partiesPrenantes`,
   `bpmnProcessus`, `capacitesMetier`, `acteurs`, `dataEntities`,
   `applications`, `techComponents`) — `/auth/register` est `@Public()`
   et limité en débit (`@Throttle`), mais un payload volumineux et
   individuellement valide pouvait insérer un nombre arbitraire de lignes
   en une seule inscription (chaque tableau est inséré via `createMany`,
   donc pas de boucle séquentielle, mais toujours sans plafond). Gravité
   réelle limitée par la limite de taille de corps par défaut
   d'Express/body-parser, mais correctif gratuit. Corrigé :
   `@ArrayMaxSize(50)` sur les 7 tableaux.

### 🟡 Dette, non traité

- **`npm audit` signale aussi `prisma` (CLI), `@prisma/dev`,
  `@prisma/config`, `valibot`, `brace-expansion`, `deepmerge-ts`,
  `fast-uri`, `find-my-way`, `js-yaml`** en sévérité haute/modérée : tous
  transitifs de `prisma`, une dépendance de développement (CLI, jamais
  copiée dans l'image d'exécution — `Dockerfile.api` fait `npm ci
  --omit=dev` à l'étape runtime). Aucune exposition en production
  aujourd'hui ; à mettre à jour à l'occasion plutôt qu'en urgence.
- **Aucune étape `prisma migrate deploy` dans `Dockerfile.api` ou
  `docker-compose.yml`** : les migrations doivent être appliquées
  manuellement avant/pendant le déploiement, ce qui n'est documenté nulle
  part (`docs/stack.md` ne mentionne pas le sujet). Pas une faille de
  sécurité, mais un point opérationnel à trancher explicitly avant le
  premier vrai déploiement (étape CI dédiée, ou commande de démarrage du
  conteneur qui l'inclut).
- Points déjà connus et toujours assumés comme dette (inchangés) :
  pagination des `findMany` sans tri par défaut documenté au-delà de ce
  qui existe, absence de vérification d'identité réelle de l'entreprise à
  l'inscription (notée dans l'entrée précédente), doublon de requêtes
  `list()`/`listPaginated()` dans deux composants (noté le 2026-08-31).

### Confirmé sain (revue ciblée, pas de régression)

- `OrganisationStatusGuard` (nouveau, voir entrée précédente) : défense en
  profondeur correcte — vérifié en profondeur ligne par ligne, pas
  seulement confiance dans l'entrée précédente. Refuse par défaut, lit le
  statut en base à chaque requête (pas seulement au login), exemptions
  limitées à `@Public()`/`SUPERADMIN`/`@AllowPendingOrganisation()`. Le
  message d'erreur distinct pour un compte non validé n'ouvre pas
  d'énumération de comptes : il ne se déclenche qu'après un mot de passe
  correct (la comparaison à temps constant reste avant ce contrôle dans
  `login()`).
- E-mails transactionnels envoyés en `text` (jamais `html`) : aucune
  injection HTML possible via `organisationNom`, quel que soit son
  contenu. Destinataire toujours recherché en base par rôle, jamais pris
  tel quel dans le corps de la requête au moment de l'envoi : pas
  d'injection de destinataire.
- `main.ts` : `helmet`, `compression`, préfixe `/api/v1`, `ValidationPipe`
  strict, filtre d'exceptions global, CORS à origine unique avec
  identifiants, Swagger limité en débit — tout confirmé en place et
  inchangé depuis le 2026-08-31.
- `.env` correctement ignoré par git ; `.env.example` déjà à jour avec les
  nouvelles variables `SMTP_*`, aucune valeur réelle.
- Pagination (`PaginationQueryDto`) : `pageSize` borné à 200, pas de
  risque d'épuisement de ressources par une page démesurée.
- Upload de logo : allowlist MIME (PNG/JPEG/WEBP, SVG toujours exclu),
  limite de taille 5 Mo, nom de fichier régénéré en UUID côté serveur —
  inchangé.

### Vérifié

- Backend : `tsc -p apps/api/tsconfig.app.json --noEmit` propre après la
  mise à jour `nodemailer` et l'ajout des `@ArrayMaxSize` ; suite complète
  `apps/api` 489/489.
- `npm audit` (prod) : 0 vulnérabilité restante sur les dépendances
  d'exécution après la mise à jour `nodemailer` (les 8 restantes sont
  toutes dev-only, cf. plus haut).
- Image Docker reconstruite de bout en bout après les deux correctifs
  (`--schema` + non-root) : build complet réussi, conteneur démarré avec
  les variables minimales requises, `whoami`/`id` dans le conteneur
  confirment l'exécution en `node` (uid 1000, non root), logs de démarrage
  propres (connexion Postgres, bascule mode simulé du `MailService` en
  l'absence de `SMTP_HOST`, comme conçu), `GET /api/v1/health` répond 200.
  Image et conteneur de test supprimés ensuite.

### Note

Ce chantier de blocage superadmin/e-mail (entrée précédente) était en
cours dans une session parallèle au moment de cet audit : les fichiers
listés par `git status` ont continué à grandir pendant l'audit
(composants frontend `register.component.ts`, `admin-organisations.component.ts`,
`inscription-recue.component.ts`, `auth.interceptor.ts`, régénération du
client API). Cet audit porte sur l'état du code au moment de chaque
vérification citée ci-dessus ; un audit de la partie frontend de ce même
chantier reste à faire séparément une fois cette session parallèle
stabilisée.

---

## 2026-09-01 (suite) : assistant « Révision » sans diagramme, diagramme de vision pré-rempli

### ⚪ UX

**Aucun diagramme dans l'assistant « Révision » (`/assistant`).** Les étapes 2 à
6 du `WizardComponent`
([wizard.component.ts](../apps/web/src/app/assistant/wizard.component.ts))
embarquaient les composants de feature complets, diagrammes compris (BPMN,
ArchiMate SVG, diagramme de classe, diagramme de composants, diagramme de
déploiement). Ajout d'un `@Input() hideDiagram` (défaut `false`, aucun impact
sur les pages dédiées) à :

- [architecture-metier.component.ts](../apps/web/src/app/architecture-metier/architecture-metier.component.ts)
  (masque les mainTabs BPMN/ArchiMate + le sous-onglet Diagramme, force
  `mainTab = 'archimate'`, garde Capacités/Éléments/Relations),
- [applications.component.ts](../apps/web/src/app/architecture-systeme/applications.component.ts)
  (masque « Diagramme de composants » et « Diagramme d'architecture applicative »
  + skip des générations SVG à l'init),
- [donnees.component.ts](../apps/web/src/app/donnees/donnees.component.ts)
  (masque « Diagramme de classe »),
- [technologie.component.ts](../apps/web/src/app/technologie/technologie.component.ts)
  (masque « Diagramme de déploiement »),
- [vision/bpmn.component.ts](../apps/web/src/app/vision/bpmn.component.ts)
  (masque le panneau détail d'un processus qui contient l'éditeur BPMN).

`WizardComponent` passe `[hideDiagram]="true"` sur ces 5 composants.

**Diagramme de vision pré-rempli automatiquement.** L'onglet « Diagramme de
vision » de
[vision.component.ts](../apps/web/src/app/vision/vision.component.ts) s'ouvrait
vide. À la première ouverture, si les 8 blocs sont vides, il est désormais
pré-rempli à partir des données déjà saisies via un helper pur déterministe
[vision-canvas.prefill.ts](../apps/web/src/app/vision/vision-canvas.prefill.ts)
(pas d'IA) : `needs` ← problèmes à résoudre ; `businessGoals` ← vision +
objectifs ; `targetGroup` ← parties prenantes ; `competitors` ← parties
prenantes de rôle « concurrent » ; `product` ← description sinon secteur. Un
seul `PATCH /vision-canvas` ; l'utilisateur modifie ensuite librement
(persistance au blur déjà en place) ; pas de re-remplissage au rechargement
(le canevas n'est plus vide).

### Vérifié

- Frontend : `npm run typecheck` propre ; `npm run test:ci` 167/167 (nouveau
  `vision-canvas.prefill.spec.ts`, 4 cas).
- Navigateur : parcours des étapes 2 à 6 de `/assistant` → aucun onglet ni
  aperçu « Diagramme », listes toujours éditables ; `/architecture-metier`
  autonome → diagrammes toujours présents (non-régression) ; sur un canevas de
  vision vidé (org K&B, restauré ensuite), l'ouverture de l'onglet remplit
  Target Group / Needs / Product / Business Goals depuis les données de
  l'organisation, un seul PATCH, aucune erreur console, pas de re-remplissage
  après rechargement.

## 2026-09-01 (suite 2) : champ « étapes » sur un processus BPMN et proposition de diagramme

### Ce qui a été fait

Ajout d'un champ **étapes** (texte libre, une étape par ligne) sur un processus
BPMN. À la création, si le champ est renseigné, l'application génère une
**proposition** de diagramme que l'utilisateur ajuste ensuite dans l'éditeur
Konva existant.

- **Schéma** : nouvelle colonne `etapes TEXT` nullable sur `BpmnProcessus`
  (migration `20260901120000_add_bpmn_processus_etapes`). Conservée pour
  permettre une régénération ultérieure.
- **Génération déterministe, sans IA** :
  [bpmn-diagramme-proposal.ts](../apps/api/src/modules/bpmn/bpmn-diagramme-proposal.ts)
  est un module pur. Règles : un événement de début et un de fin encadrent
  toujours le flux ; chaque ligne devient une tâche, sauf si elle ressemble à
  une décision (« Si … », « … ? ») → passerelle exclusive ; la nature de la
  tâche (utilisateur / service / envoi / réception) est devinée par mots-clés ;
  les éléments sont reliés séquentiellement dans l'ordre de saisie ; puces et
  numéros de liste retirés ; positions calculées en lignes qui se replient au-
  delà de 1000 px ; maximum 40 étapes.
- **API** : `POST /bpmn-processus/:id/generer-diagramme` (ADMIN/ARCHITECTE)
  crée les éléments et flux dans une transaction et **refuse** (400) si le
  diagramme contient déjà des éléments, pour ne jamais écraser un travail
  d'édition. `BpmnService.create` appelle cette génération quand `etapes` est
  fourni.
- **Frontend** : `bpmn.component.ts` ajoute une zone de texte « Étapes » dans
  les popovers de création et de modification ; après création avec étapes, le
  processus est sélectionné pour afficher la proposition ; bouton « Régénérer
  depuis les étapes » dans le panneau détail (confirmation + rechargement du
  canevas via `BpmnCanevasComponent.reload()`), masqué en mode assistant
  « Révision » (`hideDiagram`). Client généré (`api-client`) étendu à la main
  (nouveau `bpmnControllerGenererDiagramme`, champ `etapes` sur les modèles),
  à re-synchroniser au prochain `npm run generate:api-client`.

### Point de vigilance

- 🟡 La proposition est volontairement linéaire : une étape « Si … » devient une
  passerelle mais garde un seul flux entrant et un seul sortant, sans créer les
  branches. L'utilisateur doit tracer les branches à la main. Assumé pour
  garder la génération prévisible ; à réévaluer si le besoin de branches
  automatiques se confirme.
- 🟡 Client `api-client` édité à la main (pas régénéré depuis le contrat
  OpenAPI faute de serveur + BDD au moment du commit).

### Vérifié

- Backend : `npm run typecheck` propre ; `npx jest bpmn` 49/49 (nouveaux
  `bpmn-diagramme-proposal.spec.ts` 8 cas, + génération à la création / refus
  si diagramme peuplé / 403 superadmin dans les specs service et contrôleur).
- Frontend : `npm run typecheck` propre ; `bpmn.service.spec.ts` 12/12
  (nouveau cas `generer-diagramme`).
- Migration appliquée sur la BDD de dev (`prisma migrate deploy`).

---

## 2026-09-01 (suite 3) : nouvel audit de sécurité, régénération de diagramme BPMN comprise

Nouvel audit demandé par l'utilisateur, portant sur ce qui s'est ajouté
depuis le précédent (suite 1) : le module de génération de proposition de
diagramme BPMN (`bpmn-diagramme-proposal.ts`, entrée précédente) et le
pré-remplissage du diagramme de vision (`vision-canvas.prefill.ts`).

### Confirmé sain

- **`POST /bpmn-processus/:id/generer-diagramme`** : `@Roles(ADMINISTRATEUR,
  ARCHITECTE)`, isolation multi-tenant standard du projet
  (`processus.organisationId !== organisationId` → 404, pas 403, pour ne
  pas confirmer l'existence d'un id d'une autre organisation). Double
  plafond sur le texte source : `@MaxLength(5000)` en entrée DTO
  ([create-bpmn-processus.dto.ts](../apps/api/src/modules/bpmn/dto/create-bpmn-processus.dto.ts))
  et `MAX_ETAPES = 40` lignes dans
  [bpmn-diagramme-proposal.ts](../apps/api/src/modules/bpmn/bpmn-diagramme-proposal.ts)
  (l'un des deux suffirait, les deux sont présents). Module de construction
  pur (aucun accès DB, aucun `eval`, pas d'appel externe) : la seule sortie
  est une liste de nœuds/liens en mémoire.
- Le nom de chaque nœud généré (texte utilisateur quasi brut, seules les
  puces/numéros sont retirés) rejoint le même chemin de rendu SVG déjà
  audité (`bpmn-view.service.ts`, `wrap()`/`escape()` sur chaque `<text>`) :
  aucun nouveau point d'injection, la fonction d'échappement n'a pas été
  contournée par ce nouveau générateur.
- `vision-canvas.prefill.ts` (frontend) : pure concaténation de chaînes
  côté client pour préremplir un formulaire déjà validé par son propre DTO
  à l'enregistrement ; aucune surface nouvelle.
- Dette de sécurité du 2026-09-01 (suite 1) toujours en place et non
  régressée : `nodemailer@9.1.0`, `Dockerfile.api` non-root avec `--schema`
  explicite, `docker-compose.yml` (origine/SMTP/port Postgres/migration),
  `RegisterDto` avec `@ArrayMaxSize(50)`.
- `npm audit` (prod) : toujours 0 vulnérabilité d'exécution ; les
  vulnérabilités dev-only restantes (CLI `prisma` et ses transitifs) sont
  identiques à l'audit précédent, décision de ne pas forcer la mise à jour
  toujours valable (le correctif proposé reste une régression majeure).

### Rien de nouveau à corriger

Aucun point 🔴 ni 🟠 trouvé sur ce qui a été ajouté depuis le dernier
audit. Les points 🟡 déjà notés par la session parallèle elle-même dans
l'entrée précédente (proposition volontairement linéaire sans branches,
client `api-client` édité à la main faute de régénération) sont des choix
de conception assumés et documentés au moment du commit, pas des angles
morts de sécurité.

### Vérifié

- Backend : suite complète `apps/api` 504/504 (contre 489 à l'audit
  précédent : 15 tests nets ajoutés par le chantier BPMN).
- `npm audit --omit=dev` : 0 haute/critique sur les dépendances
  d'exécution, confirmé une seconde fois après les nouveaux ajouts.

## 2026-09-01 (suite 4) : correctif UX « étapes ajoutées mais diagramme vide »

### 🟠 Écart de comportement remonté par l'utilisateur

Ajouter des étapes à un processus **existant** via « Modifier » enregistrait le
texte sans construire le diagramme : la génération n'était câblée qu'à la
création. Vérifié en base (processus « Analyse des besoins du client » :
`etapes` peuplé, `elementCount = 0`). Le générateur lui-même est sain
(rejoué à la main contre la vraie base via l'adaptateur `PrismaPg` : 9 nœuds
+ 8 flux créés sans erreur, transaction interactive OK).

### Corrections

- `BpmnService.update` déclenche désormais la même génération que `create`
  quand `etapes` est renseigné **et** que le diagramme est encore vide
  (`bpmnElement.count === 0`), pour ne jamais écraser un diagramme édité.
- [bpmn.component.ts](../apps/web/src/app/vision/bpmn.component.ts) :
  - `saveEdit` force le rechargement du canevas (`BpmnCanevasComponent.reload()`)
    après enregistrement, sinon une proposition générée par cette étape
    n'apparaissait qu'au rechargement de la page ;
  - le bouton du panneau détail s'intitule « Générer le diagramme depuis les
    étapes » quand le diagramme est vide, « Régénérer… » sinon ;
  - message trompeur retiré : l'ancien texte de confirmation demandait de
    « supprimer d'abord les étapes existantes » (confusion étapes-texte /
    éléments-plan). Sur un diagramme vide la génération est directe ; sur un
    diagramme peuplé, un message clair invite à vider le plan d'abord.

### Vérifié

- `npx jest bpmn` 52/52 ; `bpmn.service.spec.ts` (web) 12/12 ; typecheck
  backend et frontend propres.
- Génération rejouée en base : le processus concerné a maintenant 9 éléments
  et 8 flux.

## 2026-09-01 (suite 5) : génération des passerelles (décisions, boucles, parallèles)

### Ce qui a été fait

Le générateur ne faisait qu'une chaîne linéaire : une étape « Si… » devenait
une passerelle mais sans branche. Il comprend désormais une petite syntaxe
d'écriture, toujours déterministe et sans IA.

- **Réécriture de**
  [bpmn-diagramme-proposal.ts](../apps/api/src/modules/bpmn/bpmn-diagramme-proposal.ts)
  en deux passes : découpage en blocs (étape simple, décision, parallèle) puis
  construction d'un graphe nœuds + liens.
  - **Décision** : ligne finissant par « ? » (ou « Si… », « Selon… ») suivie de
    branches « `= libellé : étape ; étape` ». Produit une passerelle exclusive
    de divergence, un flux libellé par branche, et une passerelle de fusion
    automatique ; la première ligne sans « = » est le point de convergence.
  - **Boucle** : une étape de branche « `→ "Nom d'une étape déjà définie"` »
    crée un flux de retour (rapproché par nom normalisé) au lieu d'un doublon.
  - **Parallèle** : ligne « En parallèle : » + branches « = » → passerelle
    parallèle (divergence + jonction).
  - Placement **en couches** (profondeur = plus long chemin depuis « Début »,
    flux de retour ignorés ; empilement vertical par ordre de création) au lieu
    de la rangée unique.
  - Garde-fous : décision/parallèle à moins de deux branches, branche « = »
    sans en-tête, retour vers une étape inconnue → `BadRequestException` avec
    message clair. `MAX_ETAPES` porté à 60 (les branches ajoutent des nœuds).
- `PropositionDiagramme.liens` passe de `[source, cible]` à
  `{ source, cible, label? }` ; `BpmnService` persiste `label` sur `BpmnFlow`.
- [bpmn.component.ts](../apps/web/src/app/vision/bpmn.component.ts) : le champ
  « Étapes » (création et modification) documente la syntaxe via un bloc
  `<details>` repliable et un exemple de placeholder avec décision, branches et
  boucle.
- Aucune migration (le rendu SVG et l'éditeur Konva affichaient déjà les
  libellés de flux et respectaient les positions enregistrées).

### Point de vigilance

- 🟡 Pas de décision imbriquée en v1 (une branche qui contient elle-même une
  ligne « ? »). Documenté, choix assumé.
- 🟡 Le placement en couches empile les branches par ordre de création sans
  minimiser les croisements : lisible mais parfois à réajuster à la main sur
  les processus très ramifiés. Le résultat reste une proposition.

### Vérifié

- `npx jest bpmn` 59/59 (spec du générateur portée à 15 cas : branches
  libellées + fusion, découpage « ; », boucle « → », passerelle parallèle,
  cohérence des couches, rejets). `bpmn.service.spec.ts` (web) 12/12.
  Typecheck backend et frontend propres.
- Bout en bout contre la vraie base (adaptateur `PrismaPg`) : un processus
  avec décision + boucle + parallèle génère 14 éléments, les flux « Oui »/
  « Non » portent leur libellé, le flux de retour pointe vers l'étape existante,
  la passerelle parallèle diverge puis converge. Processus de test remis dans
  son état initial ensuite.

## 2026-09-01 (suite 6) : conformité UML du diagramme de déploiement

### Contexte

Vérification de la notation du diagramme de déploiement
([technologie-canevas.component.ts](../apps/web/src/app/technologie/technologie-canevas.component.ts))
contre UML 2.5 (OMG formal/2017-12-05, clause 19 « Deployments ») et
uml-diagrams.org.

### 🟠 Écarts trouvés et corrigés

- **Mot-clé de stéréotype** : `«execution environment»` (deux mots) → le
  mot-clé UML normatif est `«executionEnvironment»` (un seul mot, casse de la
  métaclasse). Corrigé pour CLOUD / BASE_DE_DONNEES / MIDDLEWARE.
- **Sens de la dépendance «deploy»** : la flèche allait du Nœud vers
  l'Artefact. UML 2.4+ : la dépendance de déploiement va de l'Artefact
  (`client`) vers la cible de déploiement (`supplier` = le Nœud). Flèche
  ré-orientée Artefact → Nœud.
- **Pointe de flèche** : `Konva.Arrow` traçait une pointe pleine (triangle).
  Une dépendance UML se termine par une pointe **ouverte** (en V). Remplacé
  par un trait pointillé + chevron ouvert (`buildDeployDependency`).

### Déjà conforme (inchangé)

- Nœud = boîte 3D en perspective ; une boîte sans mot-clé = Nœud générique.
- Application déployée = **Artefact** (icône document à coin plié + `«artifact»`),
  et non l'icône Composant à encoches. Le code le soulignait déjà.
- `«device»` pour SERVEUR / RESEAU (équipement matériel, ex. serveur, switch) ;
  `«executionEnvironment»` pour les environnements logiciels.

### 🟡 Limite assumée

- Pas de **chemin de communication** entre nœuds (association trait plein,
  éventuellement `«TCP/IP»`...) : le modèle ne relie pas les `TechComponent`
  entre eux, seulement application → composant. Élément UML optionnel ;
  documenté dans l'en-tête du canevas. À ouvrir si le besoin se confirme
  (schéma + migration + interface).

### Vérifié

- `npm run typecheck` (frontend) propre ; tests web `technologie` 7/7.
- Revue manuelle du rendu Konva (nœud, artefact, dépendance) ; pas de
  vérification navigateur en direct (serveur de dev d'une autre session sur le
  port 4201).

---

## 2026-09-01 (suite 2) : génération automatique de la disposition des diagrammes

### ⚪ UX / ergonomie

Les 4 éditeurs Konva (diagramme de classe, diagramme de composants, diagramme
d'architecture applicative, diagramme de déploiement) affichaient une simple
pile d'éléments non positionnés, jamais persistée, tant que l'utilisateur ne
déplaçait pas chaque boîte à la main. Le canevas global et le BPMN avaient déjà
une génération ; ces 4-là non.

Ajout, sur le modèle de `ArchimateLayoutService.generateAndPersist` :

- **API** : util partagé
  [diagram-layout.util.ts](../apps/api/src/common/diagram-layout.util.ts)
  (`computeFlowGrid`, `computeLaneGrid`) + une route
  `POST .../generate-layout` par module
  ([donnees-layout.service.ts](../apps/api/src/modules/donnees/donnees-layout.service.ts),
  [applications-layout.service.ts](../apps/api/src/modules/urbanisation/applications-layout.service.ts),
  [architecture-applicative-layout.service.ts](../apps/api/src/modules/architecture-applicative/architecture-applicative-layout.service.ts),
  [technologie-layout.service.ts](../apps/api/src/modules/technologie/technologie-layout.service.ts)).
  Chaque service lit les éléments de l'organisation, calcule une grille (ou des
  couloirs par type pour l'archi applicative) et persiste `positionX/positionY`
  en une transaction. Réponse commune
  [DiagramLayoutResultEntity](../apps/api/src/common/entities/diagram-layout.entity.ts).
- **Inférence de liens (diagramme de classe uniquement)** :
  [donnees-relations.util.ts](../apps/api/src/modules/donnees/donnees-relations.util.ts)
  déduit les `DataRelation` manquantes à partir des attributs de type clé
  étrangère (`xId`, `x_id`, `idX`, `id_x`, `xRef` ; singulier/pluriel ;
  insensible casse/accents ; pas de doublon avec une relation existante). Aucune
  inférence pour les 3 autres diagrammes : leurs liens (échanges, flux,
  déploiements) sont déjà des données de première classe.
- **Frontend** : chaque `*-canevas.component.ts` appelle `generateLayout()`
  automatiquement à la première ouverture quand aucune position n'est
  enregistrée (`every(e => e.positionX == null)`), et expose un bouton
  « Réorganiser le diagramme » (confirmation si des positions existent, comme
  `/canevas`). L'appel est lancé **avant** `render()` pour ne pas être bloqué
  par une exception de rendu Konva (canevas de taille 0 dans un onglet masqué).
  Nouvelles méthodes de service `generateLayout()` + client API régénéré.

### Vérifié

- API : `nest build` propre ; `npm test` 540/540 (nouvelles suites
  `diagram-layout.util`, `donnees-relations.util`, `*-layout.service`,
  `*-layout` HTTP 200/403).
- Frontend : `npm run typecheck` propre ; `npm run test:ci` 172/172.
- Navigateur (org K&B) : ouverture d'un onglet diagramme sans positions
  enregistrées → `POST .../generate-layout` automatique, positions persistées
  (grille pour données/composants/déploiement, couloirs par type pour l'archi
  applicative), aucune ré-exécution au rechargement ; bouton « Réorganiser »
  fonctionnel sur les 4 diagrammes avec confirmation ; K&B n'ayant aucun
  attribut de type clé étrangère, 0 relation déduite (pas de faux positif).
  `/canevas` global et BPMN inchangés.

## 2026-09-01 (suite 7) : revue de conformité des autres diagrammes

Après le diagramme de déploiement (suite 6), passage en revue de tous les
autres diagrammes contre leur norme.

### Conformes, inchangés

- **BPMN** (processus) : flux de séquence = trait plein + pointe pleine ;
  passerelles au bon losange ; conforme BPMN 2.0 (déjà audité 08-24 et 09-01).
- **ArchiMate** (métier / motivation) : Assignation (disque plein source +
  flèche pleine cible), Composition (losange plein côté tout), Réalisation
  (trait tireté + triangle creux), Association (trait nu) : conforme
  ArchiMate 3.x (déjà audité 08-24).
- **Diagramme d'architecture applicative** : diagramme en couches maison
  (gabarit fourni), pas de norme graphique unique ; cohérent.
- **Plan d'occupation des sols** (urbanisation) : cadastre à 5 couches façon
  urbanisation du SI (Longépé) ; conforme à cette convention.
- **Organigramme** (module Service) : arbre hiérarchique, pas une notation
  normée.

### 🟠 Écarts trouvés et corrigés

- **Diagramme de classe** (données),
  [donnees-canevas.component.ts](../apps/web/src/app/donnees/donnees-canevas.component.ts)
  et [donnees.component.ts](../apps/web/src/app/donnees/donnees.component.ts) :
  les cardinalités utilisaient « N » (notation entité-association de Chen) au
  lieu de « * » (multiplicité UML), et les libellés contenaient un tiret
  cadratin. Corrigé : extrémités `1` / `*`, libellés
  « un à plusieurs (1..*) »... sans tiret cadratin.
- **Diagramme de composants** (architecture système),
  [applications-canevas.component.ts](../apps/web/src/app/architecture-systeme/applications-canevas.component.ts) :
  les échanges étaient tracés en connecteur « boule / réceptacle » (interface
  fournie / requise), avec la boule (fournie) côté source et le réceptacle
  (requis) côté cible, soit l'inverse du sens naturel « la source appelle la
  cible ». Surtout, le modèle ne nomme aucune interface : ce connecteur
  affichait une précision inexistante. Remplacé par une **dépendance UML
  orientée** : trait pointillé, pointe ouverte en V, source → cible.

### Vérifié

- `npm run typecheck` (frontend) propre ; tests web `donnees` 12/12,
  `architecture-systeme` 9/9, `technologie` 7/7.
- Revue de code du rendu Konva / SVG de chaque diagramme. Pas de contrôle
  navigateur en direct (port 4201 occupé par une autre session).

---

## 2026-09-01 (suite 3) : page d'accueil enrichie

### ⚪ UX / contenu public

La page d'accueil ([home.component.ts](../apps/web/src/app/public/home.component.ts))
se limitait à un hero, trois étapes et deux grilles de features génériques.
Elle contredisait aussi le nouveau parcours (« connecté·e immédiatement, aucune
validation à attendre »).

Ajouts :

- **Introduction plus explicite** : positionnement TOGAF ADM, référentiel unique,
  vues et diagrammes générés.
- Étape 1 corrigée : l'inscription est désormais vérifiée par l'équipe avant
  validation, puis lien de connexion par e-mail.
- Section **« Un aperçu de l'application »** : galerie de 6 visuels réels
  (diagramme de vision, vue ArchiMate, BPMN, diagramme de composants, diagramme
  de déploiement, organigramme) tirés de `apps/web/src/assets`, présentés dans
  un cadre façon fenêtre navigateur, `loading="lazy"`.
- Section **« Les modules »** : 8 cartes couvrant vision/exigences, procédures
  BPMN, architecture métier / données / applicative / technologique, canevas,
  roadmap & gouvernance.
- Section **« Dernières améliorations »** : timeline reprenant les évolutions
  récentes (génération automatique des diagrammes, validation des organisations,
  diagramme de vision pré-rempli, inscription responsive).

### Vérifié

- `npm run typecheck` propre ; `npm run test:ci` 172/172.
- Navigateur (serveur de préview dédié) : les 6 sections s'affichent, les 6
  images se chargent (200), aucune erreur console ; pas de défilement horizontal
  à 1280 px ni à 390 px (galerie, modules et étapes passent en une colonne).

---

## 2026-09-01 (suite 8) : avis d'ensemble, à la demande de l'utilisateur

L'utilisateur a demandé un avis global sur l'état de l'application plutôt
qu'un audit technique ciblé. Synthèse basée sur la relecture de ce journal
(2026-08-18 à ce jour) et quelques vérifications ponctuelles (structure de
dossiers, présence du JWT en `localStorage`), pas un nouveau passage complet
de sécurité ou de performance (déjà couvert par les entrées précédentes du
jour).

### Ce qui distingue ce projet pour un stage

- **Discipline d'audit continue et réellement suivie d'effet.** Depuis le
  premier audit du 2026-08-18, chaque point 🔴 relevé a fini par être traité
  ou explicitement requalifié avec une justification (ex. upload de logo :
  le correctif littéral suggéré aurait cassé l'inscription, le vrai risque
  XSS a été traité autrement). Le dossier plat `apps/web/src/app` (~55
  fichiers) signalé en 🟡 le 2026-08-18 est aujourd'hui réorganisé en 24
  dossiers par fonctionnalité : les points de dette notés ne sont pas restés
  lettre morte.
- **Vérification en conditions réelles, pas seulement en tests unitaires.**
  Plusieurs bugs réels (gel du navigateur sur Chart.js, corruption d'accents
  à l'import CSV, `Solution.create()` sans `include`) n'ont été trouvés qu'en
  rejouant le scénario dans un navigateur avec de vraies données
  accentuées : le journal le documente explicitement comme un enseignement
  méthodologique, pas un hasard.
- **Conformité aux notations réelles, vérifiée contre les normes**, pas
  juste "ça ressemble à". BPMN 2.0, ArchiMate 3.x et UML 2.5 (stéréotypes de
  déploiement, sens de la dépendance, multiplicités) ont chacun fait l'objet
  d'une relecture contre leur spécification, avec des écarts corrigés (ex.
  `«execution environment»` → `«executionEnvironment»`). C'est un niveau de
  rigueur rarement vu sur un projet de cette taille.
- **Isolation multi-tenant et RBAC posés dès le départ et maintenus** à
  chaque nouveau module (Architecture applicative, Opportunités,
  Gouvernance...), jamais traités comme un détail ajouté après coup.

### Ce qui reste fragile ou à surveiller

- **Token JWT toujours en `localStorage`** (confirmé encore présent dans
  [auth.service.ts](../apps/web/src/app/auth/auth.service.ts) à cette date).
  Documenté depuis le premier audit, jamais traité : la surface `[innerHTML]`
  qui pourrait un jour l'exposer via une faille XSS a nettement grandi
  depuis (6 générateurs SVG). Toujours pas de faille trouvée à ce jour, mais
  c'est le point de sécurité qui a le plus vieilli sans être traité.
- **Vélocité fonctionnelle très élevée** (10+ modules ADM complets en deux
  semaines) au prix d'une dette assumée mais réelle : glyphes BPMN dessinés
  deux fois (SVG serveur + Konva client, désynchronisation possible),
  clients API parfois édités à la main plutôt que régénérés faute de serveur
  disponible au moment du commit, doublon de requêtes `list()`/
  `listPaginated()` dans deux composants. Rien de bloquant individuellement,
  mais le rythme laisse peu de place à un nettoyage de fond.
- **Aucune vérification d'identité réelle des entreprises à l'inscription** :
  la validation superadmin repose sur les informations déclarées, pas sur
  une preuve d'existence légale. Acceptable pour une démonstration ou un
  usage interne encadré, pas pour un vrai SaaS public sans durcissement
  supplémentaire de ce processus.
- **Déploiement Docker fonctionnel mais encore artisanal** : pas d'étape
  `prisma migrate deploy` intégrée, mot de passe Postgres et secrets à
  fournir manuellement, aucune CI qui rejoue `npm audit`/les suites de tests
  avant merge (pas vérifié si `ci/cd` du dernier commit couvre déjà ce point,
  à confirmer séparément).

### Avis

Pour un projet de stage, le niveau d'exigence dépasse largement ce qui est
généralement attendu : la couverture fonctionnelle suit fidèlement le cycle
TOGAF ADM complet (A à H), les diagrammes respectent les normes qu'ils
prétendent suivre plutôt que de s'en inspirer vaguement, et surtout, la
sécurité et la qualité ont été traitées comme un sujet continu (journal
vivant, ré-audits réguliers) plutôt que comme une case cochée une fois. Le
point faible principal reste le même depuis le premier jour et n'a pas
progressé (JWT en `localStorage`), ce qui est le signe d'une dette
consciente et documentée plutôt que d'un angle mort, mais qui mériterait
d'être traité avant tout déploiement destiné à de vrais utilisateurs
externes plutôt qu'à une démonstration.

---

## 2026-09-01 (suite 9) : correctif à l'avis d'ensemble, durcissement Docker/CI, découverte d'une faille frontend

L'utilisateur a demandé de traiter tous les points fragiles listés dans
l'entrée précédente. Avant de s'y lancer, question posée pour prioriser :
réponse "tous sans plus tarder". Traitement dans l'ordre : Docker/CI
(rapide), puis vérification du JWT (le plus important).

### 🔴 Correctif à l'entrée précédente : le JWT n'est plus en `localStorage`

L'avis d'ensemble du 2026-09-01 (suite 8) affirmait "Token JWT toujours en
`localStorage`, confirmé encore présent". **C'était une erreur** : le grep
qui a servi de base ne distinguait pas *quoi* était stocké. En relisant le
code en entier ([auth.service.ts](../apps/web/src/app/auth/auth.service.ts)),
`localStorage` ne contient plus que le profil d'affichage non sensible
(id/email/nom/rôle) ; le jeton lui-même est déjà posé en cookie `httpOnly`
par l'API ([auth.controller.ts](../apps/api/src/modules/auth/auth.controller.ts),
`setAuthCookies()`/`clearAuthCookies()` dans
[auth-cookies.ts](../libs/shared/src/utils/auth-cookies.ts)), avec un cookie
`XSRF-TOKEN` non-`httpOnly` associé et un `CsrfGuard` en double soumission
cookie/en-tête ([csrf.guard.ts](../libs/shared/src/guards/csrf.guard.ts)),
`cookie-parser` et CORS `credentials: true` posés dans
[main.ts](../apps/api/src/main.ts), et le `HttpClient` Angular configuré en
conséquence (`withXsrfConfiguration`, `withCredentials` sur chaque requête
via l'intercepteur). Cette migration a été faite intégralement et
correctement par une session parallèle, sans mise à jour de ce journal, ce
qui explique l'écart entre le code réel et ce qui y était écrit.

**Vérifié en conditions réelles** (base et instance API de vérification
dédiées, isolées de l'environnement de dev habituel) : `POST /auth/login`
pose bien `access_token` (`HttpOnly`) et `XSRF-TOKEN` (lisible) ;
`GET /auth/me` réussit avec le seul cookie, sans en-tête `Authorization` ;
`PATCH /auth/me` sans en-tête `x-xsrf-token` → `403` ; avec l'en-tête
correspondant au cookie → mutation appliquée. Les 540 tests backend et
l'intégralité de la suite frontend passent. Ce point de l'audit initial
(2026-08-18), le plus ancien resté ouvert, est donc bien résolu.

**Leçon retenue** : ne plus conclure "toujours en localStorage" sur la
seule présence du mot dans un grep sans lire ce qui y est réellement
stocké. Corrigé ici plutôt que laissé tel quel, conformément à la règle de
ce journal (jamais réécrire une entrée passée, seulement corriger via une
nouvelle entrée datée).

### 🟠 Docker : deux vrais bugs trouvés et corrigés

1. **L'image de production embarquait 8 vulnérabilités hautes/modérées
   jamais détectées jusqu'ici**, alors que les audits précédents
   affirmaient "0 vulnérabilité d'exécution". `Dockerfile.api` utilisait
   `npm ci --omit=dev`, qui n'exclut pas les paquets marqués `devOptional`
   dans `package-lock.json` (dépendance optionnelle *d'une* devDependency :
   la CLI Prisma, jamais utilisée à l'exécution, en tire plusieurs :
   `mysql2`, `find-my-way`, `fast-uri`, `valibot`, `deepmerge-ts`,
   `@prisma/dev`, `@prisma/config`). Reproduit avec une installation
   `--omit=dev` réelle dans un dossier isolé (315 paquets installés, 8
   vulnérabilités) avant correctif. Corrigé : `--omit=dev --omit=optional`
   dans `Dockerfile.api` (182 paquets, 0 vulnérabilité). Seul paquet
   purement optionnel non-dev du lockfile : `pg-cloudflare` (adaptateur
   Cloudflare Workers, sans objet ici, connexion Postgres standard via `pg`
   + `@prisma/adapter-pg`).
2. **Le service `migrate` de `docker-compose.yml` (censé appliquer les
   migrations au démarrage, ajouté depuis l'audit du 2026-09-01 suite 1)
   ne fonctionnait pas du tout** : `prisma.config.ts` (requis par Prisma 7
   pour `migrate deploy`, porte `datasource.url` depuis `DATABASE_URL`)
   n'était jamais copié dans l'étage `builder` du `Dockerfile.api`, seule
   `apps/api/` et quelques fichiers de config l'étaient. Le conteneur
   `migrate` échouait donc systématiquement (`Error: the datasource.url
   property is required...`), avant même de tenter une connexion. Bug de
   déploiement bloquant, non détecté par les audits précédents faute
   d'avoir été rejoué en conditions réelles. Corrigé : `prisma.config.ts`
   ajouté à la ligne `COPY` des fichiers de config du `builder`.
3. **Vérifié de bout en bout** après les deux correctifs : image
   reconstruite, `docker compose up` complet (postgres → migrate → api),
   `migrate` applique les 26 migrations avec succès, `GET /api/v1/health`
   répond `200 {"status":"ok","db":"ok"}`, conteneur `api` toujours non-root
   (`node`, uid 1000). Conteneurs, volumes et images de vérification
   supprimés après coup.
4. **CI** ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) : ajout
   d'une étape `npm audit --omit=dev --omit=optional --audit-level=high`
   sur les deux jobs (api, web), qui ne faisait pas partie du pipeline
   jusqu'ici malgré des audits `npm audit` manuels répétés dans ce journal.

### 🔴 Nouvelle découverte : dépendances frontend jamais auditées

Tous les audits précédents de ce journal n'ont fait tourner `npm audit`
que sur `apps/api`. Un premier passage sur `apps/web` (fait dans le cadre
du point CI ci-dessus) révèle **9 vulnérabilités hautes, jamais
mentionnées jusqu'ici** :

1. **`@angular/core` et le reste du framework (≤19.2.25 concerné, installé :
   17.3.12)** : plusieurs CVE réelles, dont des XSS (attributs SVG,
   liaisons i18n, contournement de sanitisation de binding bidirectionnel,
   franchissement d'espace de noms template/attribut) et des DoS (`OOM` sur
   `formatDate`/`digitsInfo`, empoisonnement de cache via
   `HttpTransferCache`). Particulièrement pertinent ici puisque l'audit du
   2026-08-26 notait déjà 6 générateurs SVG serveur rendus via `[innerHTML]`
   + `bypassSecurityTrustHtml` comme surface XSS élargie : une faille XSS
   dans le moteur de sanitisation d'Angular lui-même aggraverait directement
   ce risque déjà identifié. Correctif disponible uniquement via
   `@angular/core@21.2.22` : **saut de 4 versions majeures (17→21)**, non
   tenté dans cette session (voir "Non traité" ci-dessous).
2. **`xlsx` (SheetJS) `^0.18.5` : prototype pollution + ReDoS, aucun
   correctif publié sur le registre npm.** Le mainteneur ne publie plus ses
   correctifs sur npm depuis plusieurs années ; la version corrigée
   (0.20.3, vérifié disponible et identique à l'alias `xlsx-latest` du CDN
   au moment de l'audit) n'est distribuée que via `cdn.sheetjs.com`,
   pratique documentée par les mainteneurs eux-mêmes et confirmée par
   l'avis GitHub lui-même ("a non-vulnerable version cannot be found via
   npm"). Pertinent car `xlsx` est utilisé en production
   ([excel.util.ts](../apps/web/src/app/shared/excel.util.ts)) pour
   importer de vrais fichiers utilisateur (réponses d'enquête
   d'évaluation...). **Corrigé, avec l'accord explicite de l'utilisateur** :
   `apps/web/package.json` pointe désormais `xlsx` vers
   `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. Vérifié : l'API
   utilisée par `excel.util.ts` (`XLSX.read`/`XLSX.writeFile`) est stable
   entre 0.18 et 0.20, aucun changement de code nécessaire ; build
   production sans erreur ni avertissement nouveau ; suite frontend
   complète 172/172 ; `npm audit --omit=dev --omit=optional` passe de 9 à 8
   vulnérabilités hautes (xlsx n'y figure plus, restent uniquement celles
   du framework Angular, voir ci-dessous).

### Décisions de l'utilisateur sur les points restants

- **Migration majeure Angular 17→21** : seule vraie remédiation aux CVE
  ci-dessus (XSS SVG/i18n, DoS `HttpTransferCache`). Chantier de bien plus
  grande ampleur que tout le reste de cette session (migration séquentielle
  probable 17→18→19→20→21, changements cassants possibles sur 24 modules,
  Konva, Chart.js), risque de régression réel sur toute l'application.
  **Décision de l'utilisateur : ne pas y toucher pour l'instant** ("on
  laisse Angular 17 tranquille"), à planifier séparément. Les 8
  vulnérabilités hautes restent donc ouvertes, dette assumée et documentée.
- **Unification des glyphes BPMN (SVG serveur / Konva client) et
  vérification d'identité des entreprises à l'inscription** : les deux
  points restants de la demande initiale de l'utilisateur. **Décision de
  l'utilisateur : laissés de côté pour l'instant**, la découverte des
  failles frontend et du bug de déploiement Docker ayant pris la priorité
  sur ces deux chantiers (l'un est un refactor de maintenabilité sans
  faille associée, l'autre nécessite une décision produit qui reste à
  prendre).
- **Environnement de dev local cassé, sans rapport avec cette session** :
  le conteneur `docker-postgres-1` utilisé par le serveur API de
  développement local (port 3000) a des identifiants qui ne correspondent
  plus à `DATABASE_URL` dans `.env` (conteneur inactif depuis le
  2026-07-06, mot de passe visiblement changé depuis). Le serveur de dev
  tourne donc actuellement sans base de données fonctionnelle
  (`/api/v1/health` → `db: unreachable`). Découvert en tentant de vérifier
  le flux de connexion en direct ; signalé à l'utilisateur avec deux options
  (récupérer l'ancien mot de passe, ou recréer proprement). **Résolu sur
  demande explicite de l'utilisateur** : `docker inspect` a confirmé la
  cause exacte (`POSTGRES_PASSWORD=postgres`, l'ancien mot de passe par
  défaut documenté comme faible depuis l'audit du 2026-08-26, jamais mis à
  jour sur ce conteneur précis) et une donnée bind-mount orpheline
  (`docker/data/postgres`, 63 Mo, sans fichier `docker-compose.yml`
  l'accompagnant, reliquat d'un ancien montage). Conteneur et données
  supprimés, base recréée proprement via le `docker-compose.yml` actuel du
  projet (volume nommé, pas de bind mount) avec le mot de passe courant de
  `.env`, migrations réappliquées, jeu de données de démonstration reseedé.
  Vérifié : `pg.Pool` du serveur de dev déjà démarré s'est reconnecté tout
  seul dès que la base a été saine (aucun redémarrage nécessaire),
  `/api/v1/health` → `200 {"status":"ok","db":"ok"}`, connexion réussie via
  le vrai formulaire de login dans le navigateur, tableau de bord affichant
  les données K&B Groupe SARL.

### Vérifié

- Backend : suite complète 540/540 (65 suites).
- Frontend : suite complète 172/172, avant et après le remplacement de
  `xlsx` ; build production sans erreur ni nouvel avertissement.
- Docker : image reconstruite de bout en bout après les deux correctifs
  (`--omit=optional`, `prisma.config.ts` copié) ; `docker compose up`
  complet (postgres → migrate → api) sur une base neuve, 26 migrations
  appliquées avec succès, `GET /api/v1/health` → `200 {"status":"ok",
  "db":"ok"}`, conteneur non-root confirmé (`whoami` → `node`, uid 1000).
- JWT/CSRF : vérifié en direct sur une base et une instance API dédiées,
  isolées de l'environnement de dev local cassé (voir ci-dessus) : login
  pose `access_token` (`HttpOnly`) + `XSRF-TOKEN` (lisible) ; `GET /auth/me`
  réussit au seul cookie ; `PATCH /auth/me` sans en-tête CSRF → `403`, avec
  l'en-tête correspondant → `200`.
- `npm audit --omit=dev --omit=optional --audit-level=high` : 0 vulnérabilité
  côté API, 8 hautes côté web (framework Angular uniquement, dette assumée
  ci-dessus).
- Toutes les ressources de vérification (conteneurs, volumes, images,
  instances API de test, bases de données isolées) supprimées après usage ;
  aucune trace laissée dans l'environnement partagé au-delà des correctifs
  de code eux-mêmes.

---

## 2026-09-02 : photo de profil par téléversement, invitation d'un membre par e-mail

### Contexte

Deux demandes fonctionnelles de l'utilisateur :

1. Dans les paramètres, l'utilisateur devait coller l'URL de sa photo de
   profil dans un champ texte. Il doit pouvoir téléverser un fichier depuis
   son poste, comme pour le logo d'organisation.
2. Un ADMINISTRATEUR ne pouvait ajouter un membre qu'en lui fixant un mot de
   passe temporaire transmis de la main à la main, sans e-mail. Il doit
   pouvoir donner l'accès par e-mail : la personne reçoit un lien, crée son
   compte et choisit son mot de passe.

### Ce qui a été fait

Photo de profil :

- Nouvel endpoint `POST /uploads/avatar`, authentifié (le `JwtAuthGuard`
  global s'applique, pas de `@Public` contrairement à `/uploads/logo`), même
  configuration multer que le logo (PNG/JPEG/WEBP, 5 Mo, SVG exclu). La
  constante `logoMulterOptions` est renommée `imageMulterOptions`, réutilisée
  par les deux routes.
- Front : `AuthService.uploadAvatar()` ; l'écran Paramètres remplace le champ
  URL par un bouton photo rond avec aperçu et une action « Retirer la photo »
  (envoie `avatarUrl: ''` pour effacer côté serveur).

Invitation d'un membre :

- Nouveau modèle Prisma `Invitation` (`email`, `role`, `organisationId`,
  `serviceId`/`poste`/`contact` optionnels, `tokenHash` unique, `statut`
  EN_ATTENTE/ACCEPTEE/REVOKEE, `invitedById`, `expiresAt`, `acceptedAt`) et
  enum `StatutInvitation`. Migration `20260902100000_add_invitation`.
- Seule l'empreinte SHA-256 du jeton est stockée ; le jeton brut ne vit que
  dans le lien e-mail. Jeton de 32 octets, lien valable 7 jours, à usage
  unique.
- `InvitationModule` : `InvitationController` (routes admin sous
  `/invitations`, `@Roles(ADMINISTRATEUR)` : liste des invitations en
  attente, création, `POST :id/renvoyer`, `DELETE :id` qui passe l'invitation
  en REVOKEE) et `InvitationPublicController` (`GET /invitations/token/:token`
  et `POST /invitations/accept`, tous deux `@Public` + throttle 10/min pour
  freiner le balayage de jetons).
- L'acceptation crée le `User` avec le rôle prévu dans une transaction avec
  le passage de l'invitation en ACCEPTEE, puis ouvre la session (mêmes
  cookies qu'un login). Vérifie que l'organisation est VALIDEE et qu'aucun
  compte n'a été créé entre-temps pour cet e-mail.
- `MailService.sendInvitation()` (mode simulé sans SMTP, comme le reste).
- Front : `InvitationsService`, section « Invitations en attente » dans
  l'onglet Membres (renvoyer / révoquer), popover « Inviter par e-mail »
  (e-mail + rôle + poste/contact/structure optionnels), page publique
  `/rejoindre?token=…` (`RejoindreComponent`) qui affiche l'organisation et
  le rôle, pré-remplit l'e-mail, demande nom + mot de passe (avec
  confirmation) puis redirige vers le tableau de bord.

### 🟡 À planifier

- L'endpoint `/uploads/avatar` ne supprime pas l'ancien fichier quand
  l'utilisateur change de photo : les images orphelines s'accumulent dans
  `apps/api/uploads`. Même dette que `/uploads/logo`, à traiter globalement
  (tâche de nettoyage ou stockage objet).
- La création directe d'un membre avec mot de passe temporaire
  (`POST /membres`) reste disponible en parallèle de l'invitation. À
  retirer une fois l'invitation adoptée, pour n'avoir qu'un seul chemin.
- Pas de limite de volume d'invitations par organisation ni de purge des
  lignes ACCEPTEE/REVOKEE anciennes.
- `MembresService` continue d'autoriser un ADMINISTRATEUR à supprimer un
  membre ; rien n'empêche encore de révoquer l'accès d'un membre déjà actif
  autrement que par cette suppression.

### Vérifié

- Backend : `npm run typecheck` sans erreur ; suite complète Jest
  66 suites / 551 tests (dont `invitation.service.spec.ts` :
  création, doublon compte, doublon invitation, révocation, jeton
  expiré/déjà utilisé, acceptation nominale).
- `prisma format` + `prisma generate` OK ; migration SQL écrite à la main
  au format Prisma (non appliquée ici, pas de base sous la main).
- Front : `tsc -p tsconfig.app.json --noEmit` sans erreur ;
  `invitations.service.spec.ts` ajouté (liste paginée, création, renvoi,
  révocation).
- Non vérifié faute d'environnement complet (base + SMTP) : le parcours
  bout-en-bout envoi d'e-mail → ouverture du lien → création de compte →
  session ; le client `api-client` régénéré (`npm run generate:api-client`
  contre l'API up) doit reproduire à l'identique les fichiers ajoutés à la
  main dans `apps/web/src/app/api-client`.

---

## 2026-09-02 : flux « mot de passe oublié »

Sur demande explicite de l'utilisateur, à la suite d'une question posée en
préparant le déploiement ("comment fait-on si on a oublié le mot de
passe ?") : jusqu'ici, aucun moyen de récupérer l'accès à un compte, y
compris pour un ADMINISTRATEUR (`membres.service.ts` ne permet de changer
ni son propre mot de passe ni celui d'un collègue). Manque bloquant avant
tout déploiement destiné à de vrais utilisateurs.

### Ce qui a été fait

Même patron que `Invitation` (jeton à usage unique, empreinte SHA-256
seule stockée), adapté à un compte déjà existant :

- **Schéma** : nouveau modèle `PasswordResetToken` (`userId`, `tokenHash`
  unique, `expiresAt`, `usedAt`) et relation sur `User`
  (migration `20260902084742_add_password_reset_token`). Expiration
  volontairement courte (1h, contre 7 jours pour une invitation) : ce
  jeton donne accès à un compte existant, pas seulement la création d'un
  nouveau.
- **Backend** (`AuthService`/`AuthController`, pas de nouveau module :
  la fonctionnalité reste un aspect de l'authentification) :
  - `POST /auth/forgot-password` (`@Public`, throttle 5/min) : répond
    **toujours** avec le même message générique, que le compte existe ou
    non (pas d'énumération d'e-mails, même principe que le timing-safe
    compare du login). N'envoie l'e-mail que si le compte existe.
  - `POST /auth/reset-password` (`@Public`, throttle 5/min) : vérifie le
    jeton (existe, non utilisé, non expiré), remplace `passwordHash`,
    marque le jeton utilisé et invalide tout autre jeton en attente pour
    ce compte, puis ouvre une session (mêmes cookies `httpOnly`/CSRF
    qu'un login classique).
  - `MailService.sendPasswordReset()`, même mode simulé sans `SMTP_HOST`
    que le reste.
- **Frontend** : `AuthService.forgotPassword()`/`resetPassword()` ;
  `MotDePasseOublieComponent` (`/mot-de-passe-oublie`) et
  `ReinitialiserMotDePasseComponent` (`/reinitialiser-mot-de-passe?token=…`,
  validation du mot de passe et de sa confirmation côté client avant
  envoi) ; lien « Mot de passe oublié ? » ajouté sur l'écran de connexion.
- Client `api-client` régénéré pour de vrai (`npm run generate:api-client`
  contre l'API de dev réellement démarrée) : au passage, cela a aussi
  régénéré les fichiers du module Invitation de l'entrée précédente
  (rédigés à la main faute de serveur disponible à ce moment-là), comblant
  le point qu'elle laissait ouvert.

### Vérifié

- Backend : suite complète 562/562 (dont 11 nouveaux cas :
  `forgotPassword`/`resetPassword` dans `auth.service.spec.ts`, HTTP dans
  `auth.controller.spec.ts`) ; `tsc --noEmit` propre.
- Frontend : suite complète 178/178 (2 nouveaux cas dans
  `auth.service.spec.ts`) ; `tsc --noEmit` et build production propres.
- **Bout en bout, sur une instance API isolée en mode e-mail simulé** (pour
  ne pas solliciter le vrai SMTP Gmail configuré sur l'environnement de dev
  partagé) : demande de réinitialisation pour le compte de démonstration →
  e-mail simulé journalisé avec le bon lien → jeton utilisé pour choisir un
  nouveau mot de passe → cookies de session posés → ancien mot de passe
  rejeté (401) → nouveau mot de passe accepté (200) → réutilisation du même
  jeton rejetée (400, déjà utilisé) → jeton inconnu rejeté (400). Mot de
  passe de démonstration restauré à l'identique après vérification (via le
  même flux, pas d'écriture directe en base), jetons de test supprimés.
- Dans le navigateur, contre le serveur de dev réel : lien « Mot de passe
  oublié ? » visible et fonctionnel depuis `/login` ; écran de
  réinitialisation avec jeton d'exemple : validation client du mot de passe
  trop court/non confirmé, puis message d'erreur serveur correctement
  affiché pour un jeton invalide ("Ce lien de réinitialisation est
  invalide ou a déjà été utilisé.").
- Migration appliquée sur la base de dev partagée ; au passage,
  `prisma migrate status` confirme que la migration `Invitation` de
  l'entrée précédente (non appliquée à l'époque faute de base disponible)
  est elle aussi désormais appliquée.

### 🟡 À planifier

- Toujours pas de moyen pour un ADMINISTRATEUR de forcer la réinitialisation
  du mot de passe d'un collègue directement (utile si l'e-mail du collègue
  est aussi inaccessible) : hors périmètre de cette demande, qui couvrait le
  cas où l'utilisateur lui-même a accès à sa boîte mail.

## 2026-09-02 : module Évaluation, constructeur de questionnaires

### Ce qui a été fait

Ajout d'un onglet « Questionnaires » au module Évaluation, à côté des onglets
« Réponses » (import Excel) et « Rapport d'évaluation » existants, laissés
intacts.

- **Schéma** : `Questionnaire` (titre, description, `reponse_fichier_url` /
  `reponse_fichier_nom`) et `Question` (intitulé, `type` enum `TypeQuestion`,
  `options TEXT[]`, `note_max`, `ordre`) ; migration
  `20260902093713_add_questionnaire_evaluation`, appliquée.
- **Types de question** : OUI_NON, CHOIX_MULTIPLE (>= 2 options), NOTE_MAX
  (borne 1 à 100, défaut 5), REPONSE_OUVERTE, SUGGESTION.
- **API** (`evaluation` module) : `GET/POST/PATCH/DELETE /questionnaires`
  (lecture ouverte, écriture ADMIN/ARCHITECTE), `POST` et `DELETE
  /questionnaires/:id/reponse-fichier`. Le PATCH remplace intégralement la
  liste des questions quand `questions` est fourni (transaction : deleteMany
  puis create). Nouveau `documentMulterOptions` (PDF, xlsx, xls, csv,
  10 Mo) dans `uploads.config.ts` ; le fichier est servi sous `/uploads`
  comme les logos/avatars.
- **Frontend** :
  [questionnaires.component.ts](../apps/web/src/app/evaluation/questionnaires.component.ts)
  (liste, éditeur avec ajout/suppression/réordonnancement de questions et
  éditeur d'options par type, vue détail), branché comme 3e onglet de
  [evaluation.component.ts](../apps/web/src/app/evaluation/evaluation.component.ts).
- **Export PDF du questionnaire** : `downloadQuestionnairePdf` dans
  [download.util.ts](../apps/web/src/app/shared/download.util.ts) (jsPDF, comme
  le reste de l'app) : formulaire vierge, une zone de réponse adaptée au type
  (cases Oui/Non, cases à cocher, « _ / max », lignes vides).
- **Fichier de réponse** : un seul par questionnaire (choix de l'utilisateur),
  remplacé à chaque téléversement, re-téléchargeable via son lien `/uploads`.

### 🟡 Points de vigilance

- Client `api-client` non régénéré : `questionnaire.service.ts` appelle
  `HttpClient` en direct (types écrits à la main), en attendant
  `npm run generate:api-client`. Bridge assumé et commenté.
- Fichier de réponse servi par la route statique publique `/uploads`
  (nom = UUID aléatoire), sans contrôle d'accès au téléchargement, comme les
  logos et avatars existants. Acceptable pour le modèle de menace actuel ;
  à revoir si les réponses contiennent des données sensibles.

### Vérifié

- API : `npm run typecheck` propre ; `npx jest evaluation` 30/30 (nouveaux
  `questionnaire.service.spec` 7 cas, `questionnaire.controller.spec` 8 cas :
  création, remplacement des questions, rejet type inconnu / choix multiple à
  1 option, 403 superadmin, fichier de réponse).
- Frontend : `npm run typecheck` propre ; `ng build` OK ; tests web
  `evaluation` 10/10.
- Bout en bout contre la vraie base (adaptateur `PrismaPg`) : questionnaire à
  5 questions typées créé, `options`/`note_max`/`_count` persistés, fichier de
  réponse rattaché, suppression en cascade des questions vérifiée. Données de
  test nettoyées.

---

## 2026-09-02 : structures (postes) éditables en liste, avec titulaire

### 🟡 Ergonomie

L'onglet « Structures » de `/organisation` n'affichait les `Service` qu'en
**arbre**, sans **modification** possible (seulement ajout/suppression) et sans
moyen de désigner **qui occupe le poste**. D'après l'utilisateur, une structure
= un poste (ex. « Secrétaire »).

Changements :

- **Schéma** : `Service.titulaireId` (→ `User`, `onDelete: SetNull`) +
  relation inverse `User.postesOccupes`. Les deux relations `User`↔`Service`
  sont désormais nommées (`ServiceMembres`, `ServiceTitulaire`). Migration
  `20260902084359_add_service_titulaire`.
- **API `service`** : `create`/`update` acceptent `titulaireId` (nullable sur
  l'update pour rendre le poste vacant) ; `update` vérifie que le titulaire
  appartient à l'organisation (400 sinon). `findAll` inclut `titulaire`
  (id + nom) à chaque niveau de l'arbre. Nouvelle route `GET /services/membres`
  → `{ id, nom }[]` de l'organisation (accessible aux rôles tenant, sans
  exposer les e-mails via `/membres` qui reste réservé `ADMINISTRATEUR`).
- **Frontend** ([organisation.component.ts](../apps/web/src/app/organisation/organisation.component.ts)) :
  l'onglet « Structures » passe en **table standard** (Nom · Structure parente ·
  Titulaire · Membres · actions). Colonne **Titulaire** = `<select>` inline
  (« Vacant » + membres) persistant à la volée (`PATCH /services/:id`).
  Nouveau popover **« Modifier la structure »** (nom, parent en excluant les
  descendants, titulaire, description). L'arbre reste dans l'onglet
  « Organigramme ». Les `<select>` pré-remplis utilisent `[selected]` sur les
  options (le `[value]` sur `<select>` + `*ngFor` ne pré-sélectionne pas de
  façon fiable sans `ngModel`).
- Champ texte libre `poste` du membre : laissé tel quel (hors périmètre).

### Incident rencontré (résolu)

Après la migration, le serveur `nest start --watch` (:3000) servait des 500 sur
`GET /services` : `nest --watch` recompile le TS mais ne recharge pas le client
Prisma régénéré. Résolu en redémarrant le serveur de dev. À garder en tête
après toute migration.

### Vérifié

- API : `nest build` propre ; `npm test` **569/569**.
- Frontend : `npm run typecheck` propre ; `npm run test:ci` **184/184** ;
  client API régénéré.
- Navigateur (org K&B) : l'onglet « Structures » affiche la table (2 lignes,
  parente résolue, compteur membres) ; choix d'un titulaire depuis la table →
  `PATCH` 200, `titulaire_id` persisté, valeur re-sélectionnée au rechargement ;
  popover « Modifier » pré-rempli correctement (nom, parent, titulaire),
  renommage + passage « Vacant » persistés ; onglet « Organigramme » intact ;
  données de démo K&B remises en état ensuite.

---

## 2026-09-01 (suite) : barre d'onglets non responsive

### Constat

Signalé par l'utilisateur (capture du module Organisation, 5 onglets) : en
largeur réduite, la barre `.tabs` passe sur plusieurs lignes mais son
`border-radius: 999px` (forme « stadium ») découpe de grands arcs dans les
onglets des coins et tronque leurs libellés (« Membres », « Structures »,
« Organigramme » partiellement mangés, grande zone arrondie vide).

### Correctif (`apps/web/src/styles.scss`, global)

- `.tabs` : `border-radius` passe de `999px` à `var(--radius-lg)` (14px).
  Identique à l'œil sur une seule ligne, propre en rectangle arrondi sur
  N lignes. Ajout de `max-width: 100%`.
- Nouveau bloc dans `@media (max-width: 640px)` : `.tabs { width: 100% }` et
  `.tab { flex: 1 1 auto; text-align: center }` pour que la barre occupe
  toute la largeur et que les onglets se répartissent au lieu de rester une
  pastille compacte qui déborde.
- Les onglets individuels gardent `border-radius: 999px` (pastilles).

Changement purement CSS et global : profite à toutes les barres d'onglets
(Organisation, Urbanisation, Données, Technologie, Architecture métier, Vues).

### Vérifié

- `ng build` (development) propre (SCSS compilé).
- Rendu isolé des règles corrigées à 800 px (une ligne) et 380 px
  (plusieurs lignes) : rectangle arrondi net, tous les libellés visibles,
  aucun rognage d'angle, pastille active correcte.

---

## 2026-09-04 : types de lien réseau sur le diagramme de déploiement

### Ce qui a été fait

Implémentation complète du typage des liens de communication dans le
diagramme de déploiement (module Architecture technologique).

**Modèle de données :**

- Champ `label String?` ajouté sur `CanevasRelation` dans `schema.prisma`.
  Stocke l'annotation du lien réseau (ex. "VPN", "HTTPS", "FIBRE").
- Migration `20260904000000_add_canevas_relation_label` :
  `ALTER TABLE "CanevasRelation" ADD COLUMN "label" TEXT;`

**Backend (`apps/api`) :**

- `CreateCanevasRelationDto` : champ `label?: string` avec `@IsOptional()`
  + `@ApiPropertyOptional()`.
- `CanevasRelationEntity` : champ `label?: string | null` avec
  `@ApiPropertyOptional()`.

**Client API généré (`apps/web/src/app/api-client`) :**

- `CanevasRelationEntity` : `label?: string | null` ajouté ; typo `id!: string`
  corrigé en `id: string` (le `!` non nul n'a pas de sens sur une interface
  TypeScript, contrairement à une classe).
- `CreateCanevasRelationDto` : `label?: string` ajouté.

**Frontend (`technologie-canevas.component.ts`) :**

- Type `TypeLienCommunication` : `TCP_IP | HTTPS | VPN | FIBRE | WIFI |
  ETHERNET | AUTRE`.
- Tables de métadonnées `LIEN_LABEL`, `LIEN_COLOR`, `LIEN_DASH` : rendu visuel
  différencié par type (couleur + style de tirets + libellé).
- `PendingLien` : interface de la modale de choix (fromId, toId, typeLien).
- `onStageMouseUp` : ouvre la modale au lieu de créer le lien directement.
- Modale dans le template : noms source et cible, `<select>` des 7 types,
  aperçu SVG inline en temps réel.
- `confirmLien()` : crée la relation avec `type: 'ASSOCIATION'` et
  `label: p.typeLien` ; le `as any` supprimé maintenant que `CreateCanevasRelationDto`
  accepte `label`.
- `extractLienType(rel)` : lit `rel.label` et tombe sur `TCP_IP` par défaut.
- `redrawRelations()` : trait coloré, style de tirets selon le type, fond blanc
  derrière l'annotation textuelle.
- `exportPng()` : garde-fou contre canvas 0×0.

### Vérifié

- `tsc --noEmit` (frontend) sur les 3 fichiers modifiés : aucune erreur.
- Diagnostics TypeScript via l'IDE : 0 erreur sur `technologie-canevas.component.ts`,
  `canevas-relation-entity.ts` et `create-canevas-relation-dto.ts`.

---

## 2026-09-04 : analyse des écarts enrichie — progression TOGAF ADM complète

### Contexte

L'analyse des écarts (module Écarts) fonctionnait de façon statique : la matrice
lisait le champ `statut` (AS_IS/TO_BE/LES_DEUX) de chaque élément et le
classifiait, sans jamais prendre en compte l'avancement réel des solutions. Un
objectif AS_IS restait AS_IS pour toujours, même si toutes ses solutions avaient
l'avancement TERMINEE. Il n'y avait aucun lien entre processus BPMN et objectifs
stratégiques, et aucune vue de progression.

### Ce qui a été fait

**Modèle de données (schéma + migration) :**

- Nouveau modèle `ObjectifProcessus` : table de jointure `BpmnProcessus ↔ Objectif`
  (clé primaire composite, cascade sur suppression). Migration
  `20260904100000_add_objectif_processus_link`.
- `BpmnProcessus.objectifs` et `Objectif.processus` : relations inverses ajoutées
  dans `schema.prisma`.

**Backend :**

- `BpmnService.updateObjectifs()` : remplace la liste des objectifs visés par un
  processus, avec validation d'appartenance à l'organisation.
- `BpmnService.getProgression()` : calcule pour un processus le taux de transition
  AS-IS vers TO-BE (éléments LES_DEUX / total) et, pour chaque objectif visé,
  le nombre de solutions liées et leur avancement, plus le booléen
  `peutEtreMarqueAtteint` (toutes solutions TERMINEE et objectif encore AS_IS).
- `ObjectifService.marquerAtteint()` : passe un objectif AS_IS à LES_DEUX après
  vérification que toutes les solutions liées sont bien TERMINEE. Refuse avec
  `BadRequestException` si aucune solution n'est liée ou si l'une d'elles n'est
  pas TERMINEE.
- `SolutionService.listGaps()` : inclut désormais `avancement` sur la solution
  (champ `solution.avancement` dans la réponse), nécessaire pour calculer l'état
  Réalisé côté frontend.
- Deux nouveaux endpoints sur `BpmnController` :
  `PATCH /bpmn-processus/:id/objectifs` et `GET /bpmn-processus/:id/progression`.
- Nouvel endpoint `PATCH /objectifs/:id/marquer-atteint`.
- Nouvelles entités Swagger : `ProcessusProgressionEntity`,
  `ObjectifProgressionItemEntity`.

**Frontend :**

- `bpmn.service.ts` : `BpmnProcessus.objectifs` ajouté, deux nouvelles méthodes
  `updateObjectifs()` et `getProgression()`.
- `objectif.service.ts` : méthode `marquerAtteint()`.
- `gap-analysis.service.ts` : nouveau type `EtatGap` (Conservé/Éliminé/Modifié/
  Nouveau/Réalisé), méthode `applyRealise()` qui applique l'état Réalisé aux
  lignes dont toutes les solutions liées ont `avancement = TERMINEE`.
- `ecarts.component.ts` entièrement enrichi :
  - Colonne « Couverture solution » dans la matrice : Non adressé / Adressé /
    En cours / Réalisé (calcul `coverageOf()` basé sur l'avancement réel des
    solutions, pas juste leur existence).
  - Compteur « Réalisés » dans le bandeau de stats.
  - Bouton « Marquer atteint » sur les lignes Objectifs dont toutes les solutions
    sont TERMINEE, avec retour d'erreur serveur si la condition n'est pas remplie.
  - Vue Processus : barre de progression (taux de transition + stats éléments),
    section « Objectifs stratégiques visés » avec mini-barre par objectif et
    bouton « Marquer atteint » depuis la vue processus également.
  - Badge sur chaque ligne de la liste de processus indiquant le nombre d'objectifs
    liés.
- Nouveaux fichiers api-client : `processus-progression-entity.ts`,
  `solution-gap-ref-entity.ts` mis à jour (ajout de `avancement`).

### Vérifié

- Diagnostics TypeScript : 0 erreur sur tous les fichiers modifiés (backend et frontend).
- Logique TOGAF : la chaîne causale complète est désormais traçable dans l'application
  (Processus → Objectif → Écart → Solution TERMINEE → Marquer atteint).
