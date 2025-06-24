import { Module } from '@nestjs/common';
import { WebpageService } from './webpage.service';
import { WebpageController } from './webpage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webpage } from './entities/webpage.entity';
import { ShopProductModule } from '../shop-product/shop-product.module';
import { ClientsModule } from '@nestjs/microservices';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webpage]),
    ShopProductModule,
    ClientsModule,
    ProductModule,
  ],
  controllers: [WebpageController],
  providers: [WebpageService],
  exports: [WebpageService],
})
export class WebpageModule { }
