import { Module } from '@nestjs/common';
import { WebpageService } from './webpage.service';
import { WebpageController } from './webpage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webpage } from './entities/webpage.entity';
import { ShopProductModule } from '../shop-product/shop-product.module';
import { ClientsModule } from '@nestjs/microservices';
import { ProductModule } from '../product/product.module';
import { AlertModule } from '../alert/alert.module';
import { WebpageTools } from './webpage.tools';
import { WebpageCacheModule } from './webpage-cache/webpage-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webpage]),
    ShopProductModule,
    ClientsModule,
    ProductModule,
    AlertModule,
    WebpageCacheModule,
  ],
  controllers: [WebpageController],
  providers: [WebpageService, WebpageTools],
  exports: [WebpageService],
})
export class WebpageModule { }
