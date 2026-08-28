import { IsEnum, IsOptional } from 'class-validator';
import { TypeElement } from '@prisma/client';
import { PaginationQueryDto } from '@archivision/shared';

export class ListElementsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TypeElement)
  type?: TypeElement;
}
