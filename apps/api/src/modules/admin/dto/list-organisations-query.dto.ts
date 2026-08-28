import { IsEnum, IsOptional } from 'class-validator';
import { StatutOrganisation } from '@prisma/client';
import { PaginationQueryDto } from '@archivision/shared';

export class ListOrganisationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(StatutOrganisation)
  statut?: StatutOrganisation;
}
