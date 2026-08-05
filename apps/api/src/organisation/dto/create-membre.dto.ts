import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class CreateMembreDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;

  @IsEnum(RoleUtilisateur)
  role!: RoleUtilisateur;

  @IsUUID()
  @IsOptional()
  serviceId?: string;
}
