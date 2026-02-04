import { IsEnum, IsUrl } from 'class-validator';
import { PageType } from '../shop-product-blacklist-url.types';

export class CreateShopProductBlacklistUrlDto {
  // @IsUUID()
  // shopProductId: string;

  // @IsUUID()
  // blackListId: string;

  @IsUrl()
  webpageUrl: string;

  @IsEnum(PageType)
  pageType: PageType;
}
