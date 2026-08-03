/**
 * Prisma Client Extension qui injecte automatiquement `tenantId` dans toutes
 * les opérations sur les modèles tenant-scopés.
 *
 * - READ / WRITE  : merge `where: { tenantId }` avec le where existant
 * - CREATE        : merge `data:  { tenantId }` avec la data existante
 * - CREATE MANY   : injecte `tenantId` dans chaque item du tableau
 *
 * Rend la fuite inter-tenant structurellement impossible sans action
 * délibérée, plutôt qu'une règle à "ne pas oublier".
 */
export declare function tenantScopingExtension(tenantId: string): (client: any) => {
    $extends: {
        extArgs: import("@prisma/client/runtime/library").InternalArgs<unknown, unknown, {}, unknown>;
    };
};
//# sourceMappingURL=tenant-scoping.extension.d.ts.map