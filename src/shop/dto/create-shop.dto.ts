import { IsBoolean, IsString } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  website: string;

  @IsString()
  sitemap: string;

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

  @IsString()
  country: string;

  @IsString()
  currency: string;
}
