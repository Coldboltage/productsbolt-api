import { Module } from '@nestjs/common';
import { WebpageCacheService } from './webpage-cache.service';
import { WebpageCacheController } from './webpage-cache.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebpageCache } from './entities/webpage-cache.entity';
import { WebpageModule } from '../webpage/webpage.module';
import { ProductModule } from 'src/product/product.module';
import { CurrencyModule } from 'src/currency/currency.module';
import { WebpageSnapshotModule } from 'src/webpage-snapshot/webpage-snapshot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebpageCache]),
    WebpageModule,
    ProductModule,
    CurrencyModule,
    WebpageSnapshotModule,
  ],
  controllers: [WebpageCacheController],
  providers: [WebpageCacheService],
})
export class WebpageCacheModule {}
