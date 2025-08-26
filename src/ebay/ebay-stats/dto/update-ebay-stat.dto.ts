import { PartialType } from '@nestjs/mapped-types';
import { CreateEbayStatDto } from './create-ebay-stat.dto';

export class UpdateEbayStatDto extends PartialType(CreateEbayStatDto) {}
