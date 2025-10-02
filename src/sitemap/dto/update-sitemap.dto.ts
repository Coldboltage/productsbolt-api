import { PartialType } from '@nestjs/mapped-types';
import { CreateSitemapDto } from './create-sitemap.dto';

export class UpdateSitemapDto extends PartialType(CreateSitemapDto) {
  scannedAt?: Date;
}
