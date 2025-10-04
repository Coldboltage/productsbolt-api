import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidatePageCacheDto } from './create-candidate-page-cache.dto';

export class UpdateCandidatePageCacheDto extends PartialType(CreateCandidatePageCacheDto) {}
