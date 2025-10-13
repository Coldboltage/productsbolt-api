import { IsUrl, IsBoolean, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCandidatePageWithIdDto {
  @IsUUID()
  id: string;

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
}
