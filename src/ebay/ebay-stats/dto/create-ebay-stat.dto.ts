import { IsNumber } from 'class-validator';

export class CreateEbayStatDto {
  @IsNumber()
  minPrice: string;

  @IsNumber()
  averagePrice: string;

  @IsNumber()
  maxPrice: string;
}
