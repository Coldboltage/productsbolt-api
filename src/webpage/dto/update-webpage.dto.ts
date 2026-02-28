import { PartialType } from '@nestjs/mapped-types';
import { CreateWebpageDto } from './create-webpage.dto';

export class UpdateWebpageDto extends PartialType(CreateWebpageDto) {
  alertCount?: number;
  disable?: boolean;
  count?: number;
  hash?: string;
  shopifySite?: boolean;
  pageAllText?: string;
  pageTitle?: string;
  lastScanned?: Date;
  euroPrice?: number;
}
