import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ProductType } from '../../product/entities/product.entity';

export class CreateProcessDto {
  @IsUrl()
  sitemap: string;

  @IsUrl()
  url: string;

  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsString()
  shopWebsite: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  context: string;

  @IsNumber()
  crawlAmount: number;

  @IsUUID()
  productId: string;

  @IsUUID()
  shopId: string;

  @IsBoolean()
  shopifySite: boolean

  @IsArray()
  @IsString({ each: true })
  sitemapUrls: string[];
}
