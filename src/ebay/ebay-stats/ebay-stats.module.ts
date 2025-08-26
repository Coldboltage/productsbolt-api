import { Module } from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { EbayStatsController } from './ebay-stats.controller';

@Module({
  controllers: [EbayStatsController],
  providers: [EbayStatsService],
})
export class EbayStatsModule {}
