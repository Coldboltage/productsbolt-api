import { IsString, IsUUID } from 'class-validator';

export class RemoveWebpageDto {
  @IsString()
  url: string;

  @IsUUID()
  shopProductId: string;
}
