import { Type } from 'class-transformer';
import {
  IsUUID,
  IsBoolean,
  IsNumber,
  IsString,
  IsDate,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CandidatePageCacheDto } from 'src/candidate-page-cache/dto/full-candidate-page-cache.dto';

export class FullCandidatePageDto {
  @IsUUID()
  id: string;

  @IsString()
  url: string;

  @IsBoolean()
  inStock: boolean;

  @IsNumber()
  price: number;

  @IsString()
  currencyCode: string;

  @IsString()
  reason: string;

  @IsBoolean()
  disable: boolean;

  @IsNumber()
  alertCount: number;

  @IsString()
  pageTitle: string;

  @IsString()
  pageAllText: string;

  @IsDate()
  @Type(() => Date)
  lastScanned: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => CandidatePageCacheDto)
  candidatePageCache?: CandidatePageCacheDto;
}
