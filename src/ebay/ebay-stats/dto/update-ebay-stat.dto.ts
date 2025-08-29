import { PartialType } from '@nestjs/mapped-types';
import { CreateEbayStatDto } from './create-ebay-stat.dto';
import { IsNumber } from 'class-validator';

export class UpdateEbayStatDto extends PartialType(CreateEbayStatDto) {
  // Clearing price where we'll get the stock sold with no problems at all
  @IsNumber()
  clearPrice: number;

  // Just In Time Price (A price that will clear as stock comes in)
  @IsNumber()
  jitPrice: number;

  // The maximum we can get out of this sale
  @IsNumber()
  maximisedPrice: number;
}
