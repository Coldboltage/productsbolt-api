import { IsEnum, IsString } from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsEnum(ProductType, { message: 'type must be a valid enum value' })
  type: ProductType;
}
