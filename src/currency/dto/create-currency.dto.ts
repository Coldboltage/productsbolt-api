import { IsNumber, IsString } from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  baseCurrency: string;

  @IsString()
  comparedCurrency: string;

  @IsNumber()
  value: number;
}
