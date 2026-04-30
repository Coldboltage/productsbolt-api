import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { ProductModule } from 'src/product/product.module';
import { WebpageModule } from 'src/webpage/webpage.module';
import { WebpageSnapshotModule } from 'src/webpage-snapshot/webpage-snapshot.module';

@Module({
  imports: [ProductModule, WebpageModule, WebpageSnapshotModule],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
