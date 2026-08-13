import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class UpdateMembreDto {
  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @IsUUID()
  @IsOptional()
  serviceId?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  poste?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  contact?: string;
}
