import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sitemap])],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule { }
