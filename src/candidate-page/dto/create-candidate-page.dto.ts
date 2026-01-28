import { IsUrl, IsBoolean, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCandidatePageDto {
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

  @IsUUID()
  shopProductId: string;

  @IsString()
  hash: string;

  @IsNumber()
  count: number;

  @IsBoolean()
  shopifySite: boolean;

  @IsString()
  pageAllText: string;

  @IsString()
  pageTitle: string;

  @IsBoolean()
  priceCheck: boolean;
}
