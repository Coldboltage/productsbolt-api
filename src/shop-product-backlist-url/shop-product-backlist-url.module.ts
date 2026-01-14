import { Module } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';
import { ShopProductBacklistUrlController } from './shop-product-backlist-url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { shopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';

@Module({
  imports: [TypeOrmModule.forFeature([shopProductBlacklistUrl])],
  controllers: [ShopProductBacklistUrlController],
  providers: [ShopProductBacklistUrlService],
  exports: [ShopProductBacklistUrlService],
})
export class ShopProductBacklistUrlModule {}
