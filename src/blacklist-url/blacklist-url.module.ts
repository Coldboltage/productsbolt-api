import { Module } from '@nestjs/common';
import { BlackListUrlService } from './blacklist-url.service';
import { BlackListUrlController } from './blacklist-url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackListUrl } from './entities/blacklist-url.entity';
import { ShopProductModule } from '../shop-product/shop-product.module';
import { WebpageModule } from '../webpage/webpage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlackListUrl]),
    ShopProductModule,
    WebpageModule,
  ],
  controllers: [BlackListUrlController],
  providers: [BlackListUrlService],
})
export class BlackListUrlModule { }
