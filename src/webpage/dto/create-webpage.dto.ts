import { IsString, IsBoolean, IsNumber, IsUrl } from 'class-validator';

export class CreateWebpageDto {
  @IsUrl()
  url: string;

  @IsUrl()
  shopWebsite: string;

  @IsBoolean()
  inStock: boolean;

  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsString()
  currencyCode: string;

  @IsString()
  productName: string;

  @IsString()
  productId: string;

  @IsString()
  shopId: string;

  @IsString()
  reason: string;
}
