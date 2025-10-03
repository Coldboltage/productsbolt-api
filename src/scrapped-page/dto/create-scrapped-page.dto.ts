import { IsString, IsUUID } from 'class-validator';

export class CreateScrappedPageDto {
  @IsString()
  url: string;

  @IsString()
  pageTitle: string;

  @IsString()
  pageAllText: string;

  @IsUUID()
  shopProductId: string;
}
