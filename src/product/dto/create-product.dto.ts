import { IsDate, IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { ProductType } from '../entities/product.entity';
import { Brand } from 'src/brand/entities/brand.entity';

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

  @IsNumber()
  price: number;

  @IsUUID()
  brandId: string;
}
