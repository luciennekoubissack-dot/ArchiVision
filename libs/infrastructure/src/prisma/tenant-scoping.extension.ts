// SUPPRIMÉ (phase 1 — v1 mono-tenant) : cette extension Prisma référençait des
// modèles (Workspace, ArchitectureModel, EventLog) absents du schema.prisma
// actuel et n'était exportée nulle part depuis index.ts. Code mort.
// Le scoping multi-tenant réel sera repensé en phase 4 (voir ROADMAP.md).
//
// NOTE OPÉRATIONNELLE : ce fichier n'a pas pu être supprimé (pas d'accès shell
// dans cette session). À supprimer manuellement :
//   rm libs/infrastructure/src/prisma/tenant-scoping.extension.ts
//   rm libs/infrastructure/src/prisma/tenant-scoping.extension.js libs/infrastructure/src/prisma/tenant-scoping.extension.js.map
//   rm libs/infrastructure/src/prisma/tenant-scoping.extension.d.ts libs/infrastructure/src/prisma/tenant-scoping.extension.d.ts.map
export {};
