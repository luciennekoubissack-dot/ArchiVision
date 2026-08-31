import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse } from '@nestjs/swagger';

/**
 * Documente, en complément d'un `@ApiOkResponse({ type: [Model] })` sur le
 * même endpoint, le fait que fournir `page` en paramètre de requête renvoie
 * `{ items, total, page, pageSize }` au lieu du tableau nu (voir
 * `paginateFindMany`, `libs/shared/src/utils/pagination.ts`).
 *
 * OpenAPI 3 ne permet pas d'attacher deux schémas distincts à un seul code de
 * statut (200) sur une même opération sans un `oneOf` qui obligerait chaque
 * client généré à discriminer `Array.isArray(...)` sur TOUS les appels, y
 * compris ceux qui n'utilisent jamais la pagination. Ce décorateur documente
 * donc la forme paginée en texte (voir la description qu'il ajoute, fusionnée
 * par Swagger avec celle du `@ApiOkResponse` voisin) plutôt que par un second
 * schéma JSON, pour garder le type généré côté client simple et correct pour
 * l'usage historique (tableau complet).
 */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(model: TModel) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: 'Si `page` est fourni : réponse paginée `{ items, total, page, pageSize }` au lieu du tableau nu.',
    }),
  );
}
