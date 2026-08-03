// SUPPRIMÉ (phase 1 — v1 mono-tenant) : ce guard référençait un package
// `@archivision/tenant-context` inexistant dans le repo et un AuthUser avec
// tenantId/roles que le JWT ne fournit pas. Code mort, ne compilait pas.
// Le multi-tenant réel est repoussé en phase 4 (voir ROADMAP.md).
//
// NOTE OPÉRATIONNELLE : ce fichier n'a pas pu être supprimé (pas d'accès shell
// dans cette session). À supprimer manuellement :
//   rm libs/shared/src/guards/tenant.guard.ts
//   rm libs/shared/src/guards/tenant.guard.js libs/shared/src/guards/tenant.guard.js.map
//   rm libs/shared/src/guards/tenant.guard.d.ts libs/shared/src/guards/tenant.guard.d.ts.map
export {};
