import { IsUUID } from 'class-validator';

export class AffecterApplicationDto {
  @IsUUID()
  applicationId!: string;

  @IsUUID()
  zoneId!: string;
}
