import { IsDate, IsEnum, IsString } from 'class-validator';
import { Brand, ProductType } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsEnum(ProductType, { message: 'type must be a valid enum value' })
  type: ProductType;

  @IsString()
  context: string;

  @IsString()
  urlSafeName: string;

  @IsDate()
  releaseDate: Date;

  @IsString()
  imageUrl: string;

  @IsEnum(Brand)
  brand: Brand;
}
