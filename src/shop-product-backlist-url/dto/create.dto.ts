import { IsEnum, IsUrl, IsUUID } from 'class-validator';
import { PageType } from '../shop-product-blacklist-url.types';

export class CreateShopProductBlacklistUrlDto {
  // @IsUUID()
  // shopProductId: string;

  // @IsUUID()
  // blackListId: string;

  @IsUUID()
  pageId: string;

  @IsEnum(PageType)
  pageType: PageType;
}
