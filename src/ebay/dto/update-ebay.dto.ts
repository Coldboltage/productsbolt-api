import { PartialType } from '@nestjs/mapped-types';
import { CreateEbayDto } from './create-ebay.dto';

export class UpdateEbayDto extends PartialType(CreateEbayDto) {}
