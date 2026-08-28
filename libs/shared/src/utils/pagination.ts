import { PaginationQueryDto } from '../dto/pagination-query.dto';

export const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** `skip`/`take` Prisma à partir d'une requête de pagination facultative. */
export function paginationArgs(query?: PaginationQueryDto): { skip: number; take: number; page: number; pageSize: number } {
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? DEFAULT_PAGE_SIZE;
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function toPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return { items, total, page, pageSize };
}

/**
 * `args` volontairement typé `any` : les délégués Prisma exposent des
 * signatures `findMany`/`count` génériques très spécifiques (SelectSubset,
 * etc.) que TypeScript refuse de faire correspondre structurellement à une
 * interface commune. On sacrifie ce niveau de typage sur l'appel interne
 * pour garder un seul helper générique ; `T` (déduit de l'appelant via
 * `baseArgs`) reste, lui, entièrement typé.
 */
interface ListDelegate<T> {
  findMany(args: any): Promise<T[]>;
  count(args: any): Promise<number>;
}

/**
 * Pagination facultative générique pour un `findMany` Prisma : sans `page`
 * fourni, renvoie la liste complète (comportement historique, nécessaire aux
 * canevas/diagrammes qui doivent tout recevoir pour se dessiner) ; avec
 * `page`, renvoie un `PaginatedResult`.
 */
export async function paginateFindMany<T, Args extends { where?: unknown; skip?: number; take?: number }>(
  delegate: ListDelegate<T>,
  baseArgs: Args,
  pagination?: PaginationQueryDto,
): Promise<T[] | PaginatedResult<T>> {
  if (!pagination?.page) {
    return delegate.findMany(baseArgs);
  }
  const { skip, take, page, pageSize } = paginationArgs(pagination);
  const [items, total] = await Promise.all([
    delegate.findMany({ ...baseArgs, skip, take }),
    delegate.count({ where: baseArgs.where }),
  ]);
  return toPaginatedResult(items, total, page, pageSize);
}
