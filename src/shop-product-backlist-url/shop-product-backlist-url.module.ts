import { Module } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';
import { ShopProductBacklistUrlController } from './shop-product-backlist-url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';
import { ShopProductModule } from 'src/shop-product/shop-product.module';
import { BlackListUrlModule } from 'src/blacklist-url/blacklist-url.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopProductBlacklistUrl]),
    ShopProductModule,
    BlackListUrlModule,
  ],
  controllers: [ShopProductBacklistUrlController],
  providers: [ShopProductBacklistUrlService],
  exports: [ShopProductBacklistUrlService],
})
export class ShopProductBacklistUrlModule {}
