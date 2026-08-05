import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class UpdateMembreDto {
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @IsUUID()
  @IsOptional()
  serviceId?: string | null;
}
