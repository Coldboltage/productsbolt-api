import { PartialType } from '@nestjs/mapped-types';
import { CreateSitemapDto } from './create-sitemap.dto';
import { IsOptional } from 'class-validator';

export class UpdateSitemapDto extends PartialType(CreateSitemapDto) {
  @IsOptional()
  scannedAt?: Date;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => UpdateSitemapUrlDto)
  // sitemapUrl?: UpdateSitemapUrlDto;
}
