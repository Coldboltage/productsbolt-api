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
import { ShopModule } from 'src/shop/shop.module';
import { CurrencyModule } from 'src/currency/currency.module';
import { UtilsModule } from 'src/utils/utils.module';
import { Url } from 'src/url/url.entity';
import { WebpageSnapshot } from 'src/webpage-snapshot/entities/webpage-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webpage, Url, WebpageSnapshot]),
    ShopProductModule,
    ClientsModule,
    ProductModule,
    AlertModule,
    ShopModule,
    CurrencyModule,
    UtilsModule,
  ],
  controllers: [WebpageController],
  providers: [WebpageService, WebpageTools],
  exports: [WebpageService],
})
export class WebpageModule {}
