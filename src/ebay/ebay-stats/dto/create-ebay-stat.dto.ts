import { IsNumber, IsUUID } from 'class-validator';

export class CreateEbayStatDto {
  @IsNumber()
  minPrice: number;

  @IsNumber()
  averagePrice: number;

  @IsNumber()
  maxPrice: number;

  @IsUUID('4')
  productId: string;
}
