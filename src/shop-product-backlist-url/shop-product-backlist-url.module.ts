import { Module } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';
import { ShopProductBacklistUrlController } from './shop-product-backlist-url.controller';

@Module({
  controllers: [ShopProductBacklistUrlController],
  providers: [ShopProductBacklistUrlService],
})
export class ShopProductBacklistUrlModule {}
