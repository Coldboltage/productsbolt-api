import { Module } from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { EbayStatsController } from './ebay-stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EbayStat } from './entities/ebay-stat.entity';
import { ProductModule } from '../../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([EbayStat]), ProductModule],
  controllers: [EbayStatsController],
  providers: [EbayStatsService],
})
export class EbayStatsModule { }
