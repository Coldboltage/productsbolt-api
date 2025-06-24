import { PartialType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';
import { IsArray, IsOptional, IsUrl } from 'class-validator';

export class UpdateShopDto extends PartialType(CreateShopDto) {
  @IsOptional()
  @IsArray()
  @IsUrl({ each: true } as any)
  sitemapUrls?: string[];
}
