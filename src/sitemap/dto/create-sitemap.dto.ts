import { IsBoolean, IsUUID } from 'class-validator';

export class CreateSitemapDto {
  @IsBoolean()
  shopifySite: boolean;

  @IsBoolean()
  errored: boolean;

  @IsUUID()
  shopId: string;
}
