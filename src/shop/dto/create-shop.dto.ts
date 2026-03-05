import { IsBoolean, IsString } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  // if www seen, add
  @IsString()
  website: string;

  @IsString()
  sitemap: string;

  // https://[websitename]/[category]/[productId]
  @IsString()
  category: string;

  @IsString()
  protocol: string;

  @IsBoolean()
  manual: boolean;

  @IsString()
  city: string;

  @IsString()
  province: string;

  // Country Code
  @IsString()
  country: string;

  // Currency Code
  @IsString()
  currency: string;
}
