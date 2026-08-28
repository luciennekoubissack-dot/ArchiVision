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
