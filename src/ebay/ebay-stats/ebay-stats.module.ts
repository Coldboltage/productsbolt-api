import { Module } from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { EbayStatsController } from './ebay-stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EbayStat } from './entities/ebay-stat.entity';
import { ProductModule } from '../../product/product.module';
import { WebpageModule } from '../../webpage/webpage.module';
import { EbayStatsTools } from './ebay-stats-tools';

@Module({
  imports: [TypeOrmModule.forFeature([EbayStat]), ProductModule, WebpageModule],
  controllers: [EbayStatsController],
  providers: [EbayStatsService, EbayStatsTools],
})
export class EbayStatsModule { }
