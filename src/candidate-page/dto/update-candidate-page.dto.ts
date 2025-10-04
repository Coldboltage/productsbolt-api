import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidatePageDto } from './create-candidate-page.dto';

export class UpdateCandidatePageDto extends PartialType(CreateCandidatePageDto) {}
