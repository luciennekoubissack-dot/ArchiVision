import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Pagination facultative : si `page` n'est pas fourni, le service renvoie la
 * liste complète (comportement historique, nécessaire aux canevas/diagrammes
 * qui ont besoin de tous les éléments pour se dessiner correctement). Un
 * client qui fournit `page` reçoit un `PaginatedResult` à la place.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: "Numéro de page, à partir de 1. Absent, la réponse n'est pas paginée (tableau complet).", minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page, entre 1 et 200.", minimum: 1, maximum: 200, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
