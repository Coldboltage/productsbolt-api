import { PartialType } from '@nestjs/mapped-types';
import { CreateWebpageUtilDto } from './create-webpage-util.dto';

export class UpdateWebpageUtilDto extends PartialType(CreateWebpageUtilDto) {}
