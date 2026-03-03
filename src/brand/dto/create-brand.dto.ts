import { IsString } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  urlSafeName: string;

  @IsString()
  name: string;

  @IsString()
  description: string;
}
