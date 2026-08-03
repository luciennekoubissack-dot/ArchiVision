"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantScopingExtension = tenantScopingExtension;
const client_1 = require("@prisma/client");
/**
 * Modèles qui portent un tenantId et doivent être scopés automatiquement.
 * Ajoutez ici chaque nouveau modèle multi-tenant au fur et à mesure.
 */
const TENANT_SCOPED_MODELS = new Set([
    'Workspace',
    'ArchitectureModel',
    'EventLog',
]);
const READ_OPS = new Set([
    'findMany',
    'findFirst',
    'findUnique',
    'findFirstOrThrow',
    'findUniqueOrThrow',
    'count',
    'aggregate',
    'groupBy',
]);
const WRITE_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany']);
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
function tenantScopingExtension(tenantId) {
    return client_1.Prisma.defineExtension({
        name: 'tenant-scoping',
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query, }) {
                    if (!TENANT_SCOPED_MODELS.has(model)) {
                        return query(args);
                    }
                    if (READ_OPS.has(operation) || WRITE_OPS.has(operation)) {
                        args = { ...args, where: { ...args.where, tenantId } };
                    }
                    if (operation === 'create') {
                        args = { ...args, data: { ...args.data, tenantId } };
                    }
                    if (operation === 'createMany') {
                        const data = args.data;
                        if (Array.isArray(data)) {
                            args = { ...args, data: data.map((item) => ({ ...item, tenantId })) };
                        }
                        else {
                            args = { ...args, data: { ...data, tenantId } };
                        }
                    }
                    return query(args);
                },
            },
        },
    });
}
//# sourceMappingURL=tenant-scoping.extension.js.map