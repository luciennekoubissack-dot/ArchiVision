import { ApiProperty } from '@nestjs/swagger';
import { DataRelationEntity } from './data-relation.entity';
import { DataEntityRefEntity } from './data-entity-ref.entity';

/** Relation entre deux entites de donnees avec la source et la cible imbriquees. */
export class DataRelationDetailEntity extends DataRelationEntity {
  @ApiProperty({ description: 'Entite de donnees source.', type: () => DataEntityRefEntity })
  source!: DataEntityRefEntity;

  @ApiProperty({ description: 'Entite de donnees cible.', type: () => DataEntityRefEntity })
  target!: DataEntityRefEntity;
}
