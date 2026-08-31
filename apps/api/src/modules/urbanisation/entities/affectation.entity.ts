import { ApiProperty } from '@nestjs/swagger';
import { TypeZone } from '@prisma/client';

export class AffectationApplicationRefEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  id!: string;

  @ApiProperty({ description: "Nom de l'application." })
  nom!: string;
}

export class AffectationZoneRefEntity {
  @ApiProperty({ description: "Identifiant de la zone." })
  id!: string;

  @ApiProperty({ description: "Nom de la zone." })
  nom!: string;

  @ApiProperty({ enum: TypeZone, description: "Type de la zone (doit être ILOT pour une affectation)." })
  type!: TypeZone;
}

/** Affectation d'une application à un îlot du référentiel POS. */
export class AffectationEntity {
  @ApiProperty({ description: "Identifiant de l'application affectée." })
  applicationId!: string;

  @ApiProperty({ description: "Identifiant de la zone (îlot) affectée." })
  zoneId!: string;

  @ApiProperty({ type: () => AffectationApplicationRefEntity, description: "Application affectée." })
  application!: AffectationApplicationRefEntity;

  @ApiProperty({ type: () => AffectationZoneRefEntity, description: "Zone (îlot) affectée." })
  zone!: AffectationZoneRefEntity;
}
