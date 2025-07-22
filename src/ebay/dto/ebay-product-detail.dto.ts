import { IsString, IsUUID } from 'class-validator';

export class EbayProductDetailDto {
  @IsUUID()
  ebayProductDetailId: string;

  @IsString()
  productId: string;
}
