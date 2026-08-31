import { IsEnum, IsOptional } from 'class-validator';
import { TypeElement } from '@prisma/client';
import { PaginationQueryDto } from '@archivision/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListElementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TypeElement, description: 'Filtre les éléments par type ArchiMate.' })
  @IsOptional()
  @IsEnum(TypeElement)
  type?: TypeElement;
}
