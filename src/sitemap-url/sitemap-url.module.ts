import { Module } from '@nestjs/common';
import { SitemapUrlService } from './sitemap-url.service';
import { SitemapUrlController } from './sitemap-url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SitemapUrl } from './entities/sitemap-url.entity';
import { SitemapModule } from 'src/sitemap/sitemap.module';

@Module({
  imports: [TypeOrmModule.forFeature([SitemapUrl]), SitemapModule],
  controllers: [SitemapUrlController],
  providers: [SitemapUrlService],
})
export class SitemapUrlModule {}
