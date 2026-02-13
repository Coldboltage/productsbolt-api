import { PartialType } from '@nestjs/mapped-types';
import { CreateShopProductDto } from './create-shop-product.dto';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateShopProductDto extends PartialType(CreateShopProductDto) {
  @IsArray()
  @IsString()
  @IsOptional()
  links?: string[];

  @IsBoolean()
  @IsOptional()
  populated?: boolean;
}
