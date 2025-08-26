import { Module } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { EbayController } from './ebay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EbayProductDetail } from './entities/ebay-product-detail.entity';
import { EbayStatsModule } from './ebay-stats/ebay-stats.module';

@Module({
  imports: [TypeOrmModule.forFeature([EbayProductDetail]), EbayStatsModule],
  controllers: [EbayController],
  providers: [EbayService],
})
export class EbayModule {}
