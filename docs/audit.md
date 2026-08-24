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
