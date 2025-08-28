import { PartialType } from '@nestjs/mapped-types';
import { CreateEbayStatDto } from './create-ebay-stat.dto';
import { IsNumber } from 'class-validator';

export class UpdateEbayStatDto extends PartialType(CreateEbayStatDto) {
  @IsNumber()
  clearPrice: number;

  @IsNumber()
  jitPrice: number;

  @IsNumber()
  maximisedPrice: number;
}
