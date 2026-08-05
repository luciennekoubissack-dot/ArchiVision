import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  // ── Organisation ──────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organisationNom!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  organisationDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  secteur?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taille?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  pays?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  logoUrl?: string;

  // ── Premier utilisateur (Architecte) ─────────────────────────────────────

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom!: string;
}
