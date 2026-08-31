import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeployerApplicationDto {
  @ApiProperty({ description: "Identifiant de l'application a deployer" })
  @IsUUID()
  applicationId!: string;

  @ApiProperty({ description: 'Identifiant du composant technologique cible' })
  @IsUUID()
  techComponentId!: string;
}
