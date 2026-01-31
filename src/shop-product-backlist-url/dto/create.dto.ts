import { IsUrl, IsUUID } from 'class-validator';

export class CreateShopProductBlacklistUrlDto {
  @IsUUID()
  shopProductId: string;

  @IsUUID()
  blackListId: string;

  @IsUrl()
  webpageUrl: string;
}
