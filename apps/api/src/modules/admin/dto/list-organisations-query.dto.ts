import { IsEnum, IsOptional } from 'class-validator';
import { StatutOrganisation } from '@prisma/client';
import { PaginationQueryDto } from '@archivision/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListOrganisationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StatutOrganisation, description: 'Filtre les organisations par statut.' })
  @IsOptional()
  @IsEnum(StatutOrganisation)
  statut?: StatutOrganisation;
}
