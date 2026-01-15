import { IsBoolean, IsDate, IsNumber, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidatePageCacheDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  confirmed: boolean;

  @IsString()
  hash: string;

  @IsNumber()
  count: number;

  @IsDate()
  @Type(() => Date)
  date: Date;
}
