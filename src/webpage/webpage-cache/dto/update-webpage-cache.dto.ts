import { PartialType } from '@nestjs/mapped-types';
import { CreateWebpageCacheDto } from './create-webpage-cache.dto';

export class UpdateWebpageCacheDto extends PartialType(CreateWebpageCacheDto) {}
