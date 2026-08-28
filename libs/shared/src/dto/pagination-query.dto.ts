import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Pagination facultative : si `page` n'est pas fourni, le service renvoie la
 * liste complète (comportement historique, nécessaire aux canevas/diagrammes
 * qui ont besoin de tous les éléments pour se dessiner correctement). Un
 * client qui fournit `page` reçoit un `PaginatedResult` à la place.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
