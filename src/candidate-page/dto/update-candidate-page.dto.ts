import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidatePageDto } from './create-candidate-page.dto';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateCandidatePageDto extends PartialType(
  CreateCandidatePageDto,
) {
  @IsBoolean()
  @IsOptional()
  inspected?: boolean;

  @IsNumber()
  @IsOptional()
  euroPrice?: number;
}
