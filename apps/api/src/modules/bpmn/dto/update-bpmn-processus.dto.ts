import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBpmnProcessusDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  bpmnXml?: string;
}
