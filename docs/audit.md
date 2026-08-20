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
