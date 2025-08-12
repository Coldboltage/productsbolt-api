import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSitemapDto {
  @IsString()
  sitemap: string;

  @IsOptional()
  @IsArray()
  sitemapUrls?: string[];

  @IsBoolean()
  isShopifySite: boolean;

  @IsBoolean()
  @IsOptional()
  errored?: boolean;

  @IsUUID()
  shopId: string;
}
