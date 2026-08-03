// SUPPRIMÉ (phase 1 — v1 mono-tenant) : ce guard dépendait d'un AuthUser avec
// des champs tenantId/roles que le JWT actuel ne fournit pas ({ sub, email }
// uniquement) et n'était branché nulle part. Code mort.
// Le RBAC réel sera repensé en phase 4 (voir ROADMAP.md).
//
// NOTE OPÉRATIONNELLE : ce fichier n'a pas pu être supprimé (pas d'accès shell
// dans cette session). À supprimer manuellement :
//   rm libs/shared/src/guards/roles.guard.ts
export {};
