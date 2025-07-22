import { Module } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { ShopProductController } from './shop-product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { ShopModule } from '../shop/shop.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShopProduct]), ShopModule, ProductModule],
  controllers: [ShopProductController],
  providers: [ShopProductService],
  exports: [ShopProductService],
})
export class ShopProductModule {}
