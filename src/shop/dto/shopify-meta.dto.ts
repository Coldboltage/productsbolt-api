import { IsUrl, IsUUID } from 'class-validator';

export class ShopifyMetaDto {
  @IsUrl()
  url: string;

  @IsUUID()
  id: string;
}
