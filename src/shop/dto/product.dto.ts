import { IsEnum, IsString, IsUrl } from 'class-validator';
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
}
