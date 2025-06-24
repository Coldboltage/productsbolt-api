import { PartialType } from '@nestjs/mapped-types';
import { CreateWebpageDto } from './create-webpage.dto';

export class UpdateWebpageDto extends PartialType(CreateWebpageDto) {}
