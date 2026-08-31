import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AffecterApplicationDto {
  @ApiProperty({ description: "Identifiant de l'application à affecter." })
  @IsUUID()
  applicationId!: string;

  @ApiProperty({ description: "Identifiant de la zone d'urbanisation cible." })
  @IsUUID()
  zoneId!: string;
}
