import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ProductType } from '../../product/entities/product.entity';
import { UniqueShopType } from '../entities/shop.entity';
import { EbayProductDetailDto } from 'src/ebay/dto/ebay-product-detail.dto';
import { Type } from 'class-transformer';
import { CreateSitemapDto } from '../../sitemap/dto/create-sitemap.dto';
import { FullCandidatePageDto } from 'src/candidate-page/dto/full-candidate-page.dto';

export class CreateProcessDto {
  @IsUrl()
  sitemap: string;

  @IsUrl()
  url: string;

  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsUUID()
  shopProductId: string;

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
  shopifySite: boolean;

  @IsEnum(UniqueShopType)
  shopType: UniqueShopType;

  @IsBoolean()
  cloudflare: boolean;

  @IsString()
  hash: string;

  @IsBoolean()
  confirmed: boolean;

  @IsNumber()
  count: number;

  @IsNumber()
  expectedPrice: number;

  @IsArray()
  @IsString()
  links: string[];

  @ValidateNested()
  @Type(() => EbayProductDetailDto)
  @IsOptional()
  ebayProductDetail?: EbayProductDetailDto;

  @ValidateNested()
  @Type(() => CreateSitemapDto)
  sitemapEntity: CreateSitemapDto;

  @IsArray()
  @ValidateNested()
  @Type(() => FullCandidatePageDto)
  candidatePages: FullCandidatePageDto[];
}
