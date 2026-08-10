import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBpmnFlowDto {
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
