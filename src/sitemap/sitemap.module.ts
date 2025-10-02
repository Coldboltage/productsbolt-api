import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { ShopModule } from '../shop/shop.module';
import { ShopProductModule } from 'src/shop-product/shop-product.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sitemap]), ShopModule, ShopProductModule],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
