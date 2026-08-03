// SUPPRIMÉ (phase 1 — v1 mono-tenant) : décorateur lié à roles.guard.ts,
// jamais utilisé (aucun @Roles() dans le code), non exporté depuis index.ts.
// Le RBAC réel sera repensé en phase 4 (voir ROADMAP.md).
//
// NOTE OPÉRATIONNELLE : ce fichier n'a pas pu être supprimé (pas d'accès shell
// dans cette session). À supprimer manuellement :
//   rm libs/shared/src/decorators/roles.decorator.ts
export {};
