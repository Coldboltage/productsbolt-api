import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateWebpageSnapshotDto {
  @IsString()
  url: string;

  @IsBoolean()
  inStock: boolean;

  @IsNumber()
  price: number;

  @IsNumber()
  euroPrice: number;

  @IsString()
  currencyCode: string;

  @IsString()
  webpageId: string;
}
