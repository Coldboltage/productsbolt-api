import { IsNumber, IsString } from 'class-validator';

export class CreateCandidatePageCacheDto {
  @IsString()
  hash: string;

  @IsNumber()
  count: number;
}
