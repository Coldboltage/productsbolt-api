import { IsUrl } from 'class-validator';

export class CreateBlackListUrlDto {
  @IsUrl()
  url: string;
}
