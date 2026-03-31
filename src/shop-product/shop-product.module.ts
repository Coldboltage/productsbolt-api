import { Module } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { ShopProductController } from './shop-product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { ShopModule } from '../shop/shop.module';
import { ProductModule } from '../product/product.module';
import { Url } from 'src/url/url.entity';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopProduct, Url]),
    ShopModule,
    ProductModule,
    UtilsModule,
  ],
  controllers: [ShopProductController],
  providers: [ShopProductService],
  exports: [ShopProductService],
})
export class ShopProductModule {}
