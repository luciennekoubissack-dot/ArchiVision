import { ApiProperty } from '@nestjs/swagger';

/** Répartition des organisations par statut de validation. */
export class AdminStatsOrganisationsEntity {
  @ApiProperty({ description: "Nombre d'organisations en attente de validation." })
  enAttente!: number;

  @ApiProperty({ description: "Nombre d'organisations validées." })
  validees!: number;

  @ApiProperty({ description: "Nombre d'organisations rejetées." })
  rejetees!: number;

  @ApiProperty({ description: "Nombre total d'organisations, tous statuts confondus." })
  total!: number;
}

/** Statistiques globales de la plateforme (`GET /admin/stats`). */
export class AdminStatsEntity {
  @ApiProperty({ description: "Nombre total d'utilisateurs, hors comptes superadmin." })
  totalUtilisateurs!: number;

  @ApiProperty({ type: () => AdminStatsOrganisationsEntity, description: 'Répartition des organisations par statut.' })
  organisations!: AdminStatsOrganisationsEntity;
}
