import { IsUUID } from 'class-validator';

export class DeployerApplicationDto {
  @IsUUID()
  applicationId!: string;

  @IsUUID()
  techComponentId!: string;
}
