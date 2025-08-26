import { IsNumber, IsUUID } from 'class-validator';

export class CreateEbayStatDto {
  @IsNumber()
  minPrice: string;

  @IsNumber()
  averagePrice: string;

  @IsNumber()
  maxPrice: string;

  @IsUUID('4')
  productId: string;
}
