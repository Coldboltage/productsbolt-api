import { Module } from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { EbayStatsController } from './ebay-stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EbayStat } from './entities/ebay-stat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EbayStat])],
  controllers: [EbayStatsController],
  providers: [EbayStatsService],
})
export class EbayStatsModule { }
