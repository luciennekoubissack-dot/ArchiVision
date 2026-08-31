import { ApiProperty } from '@nestjs/swagger';
import { CapaciteMetierEntity } from '../../modules/archimate/entities/capacite-metier.entity';
import { ElementArchimateEntity } from '../../modules/archimate/entities/element-archimate.entity';
import { RelationArchimateEntity } from '../../modules/archimate/entities/relation-archimate.entity';
import { ApplicationEntity } from '../../modules/urbanisation/entities/application.entity';
import { ZoneUrbanisationEntity } from '../../modules/urbanisation/entities/zone.entity';
import { OrganisationEntity } from './organisation.entity';

/** Export complet du référentiel d'architecture de l'organisation courante
 * (capacités métier, éléments et relations ArchiMate, portefeuille
 * applicatif et zones d'urbanisation), aux fins de sauvegarde ou de reprise. */
export class OrganisationExportEntity {
  @ApiProperty({ description: "Date et heure de génération de l'export (ISO 8601).", type: String, format: 'date-time' })
  exportedAt!: string;

  @ApiProperty({ type: () => OrganisationEntity, description: "Organisation exportée." })
  organisation!: OrganisationEntity;

  @ApiProperty({ type: () => [CapaciteMetierEntity], description: "Capacités métier de l'organisation." })
  capacites!: CapaciteMetierEntity[];

  @ApiProperty({ type: () => [ElementArchimateEntity], description: "Éléments ArchiMate de l'organisation." })
  elements!: ElementArchimateEntity[];

  @ApiProperty({ type: () => [RelationArchimateEntity], description: "Relations ArchiMate de l'organisation." })
  relations!: RelationArchimateEntity[];

  @ApiProperty({ type: () => [ApplicationEntity], description: "Applications du portefeuille applicatif de l'organisation." })
  applications!: ApplicationEntity[];

  @ApiProperty({ type: () => [ZoneUrbanisationEntity], description: "Zones d'urbanisation de l'organisation." })
  zones!: ZoneUrbanisationEntity[];
}
