import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { ShopModule } from '../shop/shop.module';
import { ShopProductModule } from 'src/shop-product/shop-product.module';
import { SitemapUrl } from 'src/sitemap-url/entities/sitemap-url.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sitemap, SitemapUrl]),
    ShopModule,
    ShopProductModule,
  ],
  controllers: [SitemapController],
  providers: [SitemapService],
  exports: [SitemapService],
})
export class SitemapModule {}
