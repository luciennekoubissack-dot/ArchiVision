import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataEntityRefEntity } from './data-entity-ref.entity';
import { DataAttributeEntity } from './data-attribute.entity';
import { DataEntityCountEntity } from './data-entity-count.entity';

export class DataEntityEntity extends DataEntityRefEntity {
  @ApiProperty({ description: "Attributs de l'entite de donnees.", type: () => [DataAttributeEntity] })
  attributs!: DataAttributeEntity[];

  @ApiPropertyOptional({
    description: "Compteur des relations imbriquees (present sur la liste, absent sur la recuperation par identifiant).",
    type: () => DataEntityCountEntity,
  })
  _count?: DataEntityCountEntity;
}
