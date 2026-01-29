import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidatePageDto } from './create-candidate-page.dto';
import { IsBoolean } from 'class-validator';

export class UpdateCandidatePageDto extends PartialType(
  CreateCandidatePageDto,
) {
  @IsBoolean()
  inspected: boolean;
}
