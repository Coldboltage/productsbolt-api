import { createZodDto } from 'nestjs-zod';
import { UpdateEbayStatsSchema } from '../ebay-stats-schema';

export class UpdateEbayStatDto extends createZodDto(UpdateEbayStatsSchema) { }
